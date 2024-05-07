import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { InputError } from "../../../common/InputError";
import { Validation } from "../../../../Constant/Validation";
import { connect } from "react-redux";
import {
  updateLocalDetails,
  updateTimings,
} from "./../../../../store/thunk/site";
import Success from "../../../common/Alert/Success";
import Error from "../../../common/Alert/Error";

const LocalDetails = ({
  updateLocalDetails,
  updateTimings,
  success,
  error,
  timingSuccess,
  timingError,
  updateSite,
}) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({});
  const timingForm = useForm();
  useEffect(() => {
    console.log("updateSite ===>", updateSite);
    if (updateSite) {
      reset({
        localAuthority: updateSite?.localAuthority,
        status: updateSite?.status,
        clientResponsibility: updateSite?.clientResponsibility,
      });
      timingForm.reset({
        monStartTime: updateSite?.monStartTime,
        tuesStartTime: updateSite?.tuesStartTime,
        wedStartTime: updateSite?.wedStartTime,
        thurStartTime: updateSite?.thurStartTime,
        friStartTime: updateSite?.friStartTime,
        satStartTime: updateSite?.satStartTime,
        sunStartTime: updateSite?.sunStartTime,
        monEndTime: updateSite?.monEndTime,
        tuesEndTime: updateSite?.tuesEndTime,
        wedEndTime: updateSite?.wedEndTime,
        thurEndTime: updateSite?.thurEndTime,
        friEndTime: updateSite?.friEndTime,
        satEndTime: updateSite?.satEndTime,
        sunEndTime: updateSite?.sunEndTime,
      });
    }
  }, [updateSite]);

  const submitLocalDetails = (data) => {
    console.log("data", data);
    updateLocalDetails({ siteId: updateSite?.id, ...data });
  };
  const submitOpeningTiming = (data) => {
    updateTimings({ id: updateSite?.id, ...data });
  };
  return (
    <>
      <div class="row p-2 bg-white">
        <div class="col-md-8">
          <h2 class="fs-6 mt-4 border-bottom">Local Details</h2>
          <form className="p-2" onSubmit={handleSubmit(submitLocalDetails)}>
            <div className="row">
              <div className="col-md-6">
                <div class="mb-3">
                  <label for="Council" class="form-label">
                    Local Authority
                  </label>
                  <input
                    type="text"
                    name="localAuthority"
                    class="form-control"
                    id="localAuthority"
                    {...register("localAuthority", {
                      required: {
                        value: true,
                        message: `${Validation.REQUIRED} Council`,
                      },
                    })}
                  />
                  {errors?.localAuthority && (
                    <InputError
                      message={errors?.localAuthority?.message}
                      key={errors?.localAuthority?.message}
                    />
                  )}
                </div>
              </div>
              <div className="col-md-6">
                <div class="mb-3">
                  <label for="status" class="form-label">
                    Status
                  </label>
                  <select
                    name="status"
                    className="form-control"
                    id="status"
                    {...register("status", {
                      required: {
                        value: true,
                        message: `${Validation.REQUIRED} Status`,
                      },
                    })}
                    // value={sites}
                    // onChange={searchSitesWithStatus}
                  >
                    <option value="status">Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="sold">Sold</option>
                  </select>
                  {errors?.status && (
                    <InputError
                      message={errors?.status?.message}
                      key={errors?.status?.message}
                    />
                  )}
                </div>
              </div>
              <fieldset>
                <div>
                  <input
                    type="checkbox"
                    id="clientResponsibility"
                    name="clientResponsibility"
                    {...register("clientResponsibility")}
                  />
                  <label class="m-2" for="clientResponsibility">
                    Client Responsibility
                  </label>
                </div>
              </fieldset>
            </div>
            <div>
              {success && <Success msg={success} />}
              {error && <Error msg={error} />}
            </div>
            <div class="float-end">
              <button type="button" class="btn btn-light mb-3 mr-4">
                Cancel
              </button>
              &nbsp; &nbsp;
              <button type="submit" class="btn btn-primary mb-3 mr-4">
                Save
              </button>
            </div>
          </form>
        </div>
        <div class="col-md-4">
          <h2 class="fs-6 mt-4 border-bottom">Opening Timings</h2>
          <div style={{display: 'flex', justifyContent: 'space-evenly'}}>
          <span>Start</span>
          <span>End</span>
          </div>
          <form
            className="p-2"
            onSubmit={timingForm.handleSubmit(submitOpeningTiming)}
          >
            <div class="mt-3" style={{ display: "flex" }}>
              <label class="">Mon:</label>
              <div class="grid-container">
                <div class="grid-item">
                  <input
                    style={{ marginLeft: "3rem" }}
                    type="time"
                    className="form-control"
                    {...timingForm.register("monStartTime")}
                  />
                </div>
                <div class="grid-item">
                  <input
                    {...timingForm.register("monEndTime")}
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                  />
                </div>
              </div>
            </div>
            <div class="mt-3" style={{ display: "flex" }}>
              <label class="">Tues:</label>
              <div class="grid-container">
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("tuesStartTime")}
                  />
                </div>
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("tuesEndTime")}
                  />
                </div>
              </div>
            </div>
            <div class="mt-3" style={{ display: "flex" }}>
              <label class="">Wed:</label>
              <div class="grid-container">
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("wedStartTime")}
                  />
                </div>
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("wedEndTime")}
                  />
                </div>
              </div>
            </div>
            <div class="mt-3" style={{ display: "flex" }}>
              <label class="">Thurs:</label>
              <div class="grid-container">
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "2.5rem" }}
                    {...timingForm.register("thurStartTime")}
                  />
                </div>
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("thurEndTime")}
                  />
                </div>
              </div>
            </div>
            <div class="mt-3" style={{ display: "flex" }}>
              <label class="">Fri:</label>
              <div class="grid-container">
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "4rem" }}
                    {...timingForm.register("friStartTime")}
                  />
                </div>
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("friEndTime")}
                  />
                </div>
              </div>
            </div>
            <div class="mt-3" style={{ display: "flex" }}>
              <label class="">Sat:</label>
              <div class="grid-container">
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3.5rem" }}
                    {...timingForm.register("satStartTime")}
                  />
                </div>
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("satEndTime")}
                  />
                </div>
              </div>
            </div>
            <div class="mt-3" style={{ display: "flex" }}>
              <label class="">Sun:</label>
              <div class="grid-container">
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("sunStartTime")}
                  />
                </div>
                <div class="grid-item">
                  <input
                    type="time"
                    className="form-control"
                    style={{ marginLeft: "3rem" }}
                    {...timingForm.register("sunEndTime")}
                  />
                </div>
              </div>
            </div>
            <div>
              {timingSuccess && <Success msg={timingSuccess} />}
              {timingError && <Error msg={timingError} />}
            </div>
            <div class="float-end m-5">
              <button type="button" class="btn btn-light mb-3 mr-4">
                Cancel
              </button>
              &nbsp; &nbsp;
              <button type="submit" class="btn btn-primary mb-3 mr-4">
                Save
              </button>
            </div>
          </form>          
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.localDetailsSuccess,
  error: state.site.localDetailsError,
  timingSuccess: state.site.timingSuccess,
  timingError: state.site.timingError,
  updateSite: state.site.updateSite,
});
export default connect(mapStateToProps, { updateLocalDetails, updateTimings })(
  LocalDetails
);
