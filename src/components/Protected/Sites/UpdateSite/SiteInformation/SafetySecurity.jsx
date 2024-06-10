import React from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import { yesNoOptions } from "../../../../../utils/yesNoOptions";
import {
  getSafetyAndSecurityDetails,
  saveSafetyAndSecurityDetails,
  setLoader,
} from "../../../../../store/thunk/site";

const SafetySecurity = ({
  updateSite,
  saveSafetyAndSecurityDetails,
  getSafetyAndSecurityDetails,
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
  console.log("update site ", updateSite);
  React.useEffect(() => {
    getSafetyAndSecurityDetails(updateSite?.siteId, setValue);
  }, []);
  const saveSafetyAndSecurity = (data) => {
    setLoader(true);
    console.log("getSafetyAndSecurity", data);
    saveSafetyAndSecurityDetails(updateSite?.siteId, data);
  };
  return (
    <div className="container">
      <form
        className="d-flex flex-wrap gap-3"
        onSubmit={handleSubmit(saveSafetyAndSecurity)}
      >
        <div>
          <label htmlFor="extFabric" name="extFabric" id="extFabric">
            External Fabric
          </label>
          <div>
            <input
              type="text"
              name="extFabric"
              id="extFabric"
              className="form-control"
              {...register("extFabric")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="extMetallicFireEscapeStaircases"
            name="extMetallicFireEscapeStaircases"
            id="extMetallicFireEscapeStaircases"
          >
            External Metallic Fire Escape Staircases
          </label>
          <div>
            <input
              type="number"
              name="extMetallicFireEscapeStaircases"
              id="extMetallicFireEscapeStaircases"
              className="form-control"
              {...register("extMetallicFireEscapeStaircases")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="extTimberFireEscapeStaircases"
            name="extTimberFireEscapeStaircases"
            id="extTimberFireEscapeStaircases"
          >
            External Timber Fire Escape Staircases
          </label>
          <div>
            <input
              type="number"
              name="extTimberFireEscapeStaircases"
              id="extTimberFireEscapeStaircases"
              className="form-control"
              {...register("extTimberFireEscapeStaircases")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="verticalLadder"
            name="verticalLadder"
            id="verticalLadder"
          >
            Vertical Ladder
          </label>
          <div>
            <input
              type="number"
              name="verticalLadder"
              id="verticalLadder"
              className="form-control"
              {...register("verticalLadder")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="confinedSpaces"
            name="confinedSpaces"
            id="confinedSpaces"
          >
            Confined Spaces
          </label>
          <div>
            <select
              type="text"
              name="confinedSpaces"
              id="confinedSpaces"
              className="form-control form-select"
              {...register("confinedSpaces")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="accessibleUnguardedRoofAreas"
            name="accessibleUnguardedRoofAreas"
            id="accessibleUnguardedRoofAreas"
          >
            Accessible Unguarded Roof Areas
          </label>
          <div>
            <select
              type="text"
              name="accessibleUnguardedRoofAreas"
              id="accessibleUnguardedRoofAreas"
              className="form-control form-select"
              {...register("accessibleUnguardedRoofAreas")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="fragileRoof" name="fragileRoof" id="fragileRoof">
            Fragile Roofs or Surfaces
          </label>
          <div>
            <select
              type="text"
              name="fragileRoof"
              id="fragileRoof"
              className="form-control form-select"
              {...register("fragileRoof")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="lightingConductoreInstalltion"
            name="lightingConductoreInstalltion"
            id="lightingConductoreInstalltion"
          >
            Lighting Conductor Installation
          </label>
          <div>
            <select
              type="text"
              name="lightingConductoreInstalltion"
              id="lightingConductoreInstalltion"
              className="form-control form-select"
              {...register("lightingConductoreInstalltion")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="fireAlarmSystem"
            name="fireAlarmSystem"
            id="fireAlarmSystem"
          >
            Fire Alarm/Detection System
          </label>
          <div>
            <select
              type="text"
              name="fireAlarmSystem"
              id="fireAlarmSystem"
              className="form-control form-select"
              {...register("fireAlarmSystem")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="firePanelLocation"
            name="firePanelLocation"
            id="firePanelLocation"
          >
            Fire Panel Location
          </label>
          <div>
            <input
              type="text"
              name="firePanelLocation"
              id="firePanelLocation"
              className="form-control"
              {...register("firePanelLocation")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="oilStorageOnSite"
            name="oilStorageOnSite"
            id="oilStorageOnSite"
          >
            Oil/Petrol Storage on Site
          </label>
          <div>
            <select
              type="text"
              name="oilStorageOnSite"
              id="oilStorageOnSite"
              className="form-control form-select"
              {...register("oilStorageOnSite")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="lpgStorageOnSite"
            name="lpgStorageOnSite"
            id="lpgStorageOnSite"
          >
            LPG Storage on Site
          </label>
          <div>
            <select
              type="text"
              name="lpgStorageOnSite"
              id="lpgStorageOnSite"
              className="form-control form-select"
              {...register("lpgStorageOnSite")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="lpgBulkStorageOnSite"
            name="lpgBulkStorageOnSite"
            id="lpgBulkStorageOnSite"
          >
            LPG Bulk Storage on Site
          </label>
          <div>
            <select
              type="text"
              name="lpgBulkStorageOnSite"
              id="lpgBulkStorageOnSite"
              className="form-control form-select"
              {...register("lpgBulkStorageOnSite")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="sprinklerSystem"
            name="sprinklerSystem"
            id="sprinklerSystem"
          >
            LPG Cylinder Storage on Site
          </label>
          <div>
            <select
              type="text"
              name="sprinklerSystem"
              id="sprinklerSystem"
              className="form-control form-select"
              {...register("sprinklerSystem")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="sprinklerSystem"
            name="sprinklerSystem"
            id="sprinklerSystem"
          >
            Sprinkler System
          </label>
          <div>
            <select
              type="text"
              name="sprinklerSystem"
              id="sprinklerSystem"
              className="form-control form-select"
              {...register("sprinklerSystem")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="hoseReels" name="hoseReels" id="hoseReels">
            Hose Reels
          </label>
          <div>
            <select
              type="text"
              name="hoseReels"
              id="hoseReels"
              className="form-control form-select"
              {...register("hoseReels")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="securityGuardEmployed"
            name="securityGuardEmployed"
            id="securityGuardEmployed"
          >
            Are Security Guards Employed
          </label>
          <div>
            <select
              type="text"
              name="securityGuardEmployed"
              id="securityGuardEmployed"
              className="form-control form-select"
              {...register("securityGuardEmployed")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="internalCCTV" name="internalCCTV" id="internalCCTV">
            Internal CCTV
          </label>
          <div>
            <select
              type="text"
              name="internalCCTV"
              id="internalCCTV"
              className="form-control form-select"
              {...register("internalCCTV")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="externalCCTV" name="externalCCTV" id="externalCCTV">
            External CCTV
          </label>
          <div>
            <select
              type="text"
              name="externalCCTV"
              id="externalCCTV"
              className="form-control form-select"
              {...register("externalCCTV")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="automaticBarrier"
            name="automaticBarrier"
            id="automaticBarrier"
          >
            Automatic Barrier
          </label>
          <div>
            <select
              type="text"
              name="automaticBarrier"
              id="automaticBarrier"
              className="form-control form-select"
              {...register("automaticBarrier")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="automaticGatesSliding"
            name="automaticGatesSliding"
            id="automaticGatesSliding"
          >
            Automatic Gates (Sliding)
          </label>
          <div>
            <select
              type="text"
              name="automaticGatesSliding"
              id="automaticGatesSliding"
              className="form-control form-select"
              {...register("automaticGatesSliding")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="automaticGatesHinged"
            name="automaticGatesHinged"
            id="automaticGatesHinged"
          >
            Automatic Gates (Hinged)
          </label>
          <div>
            <select
              type="text"
              name="automaticGatesHinged"
              id="automaticGatesHinged"
              className="form-control form-select"
              {...register("automaticGatesHinged")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="manualSwingGates"
            name="manualSwingGates"
            id="manualSwingGates"
          >
            Manual Swing Gates
          </label>
          <div>
            <select
              type="text"
              name="manualSwingGates"
              id="manualSwingGates"
              className="form-control form-select"
              {...register("manualSwingGates")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
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
  success: state.site.updateSuccess,
  error: state.site.updateError,
});
export default connect(mapStateToProps, {
  saveSafetyAndSecurityDetails,
  getSafetyAndSecurityDetails,
  setLoader,
})(SafetySecurity);
