import * as React from 'react';
import Accordion from '@mui/material/Accordion';
import AccordionActions from '@mui/material/AccordionActions';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import Button from '@mui/material/Button';
import SidebarNew from '../../../common/Sidebar/SidebarNew';
import { yearOptions } from '../../../../utils/yearOptions';
import { yesNoOptions } from '../../../../utils/yesNoOptions';

export default function SiteInformation() {
    return (
        <div>
            <SidebarNew />
            <div class="row">
                <div class="col-md-2">
                    <label htmlFor='buildyear' name="buildyear" id="buildyear">Year Of Build</label>
                    <div class="pt-2 pb-4">
                        <select name="buildyear" id="buildyear" class="form-control w-100">
                            {yearOptions.map((year) => <option value={year.value}>{year.label}</option>)}
                        </select>
                    </div>
                </div>
                <div class="col-md-4">
                    <label htmlFor='buildyear' name="buildyear" id="buildyear">Building Under Client Control</label>
                    <div class="pt-2 pb-4">
                        <select name="buildyear" id="buildyear" class="form-control w-100">
                            {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <label htmlFor='buildyear' name="buildyear" id="buildyear">Canteen in building</label>
                    <div class="pt-2 pb-4">
                        <select name="buildyear" id="buildyear" class="form-control w-100">
                        {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
                <div class="col-md-3">
                    <label htmlFor='buildyear' name="buildyear" id="buildyear">Dedicated Kitchen Area</label>
                    <div class="pt-2 pb-4">
                        <select name="buildyear" id="buildyear" class="form-control w-100">
                        {yesNoOptions.map((itm) => <option value={itm.value}>{itm.label}</option>)}
                        </select>
                    </div>
                </div>
            </div>
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
