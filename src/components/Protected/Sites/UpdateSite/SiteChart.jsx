import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import styled from "@emotion/styled";
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

const StyledNode = styled.div`
  padding: 5px;
  font-size: small;
  border-radius: 8px;
  display: inline-block;
  cursor: pointer;
  border-left: 4px solid ${(props) => props.borderColor || "#000"};
  background: ${(props) => props.background || "#f5f5f5"};
`;

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
    watch,
    setValue,
  } = useForm();

  const [parentNodeTypes, setParentNodeTypes] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState();
  const [expandedNodes, setExpandedNodes] = useState({});

  const selectedNodeType = watch("nodeType");
  const getParentNodeName = (id) => {
    return siteLayout?.filter((itm) => itm?.id === id)?.[0]?.nodeName;
  };

  useEffect(() => {
    getSiteLayout(updateSite?.siteId);
  }, [getSiteLayout, updateSite]);

  // Update parent node options based on selected node type
  useEffect(() => {
    if (selectedNodeType) {
      let filteredNodes = [];

      if (selectedNodeType === "room") {
        // If room is selected, only floors can be parents
        filteredNodes =
          siteLayout
            ?.filter((node) => node.nodeType === "floor")
            ?.sort(
              (a, b) =>
                (orderMap[a.nodeName] || 999) - (orderMap[b.nodeName] || 999)
            ) || [];
      } else if (selectedNodeType === "type") {
        // If type is selected, only buildings can be parents
        filteredNodes =
          siteLayout
            ?.filter((node) => node.nodeType === "building")
            ?.sort(
              (a, b) =>
                (orderMap[a.nodeName] || 999) - (orderMap[b.nodeName] || 999)
            ) || [];
      } else if (selectedNodeType === "floor") {
        // If floor is selected, only types or buildings can be parents
        filteredNodes =
          siteLayout
            ?.filter(
              (node) => node.nodeType === "type" || node.nodeType === "building"
            )
            .sort(
              (a, b) =>
                (orderMap[a.nodeName] || 999) - (orderMap[b.nodeName] || 999)
            ) || [];
      }

      setParentNodeTypes(filteredNodes);
      // Reset parent selection when node type changes
      setValue("parentNode", "");
    }
  }, [selectedNodeType, siteLayout, setValue]);

  const toggleNode = (nodeId) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: !prev[nodeId],
    }));
  };

  const isDescendantOfInteriorOrExterior = (nodeId) => {
    const findParent = (id) => {
      const node = siteLayout.find((n) => n.id === id);
      if (!node) return false;
      if (node.nodeName === "Interior" || node.nodeName === "Exterior")
        return true;
      return findParent(node.parentNode);
    };
    return findParent(nodeId);
  };

  const CustomTreeNode = ({ node }) => {
    const children = siteLayout
      .filter((child) => child.parentNode === node.id)
      ?.sort(
        (a, b) => (orderMap[a.nodeName] || 999) - (orderMap[b.nodeName] || 999)
      );
    const isExpanded = expandedNodes[node.id];
    const style = nodeStyles[node.nodeType] || nodeStyles.default;
    const isDescendant = isDescendantOfInteriorOrExterior(node.id);
    const hasChildren = children.length > 0;

    return (
      <div
        className={`tree-node ${hasChildren ? "has-children" : ""}`}
        style={{ position: "relative" }}
      >
        <div
          className="tree-label"
          style={{
            borderLeftColor: style.borderColor,
            background: style.background,
          }}
          onClick={() => toggleNode(node.id)}
        >
          {node.nodeName}
          {(node.nodeName === "Interior" ||
            node.nodeName === "Exterior" ||
            isDescendant) && (
            <span
              style={{ float: "right", cursor: "pointer", marginLeft: "10px" }}
              onClick={(e) => {
                e.stopPropagation();
                setSelectedNode(node);
                setShowModal(true);
              }}
            >
              ✏️
            </span>
          )}
        </div>
        {isExpanded && hasChildren && (
          <div
            className={`tree-children ${
              children.length > 1 ? "multi-child" : "single-child"
            }`}
          >
            {children.map((child) => (
              <CustomTreeNode key={child.id} node={child} />
            ))}
          </div>
        )}
      </div>
    );
  };

  const rootNodes = siteLayout
    .filter((node) => node.parentNode === 0 || node.parentNode === -1)
    .sort(
      (a, b) => (orderMap[a.nodeName] || 999) - (orderMap[b.nodeName] || 999)
    );

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

        <div className="tree-horizontal">
          {rootNodes.map((node) => (
            <CustomTreeNode
              key={node.id}
              node={node}
              childrenNodes={siteLayout
                .filter((n) => n.parentNode === node.id)
                .sort(
                  (a, b) =>
                    (orderMap[a.nodeName] || 999) -
                    (orderMap[b.nodeName] || 999)
                )}
            />
          ))}
        </div>

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
                <option value="type">Type</option>
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
                disabled={!selectedNodeType}
              >
                <option value="" disabled>
                  {!selectedNodeType
                    ? "Please select node type first"
                    : "Select Parent Node"}
                </option>
                {parentNodeTypes.map((node) => (
                  <option key={node.id} value={node.id}>
                    {selectedNodeType === "room"
                      ? `${getParentNodeName(node?.parentNode)} : ${
                          node?.nodeName
                        }`
                      : node?.nodeName}
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
