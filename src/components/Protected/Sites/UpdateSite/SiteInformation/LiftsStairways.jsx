import React from 'react'
import { useForm } from 'react-hook-form';

const LiftsStairways = () => {
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
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Disabled Hoist/Lift</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Lifts (Goods-Traction)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Lifts (Goods-Hydraulic)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Lifts (Passenger-Traction)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Lifts (Passenger-Hydraulic)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Lifts (Passenger-Monospace)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Lifts (Fire Fighting)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Lifts (Fire Evacuation)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Number of Stairways (Internal)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Number of Stairways (External)</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
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

export default LiftsStairways