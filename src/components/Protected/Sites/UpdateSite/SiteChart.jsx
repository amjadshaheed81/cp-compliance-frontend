import * as React from "react";
import { connect } from "react-redux";
import styled from "@emotion/styled";
import { Tree, TreeNode } from "react-organizational-chart";
import { useForm } from "react-hook-form";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import UpdateFloor from "./UpdateFloor";
import FloorMap from "./FloorMap";
import { useEffect } from "react";
import {
  getSiteLayout,
  addSiteLayoutNode,
} from "./../../../../store/thunk/site";
import { useState } from "react";

const InteriorExteriorStyledNode = styled.div`
  background: #fff7de;
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #f3a515;
`;

const MainBuildingStyledNode = styled.div`
  background: #1dca5d0a;
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #1dca5d;
`;

const FloorStyledNode = styled.div`
  background: #fff5f4;
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #f34040;
`;

const OtherStyledNode = styled.div`
  background: #f0f8ff;
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #3b80f2;
`;

const SiteChart = ({
  getSiteLayout,
  addSiteLayoutNode,
  siteLayout,
  updateSite,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm({});
  const [parentNodeOptions, setParntNodeOptions] = useState([]);
  const [floorOptions, setFloorOptions] = useState([]);
  const submitNode = (values) => {
    const data = {
      siteId: updateSite?.id,
      nodeName: values?.typeOfNode,
      nodeType: values?.nodeType,
      parentNode: values?.parentNode,
    };
    addSiteLayoutNode(data);
  };
  useEffect(() => {
    getSiteLayout(updateSite?.id);
  }, []);

  const getMainBuilding = () => {
    const mainNode = siteLayout?.filter(
      (itm) => itm?.nodeType === "MasterNode"
    );
    return (
      <MainBuildingStyledNode>{mainNode?.[0]?.nodeName}</MainBuildingStyledNode>
    );
  };
  const getTreeNodePosition = () => {
    const positionNode = siteLayout?.filter(
      (itm) => itm?.nodeType === "position" && itm?.nodeName === "Exterior"
    );
    const childs = siteLayout?.filter(
      (itm) => itm?.parentNode === positionNode?.[0]?.id
    );
    return (
      <TreeNode
        label={
          <InteriorExteriorStyledNode>
            {positionNode?.[0]?.nodeName}
          </InteriorExteriorStyledNode>
        }
      >
        {childs?.map((itm) => (
          <TreeNode
            label={<FloorStyledNode>{itm?.nodeName}</FloorStyledNode>}
          />
        ))}
      </TreeNode>
    );
  };
  const getOtherStyleNode = (node) => {
    const positionNode = siteLayout?.filter(
      (itm) => itm?.parentNode === node?.id
    );
    return positionNode?.map((itm) => (
      <TreeNode
        label={<OtherStyledNode>{itm?.nodeName}</OtherStyledNode>}
      ></TreeNode>
    ));
  };
  const getTreeNodePositionInterior = () => {
    const positionNode = siteLayout?.filter(
      (itm) => itm?.nodeType === "position" && itm?.nodeName === "Interior"
    );
    const childs = siteLayout?.filter(
      (itm) => itm?.parentNode === positionNode?.[0]?.id
    );
    return (
      <TreeNode
        label={
          <InteriorExteriorStyledNode>
            {positionNode?.[0]?.nodeName}
          </InteriorExteriorStyledNode>
        }
      >
        {childs?.map((itm) => (
          <TreeNode
            label={<FloorStyledNode>{itm?.nodeName}</FloorStyledNode>}
          >
            {getOtherStyleNode(itm)}
          </TreeNode>
        ))}
      </TreeNode>
    );
  };
  return (
    <>
      <SidebarNew />
      <div style={{ textAlign: "center" }}>
        <h5 class="text-start">Creating Building Layout</h5>
        <Tree
          lineWidth={"2px"}
          lineColor={"grey"}
          lineBorderRadius={"10px"}
          label={getMainBuilding()}
        >
          {getTreeNodePosition()}
          {getTreeNodePositionInterior()}
          {/* <TreeNode
            label={
              <InteriorExteriorStyledNode>Interior</InteriorExteriorStyledNode>
            }
          >
            <TreeNode label={<FloorStyledNode>Ground Floor</FloorStyledNode>}>
              <TreeNode label={<OtherStyledNode>Reception</OtherStyledNode>} />
              <TreeNode label={<OtherStyledNode>Concierge</OtherStyledNode>} />
            </TreeNode>
            <TreeNode label={<FloorStyledNode>First Floor</FloorStyledNode>}>
              <TreeNode label={<OtherStyledNode>Lift Lobby</OtherStyledNode>} />
              <TreeNode label={<OtherStyledNode>Office</OtherStyledNode>} />
              <TreeNode label={<OtherStyledNode>WC</OtherStyledNode>} />
            </TreeNode>
            <TreeNode label={<FloorStyledNode>Second Floor</FloorStyledNode>}>
              <TreeNode label={<OtherStyledNode>Lift Lobby</OtherStyledNode>} />
              <TreeNode label={<OtherStyledNode>Office</OtherStyledNode>} />
              <TreeNode label={<OtherStyledNode>WC</OtherStyledNode>} />
            </TreeNode>
          </TreeNode> */}
        </Tree>
        <form className="d-flex mt-4" onSubmit={handleSubmit(submitNode)}>
          {/* <div className="col-md-3">
            <input
              type="text"
              placeholder="Node Name"
              className="form-control w-75"
              id="nodename"
              name="nodename"
              {...register("nodename", {
                required: {
                  value: true,
                  // message: `${Validation.REQUIRED} Council`,
                },
              })}
            />
          </div> */}
          <div className="col-md-3">
            <select
              name="nodeType"
              className="form-control w-75"
              id="nodeType"
              {...register("nodeType", {
                required: {
                  value: true,
                  // message: `${Validation.REQUIRED} Status`,
                },
              })}
              onChange={(e) => {
                setValue("nodeType", e.target.value);
                setFloorOptions([]);
                if (e.target.value === "position") {
                  const parentNodeId = siteLayout?.filter(
                    (itm) => itm?.nodeType === "MasterNode"
                  );
                  setValue("parentNode", parentNodeId?.[0]?.id);
                  setParntNodeOptions(["Exterior", "Interior"]);
                } else if (e.target.value === "floor") {
                  setParntNodeOptions([
                    "Garden",
                    "Ground Floor",
                    "First Floor",
                    "Second Floor",
                  ]);
                } else if (e.target.value === "room") {
                  setParntNodeOptions(["Reception", "Concierge", "Lift Lobby"]);
                  const floors = siteLayout?.filter(
                    (itm) => itm?.nodeType === "floor"
                  );
                  setFloorOptions(floors);
                }
              }}
            >
              <option value="" disabled selected>
                Node Type
              </option>
              <option value="position">Position</option>
              <option value="floor">Floor</option>
              <option value="room">Room</option>
            </select>
          </div>
          <div className="col-md-3">
            <select
              name="typeOfNode"
              className="form-control w-75"
              id="typeOfNode"
              {...register("typeOfNode", {
                required: {
                  value: true,
                  // message: `${Validation.REQUIRED} Status`,
                },
              })}
              onChange={(e) => {
                setValue("typeOfNode", e.target.value);
                if (e.target.value === "Garden") {
                  const parentNodeId = siteLayout?.filter(
                    (itm) => itm?.nodeName === "Exterior"
                  );
                  setValue("parentNode", parentNodeId?.[0]?.id);
                } else {
                  const parentNodeId = siteLayout?.filter(
                    (itm) => itm?.nodeName === "Interior"
                  );
                  setValue("parentNode", parentNodeId?.[0]?.id);
                }
              }}
            >
              <option value="" disabled selected>
                Node name
              </option>
              {parentNodeOptions?.map((itm) => (
                <option value={itm}>{itm}</option>
              ))}
            </select>
          </div>
          {floorOptions?.length > 0 && (
            <div className="col-md-3">
              <select
                name="floorNode"
                className="form-control w-75"
                id="floorNode"
                {...register("floorNode")}
                onChange={(e) => {
                  setValue("floorNode", e.target.value);
                  setValue("parentNode", e.target.value);
                }}
              >
                <option value="" disabled selected>
                  Select Floor Node
                </option>
                {floorOptions?.map((itm) => (
                  <option value={itm?.id}>{itm?.nodeName}</option>
                ))}
              </select>
            </div>
          )}
          <div className="col-md-3">
            <button className="btn btn-primary" type="submit">
              Add Node
            </button>
          </div>
        </form>
        <UpdateFloor />
        <FloorMap />
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  error: state.site.siteLayoutFailure,
  updateSite: state.site.updateSite,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, {
  getSiteLayout,
  addSiteLayoutNode,
})(SiteChart);
