import React, { useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import styled from "@emotion/styled";
import { Tree, TreeNode } from "react-organizational-chart";
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
import "./SiteChart.css";

// Styled Components
const StyledNode = styled.div`
  padding: 5px;
  font-size: small;
  border-radius: 8px;
  display: inline-block;
  cursor: pointer;
  border-left: 4px solid ${(props) => props.borderColor || "#000"};
  background: ${(props) => props.background || "#f5f5f5"};
  overflow-x: auto !important;
`;
const nodeStyles = {
  building: {
    borderColor: "#1dca5d",
    background: "repeating-linear-gradient(+45deg, #1dca5d0a 2px, transparent 1rem)",
  },
  floor: {
    borderColor: "#f34040",
    background: "repeating-linear-gradient(+45deg, #fff5f4 2px, transparent 1rem)",
  },
  type: {
    borderColor: "#f3a515",
    background: "repeating-linear-gradient(+45deg, #fff7de 2px, transparent 1rem)",
  },
  default: {
    borderColor: "#3b80f2",
    background: "repeating-linear-gradient(+45deg, #f0f8ff 2px, transparent 1rem)",
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
  const [selectedNode, setSelectedNode] = useState();
  const [expandedNodes, setExpandedNodes] = useState({});

  useEffect(() => {
    getSiteLayout(updateSite?.siteId);
  }, [getSiteLayout, updateSite]);

  useEffect(() => {
    const floors = siteLayout?.filter((node) => node.nodeType === "floor") || [];
    setParentNodeTypes(floors);
  }, [siteLayout]);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  // Helper function to check if a node is a descendant of "Interior" or "Exterior"
  const isDescendantOfInteriorOrExterior = (nodeId) => {
    const findParent = (id) => {
      const node = siteLayout.find((n) => n.id === id);
      if (!node) return false;
      if (node.nodeName === "Interior" || node.nodeName === "Exterior") return true;
      return findParent(node.parentNode);
    };
    return findParent(nodeId);
  };

  const renderTreeNodes = (nodes) => {
    const orderMap = {
      Basement: 1,
      "Ground Floor": 2,
      "1st Floor": 3,
      "2nd Floor": 4,
      "3rd Floor": 5,
      "4th Floor": 6,
      "5th Floor": 7,
      "6th Floor": 8,
      "7th Floor": 9,
      Vertical: 10,
    };

    const sortedNodes = nodes.sort((a, b) => {
      const aOrder = orderMap[a.nodeName] || Number.MAX_SAFE_INTEGER;
      const bOrder = orderMap[b.nodeName] || Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder;
    });

    return sortedNodes.map((node) => {
      const children = siteLayout.filter((child) => child.parentNode === node.id);
      const style = nodeStyles[node.nodeType] || nodeStyles.default;
      const isExpanded = expandedNodes[node.id];
      const isDescendant = isDescendantOfInteriorOrExterior(node.id);

      return (
        <TreeNode
          key={node.id}
          label={
            <StyledNode
              borderColor={style.borderColor}
              background={style.background}
              onClick={() => toggleNode(node.id)}
            >
              {node.nodeName}
              {(node.nodeName === "Interior" || node.nodeName === "Exterior" || isDescendant) && (
                <span
                  style={{ float: "right", cursor: "pointer" }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedNode(node);
                    setShowModal(true);
                  }}
                >
                  ✏️
                </span>
              )}
            </StyledNode>
          }
        >
          {isExpanded && renderTreeNodes(children)}
        </TreeNode>
      );
    });
  };

  const rootNodes = siteLayout.filter((node) => node.parentNode === 0);

  const submitNode = (values) => {
    const { typeOfNode, nodeType, parentNode } = values;
    const duplicateNode = siteLayout.some(
      (node) =>
        node.parentNode == parentNode && node.nodeName === typeOfNode
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
        <Tree
          lineWidth="2px"
          lineColor="grey"
          lineBorderRadius="10px"
          label={<strong>Site Layout</strong>}
        >
          {renderTreeNodes(rootNodes)}
        </Tree>
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
 