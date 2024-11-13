import React, { useEffect } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import {
  saveLiftAndStairways,
  getSiteLiftStairways,
  setLoader,
} from "../../../../../store/thunk/site";
import { isManagerAdminLogin } from "../../../../../utils/isManagerAdminLogin";
const LiftsStairways = ({
  updateSite,
  getSiteLiftStairways,
  saveLiftAndStairways,
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
    const formData = {
      ...data,
      siteId: updateSite?.siteId,
    };
    setLoader(true);
    saveLiftAndStairways(formData);
  };
  useEffect(() => {
    getSiteLiftStairways(updateSite?.siteId, reset);
  }, []);
  return (
    <div className="container">
      <form
        className="d-flex flex-wrap gap-3"
        onSubmit={handleSubmit(saveAreaAndOccupancy)}
      >
        <div>
          <label
            htmlFor="disabledHoistLift"
            name="disabledHoistLift"
            id="disabledHoistLift"
          >
            Disabled Hoist/Lift
          </label>
          <div>
            <input
              type="number"
              name="disabledHoistLift"
              id="disabledHoistLift"
              className="form-control"
              {...register("disabledHoistLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("disabledHoistLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="goodsTractionLift"
            name="goodsTractionLift"
            id="goodsTractionLift"
          >
            Lifts (Goods-Traction)
          </label>
          <div>
            <input
              type="number"
              name="goodsTractionLift"
              id="goodsTractionLift"
              className="form-control"
              {...register("goodsTractionLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("goodsTractionLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="goodsHydraulicLift"
            name="goodsHydraulicLift"
            id="goodsHydraulicLift"
          >
            Lifts (Goods-Hydraulic)
          </label>
          <div>
            <input
              type="number"
              name="goodsHydraulicLift"
              id="goodsHydraulicLift"
              className="form-control"
              {...register("goodsHydraulicLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("goodsHydraulicLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="passengerTractionLift"
            name="passengerTractionLift"
            id="passengerTractionLift"
          >
            Lifts (Passenger-Traction)
          </label>
          <div>
            <input
              type="number"
              name="passengerTractionLift"
              id="passengerTractionLift"
              className="form-control"
              {...register("passengerTractionLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("passengerTractionLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="passengerHydraulicLift"
            name="passengerHydraulicLift"
            id="passengerHydraulicLift"
          >
            Lifts (Passenger-Hydraulic)
          </label>
          <div>
            <input
              type="number"
              name="passengerHydraulicLift"
              id="passengerHydraulicLift"
              className="form-control"
              {...register("passengerHydraulicLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("passengerHydraulicLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="passengerMonospaceLift"
            name="passengerMonospaceLift"
            id="passengerMonospaceLift"
          >
            Lifts (Passenger-Monospace)
          </label>
          <div>
            <input
              type="number"
              name="passengerMonospaceLift"
              id="passengerMonospaceLift"
              className="form-control"
              {...register("passengerMonospaceLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("passengerMonospaceLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="fireFightingLift"
            name="fireFightingLift"
            id="fireFightingLift"
          >
            Lifts (Fire Fighting)
          </label>
          <div>
            <input
              type="number"
              name="fireFightingLift"
              id="fireFightingLift"
              className="form-control"
              {...register("fireFightingLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("fireFightingLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="fireEvacuationLift"
            name="fireEvacuationLift"
            id="fireEvacuationLift"
          >
            Lifts (Fire Evacuation)
          </label>
          <div>
            <input
              type="number"
              name="fireEvacuationLift"
              id="fireEvacuationLift"
              className="form-control"
              {...register("fireEvacuationLift")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("fireEvacuationLift").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="internalStairways"
            name="internalStairways"
            id="internalStairways"
          >
            Number of Stairways (Internal)
          </label>
          <div>
            <input
              type="number"
              name="internalStairways"
              id="internalStairways"
              className="form-control"
              {...register("internalStairways")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("internalStairways").onChange(e);
              }}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="externalStairways"
            name="externalStairways"
            id="externalStairways"
          >
            Number of Stairways (External)
          </label>
          <div>
            <input
              type="number"
              name="externalStairways"
              id="externalStairways"
              className="form-control"
              {...register("externalStairways")}
              disabled={isViewMode}
              min="0"
              onChange={(e) => {
                const value = e.target.value;
                if (value < 0) {
                  e.target.value = 0;
                }
                register("externalStairways").onChange(e);
              }}
            />
          </div>
        </div>
        <div
          style={{
            display: (isViewMode || !isManagerAdminLogin(loggedInUserData)) ? "none" : "block",
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
  getSiteLiftStairways,
  saveLiftAndStairways,
  setLoader,
})(LiftsStairways);
