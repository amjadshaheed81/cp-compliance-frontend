import React, { useEffect } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import { yesNoOptions } from "../../../../../utils/yesNoOptions";
import { getUtilityAndEnergyDetails, saveUtilityAndEnergyDetails, setLoader } from "../../../../../store/thunk/site";

const UtilityEnergy = ({
  updateSite,
  saveUtilityAndEnergyDetails,
  getUtilityAndEnergyDetails,
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
  React.useEffect(() => {
    getUtilityAndEnergyDetails(updateSite?.siteId, setValue);
  }, []);
  const saveUtilityAndEnergy = (data) => {
    console.log("saveAreaAndOccupancy", data);
    setLoader(true);
    saveUtilityAndEnergyDetails()
  };
  return (
    <div className="container">
      <form
        className="d-flex flex-wrap gap-3"
        onSubmit={handleSubmit(saveUtilityAndEnergy)}
      >
        <div>
          <label
            htmlFor="utilGas"
            name="utilGas"
            id="utilGas"
          >
            Utility - Gas
          </label>
          <div>
            <select
              type="text"
              name="utilGas"
              id="utilGas"
              className="form-control form-select"
              {...register("utilGas")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="utilElectricity"
            name="utilElectricity"
            id="utilElectricity"
          >
            Utility - Electricity
          </label>
          <div>
            <select
              type="text"
              name="utilElectricity"
              id="utilElectricity"
              className="form-control form-select"
              {...register("utilElectricity")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="utilWater"
            name="utilWater"
            id="utilWater"
          >
            Utility - Water
          </label>
          <div>
            <select
              type="text"
              name="utilWater"
              id="utilWater"
              className="form-control form-select"
              {...register("utilWater")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="utilTelecom" name="utilTelecom" id="utilTelecom">
            Utility - Telecom/Data
          </label>
          <div>
            <select
              type="text"
              name="utilTelecom"
              id="utilTelecom"
              className="form-control form-select"
              {...register("utilTelecom")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="utilMainsDrainage"
            name="utilMainsDrainage"
            id="utilMainsDrainage"
          >
            Utility - Mains Drainage
          </label>
          <div>
            <select
              type="text"
              name="utilMainsDrainage"
              id="utilMainsDrainage"
              className="form-control form-select"
              {...register("utilMainsDrainage")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="airConditioning"
            name="airConditioning"
            id="airConditioning"
          >
            Air Conditioning
          </label>
          <div>
            <select
              type="text"
              name="airConditioning"
              id="airConditioning"
              className="form-control form-select"
              {...register("airConditioning")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="coolingTower"
            name="coolingTower"
            id="coolingTower"
          >
            Cooling Tower
          </label>
          <div>
            <select
              type="text"
              name="coolingTower"
              id="coolingTower"
              className="form-control form-select"
              {...register("coolingTower")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="waterIsolationValveInternal" name="tenantNwaterIsolationValveInternalame" id="waterIsolationValveInternal">
            Water Isolation Valve Location (Internal)
          </label>
          <div>
            <input
              type="text"
              name="waterIsolationValveInternal"
              id="waterIsolationValveInternal"
              className="form-control"
              {...register("waterIsolationValveInternal")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="waterTankLocation"
            name="waterTankLocation"
            id="waterTankLocation"
          >
            Water Tanks
          </label>
          <div>
            <select
              type="text"
              name="waterTankLocation"
              id="waterTankLocation"
              className="form-control form-select"
              {...register("waterTankLocation")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label htmlFor="waterTanks" name="waterTanks" id="waterTanks">
            Water Tank Location
          </label>
          <div>
            <input
              type="text"
              name="waterTanks"
              id="waterTanks"
              className="form-control"
              {...register("waterTanks")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="hotWaterCalorifier"
            name="hotWaterCalorifier"
            id="hotWaterCalorifier"
          >
            Hot Water Calorifier
          </label>
          <div>
            <input
              type="number"
              name="hotWaterCalorifier"
              id="hotWaterCalorifier"
              className="form-control"
              {...register("hotWaterCalorifier")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="hotWaterCalorifierLocation"
            name="hotWaterCalorifierLocation"
            id="hotWaterCalorifierLocation"
          >
            Hot Water Calorifier Location
          </label>
          <div>
            <input
              type="text"
              name="hotWaterCalorifierLocation"
              id="hotWaterCalorifierLocation"
              className="form-control"
              {...register("hotWaterCalorifierLocation")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="pressureVessel"
            name="pressureVessel"
            id="pressureVessel"
          >
            Pressure Vessel
          </label>
          <div>
            <input
              type="number"
              name="pressureVessel"
              id="pressureVessel"
              className="form-control"
              {...register("pressureVessel")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="gasBoiler"
            name="gasBoiler"
            id="gasBoiler"
          >
            Gas Boiler
          </label>
          <div>
            <select
              type="text"
              name="gasBoiler"
              id="gasBoiler"
              className="form-control form-select"
              {...register("gasBoiler")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="gasBoilerLocation"
            name="gasBoilerLocation"
            id="gasBoilerLocation"
          >
            Gas Boiler Location
          </label>
          <div>
            <input
              type="text"
              name="gasBoilerLocation"
              id="gasBoilerLocation"
              className="form-control"
              {...register("gasBoilerLocation")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="gasSupplyIsolation"
            name="gasSupplyIsolation"
            id="gasSupplyIsolation"
          >
            Gas Supply Isolation/Meter Location
          </label>
          <div>
            <input
              type="text"
              name="gasSupplyIsolation"
              id="gasSupplyIsolation"
              className="form-control"
              {...register("gasSupplyIsolation")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="gasSupplyExternalIsolation"
            name="gasSupplyExternalIsolation"
            id="gasSupplyExternalIsolation"
          >
            Gas Supply External Isolation Location
          </label>
          <div>
            <input
              type="text"
              name="gasSupplyExternalIsolation"
              id="gasSupplyExternalIsolation"
              className="form-control"
              {...register("gasSupplyExternalIsolation")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="electricInstallationLocation"
            name="electricInstallationLocation"
            id="electricInstallationLocation"
          >
            Electric Installation / Meter Location
          </label>
          <div>
            <input
              type="text"
              name="electricInstallationLocation"
              id="electricInstallationLocation"
              className="form-control"
              {...register("electricInstallationLocation")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="electricSubStationOnSite"
            name="electricSubStationOnSite"
            id="electricSubStationOnSite"
          >
            Electric Sub-Station on Site
          </label>
          <div>
            <select
              type="text"
              name="electricSubStationOnSite"
              id="electricSubStationOnSite"
              className="form-control form-select"
              {...register("electricSubStationOnSite")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="externalLighting"
            name="externalLighting"
            id="externalLighting"
          >
            External Lighting
          </label>
          <div>
            <select
              type="text"
              name="externalLighting"
              id="externalLighting"
              className="form-control form-select"
              {...register("externalLighting")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="backupGenerator"
            name="backupGenerator"
            id="backupGenerator"
          >
            Back Up Generator
          </label>
          <div>
            <select
              type="text"
              name="backupGenerator"
              id="backupGenerator"
              className="form-control form-select"
              {...register("backupGenerator")}
            >
              {yesNoOptions.map((itm) => (
                <option value={itm.value}>{itm.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label
            htmlFor="backupGeneratorLocation"
            name="backupGeneratorLocation"
            id="backupGeneratorLocation"
          >
            Back Up Generator Location
          </label>
          <div>
            <input
              type="text"
              name="backupGeneratorLocation"
              id="backupGeneratorLocation"
              className="form-control"
              {...register("backupGeneratorLocation")}
            />
          </div>
        </div>

        <div>
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
  saveUtilityAndEnergyDetails,
  getUtilityAndEnergyDetails,
  setLoader,
})(UtilityEnergy);
