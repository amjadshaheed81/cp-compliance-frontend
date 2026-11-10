import PostcodeLookup from "../../../common/PostcodeLookup/PostcodeLookup";
import React, { useState, Fragment, useEffect, useRef } from "react";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useNavigate } from "react-router-dom";
import {
  addSite,
  updateSiteImage,
  updateSite,
  getSites,
  setLoader,
} from "../../../../store/thunk/site";
import { InputError } from "../../../common/InputError";
import "./AddSite.css";
import { Validation } from "../../../../Constant/Validation";
import userDefault from "../../../../images/user-default.png";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import GoogleMap from "../UpdateSite/GoogleMap";
import Header from "../../../common/Header/Header";
import { getPlatformWorkspace } from "../../../../utils/platformWorkspace";
import { isPlatformUser } from "../../../../utils/sessionContext";
import BusinessIcon from "@mui/icons-material/Business";
import { SiteArea } from "../../../../Constant/SiteArea";
import { toast } from "react-toastify";

const AddSite = ({
  updateSite,
  updateSiteImage,
  addSite,
  setLoader,
  loggedInUserData,
  getSites,
  sites
}) => {

  useEffect(() => {
    if (!isPlatformUser(loggedInUserData)) getSites(loggedInUserData);
  }, [getSites, loggedInUserData?.id]);
  const navigate = useNavigate();
  const workspace = getPlatformWorkspace();
  const platform = isPlatformUser(loggedInUserData);
  const firstSite = platform && workspace?.sites?.length === 0;
  const [saveMessage, setSaveMessage] = useState("");
  const [created, setCreated] = useState(false);
  const saveInFlight = useRef(false);
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
    formState: { errors, isSubmitting },
    getValues,
    setValue,
    watch,
  } = useForm({
    defaultValues,
  });
  const values = watch();
  const submitSite = async (data) => {
    if (created || saveInFlight.current) return;
    let license = workspace?.selectedClient;
    if (!platform) { try { license = JSON.parse(localStorage.getItem("license") || "null"); } catch { license = null; } }
    if (!license?.licenseId) { setSaveMessage("Choose a client before creating a site."); return; }
    const count = platform ? workspace.sites.length : (sites || []).length;
    if (license.allowedSites != null && count >= Number(license.allowedSites)) {
      setSaveMessage(platform ? "This client's site allowance has been reached. Update its configuration in Client List to add a site." : "Your site allowance has been reached. Contact your platform administrator to increase it.");
      return;
    }
    setSaveMessage("");
    saveInFlight.current = true;
    setLoader(true);
    try {
      const result = await addSite({ ...data, licenseId: license.licenseId }, goTo);
      if (result?.success) { setCreated(true); setSaveMessage(result.message || "Site created. Opening the site…"); }
      else setSaveMessage(result?.message || "The site could not be saved. Your details have been kept.");
    } catch {
      setSaveMessage("The site could not be saved. Your details have been kept; please retry.");
    } finally {
      saveInFlight.current = false;
      setLoader(false);
    }

  };
  const handleFileSelect = async (event) => {
    setLoader(true);
    let siteId = updateSite?.siteId;
    updateSiteImage(event, siteId);
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content cafm-site-create">
        <Header pageContext={firstSite ? { icon: "sites", breadcrumbs: [ { label: "Dashboard", path: "/dashboard" }, { label: "Create First Site" } ] } : undefined} />
        <main className="container-fluid cafm-site-create-main">
          
          {platform && <p>{workspace?.selectedClient?.companyName} — {firstSite ? "Add the first site to open this client's workspace." : "Add a site to this client."}</p>}
          {saveMessage && <div role="alert" className={created ? "alert alert-success" : "alert alert-warning"}>{saveMessage}</div>}
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
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
                        <PostcodeLookup register={register} getValues={getValues} setValue={setValue} error={errors?.postCode} />
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
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                      name="mapViewUrl"
                      className="form-control"
                      id="mapViewUrl"
                      style={{ display: "none" }}
                      {...register("mapViewUrl")}
                    />
                    <input
                      type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
                            navigate(firstSite ? "/platform" : "/sites")
                          }}
                        >
                          Cancel
                        </button>
                        &nbsp; &nbsp;
                        <button
                          type="submit"
                          disabled={isSubmitting || created}
                          className="btn btn-primary mb-3 mr-4"
                        >
                          {isSubmitting ? "Saving…" : "Save site"}
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
        </main>
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
  setLoader,
})(AddSite);
