import React, { useEffect, useState } from "react";
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
} from "./../../../../store/thunk/site";

const InteriorExteriorStyledNode = styled.div`
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #f3a515;
  background: repeating-linear-gradient(
    +45deg,
    #fff7de 2px,
    #fff7de,
    transparent 1rem
  );
`;

const MainBuildingStyledNode = styled.div`
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #1dca5d;
  background: repeating-linear-gradient(
    +45deg,
    #1dca5d0a 2px,
    #1dca5d0a,
    transparent 1rem
  );
`;

const FloorStyledNode = styled.div`
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #f34040;
  background: repeating-linear-gradient(
    +45deg,
    #fff5f4 2px,
    #fff5f4,
    transparent 1rem
  );
`;

const OtherStyledNode = styled.div`
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #3b80f2;
  background: repeating-linear-gradient(
    +45deg,
    #f0f8ff 2px,
    #f0f8ff,
    transparent 1rem
  );
`;

const SiteChart = ({
  getSiteLayout,
  addSiteLayoutNode,
  siteLayout,
  updateSite,
  setLoader,
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
      siteId: updateSite?.siteId,
      nodeName: values?.typeOfNode,
      nodeType: values?.nodeType,
      parentNode: values?.parentNode,
    };
    setLoader(true);
    addSiteLayoutNode(data);
  };
  useEffect(() => {
    getSiteLayout(updateSite?.siteId);
  }, []);

  const getMainBuilding = () => {
    const mainNode = siteLayout?.filter(
      (itm) => itm?.nodeType === "MasterNode"
    );
    return mainNode?.length > 0 ? (
      <MainBuildingStyledNode>{mainNode?.[0]?.nodeName}</MainBuildingStyledNode>
    ) : null;
  };
  const getTreeNodePosition = () => {
    const positionNode = siteLayout?.filter(
      (itm) => itm?.nodeType === "position" && itm?.nodeName === "Exterior"
    );
    const childs = siteLayout?.filter(
      (itm) => itm?.parentNode === positionNode?.[0]?.id
    );
    return positionNode?.length > 0 ? (
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
    ) : null;
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
    return positionNode?.length > 0 ? (
      <TreeNode
        label={
          <InteriorExteriorStyledNode>
            {positionNode?.[0]?.nodeName}
          </InteriorExteriorStyledNode>
        }
      >
        {childs?.map((itm) => (
          <TreeNode label={<FloorStyledNode>{itm?.nodeName}</FloorStyledNode>}>
            {getOtherStyleNode(itm)}
          </TreeNode>
        ))}
      </TreeNode>
    ) : null;
  };
  return (
    <>
      <SidebarNew />
      <div style={{ textAlign: "center" }}>
        <h5 className="text-start">Creating Building Layout</h5>
        <Tree
          lineWidth={"2px"}
          lineColor={"grey"}
          lineBorderRadius={"10px"}
          label={getMainBuilding()}
        >
          {getTreeNodePosition()}
          {getTreeNodePositionInterior()}
        </Tree>
        <div
          style={{
            display: updateSite?.isViewMode ? "none" : "block",
          }}
        >
          <form className="d-flex mt-4" onSubmit={handleSubmit(submitNode)}>
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
                    setParntNodeOptions([
                      "Reception",
                      "Concierge",
                      "Lift Lobby",
                    ]);
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
        </div>
        <UpdateFloor />
        <FloorMap siteLayout={siteLayout} />
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
  setLoader,
})(SiteChart);
