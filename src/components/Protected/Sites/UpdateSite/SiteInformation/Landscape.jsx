import React, { useEffect } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import { yesNoOptions } from "../../../../../utils/yesNoOptions";
import {
  saveSiteLandScapes,
  setLoader,
  getSiteLandScapeInfo,
} from "../../../../../store/thunk/site";
import { isManagerAdminLogin } from "../../../../../utils/isManagerAdminLogin";

const Landscape = ({
  updateSite,
  saveSiteLandScapes,
  getSiteLandScapeInfo,
  setLoader,
  loggedInUserData,
}) => {
  const isViewMode = updateSite?.isViewMode;
  const {
    register,
    handleSubmit,
    reset,
  } = useForm({});
  const saveAreaAndOccupancy = (data) => {
    setLoader(true);
    const formData = {
      ...data,
      siteId: updateSite?.siteId,
    };
    saveSiteLandScapes(formData);
  };
  useEffect(() => {
    getSiteLandScapeInfo(updateSite?.siteId, reset);
  }, []);
  return (
    <div className="container">
      <form
        className="d-flex flex-wrap gap-3"
        onSubmit={handleSubmit(saveAreaAndOccupancy)}
      >
        <div>
          <label
            htmlFor="hardLandScaping"
            name="hardLandScaping"
            id="hardLandScaping"
          >
            Hard Landscaping
          </label>
          <div>
            <select
              type="text"
              name="hardLandScaping"
              id="hardLandScaping"
              className="form-control form-select"
              {...register("hardLandScaping")}
              disabled={isViewMode || !isManagerAdminLogin(loggedInUserData)}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="softLandScaping"
            name="softLandScaping"
            id="softLandScaping"
          >
            Soft Landscaping
          </label>
          <div>
            <select
              type="text"
              name="softLandScaping"
              id="softLandScaping"
              className="form-control form-select"
              {...register("softLandScaping")}
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
            htmlFor="riverPondLakes"
            name="riverPondLakes"
            id="riverPondLakes"
          >
            Rivers/Ponds/Lakes
          </label>
          <div>
            <select
              type="text"
              name="riverPondLakes"
              id="riverPondLakes"
              className="form-control form-select"
              {...register("riverPondLakes")}
              disabled={isViewMode}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="tallTrees" name="tallTrees" id="tallTrees">
            Tall Trees
          </label>
          <div>
            <select
              type="text"
              name="tallTrees"
              id="tallTrees"
              className="form-control form-select"
              {...register("tallTrees")}
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
            htmlFor="drainageInterceptors"
            name="drainageInterceptors"
            id="drainageInterceptors"
          >
            Drainage Interceptors
          </label>
          <div>
            <select
              type="text"
              name="drainageInterceptors"
              id="drainageInterceptors"
              className="form-control form-select"
              {...register("drainageInterceptors")}
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
            htmlFor="thirdPartyTelEquipment"
            name="thirdPartyTelEquipment"
            id="thirdPartyTelEquipment"
          >
            Third Party Telecomms Equipment
          </label>
          <div>
            <select
              type="text"
              name="thirdPartyTelEquipment"
              id="thirdPartyTelEquipment"
              className="form-control form-select"
              {...register("thirdPartyTelEquipment")}
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
            htmlFor="electricalOverHeadPowerLines"
            name="electricalOverHeadPowerLines"
            id="electricalOverHeadPowerLines"
          >
            Electrical Overhead Power Lines
          </label>
          <div>
            <select
              type="text"
              name="electricalOverHeadPowerLines"
              id="electricalOverHeadPowerLines"
              className="form-control form-select"
              {...register("electricalOverHeadPowerLines")}
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
            htmlFor="vacantLandAdjacent"
            name="vacantLandAdjacent"
            id="vacantLandAdjacent"
          >
            Demolition Site or Vacant Land Adjacent
          </label>
          <div>
            <select
              name="vacantLandAdjacent"
              id="vacantLandAdjacent"
              className="form-control form-select"
              {...register("vacantLandAdjacent")}
              disabled={isViewMode}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="floodRisk" name="floodRisk" id="floodRisk">
            Risk of Flooding
          </label>
          <div>
          <select
              name="floodRisk"
              id="floodRisk"
              className="form-control form-select"
              {...register("floodRisk")}
              disabled={isViewMode}
            >
              <option value=""></option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="railwayLineAdjacent"
            name="railwayLineAdjacent"
            id="railwayLineAdjacent"
          >
            Railway Line Adjacent
          </label>
          <div>
            <select
              name="railwayLineAdjacent"
              id="railwayLineAdjacent"
              className="form-control form-select"
              {...register("railwayLineAdjacent")}
              disabled={isViewMode}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div
          style={{
            display:
              isViewMode || !isManagerAdminLogin(loggedInUserData)
                ? "none"
                : "block",
          }}
        >
          <button className="btn btn-primary float-end m-3" type="submit">
            Save
          </button>
        </div>
      </form>
    </div>
  );
};

const mapStateToProps = (state) => ({
  updateSite: state.site.updateSite,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  saveSiteLandScapes,
  getSiteLandScapeInfo,
  setLoader,
})(Landscape);
