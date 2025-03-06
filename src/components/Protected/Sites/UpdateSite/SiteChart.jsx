import React, { useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import styled from "@emotion/styled";
import * as d3 from "d3";
import { useForm } from "react-hook-form";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import UpdateFloor from "./UpdateFloor";
import FloorMap from "./FloorMap";
import {
  getSiteLayout,
  addSiteLayoutNode,
  setLoader,
} from "../../../../store/thunk/site";
import { toast } from "react-toastify";
import { InputError } from "../../../common/InputError";
import UpdateSiteLayout from "./UpdateSiteLayout";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";

// Styled Components
const StyledNode = styled.div`
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  cursor: pointer;
  border-left: 4px solid ${(props) => props.borderColor || "#000"};
  background: ${(props) => props.background || "#f5f5f5"};
`;
const nodeColors = {
  building: "#1dca5d", // Green
  floor: "#f34040", // Red
  room: "#3b80f2", // Blue
  default: "#ccc", // Gray (fallback)
};
const nodeStyles = {
  building: {
    borderColor: "#1dca5d",
    background:
      "repeating-linear-gradient(+45deg, #1dca5d0a 2px, transparent 1rem)",
  },
  floor: {
    borderColor: "#f34040",
    background:
      "repeating-linear-gradient(+45deg, #fff5f4 2px, transparent 1rem)",
  },
  type: {
    borderColor: "#f3a515",
    background:
      "repeating-linear-gradient(+45deg, #fff7de 2px, transparent 1rem)",
  },
  default: {
    borderColor: "#3b80f2",
    background:
      "repeating-linear-gradient(+45deg, #f0f8ff 2px, transparent 1rem)",
  },
};

// Component
const SiteChart = ({
  getSiteLayout,
  addSiteLayoutNode,
  siteLayout,
  updateSite,
  setLoader,
  loggedInUserData,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm({});
  const [parentNodeTypes, setParentNodeTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState(null);
  const chartRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // Fetch site layout on component mount
  useEffect(() => {
    getSiteLayout(updateSite?.siteId);
  }, [getSiteLayout, updateSite]);

  // Update parent node types when site layout changes
  useEffect(() => {
    const floors =
      siteLayout?.filter((node) => node.nodeType === "floor") || [];
    setParentNodeTypes(floors);
  }, [siteLayout]);

  // Initialize D3.js Tree Chart
  const renderChart = () => {
    if (siteLayout.length > 0 && chartRef.current) {
      const container = chartRef.current;
      const containerWidth = container.clientWidth;
      const containerHeight = window.innerHeight * 0.8; // Adjust height based on screen size

      d3.select(container).selectAll("*").remove();

      const root = d3.hierarchy(generateTreeData(siteLayout));
      const treeLayout = d3
        .tree()
        .size([containerHeight, containerWidth - 200]); // Adjust size for responsiveness
      treeLayout(root);

      const svg = d3
        .select(container)
        .append("svg")
        .attr("width", "100%")
        .attr("height", containerHeight)
        .append("g")
        .attr("transform", `translate(50, 0)`); // Adjust translation for better visibility

      svg
        .selectAll(".link")
        .data(root.links())
        .enter()
        .append("path")
        .attr("class", "link")
        .attr(
          "d",
          d3
            .linkHorizontal()
            .x((d) => d.y)
            .y((d) => d.x)
        )
        .attr("fill", "none")
        .attr("stroke", "#ccc");

      const nodes = svg
        .selectAll(".node")
        .data(root.descendants())
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => `translate(${d.y},${d.x})`)
        .on("click", (event, d) => {
          const node = siteLayout.find((node) => node.nodeName === d.data.name);
          setSelectedNode(node);
          setShowModal(true);
        });

      nodes
        .append("circle")
        .attr("r", 6)
        .attr("fill", (d) => {
          const node = siteLayout.find((node) => node.nodeName === d.data.name);
          return nodeColors[node?.nodeType] || nodeColors.default;
        })
        .on("mouseover", function () {
          d3.select(this).attr("r", 8);
        })
        .on("mouseout", function () {
          d3.select(this).attr("r", 6);
        });

      nodes
        .append("text")
        .attr("dy", "0.31em")
        .attr("x", (d) => (d.children ? -20 : 20))
        .attr("text-anchor", (d) => (d.children ? "end" : "start"))
        .text((d) => d.data.name)
        .style("font-size", `9px`)
        .style("font-weight", "bold")
        .style("fill", "#333")
        .style("dominant-baseline", "middle");
    }
  };

  useEffect(() => {
    if (chartRef.current) {
      const container = chartRef.current;
      renderChart();
      const resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const { width } = entry.contentRect;
          setWidth(width);
          renderChart();
        }
      });
      resizeObserver.observe(container);
      return () => {
        resizeObserver.unobserve(container);
      };
    }
  }, [siteLayout, width]);

  const generateTreeData = (nodes) => {
    const mainBuildingNode = nodes.find(
      (node) => node.nodeName === "Main Building"
    );
    if (!mainBuildingNode) {
      console.error("Main Building node not found!");
      return { name: "Root", children: [] };
    }

    return {
      name: "Main", //mainBuildingNode.nodeName,
      children: getChildren(mainBuildingNode.id, nodes),
    };
  };

  const getChildren = (parentId, nodes) => {
    const children = nodes.filter((node) => node.parentNode === parentId);
    return children.map((node) => ({
      name: node.nodeName,
      children: getChildren(node.id, nodes),
    }));
  };

  const submitNode = (values) => {
    const { typeOfNode, nodeType, parentNode } = values;
    const duplicateNode = siteLayout.some(
      (node) => node.parentNode == parentNode && node.nodeName === typeOfNode
    );

    if (duplicateNode) {
      toast.warn(`${typeOfNode} is already added under this parent.`);
      return;
    }

    const newNode = {
      siteId: updateSite?.siteId,
      nodeName: typeOfNode,
      nodeType,
      parentNode: Number(parentNode),
    };

    setLoader(true);
    addSiteLayoutNode(newNode);
    reset();
  };

  return (
    <>
      <SidebarNew />
      {showModal && (
        <UpdateSiteLayout
          selectedNode={selectedNode}
          showModal={showModal}
          setShowModal={setShowModal}
          refresh={() => getSiteLayout(updateSite?.siteId)}
        />
      )}
      <div style={{ textAlign: "center" }}>
        <h5 className="text-start">Creating Building Layout</h5>
        <div ref={chartRef} style={{ width: "100%", height: "80vh" }}></div>
        {!updateSite?.isViewMode && isManagerAdminLogin(loggedInUserData) && (
          <form className="d-flex mt-4" onSubmit={handleSubmit(submitNode)}>
            <div className="col-md-3 p-2">
              <input
                className="form-control"
                placeholder="Enter Node Name"
                {...register("typeOfNode", {
                  required: "Please enter node name",
                })}
              />
              {errors.typeOfNode && (
                <InputError message={errors.typeOfNode.message} />
              )}
            </div>
            <div className="col-md-3 p-2">
              <select
                className="form-control form-select"
                {...register("nodeType", {
                  required: "Please select node type",
                })}
              >
                <option value="" disabled>
                  Select Node Type
                </option>
                <option value="floor">Floor</option>
                <option value="room">Room</option>
              </select>
              {errors.nodeType && (
                <InputError message={errors.nodeType.message} />
              )}
            </div>
            <div className="col-md-3 p-2">
              <select
                className="form-control form-select"
                {...register("parentNode", {
                  required: "Please select parent node",
                })}
              >
                <option value="" disabled>
                  Select Parent Node
                </option>
                {parentNodeTypes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {node.nodeName}
                  </option>
                ))}
              </select>
              {errors.parentNode && (
                <InputError message={errors.parentNode.message} />
              )}
            </div>
            <div className="col-md-3 p-2">
              <button className="btn btn-primary" type="submit">
                Add Node
              </button>
            </div>
          </form>
        )}
        {!updateSite?.isViewMode && isManagerAdminLogin(loggedInUserData) && (
          <UpdateFloor />
        )}
        <FloorMap siteLayout={siteLayout} />
      </div>
    </>
  );
};

// Map Redux state and actions
const mapStateToProps = (state) => ({
  siteLayout: state.site.siteLayout,
  updateSite: state.site.updateSite,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
  getSiteLayout,
  addSiteLayoutNode,
  setLoader,
})(SiteChart);
