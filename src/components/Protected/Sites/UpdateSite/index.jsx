import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import {
  updateSiteDetail,
  updateSiteImage,
  deleteSiteImage,
  getSiteById,
  handleOnPostCodeSearch,
  getSiteDetailsById,
  setLoader,
} from "../../../../store/thunk/site";
import { InputError } from "../../../common/InputError";
import "./../AddSite/AddSite.css";
import { Validation } from "../../../../Constant/Validation";
import userDefault from "../../../../images/user-default.png";
import GoogleMap from "./GoogleMap";
import LocalDetails from "./LocalDetails";
import KeyContacts from "./KeyContacts";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { get } from "../../../../api";
import BusinessIcon from "@mui/icons-material/Business";
import { toast } from "react-toastify";

const UpdateSite = ({
  getAddresOnPostCodeSuccess,
  getSiteById,
  updateSite,
  updateSiteDetail,
  updateSiteImage,
  updateSiteImageSuccess,
  deleteSiteImage,
  handleOnPostCodeSearch,
  getSiteDetailsById,
  setLoader,
}) => {
  const [showPostCodeSearch, setShowPostCodeSearch] = useState(false);
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
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });
  const values = watch();
  const isViewMode = updateSite?.isViewMode;
  useEffect(() => {
    setLoader(true);
    getSiteDetailsById(updateSite?.siteId, isViewMode);
  }, []);
  useEffect(() => {
    console.log("updateSite", updateSite);
    if (updateSite) {
      reset(updateSite);
    }
  }, [updateSite]);
  const submitSite = (data) => {
    setLoader(true);
    updateSiteDetail(data);
    reset(data);
  };
  const handleFileSelect = async (event) => {
    setLoader(true);
    let siteId = updateSite?.siteId;
    const res = await updateSiteImage(event, siteId);
    setValue("siteImage", "");
  };
  const handleDeleteSiteImage = async (event) => {
    setLoader(true);
    let siteId = updateSite?.siteId;
    const res = await deleteSiteImage(siteId);
    if (res === "Success") {
      toast.success("Site image has been deleted successfully.");
      getSiteById(siteId);
    } else {
      toast.error(
        "Something went wrong while deleting site image. Please try again."
      );
    }
  };
  const handleOnSearch = async (event) => {
    setValue("latitude", "");
    setValue("longitude", "");
    setShowPostCodeSearch(true);
    handleOnPostCodeSearch(event);
  };
  const handleOnSelect = async (data) => {
    setLoader(true);
    try {
      const url = `https://api.getaddress.io${data?.url}?api-key=pdSw7G1TEk6kghR1DNzddQ41182&all=true`;
      const response = await get(url);
      setValue("postCode", response?.postcode, { shouldValidate: true });
      setValue("address1", response?.line_1);
      setValue("address2", response?.line_2, { shouldValidate: true });
      setValue("city", response?.town_or_city, { shouldValidate: true });
      setValue("area", response?.county);
      setValue("latitude", response?.latitude);
      setValue("longitude", response?.longitude);
      setValue("country", response?.country);
      setValue(
        "mapViewUrl",
        `http://maps.google.com/maps?q=${response?.latitude},${response?.longitude}`
      );
      setValue(
        "streetViewUrl",
        `http://maps.google.com/maps?q=${response?.latitude},${response?.longitude}`
      );

      setShowPostCodeSearch(false);
      setLoader(false);
    } catch (e) {
      console.log("error while loading postcode");
    }
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="">
        {/* <Header /> */}
        <div className="container-fluid">
          {/* <BreadCrumHeader header={"Update Site"} page={"Update Site"} /> */}
          {/* row start*/}
          <div className="row p-2" style={{ backgroundColor: "white" }}>
            <div className="col-md-8">
              <div className="row bg-white" style={{ height: 'auto'}}>
                <p className="pt-2 pb-2 border-bottom">Property Detail</p>
                <form className="p-2" onSubmit={handleSubmit(submitSite)}>
                  <div className="row">
                    <div className="col-md-12">
                      <div className="input-group mb-3">
                        <span class="input-group-text" id="basic-addon1">
                          <BusinessIcon />
                        </span>
                        <input
                          type="text"
                          name="siteName"
                          className="form-control"
                          id="siteName"
                          disabled={isViewMode}
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
                      <div className="mb-3">
                        <label for="address1" className="form-label">
                          Address Line 1
                        </label>
                        <input
                          type="text"
                          name="address1"
                          className="form-control"
                          id="address1"
                          disabled={isViewMode}
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
                      <div className="mb-3">
                        <label for="address2" className="form-label">
                          Address Line 2
                        </label>
                        <input
                          type="text"
                          name="address2"
                          className="form-control"
                          id="address2"
                          disabled={isViewMode}
                          {...register("address2")}
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label for="city" className="form-label">
                          City
                        </label>
                        <input
                          type="text"
                          name="city"
                          className="form-control"
                          id="city"
                          disabled={isViewMode}
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
                      <div className="mb-3">
                        <label for="area" className="form-label">
                          Area
                        </label>
                        <select
                          name="area"
                          className="contact-input form-control form-select"
                          id="area"
                          disabled={isViewMode}
                          {...register("area", {
                            required: {
                              value: true,
                              message: `${Validation.REQUIRED} your area`,
                            },
                          })}
                        >
                          <option value="">Select</option>
                          <option value="East Midlands">East Midlands</option>
                          <option value="Ireland & Northern Ireland">
                            Ireland & Northern Ireland
                          </option>
                          <option value="London & Eastern">
                            London & Eastern
                          </option>
                          <option value="North East, Yorkshire & Humberside">
                            North East, Yorkshire & Humberside
                          </option>
                          <option value="North West">North West</option>
                          <option value="Scotland">Scotland</option>
                          <option value="South East">South East</option>
                          <option value="South West">South West</option>
                          <option value="Wales">Wales</option>
                          <option value="West Midlands">West Midlands</option>
                        </select>
                        {errors?.area && (
                          <InputError
                            message={errors?.area?.message}
                            key={errors?.area?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label for="postCode" className="form-label">
                          Post Code
                        </label>
                        <input
                          type="text"
                          name="postCode"
                          className="form-control"
                          id="postCode"
                          disabled={isViewMode}
                          {...register("postCode", {
                            required: {
                              value: true,
                              message: `${Validation.REQUIRED} your city post code`,
                            },
                          })}
                          onChange={handleOnSearch}
                        />
                        <ul
                          className="postCodeSearchResult postCodeSearchResultSite"
                          style={{
                            display: showPostCodeSearch ? "block" : "none",
                          }}
                        >
                          {getAddresOnPostCodeSuccess?.map((itm) => (
                            <li
                              onClick={() => handleOnSelect(itm)}
                              key={itm?.id}
                            >
                              {itm?.name}
                            </li>
                          ))}
                        </ul>
                        {errors?.postCode && (
                          <InputError
                            message={errors?.postCode?.message}
                            key={errors?.postCode?.message}
                          />
                        )}
                      </div>
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label for="country" className="form-label">
                          Country
                        </label>
                        <input
                          type="text"
                          name="country"
                          className="form-control"
                          id="country"
                          disabled={isViewMode}
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
                    <input
                      type="text"
                      name="mapViewUrl"
                      className="form-control"
                      id="mapViewUrl"
                      style={{ display: "none" }}
                      {...register("mapViewUrl")}
                    />
                    <input
                      type="text"
                      name="streetViewUrl"
                      className="form-control"
                      id="streetViewUrl"
                      style={{ display: "none" }}
                      {...register("streetViewUrl")}
                    />
                    <div
                      className="col-md-12"
                      style={{
                        display: isViewMode ? "none" : "block",
                      }}
                    >
                      <div className="float-end">
                        <button
                          type="button"
                          className="btn btn-light mb-3 mr-4"
                        >
                          Cancel
                        </button>
                        &nbsp; &nbsp;
                        <button
                          disabled={isViewMode}
                          type="submit"
                          className="btn btn-primary mb-3 mr-4"
                        >
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
                  src={
                    updateSiteImageSuccess
                      ? updateSiteImageSuccess?.data?.url
                      : updateSite?.siteImageUrl
                      ? updateSite?.siteImageUrl
                      : userDefault
                  }
                  alt=""
                  width="64px"
                  height="64px"
                />
                <span>Upload your site photo</span>
                <div
                  style={{
                    display: isViewMode ? "none" : "block",
                  }}
                >
                  <button
                    className="btn btn-sm btn-primary mt-2 mb-2 "
                    disabled={!updateSiteImageSuccess?.data?.url}
                    onClick={handleDeleteSiteImage}
                  >
                    Delete
                  </button>
                </div>
              </div>
              <div
                className="uploading-outer"
                style={{
                  backgroundColor: "#f1f5f9",
                  display: isViewMode ? "none" : "block",
                }}
              >
                <div className="uploadPhotoButton text-center">
                  <FileUploadOutlinedIcon
                    style={{
                      color: "blue",
                      position: "relative",
                      left: "50%",
                      transform: "translate(-25%, 0)",
                    }}
                  />
                  <input
                    {...register("siteImage")}
                    disabled={isViewMode}
                    className="uploadButton-input mt-4"
                    type="file"
                    name="siteImage"
                    accept="image/*, application/pdf"
                    id="siteImage"
                    onChange={handleFileSelect}
                  />
                  <label
                    htmlFor="siteImage"
                    className="text-primary cursor mt-4"
                  >
                    Click to upload
                  </label>
                  &nbsp;
                  <span>or drag and drop</span>
                  <p>
                    SVG, PNG, JPG or GIF
                    <br />
                    (max 800 * 800 px)
                  </p>
                </div>
              </div>
              <div className="map mt-2">
                <GoogleMap
                  lat={values?.latitude}
                  long={values?.longitude}
                  postCode={values?.postCode}
                  streetViewURL={values?.streetViewUrl}
                />
              </div>
            </div>
          </div>
          {/* row end*/}
          <LocalDetails />
          <KeyContacts />
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  updateSite: state.site.updateSite,
  updateSiteImageSuccess: state.site.updateSiteImageSuccess,
  siteDetailsById: state.site.siteDetailsById,
  getAddresOnPostCodeSuccess: state.site.getAddresOnPostCodeSuccess,
});
export default connect(mapStateToProps, {
  updateSiteDetail,
  updateSiteImage,
  deleteSiteImage,
  getSiteById,
  handleOnPostCodeSearch,
  getSiteDetailsById,
  setLoader,
})(UpdateSite);
