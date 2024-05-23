import * as React from "react";
import styled from "@emotion/styled";
import { Tree, TreeNode } from "react-organizational-chart";
import { useForm } from "react-hook-form";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import UpdateFloor from "./UpdateFloor";
import FloorMap from "./FloorMap";

const InteriorExteriorStyledNode = styled.div`
  background: #FFF7DE;
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border-left: 4px solid #f3a515;
`;

const MainBuildingStyledNode = styled.div`
 background: #1DCA5D0A;
 padding: 5px;
 border-radius: 8px;
 display: inline-block;
 border-left: 4px solid #1dca5d;
`;

const FloorStyledNode = styled.div`
 background: #FFF5F4;
 padding: 5px;
 border-radius: 8px;
 display: inline-block;
 border-left: 4px solid #f34040;
`;

const OtherStyledNode = styled.div`
 background: #F0F8FF;
 padding: 5px;
 border-radius: 8px;
 display: inline-block;
 border-left: 4px solid #3b80f2;
`;

const SiteChart = (props) => {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
    } = useForm({});
    const submitNode = (values) => {
        console.log('vales', values);
    }
    return (
        <><SidebarNew /><div style={{ textAlign: "center" }}>
            <h5 class="text-start">Creating Building Layout</h5>
            <Tree
                lineWidth={"2px"}
                lineColor={"grey"}
                lineBorderRadius={"10px"}
                label={<MainBuildingStyledNode>Main Building</MainBuildingStyledNode>}
            >
                <TreeNode label={<InteriorExteriorStyledNode>Exterior</InteriorExteriorStyledNode>}>
                    <TreeNode label={<FloorStyledNode>Garden</FloorStyledNode>} />
                </TreeNode>
                <TreeNode label={<InteriorExteriorStyledNode>Interior</InteriorExteriorStyledNode>}>
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
                </TreeNode>
            </Tree>
            <form className="d-flex mt-4" onSubmit={handleSubmit(submitNode)}>
                <div className="col-md-3">
                    <input type="text" placeholder="Node Name" className="form-control w-75" id="nodename" name="nodename"
                        {...register("nodename", {
                            required: {
                                value: true,
                                // message: `${Validation.REQUIRED} Council`,
                            },
                        })} />
                </div>
                <div className="col-md-3">
                    <select
                        name="type"
                        className="form-control w-75"
                        id="type"
                        {...register("type", {
                            required: {
                                value: true,
                                // message: `${Validation.REQUIRED} Status`,
                            },
                        })}
                    >
                        <option value="nodeType">Node Type</option>
                        <option value="position">Status</option>
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
                    >
                        <option value="parentnode">Parent Node</option>
                        <option value="childnode">Child Node</option>
                    </select>
                </div>
                <div className="col-md-3">
                    <button className="btn btn-primary" onClick={submitNode}>Add Node</button>
                </div>
            </form>
            <UpdateFloor />
            <FloorMap />
        </div></>
    );
};
export default SiteChart;