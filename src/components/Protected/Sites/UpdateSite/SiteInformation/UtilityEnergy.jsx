import React from 'react'
import { useForm } from 'react-hook-form';
import { yesNoOptions } from '../../../../../utils/yesNoOptions';

const UtilityEnergy = () => {
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
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Utility - Gas</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='clientOccupiedArea' name="clientOccupiedArea" id="clientOccupiedArea">Utility - Electricity</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div >
                    <label htmlFor='tenantOccupiedArea' name="tenantOccupiedArea" id="tenantOccupiedArea">Utility - Water</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='maxOccupancy' name="maxOccupancy" id="maxOccupancy">Utility - Telecom/Data</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='meetingClients' name="meetingClients" id="meetingClients">Utility - Mains Drainage</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numberOfStaff' name="numberOfStaff" id="numberOfStaff">Air Conditioning</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='tenantInOccupation' name="tenantInOccupation" id="tenantInOccupation">Cooling Tower</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='tenantName' name="tenantName" id="tenantName">Water Isolation Valve Location (Internal)</label>
                    <div>
                        <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='vacantAreaInBuilding' name="vacantAreaInBuilding" id="vacantAreaInBuilding">Water Tanks</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfFloors' name="numOfFloors" id="numOfFloors">Water Tank Location</label>
                    <div>
                        <input type="text" name="numOfFloors" id="numOfFloors" class="form-control"
                            {...register("numOfFloors")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='carParkSpaceAboveGround' name="carParkSpaceAboveGround" id="carParkSpaceAboveGround">Hot Water Calorifier</label>
                    <div>
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='carParkSpaceBelowGround' name="carParkSpaceBelowGround" id="carParkSpaceBelowGround">Hot Water Calorifier Location</label>
                    <div>
                        <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Pressure Vessel</label>
                    <div >
                        <input type="number" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Gas Boiler</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Gas Boiler Location</label>
                    <div >
                        <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Gas Supply Isolation/Meter Location</label>
                    <div >
                        <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Gas Supply External Isolation Location</label>
                    <div >
                        <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Electric Installation / Meter Location</label>
                    <div >
                        <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Electric Sub-Station on Site</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">External Lighting</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Back Up Generator</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Back Up Generator Location</label>
                    <div >
                        <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
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

export default UtilityEnergy