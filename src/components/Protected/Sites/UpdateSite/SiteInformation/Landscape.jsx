import React from 'react'
import { useForm } from 'react-hook-form';
import { yesNoOptions } from '../../../../../utils/yesNoOptions';

const Landscape = () => {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        getValues,
        setValue,
        watch,
    } = useForm({});
    const saveAreaAndOccupancy = (data) => {
        console.log('saveAreaAndOccupancy', data);
    };
    return (
        <div class="container">
            <form class="d-flex flex-wrap gap-3" onSubmit={handleSubmit(saveAreaAndOccupancy)}>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Hard Landscaping</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Soft Landscaping</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Rivers/Ponds/Lakes</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Tall Trees</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Drainage Interceptors</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Third Party Telecomms Equipment</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Electrical Overhead Power Lines</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Demolition Site or Vacant Land Adjacent</label>
                    <div>
                        <input type="string" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Risk of Flooding</label>
                    <div>
                        <input type="string" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Railway Line Adjacent</label>
                    <div>
                        <input type="string" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
            </form>
            <div>
                <button class="btn btn-primary float-end m-3">Save</button>
            </div>
        </div>
    )
}

export default Landscape