import React from "react";
import { useForm } from "react-hook-form";
import { InputError } from "../../../common/InputError";
import { Validation } from "../../../../Constant/Validation";

const LocalDetails = ({ siteId }) => {
  const {
    register,
    handleSubmit,
    // reset,
    formState: { errors },
    // getValues,
  } = useForm({});
  const submitSite = (data) => {
    // addSite(data);
    // reset(defaultValues);
  };
  return (
    <>
      <div class="row p-2 bg-white">
        <div class="col-md-8">
          <h2 class="fs-6 mt-4 border-bottom">Local Details</h2>
          <form className="p-2" onSubmit={handleSubmit(submitSite)}>
            <div className="row">
              <div className="col-md-6">
                <div class="mb-3">
                  <label for="Council" class="form-label">
                    Liverpool Council
                  </label>
                  <input
                    type="text"
                    name="council"
                    class="form-control"
                    id="council"
                    {...register("council", {
                      required: {
                        value: true,
                        message: `${Validation.REQUIRED} Council`,
                      },
                    })}
                  />
                  {errors?.council && (
                    <InputError
                      message={errors?.council?.message}
                      key={errors?.council?.message}
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
                    {...register("councilStatus", {
                      required: {
                        value: true,
                        message: `${Validation.REQUIRED} Status`,
                      },
                    })}
                    // value={sites}
                    // onChange={searchSitesWithStatus}
                  >
                    <option value="">Select</option>
                    <option value="status">Status</option>
                    <option value="open">Open</option>
                    <option value="closed">Closed</option>
                    <option value="sold">Sold</option>
                  </select>
                  {errors?.councilStatus && (
                    <InputError
                      message={errors?.councilStatus?.message}
                      key={errors?.councilStatus?.message}
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
          <span style={{ marginLeft: "5.5rem" }}>Start</span>
          <span style={{ marginLeft: "4.5rem" }}>End</span>
          <div class="mt-3" style={{ display: "flex" }}>
            <label class="">Mon:</label>
            <div class="grid-container">
              <div class="grid-item">
                <input style={{ marginLeft: "3rem" }} type="text" />
              </div>
              <div class="grid-item">
                <input type="text" />
              </div>
            </div>
          </div>
          <div class="mt-3" style={{ display: "flex" }}>
            <label class="">Tues:</label>
            <div class="grid-container">
              <div class="grid-item">
                <input style={{ marginLeft: "3rem" }} type="text" />
              </div>
              <div class="grid-item">
                <input type="text" />
              </div>
            </div>
          </div>
          <div class="mt-3" style={{ display: "flex" }}>
            <label class="">Wed:</label>
            <div class="grid-container">
              <div class="grid-item">
                <input style={{ marginLeft: "3rem" }} type="text" />
              </div>
              <div class="grid-item">
                <input type="text" />
              </div>
            </div>
          </div>
          <div class="mt-3" style={{ display: "flex" }}>
            <label class="">Thurs:</label>
            <div class="grid-container">
              <div class="grid-item">
                <input style={{ marginLeft: "2.5rem" }} type="text" />
              </div>
              <div class="grid-item">
                <input type="text" />
              </div>
            </div>
          </div>
          <div class="mt-3" style={{ display: "flex" }}>
            <label class="">Fri:</label>
            <div class="grid-container">
              <div class="grid-item">
                <input style={{ marginLeft: "4rem" }} type="text" />
              </div>
              <div class="grid-item">
                <input style={{ marginLeft: "0.9rem" }} type="text" />
              </div>
            </div>
          </div>
          <div class="mt-3" style={{ display: "flex" }}>
            <label class="">Sat:</label>
            <div class="grid-container">
              <div class="grid-item">
                <input style={{ marginLeft: "3.7rem" }} type="text" />
              </div>
              <div class="grid-item">
                <input style={{ marginLeft: "0.8rem" }} type="text" />
              </div>
            </div>
          </div>
          <div class="mt-3" style={{ display: "flex" }}>
            <label class="">Sun:</label>
            <div class="grid-container">
              <div class="grid-item">
                <input style={{ marginLeft: "3.5rem" }} type="text" />
              </div>
              <div class="grid-item">
                <input style={{ marginLeft: "0.8rem" }} type="text" />
              </div>
            </div>
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
        </div>
      </div>
    </>
  );
};
export default LocalDetails;
