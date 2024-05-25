import React from 'react'
import { useForm } from 'react-hook-form';
import { yesNoOptions } from '../../../../../utils/yesNoOptions';

const SafetySecurity = () => {
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
                    <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">External Fabric</label>
                    <div>
                        <input type="text" name="totalBuildingArea" id="totalBuildingArea" class="form-control"
                            {...register("totalBuildingArea")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='clientOccupiedArea' name="clientOccupiedArea" id="clientOccupiedArea">External Metallic Fire Escape Staircases</label>
                    <div>
                        <input type="number" name="clientOccupiedArea" id="clientOccupiedArea" class="form-control"
                            {...register("clientOccupiedArea")}
                        />
                    </div>
                </div>
                <div >
                    <label htmlFor='tenantOccupiedArea' name="tenantOccupiedArea" id="tenantOccupiedArea">External Timber Fire Escape Staircases</label>
                    <div >
                        <input type="number" name="tenantOccupiedArea" id="tenantOccupiedArea" class="form-control"
                            {...register("tenantOccupiedArea")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='maxOccupancy' name="maxOccupancy" id="maxOccupancy">Vertical Ladder</label>
                    <div>
                        <input type="number" name="maxOccupancy" id="maxOccupancy" class="form-control"
                            {...register("maxOccupancy")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='meetingClients' name="meetingClients" id="meetingClients">Confined Spaces</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numberOfStaff' name="numberOfStaff" id="numberOfStaff">Accessible Unguarded Roof Areas</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='tenantInOccupation' name="tenantInOccupation" id="tenantInOccupation">Fragile Roofs or Surfaces</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='tenantName' name="tenantName" id="tenantName">Lighting Conductor Installation</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='vacantAreaInBuilding' name="vacantAreaInBuilding" id="vacantAreaInBuilding">Fire Alarm/Detection System</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfFloors' name="numOfFloors" id="numOfFloors">Fire Panel Location</label>
                    <div>
                        <input type="text" name="numOfFloors" id="numOfFloors" class="form-control"
                            {...register("numOfFloors")}
                        />
                    </div>
                </div>
                <div>
                    <label htmlFor='carParkSpaceAboveGround' name="carParkSpaceAboveGround" id="carParkSpaceAboveGround">Oil/Petrol Storage on Site</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='carParkSpaceBelowGround' name="carParkSpaceBelowGround" id="carParkSpaceBelowGround">LPG Storage on Site</label>
                    <div>
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">LPG Bulk Storage on Site</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">LPG Cylinder Storage on Site</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Sprinkler System</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Hose Reels</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Are Security Guards Employed</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Internal CCTV</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">External CCTV</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Automatic Barrier</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Automatic Gates (Sliding)</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Automatic Gates (Hinged)</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div>
                    <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Manual Swing Gates</label>
                    <div >
                        <select type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control"
                            {...register("carParkSpaceAboveGround")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
            </form>
            <div>
                <button class="btn btn-primary float-end m-3">Save</button>
            </div>
        </div>
    )
}

export default SafetySecurity