import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import { InputError } from "../../../common/InputError";
import { Validation } from "../../../../Constant/Validation";
import { connect } from "react-redux";
import {
  updateLocalDetails,
  updateTimings,
  setLoader,
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
  setLoader,
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
        clientResponsibility: updateSite?.client_responsiblity,
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
    setLoader(true);
    updateLocalDetails({ siteId: updateSite?.siteId, ...data });
  };
  const submitOpeningTiming = (data) => {
    setLoader(true);
    updateTimings({ siteId: updateSite?.siteId, ...data });
  };
  return (
    <>
      <div className="row p-2 bg-white">
        <div className="col-md-8">
          <h2 className="fs-6 mt-4 border-bottom">Local Details</h2>
          <form className="p-2" onSubmit={handleSubmit(submitLocalDetails)}>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label for="Council" className="form-label">
                    Local Authority
                  </label>
                  <input
                    type="text"
                    name="localAuthority"
                    className="form-control"
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
                <div className="mb-3">
                  <label htmlFor="status" className="form-label">
                    Status
                  </label>
                  <select
                    name="status"
                    className="form-control form-select"
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
                    <option value="" selected disabled>
                      Select Status
                    </option>
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
                  <label className="m-2" for="clientResponsibility">
                    Client Responsibility
                  </label>
                </div>
              </fieldset>
            </div>
            <div>
              {success && <Success msg={success} />}
              {/* {error && <Error msg={error} />} */}
            </div>
            <div
              className="float-end"
              style={{
                display: updateSite?.isViewMode ? "none" : "block",
              }}
            >
              <button type="button" className="btn btn-light mb-3 mr-4">
                Cancel
              </button>
              &nbsp; &nbsp;
              <button type="submit" className="btn btn-primary mb-3 mr-4">
                Save
              </button>
            </div>
          </form>
        </div>
        <div className="col-md-4">
          <h2 className="fs-6 mt-4 border-bottom">Opening Timings</h2>
          <div style={{ display: "flex", justifyContent: "space-evenly" }}>
            <span>Start</span>
            <span>End</span>
          </div>
          <form
            className="p-2"
            onSubmit={timingForm.handleSubmit(submitOpeningTiming)}
          >
            <div className="table-responsive">
              <table className="table">
                <tr>
                  <td>
                    <label className="">Mon:</label>
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("monStartTime")}
                    />
                  </td>
                  <td>
                    <input
                      {...timingForm.register("monEndTime")}
                      type="time"
                      className="form-control"
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Tues:</label>
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("tuesStartTime")}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("tuesEndTime")}
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>wed:</label>
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("wedStartTime")}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("wedEndTime")}
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Thurs:</label>
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("thurStartTime")}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("thurEndTime")}
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Fri:</label>
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("friStartTime")}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("friEndTime")}
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Sat:</label>
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("satStartTime")}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("satEndTime")}
                    />
                  </td>
                </tr>
                <tr>
                  <td>
                    <label>Sun:</label>
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("sunStartTime")}
                    />
                  </td>
                  <td>
                    <input
                      type="time"
                      className="form-control"
                      {...timingForm.register("sunEndTime")}
                    />
                  </td>
                </tr>
              </table>
            </div>
            <div>
              {timingSuccess && <Success msg={timingSuccess} />}
              {timingError && <Error msg={timingError} />}
            </div>
            <div
              className="float-end m-5"
              style={{
                display: updateSite?.isViewMode ? "none" : "block",
              }}
            >
              <button type="button" className="btn btn-light mb-3 mr-4">
                Cancel
              </button>
              &nbsp; &nbsp;
              <button type="submit" className="btn btn-primary mb-3 mr-4">
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
export default connect(mapStateToProps, {
  updateLocalDetails,
  updateTimings,
  setLoader,
})(LocalDetails);
