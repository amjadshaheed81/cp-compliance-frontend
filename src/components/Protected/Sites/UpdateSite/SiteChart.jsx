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
import { toast } from "react-toastify";
import { InputError } from "../../../common/InputError";
import UpdateSiteLayout from "./UpdateSiteLayout";

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
  cursor: pointer;
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
  cursor: pointer;
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
    watch,
  } = useForm({});
  const [floorOptions, setFloorOptions] = useState([]);
  const [positionOption, setPositionOption] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedNode, setSelectedNode] = useState();
  const [nodeTypes, setNodeTypes] = useState([
    {
      name: "Floor",
      value: "floor",
    },
  ]);
  const [parentNodeTypes, setParentNodeTypes] = useState([]);
  useEffect(() => {
    const floorNodes = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    if (floorNodes?.length > 0) {
      setNodeTypes([
        {
          name: "Floor",
          value: "floor",
        },
        {
          name: "Room",
          value: "room",
        },
      ]);
    }
    const positions = siteLayout?.filter((itm) => itm?.nodeType === "position");
    setPositionOption(positions || []);
    setFloorOptions(floorNodes || []);
  }, [siteLayout]);
  const formValues = watch();
  const submitNode = (values) => {
    const isFloorAlreadyAdded = siteLayout?.filter(
      (itm) =>
        itm?.parentNode == values?.parentNode &&
        itm?.nodeName == values?.typeOfNode
    );
    if (isFloorAlreadyAdded?.length > 0) {
      toast.warn(`${values?.typeOfNode} is already added in parent node.`);
      return;
    }
    const data = {
      siteId: updateSite?.siteId,
      nodeName: values?.typeOfNode,
      nodeType: values?.nodeType,
      parentNode: Number(values?.parentNode),
    };
    setLoader(true);
    addSiteLayoutNode(data);
    reset({});
  };
  useEffect(() => {
    getSiteLayout(updateSite?.siteId);
  }, []);

  const getMainBuilding = () => {
    const mainNode = siteLayout?.filter(
      (itm) => itm?.nodeType === "MasterNode" || itm?.nodeType === "building"
    );
    return mainNode?.length > 0 ? (
      <MainBuildingStyledNode>{mainNode?.[0]?.nodeName}</MainBuildingStyledNode>
    ) : null;
  };
  const getTreeNodePosition = () => {
    const positionNode = siteLayout?.filter(
      (itm) => (itm?.nodeType === "position" || itm?.nodeType === "type") && itm?.nodeName === "Exterior"
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
          <TreeNode label={<FloorStyledNode><span
            onClick={() => {
              setSelectedNode(itm);
              setShowModal(true);
            }}
          >{itm?.nodeName}</span></FloorStyledNode>}>
            {getOtherStyleNode(itm)}
          </TreeNode>
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
        label={<OtherStyledNode><span onClick={() => {
          setSelectedNode(itm);
          setShowModal(true);
        }}>{itm?.nodeName}</span></OtherStyledNode>}
      ></TreeNode>
    ));
  };
  const getTreeNodePositionInterior = () => {
    const positionNode = siteLayout?.filter(
      (itm) => (itm?.nodeType === "position" || itm?.nodeType === "type") && itm?.nodeName === "Interior"
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
          <TreeNode label={<FloorStyledNode><span
            onClick={() => {
              setSelectedNode(itm);
              setShowModal(true);
            }}
          >{itm?.nodeName}</span></FloorStyledNode>}>
            {getOtherStyleNode(itm)}
          </TreeNode>
        ))}
      </TreeNode>
    ) : null;
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
          lineWidth={"2px"}
          lineColor={"grey"}
          lineBorderRadius={"10px"}
          label={getMainBuilding()}
        >
          {getTreeNodePositionInterior()}
          {getTreeNodePosition()}
        </Tree>
        <div
          style={{
            display: updateSite?.isViewMode ? "none" : "block",
          }}
        >
          <form className="d-flex mt-4" onSubmit={handleSubmit(submitNode)}>
            <div className="col-md-3 p-2">
              <input
                className="form-control"
                placeholder="Enter Node Name"
                {...register("typeOfNode", {
                  required: {
                    value: true,
                    message: `Please enter node name`,
                  },
                })}
              />

              {errors?.typeOfNode && (
                <InputError
                  message={errors?.typeOfNode?.message}
                  key={errors?.typeOfNode?.message}
                />
              )}
            </div>
            <div className="col-md-3 p-2">
              <select
                name="nodeType"
                className="form-control form-select"
                id="nodeType"
                {...register("nodeType", {
                  required: {
                    value: true,
                    message: `Please select node type.`,
                  },
                })}
                onChange={(e) => {
                  setValue("nodeType", e.target.value, {
                    shouldValidate: true,
                  });
                  if (String(e.target.value).toLowerCase() === "floor") {
                    setParentNodeTypes(positionOption);
                    setValue("parentNode", "", { shouldValidate: true });
                  }
                  if (String(e.target.value).toLowerCase() === "room") {
                    setParentNodeTypes(floorOptions);
                    setValue("parentNode", "", { shouldValidate: true });
                  }
                }}
              >
                <option value="" disabled selected>
                  Select Node Type
                </option>
                {nodeTypes?.map((itm) => (
                  <option value={itm?.value}>{itm?.name}</option>
                ))}
              </select>
              {errors?.nodeType && (
                <InputError
                  message={errors?.nodeType?.message}
                  key={errors?.nodeType?.message}
                />
              )}
            </div>
            <div className="col-md-3 p-2">
              <select
                name="parentNode"
                className="form-control form-select w-75"
                id="parentNode"
                {...register("parentNode", {
                  required: {
                    value: true,
                    message: `Please select parent node.`,
                  },
                })}
                onChange={(e) => {
                  setValue("parentNode", e.target.value, {
                    shouldValidate: true,
                  });
                }}
              >
                <option value="" disabled selected>
                  Select Parent Node
                </option>
                {parentNodeTypes?.map((itm) => (
                  <option value={itm?.id}>{itm?.nodeName}</option>
                ))}
              </select>
              {errors?.parentNode && (
                <InputError
                  message={errors?.parentNode?.message}
                  key={errors?.parentNode?.message}
                />
              )}
            </div>
            <div className="col-md-3 p-2">
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
