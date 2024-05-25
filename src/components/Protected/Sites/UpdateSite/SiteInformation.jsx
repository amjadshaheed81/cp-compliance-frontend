import * as React from 'react';
import { connect } from "react-redux";
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import SidebarNew from '../../../common/Sidebar/SidebarNew';
import { yearOptions } from '../../../../utils/yearOptions';
import { yesNoOptions } from '../../../../utils/yesNoOptions';
import { useForm } from 'react-hook-form';
import { Validation } from '../../../../Constant/Validation';
import { getSiteInformation, saveSiteBuildingData, saveAreaAndOccupancyDetails } from '../../../../store/thunk/site';
import SafetySecurity from './SiteInformation/SafetySecurity';

const SiteInformation = ({ updateSite, saveSiteBuildingData, siteInformation, getSiteInformation, saveAreaAndOccupancyDetails }) => {
    const defaultValues = {
        buildYear: "",
        buildingUnderClientControl: '',
        canteenInBuilding: '',
        dedicatedKitchenArea:''
    };
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
        getValues,
        setValue,
        watch,
    } = useForm({});
    const siteAreaForm = useForm();
    React.useEffect(() => {
        if(updateSite?.id === siteInformation?.data?.siteId) {
            setValue('buildYear', siteInformation.data.buildYear);
            setValue('buildingUnderClientControl', siteInformation.data.buildingUnderClientControl);
            setValue('canteenInBuilding', siteInformation.data.canteenInBuilding);
            setValue('dedicatedKitchenArea', siteInformation.data.dedicatedKitchenArea);
        }
    },[])
    const saveSiteInformation = (data) => {
        saveSiteBuildingData(updateSite?.id, data);
    };
    const saveAreaAndOccupancy = (data) => {
        console.log('data', data);
        saveAreaAndOccupancyDetails(updateSite?.id, data);
    };
    console.log('site information', siteInformation.data);
    return (
        <div>
            <SidebarNew />
            <form class="row" onSubmit={handleSubmit(saveSiteInformation)}>
                <div class="col-md-2">
                    <div class="pt-2 pb-4">
                        <label htmlFor='buildYear' name="buildYear" id="buildYear">Year Of Build</label>
                        <select
                            name="buildYear"
                            id="buildYear"
                            class="form-control w-100"
                            // value={siteInformation?.buildYear}
                            // onChange={(e)=> setValue('buildYear',e.target.value)}
                            {...register("buildYear")}
                        >
                            {yearOptions.map((year) => <option value={year.value}>{year.label}</option>)}
                        </select>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="pt-2 pb-4">
                        <label htmlFor='buildingUnderClientControl' name="buildingUnderClientControl" id="buildingUnderClientControl">Building Under Client Control</label>

                        <select
                            name="buildingUnderClientControl"
                            id="buildingUnderClientControl"
                            class="form-control w-100"
                            // value={siteInformation?.buildingUnderClientControl}
                            {...register("buildingUnderClientControl")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="pt-2 pb-4">
                        <label htmlFor='canteenInBuilding' name="canteenInBuilding" id="canteenInBuilding">Canteen in building</label>

                        <select
                            name="canteenInBuilding"
                            id="canteenInBuilding"
                            class="form-control w-100"
                            // value={siteInformation?.canteenInBuilding}
                            {...register("canteenInBuilding", {
                                // required: {
                                //     value: true,
                                //     message: `${Validation.REQUIRED}`,
                                // },
                            })}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="pt-2 pb-4">
                        <label htmlFor='dedicatedKitchenArea' name="dedicatedKitchenArea" id="dedicatedKitchenArea">Dedicated Kitchen Area</label>

                        <select
                            name="dedicatedKitchenArea"
                            id="dedicatedKitchenArea"
                            class="form-control w-100"
                            // value={siteInformation?.dedicatedKitchenArea}
                            {...register("dedicatedKitchenArea")}
                        >
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div class="pb-4">
                    <button class="float-end btn btn-primary">Save</button>
                </div>
            </form>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel1-content"
                    id="panel1-header"
                >
                    Area & Occupancy
                </AccordionSummary>
                <AccordionDetails>
                    <form class="row" onSubmit={siteAreaForm.handleSubmit(saveAreaAndOccupancy)}>
                        <div class="col-md-2">
                            <label htmlFor='totalBuildingArea' name="totalBuildingArea" id="totalBuildingArea">Total Building Area(Sq.m)</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="totalBuildingArea" id="totalBuildingArea" class="form-control"
                                {...register("totalBuildingArea")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='clientOccupiedArea' name="clientOccupiedArea" id="clientOccupiedArea">Client Occupied Area(Sq.m)</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="clientOccupiedArea" id="clientOccupiedArea" class="form-control"
                                {...register("clientOccupiedArea")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='tenantOccupiedArea' name="tenantOccupiedArea" id="tenantOccupiedArea">Tenant Occupied Area(Sq.m)</label>
                            <div class="pt-2 pb-2">
                                <input type="tenantOccupiedArea" name="tenantOccupiedArea" id="tenantOccupiedArea" class="form-control"
                                {...register("tenantOccupiedArea")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='maxOccupancy' name="maxOccupancy" id="maxOccupancy">Maximum Occupancy(Client)</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="maxOccupancy" id="maxOccupancy" class="form-control" 
                                {...register("maxOccupancy")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='meetingClients' name="meetingClients" id="meetingClients">Meeting/Conferences Client</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="meetingClients" id="meetingClients" class="form-control" 
                                {...register("meetingClients")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='numberOfStaff' name="numberOfStaff" id="numberOfStaff">Number Of Staff</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="numberOfStaff" id="numberOfStaff" class="form-control mt-4" 
                                {...register("numberOfStaff")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='tenantInOccupation' name="tenantInOccupation" id="tenantInOccupation">Tenants in Occupation</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="tenantInOccupation" id="tenantInOccupation" class="form-control mt-4" 
                                {...register("tenantInOccupation")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='tenantName' name="tenantName" id="tenantName">Name Of Tenant</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="tenantName" id="tenantName" class="form-control mt-4" 
                                {...register("tenantName")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='vacantAreaInBuilding' name="vacantAreaInBuilding" id="vacantAreaInBuilding">Vacant Areas in building</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="vacantAreaInBuilding" id="vacantAreaInBuilding" class="form-control" 
                                {...register("vacantAreaInBuilding")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='numOfFloors' name="numOfFloors" id="numOfFloors">Number Of Floors</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="numOfFloors" id="numOfFloors" class="form-control mt-4" 
                                {...register("numOfFloors")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='carParkSpaceAboveGround' name="carParkSpaceAboveGround" id="carParkSpaceAboveGround">Cark Park Spaces Above Ground</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="carParkSpaceAboveGround" id="carParkSpaceAboveGround" class="form-control" 
                                {...register("carParkSpaceAboveGround")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='carParkSpaceBelowGround' name="carParkSpaceBelowGround" id="carParkSpaceBelowGround">Cark Park Spaces Below Ground</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="carParkSpaceBelowGround" id="carParkSpaceBelowGround" class="form-control" 
                                {...register("carParkSpaceBelowGround")}
                                />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='numOfBasementLevels' name="numOfBasementLevels" id="numOfBasementLevels">Number Of Basement Levels</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="numOfBasementLevels" id="numOfBasementLevels" class="form-control" 
                                {...register("numOfBasementLevels")}
                                />
                            </div>
                        </div>
                        <div class="pb-4">
                        <button class="btn btn-primary float-end">Save</button>
                        </div>
                    </form>
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2-content"
                    id="panel2-header"
                >
                    Safety & Security
                </AccordionSummary>
                <AccordionDetails>
                    <SafetySecurity />
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2-content"
                    id="panel2-header"
                >
                    Utility & Energy
                </AccordionSummary>
                <AccordionDetails>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                    malesuada lacus ex, sit amet blandit leo lobortis eget.
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2-content"
                    id="panel2-header"
                >
                    Lifts & Stairways
                </AccordionSummary>
                <AccordionDetails>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                    malesuada lacus ex, sit amet blandit leo lobortis eget.
                </AccordionDetails>
            </Accordion>
            <Accordion>
                <AccordionSummary
                    expandIcon={<ExpandMoreIcon />}
                    aria-controls="panel2-content"
                    id="panel2-header"
                >
                    Landscape
                </AccordionSummary>
                <AccordionDetails>
                    Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse
                    malesuada lacus ex, sit amet blandit leo lobortis eget.
                </AccordionDetails>
            </Accordion>
        </div>
    );
}

const mapStateToProps = (state) => ({
    updateSite: state.site.updateSite,
    success: state.site.updateSuccess,
    error: state.site.updateError,
    siteInformation: state.site.siteInformation
});
export default connect(mapStateToProps, {
    saveSiteBuildingData,
    getSiteInformation,
    saveAreaAndOccupancyDetails,
})(SiteInformation);
