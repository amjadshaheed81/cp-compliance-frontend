import React, { useEffect } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import { yesNoOptions } from "../../../../../utils/yesNoOptions";
import {
  saveSiteLandScapes,
  setLoader,
  getSiteLandScapeInfo,
} from "../../../../../store/thunk/site";

const Landscape = ({
  updateSite,
  saveSiteLandScapes,
  getSiteLandScapeInfo,
  setLoader,
}) => {
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
            <input
              type="string"
              name="vacantLandAdjacent"
              id="vacantLandAdjacent"
              className="form-control"
              {...register("vacantLandAdjacent")}
            />
          </div>
        </div>
        <div>
          <label htmlFor="floodRisk" name="floodRisk" id="floodRisk">
            Risk of Flooding
          </label>
          <div>
            <input
              type="string"
              name="floodRisk"
              id="floodRisk"
              className="form-control"
              {...register("floodRisk")}
            />
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
            <input
              type="string"
              name="railwayLineAdjacent"
              id="railwayLineAdjacent"
              className="form-control"
              {...register("railwayLineAdjacent")}
            />
          </div>
        </div>

        <div
          style={{
            display: updateSite?.isViewMode ? "none" : "block",
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
});
export default connect(mapStateToProps, {
  saveSiteLandScapes,
  getSiteLandScapeInfo,
  setLoader,
})(Landscape);
