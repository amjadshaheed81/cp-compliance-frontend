import React, { useEffect, useState } from "react";
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
import { useNavigate } from "react-router-dom";

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
  const navigate = useNavigate();
  const [timingDisable, setTimingDisable] = useState({
    isMondayDisable: false,
    isTuesdayDisable: false,
    isWednesdayDisable: false,
    isThursdayDisable: false,
    isFridayDisable: false,
    isSaturdayDisable: false,
    isSundayDisable: false,
  });
  const isViewMode = updateSite?.isViewMode;
  useEffect(() => {
    console.log("updateSite ===>", updateSite);
    if (updateSite) {
      reset({
        localAuthority: updateSite?.localAuthority,
        status: updateSite?.status,
        clientResponsibility: updateSite?.clientResponsiblity,
      });
      if (updateSite?.monStartTime === "Closed") {
        timingForm.setValue("isMondayClosed", "on");
      }
      if (updateSite?.tuesStartTime === "Closed") {
        timingForm.setValue("isTuesdayClosed", "on");
      }
      if (updateSite?.wedStartTime === "Closed") {
        timingForm.setValue("isWednesdayClosed", "on");
      }
      if (updateSite?.thurStartTime === "Closed") {
        timingForm.setValue("isThursdayClosed", "on");
      }
      if (updateSite?.friStartTime === "Closed") {
        timingForm.setValue("isFridayClosed", "on");
      }
      if (updateSite?.satStartTime === "Closed") {
        timingForm.setValue("isSaturdayClosed", "on");
      }
      if (updateSite?.sunStartTime === "Closed") {
        timingForm.setValue("isSundayClosed", "on");
      }
      setTimingDisable({
        isMondayDisable: updateSite?.monStartTime === "Closed" ? true : false,
        isTuesdayDisable: updateSite?.tuesStartTime === "Closed" ? true : false,
        isWednesdayDisable:
          updateSite?.wedStartTime === "Closed" ? true : false,
        isThursdayDisable:
          updateSite?.thurStartTime === "Closed" ? true : false,
        isFridayDisable: updateSite?.friStartTime === "Closed" ? true : false,
        isSaturdayDisable: updateSite?.satStartTime === "Closed" ? true : false,
        isSundayDisable: updateSite?.sunStartTime === "Closed" ? true : false,
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
    console.log("data", data);
    const formData = {
      monStartTime: timingDisable?.isMondayDisable
        ? "Closed"
        : data?.monStartTime,
      tuesStartTime: timingDisable?.isTuesdayDisable
        ? "Closed"
        : updateSite?.tuesStartTime,
      wedStartTime: timingDisable?.isWednesdayDisable
        ? "Closed"
        : updateSite?.wedStartTime,
      thurStartTime: timingDisable?.isThursdayDisable
        ? "Closed"
        : updateSite?.thurStartTime,
      friStartTime: timingDisable?.isFridayDisable
        ? "Closed"
        : updateSite?.friStartTime,
      satStartTime: timingDisable?.isSaturdayDisable
        ? "Closed"
        : updateSite?.satStartTime,
      sunStartTime: timingDisable?.isSundayDisable
        ? "Closed"
        : updateSite?.sunStartTime,
      monEndTime: data?.monEndTime,
      tuesEndTime: data?.tuesEndTime,
      wedEndTime: data?.wedEndTime,
      thurEndTime: data?.thurEndTime,
      friEndTime: data?.friEndTime,
      satEndTime: data?.satEndTime,
      sunEndTime: data?.sunEndTime,
    };
    updateTimings({ siteId: updateSite?.siteId, ...formData });
  };
  return (
    <>
      <div className="row p-2 bg-white">
        <div className="col-md-6">
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
                    disabled={isViewMode}
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
                    disabled={isViewMode}
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
                    disabled={isViewMode}
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
                display: isViewMode ? "none" : "block",
              }}
            >
              <button type="button" className="btn btn-light mb-3 mr-4" onClick={() => {
                navigate("/sites")
              }}>
                Cancel
              </button>
              &nbsp; &nbsp;
              <button type="submit" className="btn btn-primary mb-3 mr-4">
                Save
              </button>
            </div>
          </form>
        </div>
        <div className="col-md-6">
          <h2 className="fs-6 mt-4 border-bottom">Opening Times</h2>
          <form
            className="p-2"
            onSubmit={timingForm.handleSubmit(submitOpeningTiming)}
          >
            <div className="table-responsive">
              <table className="table p-2">
                <thead className="table-dark">
                  <tr>
                    <th scope="col">Day</th>
                    <th scope="col">Start Time</th>
                    <th scope="col">End Time</th>
                    <th
                      scope="col"
                      style={{ display: isViewMode ? "none" : "" }}
                    >
                      Is Closed
                    </th>
                  </tr>
                </thead>
                {isViewMode && (
                  <>
                    <tr>
                      <th scope="row">Monday</th>
                      <td>{updateSite?.monStartTime}</td>
                      <td>{updateSite?.monEndTime}</td>
                    </tr>
                    <tr>
                      <th scope="row">Tuesday</th>
                      <td>{updateSite?.tuesStartTime}</td>
                      <td>{updateSite?.tuesEndTime}</td>
                    </tr>
                    <tr>
                      <th scope="row">Wednesday</th>
                      <td>{updateSite?.wedStartTime}</td>
                      <td>{updateSite?.wedEndTime}</td>
                    </tr>
                    <tr>
                      <th scope="row">Thursday</th>
                      <td>{updateSite?.thurStartTime}</td>
                      <td>{updateSite?.thurEndTime}</td>
                    </tr>
                    <tr>
                      <th scope="row">Friday</th>
                      <td>{updateSite?.friStartTime}</td>
                      <td>{updateSite?.friEndTime}</td>
                    </tr>
                    <tr>
                      <th scope="row">Saturday</th>
                      <td>{updateSite?.satStartTime}</td>
                      <td>{updateSite?.satEndTime}</td>
                    </tr>
                    <tr>
                      <th scope="row">Sunday</th>
                      <td>{updateSite?.sunStartTime}</td>
                      <td>{updateSite?.sunEndTime}</td>
                    </tr>
                  </>
                )}
                {!isViewMode && (
                  <>
                    <tr>
                      <td>
                        <label className="">Mon:</label>
                      </td>
                      <td>
                        <input
                          type="time"
                          disabled={
                            isViewMode || timingDisable?.isMondayDisable
                          }
                          className="form-control"
                          {...timingForm.register("monStartTime")}
                        />
                      </td>
                      <td>
                        <input
                          {...timingForm.register("monEndTime")}
                          disabled={
                            isViewMode || timingDisable?.isMondayDisable
                          }
                          type="time"
                          className="form-control"
                        />
                      </td>
                      <td className="text-center">
                        <input
                          {...timingForm.register("isMondayClosed")}
                          disabled={isViewMode}
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if(e.target.checked) {
                              timingForm.setValue("monEndTime", "");
                              timingForm.setValue("monStartTime", "");
                            }
                            setTimingDisable({
                              ...timingDisable,
                              isMondayDisable: e.target.checked,
                            });
                            timingForm.setValue(
                              "isMondayClosed",
                              e.target.checked
                            );
                          }}
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
                          disabled={
                            isViewMode || timingDisable?.isTuesdayDisable
                          }
                          {...timingForm.register("tuesStartTime")}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          disabled={
                            isViewMode || timingDisable?.isTuesdayDisable
                          }
                          {...timingForm.register("tuesEndTime")}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          {...timingForm.register("isTuesdayClosed")}
                          disabled={isViewMode}
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if(e.target.checked) {
                              timingForm.setValue("tuesEndTime", "");
                              timingForm.setValue("tuesStartTime", "");
                            }
                            setTimingDisable({
                              ...timingDisable,
                              isTuesdayDisable: e.target.checked,
                            });
                            timingForm.setValue(
                              "isTuesdayClosed",
                              e.target.checked
                            );
                          }}
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
                          disabled={
                            isViewMode || timingDisable?.isWednesdayDisable
                          }
                          {...timingForm.register("wedStartTime")}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          disabled={
                            isViewMode || timingDisable?.isWednesdayDisable
                          }
                          {...timingForm.register("wedEndTime")}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          {...timingForm.register("isWednesdayClosed")}
                          disabled={isViewMode}
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if(e.target.checked) {
                              timingForm.setValue("wedEndTime", "");
                              timingForm.setValue("wedStartTime", "");
                            }
                            setTimingDisable({
                              ...timingDisable,
                              isWednesdayDisable: e.target.checked,
                            });
                            timingForm.setValue(
                              "isWednesdayClosed",
                              e.target.checked
                            );
                          }}
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
                          disabled={
                            isViewMode || timingDisable?.isThursdayDisable
                          }
                          {...timingForm.register("thurStartTime")}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          disabled={
                            isViewMode || timingDisable?.isThursdayDisable
                          }
                          {...timingForm.register("thurEndTime")}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          {...timingForm.register("isThursdayClosed")}
                          disabled={isViewMode}
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if(e.target.checked) {
                              timingForm.setValue("thurEndTime", "");
                              timingForm.setValue("thurStartTime", "");
                            }
                            setTimingDisable({
                              ...timingDisable,
                              isThursdayDisable: e.target.checked,
                            });
                            timingForm.setValue(
                              "isThursdayClosed",
                              e.target.checked
                            );
                          }}
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
                          disabled={
                            isViewMode || timingDisable?.isFridayDisable
                          }
                          className="form-control"
                          {...timingForm.register("friStartTime")}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          disabled={
                            isViewMode || timingDisable?.isFridayDisable
                          }
                          {...timingForm.register("friEndTime")}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          {...timingForm.register("isFridayClosed")}
                          disabled={isViewMode}
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if(e.target.checked) {
                              timingForm.setValue("friEndTime", "");
                              timingForm.setValue("friStartTime", "");
                            }
                            setTimingDisable({
                              ...timingDisable,
                              isFridayDisable: e.target.checked,
                            });
                            timingForm.setValue(
                              "isFridayClosed",
                              e.target.checked
                            );
                          }}
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
                          disabled={
                            isViewMode || timingDisable?.isSaturdayDisable
                          }
                          {...timingForm.register("satStartTime")}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          disabled={
                            isViewMode || timingDisable?.isSaturdayDisable
                          }
                          {...timingForm.register("satEndTime")}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          {...timingForm.register("isSaturdayClosed")}
                          disabled={isViewMode}
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if(e.target.checked) {
                              timingForm.setValue("satEndTime", "");
                              timingForm.setValue("satStartTime", "");
                            }
                            setTimingDisable({
                              ...timingDisable,
                              isSaturdayDisable: e.target.checked,
                            });
                            timingForm.setValue(
                              "isSaturdayClosed",
                              e.target.checked
                            );
                          }}
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
                          disabled={
                            isViewMode || timingDisable?.isSundayDisable
                          }
                          {...timingForm.register("sunStartTime")}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          className="form-control"
                          disabled={
                            isViewMode || timingDisable?.isSundayDisable
                          }
                          {...timingForm.register("sunEndTime")}
                        />
                      </td>
                      <td className="text-center">
                        <input
                          {...timingForm.register("isSundayClosed")}
                          disabled={isViewMode}
                          type="checkbox"
                          className="form-check-input"
                          onChange={(e) => {
                            if(e.target.checked) {
                              timingForm.setValue("sunEndTime", "");
                              timingForm.setValue("sunStartTime", "");
                            }
                            setTimingDisable({
                              ...timingDisable,
                              isSundayDisable: e.target.checked,
                            });
                            timingForm.setValue(
                              "isSundayClosed",
                              e.target.checked
                            );
                          }}
                        />
                      </td>
                    </tr>
                  </>
                )}
              </table>
            </div>
            <div>
              {timingSuccess && <Success msg={timingSuccess} />}
              {timingError && <Error msg={timingError} />}
            </div>
            <div
              className="float-end m-5"
              style={{
                display: isViewMode ? "none" : "block",
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
