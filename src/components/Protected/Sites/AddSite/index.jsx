import React, { Fragment } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { addSite, updateSiteImage } from "../../../../store/thunk/site";
import { InputError } from "../../../common/InputError";
import Success from "../../../common/Alert/Success";
import Error from "../../../common/Alert/Error";
import Sidebar from "../../../common/Sidebar/Sidebar";
import Header from "../../../common/Header/Header";
import "./AddSite.css";
import { Validation } from "../../../../Constant/Validation";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import userDefault from "../../../../images/user-default.png";

const AddSite = ({ siteId, updateSiteImage, success, error, addSite }) => {
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
    streetViewUrl: "",
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
  const handleFileSelect = async (event,siteId) => {
    updateSiteImage(event, siteId);
  };
  return (
    <Fragment>
      <Sidebar />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <BreadCrumHeader header={"Create New Site"} page={"New Site"} />
          {/* row start*/}
          <div className="row p-2" style={{ backgroundColor: "white" }}>
            <div className="col-md-8">
              <div className="row bg-white">
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
                              message: `${Validation.REQUIRED} site name`,
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
                              message: `${Validation.REQUIRED} addess on line 1`,
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
                              message: `${Validation.REQUIRED} addess on line 2`,
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
                              message: `${Validation.REQUIRED} city`,
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
                              message: `${Validation.REQUIRED} your area`,
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
                              message: `${Validation.REQUIRED} your city post code`,
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
                              message: `${Validation.REQUIRED} country`,
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
                              message: `${Validation.REQUIRED} map view link`,
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
                              message: `${Validation.REQUIRED} street view url`,
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
                    <div className="col-md-12">
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
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="col-md-4">
              <div className="pic-container pic-medium pic-circle">
                <img
                  className="pic"
                  src={userDefault}
                  alt=""
                  width="64px"
                  height="64px"
                />
                <span>Upload your site photo</span>
                <div>
                  <button
                    className="del-btn"
                    style={{ backgroundColor: "white" }}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div
                className="uploading-outer"
                style={{ backgroundColor: "#f1f5f9" }}
              >
                <div className="uploadPhotoButton">
                  <FileUploadOutlinedIcon
                    style={{
                      color: "blue",
                      fontSize: "50px",
                      marginLeft: "9rem",
                    }}
                  />
                  <input
                    {...register("photo")}
                    className="uploadButton-input"
                    type="file"
                    name="siteImage"
                    accept="image/*, application/pdf"
                    id="siteImage"
                    onChange={(e) => handleFileSelect(e, siteId)}
                  />
                  <label
                    htmlFor="siteImage"
                    style={{ color: "blue", marginLeft: "2.5rem" }}
                    class="btn"
                  >
                    Click to upload
                  </label>
                  <span>or drag and drop</span>
                  <p style={{ marginLeft: "6rem" }}>SVG, PNG, JPG or GIF</p>
                  <p style={{ marginLeft: "6rem" }}>(max 800 * 800 px)</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  success: state.site.success,
  error: state.site.error,
});
export default connect(mapStateToProps, { addSite, updateSiteImage })(AddSite);
