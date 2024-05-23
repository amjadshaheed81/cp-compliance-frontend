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
import { getSiteInformation, saveSiteBuildingData } from '../../../../store/thunk/site';

const SiteInformation = ({ updateSite, saveSiteBuildingData, siteInformation, getSiteInformation }) => {
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
    } = useForm({
        defaultValues,
    });
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
                                required: {
                                    value: true,
                                    message: `${Validation.REQUIRED}`,
                                },
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
                    <div class="row">
                        <div class="col-md-2">
                            <label htmlFor='buildArea' name="buildArea" id="buildArea">Total Building Area(Sq.m)</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="buildArea" id="buildArea" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='clientArea' name="clientArea" id="clientArea">Client Occupied Area(Sq.m)</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="clientArea" id="clientArea" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='tenantArea' name="tenantArea" id="tenantArea">Tenant Occupied Area(Sq.m)</label>
                            <div class="pt-2 pb-2">
                                <input type="tenantArea" name="tenantArea" id="tenantArea" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='maxOccu' name="maxOccu" id="maxOccu">Maximum Occupancy(Client)</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="maxOccu" id="maxOccu" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='meet' name="meet" id="meet">Meeting/Conferences Client</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="meet" id="meet" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='staff' name="staff" id="staff">Number Of Staff</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="staff" id="staff" class="form-control mt-4" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='tenants' name="tenants" id="tenants">Tenants in Occupation</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="tenants" id="tenants" class="form-control mt-4" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='tenantName' name="tenantName" id="tenantName">Name Of Tenant</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="tenantName" id="tenantName" class="form-control mt-4" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='vacantArea' name="vacantArea" id="vacantArea">Vacant Areas in building</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="vacantArea" id="vacantArea" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='floorNos' name="floorNos" id="floorNos">Number Of Floors</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="floorNos" id="floorNos" class="form-control mt-4" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='carParkAbove' name="carParkAbove" id="carParkAbove">Cark Park Spaces Above Ground</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="carParkAbove" id="carParkAbove" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='carParkBelow' name="carParkBelow" id="carParkBelow">Cark Park Spaces Below Ground</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="carParkBelow" id="carParkBelow" class="form-control" />
                            </div>
                        </div>
                        <div class="col-md-2">
                            <label htmlFor='basementLevelno' name="basementLevelno" id="basementLevelno">Number Of Basement Levels</label>
                            <div class="pt-2 pb-2">
                                <input type="text" name="basementLevelno" id="basementLevelno" class="form-control" />
                            </div>
                        </div>
                    </div>
                    <div class="float-end pb-4">
                        <button class="btn btn-primary">Save</button>
                    </div>
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
})(SiteInformation);
