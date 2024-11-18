import React, { useEffect } from "react";
import { connect } from "react-redux";
import Accordion from "@mui/material/Accordion";
import AccordionSummary from "@mui/material/AccordionSummary";
import AccordionDetails from "@mui/material/AccordionDetails";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { yearOptions } from "../../../../utils/yearOptions";
import { yesNoOptions } from "../../../../utils/yesNoOptions";
import { useForm } from "react-hook-form";
import {
  getSiteInformation,
  saveSiteBuildingData,
  saveAreaAndOccupancyDetails,
  getAreaAndOccupancy,
  setLoader,
} from "../../../../store/thunk/site";
import SafetySecurity from "./SiteInformation/SafetySecurity";
import UtilityEnergy from "./SiteInformation/UtilityEnergy";
import LiftsStairways from "./SiteInformation/LiftsStairways";
import Landscape from "./SiteInformation/Landscape";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";

const SiteInformation = ({
  updateSite,
  saveSiteBuildingData,
  getSiteInformation,
  saveAreaAndOccupancyDetails,
  getAreaAndOccupancy,
  isLoading,
  setLoader,
  loggedInUserData,
}) => {
  const { register, handleSubmit, reset, setValue, getValues } = useForm({});
  const siteAreaForm = useForm();
  const isViewMode =  updateSite?.isViewMode;
  useEffect(() => {
    getSiteInformation(updateSite?.siteId, setValue);
    getAreaAndOccupancy(updateSite?.siteId, siteAreaForm.setValue);
  }, []);
  const saveSiteInformation = (data) => {
    setLoader(true);
    saveSiteBuildingData(updateSite?.siteId, data);
  };
  const saveAreaAndOccupancy = (data) => {
    setLoader(true);
    saveAreaAndOccupancyDetails(updateSite?.siteId, data);
  };
  return (
    <div>
      <SidebarNew />
      <form className="row" onSubmit={handleSubmit(saveSiteInformation)}>
        <div className="col-md-2">
          <div className="pt-2 pb-4">
            <label htmlFor="buildYear" name="buildYear" id="buildYear">
              Year Of Build
            </label>
            <input
              type="number"
              name="buildYear"
              id="buildYear"
              className="form-control"
              {...register("buildYear")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("buildYear").onChange(e);
              }}
            />
          </div>
        </div>
        <div className="col-md-4">
          <div className="pt-2 pb-4">
            <label
              htmlFor="buildingUnderClientControl"
              name="buildingUnderClientControl"
              id="buildingUnderClientControl"
            >
              Building Under Client Control
            </label>

            <select
              name="buildingUnderClientControl"
              id="buildingUnderClientControl"
              className="form-control w-100 form-select"
              // value={siteInformation?.buildingUnderClientControl}
              {...register("buildingUnderClientControl")}
              disabled={isViewMode}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="pt-2 pb-4">
            <label
              htmlFor="canteenInBuilding"
              name="canteenInBuilding"
              id="canteenInBuilding"
            >
              Canteen in building
            </label>

            <select
              name="canteenInBuilding"
              id="canteenInBuilding"
              className="form-control w-100 form-select"
              // value={siteInformation?.canteenInBuilding}
              {...register("canteenInBuilding", {
                // required: {
                //     value: true,
                //     message: `${Validation.REQUIRED}`,
                // },
              })}
              disabled={isViewMode}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="col-md-3">
          <div className="pt-2 pb-4">
            <label
              htmlFor="dedicatedKitchenArea"
              name="dedicatedKitchenArea"
              id="dedicatedKitchenArea"
            >
              Dedicated Kitchen Area
            </label>

            <select
              name="dedicatedKitchenArea"
              id="dedicatedKitchenArea"
              className="form-control w-100 form-select"
              {...register("dedicatedKitchenArea")}
              disabled={isViewMode}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div
          className="pb-4 "
          style={{
            display: (isViewMode || !isManagerAdminLogin(loggedInUserData)) ? "none" : "block",
          }}
        >
          <button className="float-end btn btn-primary" type="submit">
            Save
          </button>
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
          <div className="container">
          <form
            className="d-flex flex-wrap gap-3"
            onSubmit={siteAreaForm.handleSubmit(saveAreaAndOccupancy)}
          >
            <div>
              <label
                htmlFor="totalBuildingArea"
                name="totalBuildingArea"
                id="totalBuildingArea"
              >
                Total Building Area(Sq.m)
              </label>
              <div>
                <input
                  type="text"
                  name="totalBuildingArea"
                  id="totalBuildingArea"
                  className="form-control"
                  {...siteAreaForm.register("totalBuildingArea")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="clientOccupiedArea"
                name="clientOccupiedArea"
                id="clientOccupiedArea"
              >
                Client Occupied Area(Sq.m)
              </label>
              <div>
                <input
                  type="text"
                  name="clientOccupiedArea"
                  id="clientOccupiedArea"
                  className="form-control"
                  {...siteAreaForm.register("clientOccupiedArea")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="tenantOccupiedArea"
                name="tenantOccupiedArea"
                id="tenantOccupiedArea"
              >
                Tenant Occupied Area(Sq.m)
              </label>
              <div>
                <input
                  type="tenantOccupiedArea"
                  name="tenantOccupiedArea"
                  id="tenantOccupiedArea"
                  className="form-control"
                  {...siteAreaForm.register("tenantOccupiedArea")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="maxOccupancy"
                name="maxOccupancy"
                id="maxOccupancy"
              >
                Maximum Occupancy(Client)
              </label>
              <div>
                <input
                  type="text"
                  name="maxOccupancy"
                  id="maxOccupancy"
                  className="form-control"
                  {...siteAreaForm.register("maxOccupancy")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="meetingClients"
                name="meetingClients"
                id="meetingClients"
              >
                Meeting/Conferences Client
              </label>
              <div>
                <select
                  name="meetingClients"
                  id="meetingClients"
                  className="form-control form-select"
                  {...siteAreaForm.register("meetingClients")}
                  disabled={isViewMode}
                >
                  {yesNoOptions.map((itm) => (
                    <option value={itm.value}>{itm.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="numberOfStaff"
                name="numberOfStaff"
                id="numberOfStaff"
              >
                Number Of Staff
              </label>
              <div>
                <input
                  type="text"
                  name="numberOfStaff"
                  id="numberOfStaff"
                  className="form-control"
                  {...siteAreaForm.register("numberOfStaff")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="tenantInOccupation"
                name="tenantInOccupation"
                id="tenantInOccupation"
              >
                Tenants in Occupation
              </label>
              <div>
              <select
                  type="text"
                  name="tenantInOccupation"
                  id="tenantInOccupation"
                  className="form-control form-select"
                  {...siteAreaForm.register("tenantInOccupation")}
                  disabled={isViewMode}
                >
                  {yesNoOptions.map((itm) => (
                    <option value={itm.value}>{itm.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="tenantName" name="tenantName" id="tenantName">
                Name Of Tenant
              </label>
              <div>
                <input
                  type="text"
                  name="tenantName"
                  id="tenantName"
                  className="form-control"
                  {...siteAreaForm.register("tenantName")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="vacantAreaInBuilding"
                name="vacantAreaInBuilding"
                id="vacantAreaInBuilding"
              >
                Vacant Areas in building
              </label>
              <div>
              <select
                  type="text"
                  name="vacantAreaInBuilding"
                  id="vacantAreaInBuilding"
                  className="form-control form-select"
                  {...siteAreaForm.register("vacantAreaInBuilding")}
                  disabled={isViewMode}
                >
                  {yesNoOptions.map((itm) => (
                    <option value={itm.value}>{itm.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label htmlFor="numOfFloors" name="numOfFloors" id="numOfFloors">
                Number Of Floors
              </label>
              <div>
                <input
                  type="text"
                  name="numOfFloors"
                  id="numOfFloors"
                  className="form-control"
                  {...siteAreaForm.register("numOfFloors")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="carParkSpaceAboveGround"
                name="carParkSpaceAboveGround"
                id="carParkSpaceAboveGround"
              >
                Cark Park Spaces Above Ground
              </label>
              <div>
                <input
                  type="text"
                  name="carParkSpaceAboveGround"
                  id="carParkSpaceAboveGround"
                  className="form-control"
                  {...siteAreaForm.register("carParkSpaceAboveGround")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="carParkSpaceBelowGround"
                name="carParkSpaceBelowGround"
                id="carParkSpaceBelowGround"
              >
                Cark Park Spaces Below Ground
              </label>
              <div>
                <input
                  type="text"
                  name="carParkSpaceBelowGround"
                  id="carParkSpaceBelowGround"
                  className="form-control"
                  {...siteAreaForm.register("carParkSpaceBelowGround")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div>
              <label
                htmlFor="numOfBasementLevels"
                name="numOfBasementLevels"
                id="numOfBasementLevels"
              >
                Number Of Basement Levels
              </label>
              <div>
                <input
                  type="text"
                  name="numOfBasementLevels"
                  id="numOfBasementLevels"
                  className="form-control"
                  {...siteAreaForm.register("numOfBasementLevels")}
                  disabled={isViewMode}
                  onKeyPress={(e) => {
                    if (!/^\d*$/.test(e.key)) {
                      e.preventDefault();
                    }
                  }}
                />
              </div>
            </div>
            <div
              className="pb-4"
              style={{
                display: (isViewMode || !isManagerAdminLogin(loggedInUserData)) ? "none" : "block",
              }}
            >
              <button className="btn btn-primary float-end" type="submit">
                Save
              </button>
            </div>
          </form>
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
          <UtilityEnergy />
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
          <LiftsStairways />
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
          <Landscape />
        </AccordionDetails>
      </Accordion>
    </div>
  );
};

const mapStateToProps = (state) => ({
  updateSite: state.site.updateSite,
  success: state.site.updateSuccess,
  error: state.site.updateError,
  siteInformation: state.site.siteInformation,
  isLoading: state.site.isLoading,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  saveSiteBuildingData,
  getSiteInformation,
  saveAreaAndOccupancyDetails,
  getAreaAndOccupancy,
  setLoader,
})(SiteInformation);
