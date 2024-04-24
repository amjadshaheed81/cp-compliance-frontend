import React, { Fragment } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Sidebar from "../../common/Sidebar/Sidebar";
import Header from "../../common/Header/Header";
import { addSite } from "../../../store/thunk/site";

import "./AddSite.css";
import { InputError } from "../../common/InputError";
import Success from "../../common/Alert/Success";
import Error from "../../common/Alert/Error";

const AddSite = ({ success, error, addSite }) => {
  console.log("error", error);
  const defaultValues = {
    address1: "",
    address2: "",
    area: "",
    city: "",
    country: "",
    mapViewUrl: "",
    postCode: "",
    siteName: "",
    streetViewURL: "",
  };
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
    getValues,
  } = useForm({
    defaultValues,
  });
  const submitSite = (data) => {
    addSite(data);
    reset(defaultValues);
  };
  return (
    <Fragment>
      <Sidebar />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <h4 role="heading">Create New Site</h4>
          {/* row start*/}
          <div className="row p-2">
            <div className="col-md-8 bg-light">
              <div className="row">
                <p class="fs-6 mt-2 border-bottom">Property Detail</p>
                <form className="p-2" onSubmit={handleSubmit(submitSite)}>
                  <div className="row">
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="siteName" class="form-label">
                          Site Name
                        </label>
                        <input
                          type="text"
                          name="siteName"
                          class="form-control"
                          id="siteName"
                          {...register("siteName", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.siteName && (
                          <InputError
                            message={errors?.siteName?.message}
                            key={errors?.siteName?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="address1" class="form-label">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          name="address1"
                          class="form-control"
                          id="address1"
                          {...register("address1", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.address1 && (
                          <InputError
                            message={errors?.address1?.message}
                            key={errors?.address1?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="address2" class="form-label">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          name="address2"
                          class="form-control"
                          id="address2"
                          {...register("address2", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.address2 && (
                          <InputError
                            message={errors?.address2?.message}
                            key={errors?.address2?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="city" class="form-label">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          class="form-control"
                          id="city"
                          {...register("city", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.city && (
                          <InputError
                            message={errors?.city?.message}
                            key={errors?.city?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="area" class="form-label">
                          Area
                        </label>
                        <input
                          type="text"
                          name="area"
                          class="form-control"
                          id="area"
                          {...register("area", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.area && (
                          <InputError
                            message={errors?.area?.message}
                            key={errors?.area?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="postCode" class="form-label">
                          Post Code
                        </label>
                        <input
                          type="text"
                          name="postCode"
                          class="form-control"
                          id="postCode"
                          {...register("postCode", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.postCode && (
                          <InputError
                            message={errors?.postCode?.message}
                            key={errors?.postCode?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div class="mb-3">
                        <label for="country" class="form-label">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          class="form-control"
                          id="country"
                          {...register("country", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.country && (
                          <InputError
                            message={errors?.country?.message}
                            key={errors?.country?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="mapViewUrl" class="form-label">
                          Map View URL <i class="fas fa-info-circle"></i>
                        </label>
                        <input
                          type="text"
                          name="mapViewUrl"
                          class="form-control"
                          id="mapViewUrl"
                          {...register("mapViewUrl", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.mapViewUrl && (
                          <InputError
                            message={errors?.mapViewUrl?.message}
                            key={errors?.mapViewUrl?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-12">
                      <div class="mb-3">
                        <label for="streetViewUrl" class="form-label">
                          Street View URL <i class="fas fa-info-circle"></i>
                        </label>
                        <input
                          type="text"
                          name="streetViewUrl"
                          class="form-control"
                          id="streetViewUrl"
                          {...register("streetViewUrl", {
                            required: {
                              value: true,
                              message: "required",
                            },
                          })}
                        />
                        {errors?.streetViewUrl && (
                          <InputError
                            message={errors?.streetViewUrl?.message}
                            key={errors?.streetViewUrl?.message}
                          />
                        )}
                      </div>
                    </div>
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
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-md-4"></div>
          </div>
          {/* row end*/}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  success: state.success,
  error: state.error,
});
export default connect(mapStateToProps, { addSite })(AddSite);
