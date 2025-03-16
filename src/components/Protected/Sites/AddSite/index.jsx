import React, { useState, Fragment, useEffect } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useNavigate } from "react-router-dom";
import {
  addSite,
  updateSiteImage,
  updateSite,
  getSites,
  handleOnPostCodeSearch,
  setLoader,
} from "../../../../store/thunk/site";
import { InputError } from "../../../common/InputError";
import "./AddSite.css";
import { Validation } from "../../../../Constant/Validation";
import userDefault from "../../../../images/user-default.png";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { get } from "../../../../api";
import GoogleMap from "../UpdateSite/GoogleMap";
import BusinessIcon from "@mui/icons-material/Business";
import { SiteArea } from "../../../../Constant/SiteArea";
import { toast } from "react-toastify";

const AddSite = ({
  updateSite,
  updateSiteImage,
  addSite,
  handleOnPostCodeSearch,
  getAddresOnPostCodeSuccess,
  setLoader,
  loggedInUserData,
  sites
}) => {

  useEffect(() => {
    getSites(loggedInUserData);
  }, []);
  const navigate = useNavigate();
  const [showPostCodeSearch, setShowPostCodeSearch] = useState(false);
  const goTo = (link) => {
    navigate(link);
  };
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
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });
  const values = watch();
  const submitSite = (data) => {
    const license = JSON.parse(localStorage.getItem('license'));
    if(sites.length >= Number(license.allowedUser)) {
      toast.error("You have reached your limit for adding site under your license.")
      return;
    }
    setLoader(true);
    data.licenseId = license?.licenseId
    
    addSite(data, goTo);
    reset(defaultValues);
  };
  const handleFileSelect = async (event) => {
    setLoader(true);
    let siteId = updateSite?.siteId;
    updateSiteImage(event, siteId);
  };
  const handleOnSearch = async (event) => {
    setValue("latitude", "");
    setValue("longitude", "");
    setShowPostCodeSearch(true);
    handleOnPostCodeSearch(event);
  };
  const handleOnSelect = async (data) => {
    try {
      const url = `https://api.getaddress.io${data?.url}?api-key=pdSw7G1TEk6kghR1DNzddQ41182&all=true`;
      const response = await get(url);
      setValue("postCode", response?.postcode, { shouldValidate: true });
      setValue("address2", response?.line_2);
      setValue("address1", response?.line_1, { shouldValidate: true });
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
    } catch (e) {
      console.log("error while loading postcode");
    }
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        {/* <Header /> */}
        <div className="container-fluid">
          {/* row start*/}
          <div className="row p-2">
            <div className="col-md-8">
              <div className="row autoHeight">
                <p className="fs-6 border-bottom">Property Detail</p>
                <form className="p-2" onSubmit={handleSubmit(submitSite)}>
                  <div className="row">
                    <div className="col-md-12">
                      <div for="siteName" className="form-label">
                        Site Name
                      </div>
                      <div class="input-group mb-3">
                        <span class="input-group-text" id="basic-addon1">
                          <BusinessIcon />
                        </span>
                        <input
                          type="text"
autoComplete="off"
                          name="siteName"
                          className="form-control"
                          id="siteName"
                          {...register("siteName", {
                            required: {
                              value: true,
                              message: `${Validation.REQUIRED} site name`,
                            },
                          })}
                        />
                      </div>
                      {errors?.siteName && (
                        <InputError
                          message={errors?.siteName?.message}
                          key={errors?.siteName?.message}
                        />
                      )}
                      {/* <div className="mb-3">
                       
                      </div> */}
                    </div>
                    <div className="col-md-6">
                      <div className="mb-3">
                        <label for="address1" className="form-label">
                          Address Line 1
                        </label>
                        <input
                          type="text"
autoComplete="off"
                          name="address1"
                          className="form-control"
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
                      <div className="mb-3">
                        <label for="address2" className="form-label">
                          Address Line 2
                        </label>
                        <input
                          type="text"
autoComplete="off"
                          name="address2"
                          className="form-control"
                          id="address2"
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
autoComplete="off"
                          name="city"
                          className="form-control"
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
                      <div className="mb-3">
                        <label for="area" className="form-label">
                          Area
                        </label>
                        <select
                          name="area"
                          className="contact-input form-control form-select"
                          id="area"
                          {...register("area", {
                            required: {
                              value: true,
                              message: `${Validation.REQUIRED} your area`,
                            },
                          })}
                        >
                          <option value="">Select</option>
                          {SiteArea?.map((itm)=> <option value={itm}>{itm}</option>)}
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
autoComplete="off"
                          name="postCode"
                          className="form-control"
                          id="postCode"
                          placeholder="Search Post Code"
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
autoComplete="off"
                          name="country"
                          className="form-control"
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
                    <input
                      type="text"
autoComplete="off"
                      name="mapViewUrl"
                      className="form-control"
                      id="mapViewUrl"
                      style={{ display: "none" }}
                      {...register("mapViewUrl")}
                    />
                    <input
                      type="text"
autoComplete="off"
                      name="streetViewUrl"
                      className="form-control"
                      id="streetViewUrl"
                      style={{ display: "none" }}
                      {...register("streetViewUrl")}
                    />
                    <div className="col-md-12">
                      <div className="float-end">
                        <button
                          type="button"
                          className="btn btn-light mb-3 mr-4"
                          onClick={() => {
                            navigate("/sites")
                          }}
                        >
                          Cancel
                        </button>
                        &nbsp; &nbsp;
                        <button
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
              {values?.latitude && values?.longitude && (
                <GoogleMap
                  lat={values?.latitude}
                  long={values?.longitude}
                  postCode={values?.postCode}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  updateSite: state.site.updateSite,
  sites: state.site.sites,
  getAddresOnPostCodeSuccess: state.site.getAddresOnPostCodeSuccess,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  updateSite,
  addSite,
  updateSiteImage,
  getSites,
  handleOnPostCodeSearch,
  setLoader,
})(AddSite);
