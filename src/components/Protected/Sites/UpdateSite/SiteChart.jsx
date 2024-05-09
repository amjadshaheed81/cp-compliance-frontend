import * as React from "react";
import styled from "@emotion/styled";
import { Tree, TreeNode } from "react-organizational-chart";
import { useForm } from "react-hook-form";

const StyledNode = styled.div`
  padding: 5px;
  border-radius: 8px;
  display: inline-block;
  border: 1px solid red;
`;

const Title = styled.h2`
  margin-top: 5rem;
  :first-of-type {
    margin-top: 0;
  }
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
        <div style={{ textAlign: "center" }}>
            <Title>Creating building Layout</Title>
            <Tree
                lineWidth={"2px"}
                lineColor={"green"}
                lineBorderRadius={"10px"}
                label={<StyledNode>Main Building</StyledNode>}
            >
                <TreeNode label={<StyledNode>Child 1</StyledNode>}>
                    <TreeNode label={<StyledNode>Grand Child</StyledNode>} />
                </TreeNode>
                <TreeNode label={<StyledNode>Child 2</StyledNode>}>
                    <TreeNode label={<StyledNode>Grand Child</StyledNode>}>
                        <TreeNode label={<StyledNode>Great Grand Child 1</StyledNode>} />
                        <TreeNode label={<StyledNode>Great Grand Child 2</StyledNode>} />
                    </TreeNode>
                </TreeNode>
                <TreeNode label={<StyledNode>Child 3</StyledNode>}>
                    <TreeNode label={<StyledNode>Grand Child 1</StyledNode>} />
                    <TreeNode label={<StyledNode>Grand Child 2</StyledNode>} />
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
        </div>
    );
};
export default SiteChart;