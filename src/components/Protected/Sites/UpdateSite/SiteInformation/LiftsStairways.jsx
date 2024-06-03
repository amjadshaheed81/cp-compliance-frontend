import React from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import { getLiftsAndStairwaysDetails, saveLiftsAndStairwaysDetails } from "../../../../../store/thunk/site";

const LiftsStairways = ({ saveLiftsAndStairwaysDetails, getLiftsAndStairwaysDetails }) => {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
    setValue,
    watch,
  } = useForm({});
  const saveLiftAndStairways = (data) => {
    console.log("saveAreaAndOccupancy", data);
  };
  return (
    <div className="container">
      <form
        className="d-flex flex-wrap gap-3"
        onSubmit={handleSubmit(saveLiftAndStairways)}
      >
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Disabled Hoist/Lift
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Lifts (Goods-Traction)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Lifts (Goods-Hydraulic)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Lifts (Passenger-Traction)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Lifts (Passenger-Hydraulic)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Lifts (Passenger-Monospace)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Lifts (Fire Fighting)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Lifts (Fire Evacuation)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Number of Stairways (Internal)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
        <div>
          <label
            htmlFor="totalBuildingArea"
            name="totalBuildingArea"
            id="totalBuildingArea"
          >
            Number of Stairways (External)
          </label>
          <div>
            <input
              type="number"
              name="carParkSpaceAboveGround"
              id="carParkSpaceAboveGround"
              className="form-control"
              {...register("carParkSpaceAboveGround")}
            />
          </div>
        </div>
      </form>
      <div>
        <button className="btn btn-primary float-end m-3">Save</button>
      </div>
    </div>
  );
};
const mapStateToProps = (state) => ({
  updateSite: state.site.updateSite,
  success: state.site.updateSuccess,
  error: state.site.updateError,
});
export default connect(mapStateToProps, {
  saveLiftsAndStairwaysDetails,
  getLiftsAndStairwaysDetails
})(LiftsStairways);
