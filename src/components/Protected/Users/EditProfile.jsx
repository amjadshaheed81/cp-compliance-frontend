import React, { Fragment, useEffect, useState } from "react";
import { Autocomplete, TextField } from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import CircularProgress from "@mui/material/CircularProgress";
import {
  addUser,
  addUserTagSite,
  getSites,
  setLoggedInUser,
} from "../../../store/thunk/site";
import { toast } from "react-toastify";
import { InputError } from "../../common/InputError";
import { Validation } from "../../../Constant/Validation";
import { ROLE } from "../../../Constant/Role";
import { get, getSasToken, put, uploadProfileSignature } from "../../../api";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import { isAdminLogin } from "../../../utils/isManagerAdminLogin";
import "./EditProfile.css";

const EditProfile = ({
  sites,
  getSites,
  addUser,
  addUserTagSite,
  loggedInUserData,
  setLoggedInUser,
  siteSelectedForGlobal
}) => {

  const [sasToken, setSasToken] = useState();
  const isAdmin = isAdminLogin(loggedInUserData);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setcompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState();
  const [tagSite, setTagSite] = useState([]);
  const {
    register,
    reset,
    watch,
    formState: { errors },
    handleSubmit,
    setValue,
  } = useForm({});
  const values = watch();
  useEffect(() => {
    getToken();
    const name = loggedInUserData?.name?.split(" ");
    reset({
      ...loggedInUserData,
      firstName: name?.[0] || "",
      lastName: name?.[1] || "",
      isCompany: loggedInUserData?.companyId ? true : false,
    });
    if (isAdmin) {
      setTagSite(
        loggedInUserData?.taggedSites
          ? loggedInUserData?.taggedSites?.map((itm) => itm?.id)
          : []
      );
      setSelectedCompany(loggedInUserData?.companyId);
      getSites(loggedInUserData);
      getCompanies();
    }
  }, []);
  const getCompanies = async () => {
    const license = JSON.parse(localStorage.getItem("license"));
    const url = "/api/companies/all?licenseId=" + license?.licenseId;
    let response = await get(url);
    response = response.filter((r) => r !== null);
    setcompanies(response);
  };

  

  const getToken = async () => {
    const token = await getSasToken();
    setSasToken(token);
  };

  const getSelectedTagValue = () => {
    const selectedSites = tagSite;
    const arr = [];
    if (selectedSites) {
      for (const iterator of selectedSites) {
        const selectedValue =
          (sites || []).find((itm) => String(itm.siteId) === String(iterator)) || null;
        if (selectedValue) {
          arr.push({
            key: selectedValue?.siteId,
            label: selectedValue?.siteName,
          });
        }
      }
    }
    return arr;
  };
  const submitUser = async (formJson) => {
    setIsLoading(true);

    try {
      let signature = loggedInUserData?.signature || null;
      const selectedSignatureFile = formJson?.file?.[0];
      if (selectedSignatureFile) {
        const uploadedSignature = await uploadProfileSignature(selectedSignatureFile);
        if (typeof uploadedSignature !== "string" || !uploadedSignature.trim()) {
          throw new Error("Signature upload failed");
        }
        signature = uploadedSignature.split("?")[0];
      }

      if (!isAdmin) {
        const response = await put("/api/user/profile", {
          firstName: formJson?.firstName?.trim(),
          lastName: formJson?.lastName?.trim(),
          phone: formJson?.phone?.trim() || null,
          signature: selectedSignatureFile ? signature : null,
        });
        const updatedUser = response?.data;
        if (!updatedUser?.id) {
          throw new Error("Profile update failed");
        }
        setLoggedInUser(updatedUser);
        toast.success("Your profile has been updated successfully.");
        return;
      }

      const data = {
        userId: loggedInUserData?.id,
        firstName: formJson?.firstName || null,
        lastName: formJson?.lastName || null,
        // Login email is not changed from the self-profile page.
        email: loggedInUserData?.email || null,
        phone: formJson?.phone?.trim() || null,
        role: formJson?.role || null,
        userType: formJson?.userType || null,
        defaultSiteId:
          formJson?.userType === "Internal"
            ? loggedInUserData?.defaultSiteId
            : null,
        companyId: selectedCompany || null,
        trade: formJson?.userType === "External" ? formJson?.trade : null,
        gasSafetyRegNo: formJson?.gasSafetyRegNo || "",
        status: formJson?.status || null,
        licenseId: loggedInUserData?.licenseId,
        siteId: siteSelectedForGlobal?.siteId,
        signature,
      };

      const res = await addUser(data);
      if (!res?.id) {
        throw new Error(typeof res === "string" ? res : "Profile update failed");
      }

      const tagSiteValue = {
        addedSites: tagSite,
        removedSites: [],
      };
      if (loggedInUserData?.taggedSites) {
        for (const iterator of loggedInUserData?.taggedSites) {
          if (!tagSite?.includes(iterator?.id)) {
            tagSiteValue.removedSites.push(iterator?.id);
          }
        }
      }
      await addUserTagSite(data?.userId, tagSiteValue);
      const refreshedUser = await get(`/api/user/${data?.userId}/details`);
      setLoggedInUser(refreshedUser);
      toast.success(`${formJson?.firstName} user has been updated successfully.`);
    } catch (e) {
      toast.error(
        e?.response?.data?.message ||
          e?.message ||
          "Something went wrong while updating your profile."
      );
    } finally {
      setIsLoading(false);
    }
  };
  const getSelectedValue = () => {
    const selectedValue =
      companies.find((itm) => itm.companyId === selectedCompany) || null;
    if (selectedValue) {
      return {
        key: selectedValue?.companyId,
        label: selectedValue?.companyName,
      };
    }
    return null;
  };
  const selectedTagSites = getSelectedTagValue();

  const removeTaggedSite = (siteId) => {
    setTagSite((currentSites) =>
      currentSites.filter((id) => String(id) !== String(siteId))
    );
  };

  return (
    <React.Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <form onSubmit={handleSubmit(submitUser)}>
          <div className="container-fluid profile-page">
            <BreadCrumHeader
              header={`Edit ${loggedInUserData?.name} Profile`}
              page={"Edit Profile"}
            />

            {isLoading ? (
              <div className="profile-loading">
                <CircularProgress />
              </div>
            ) : (
              <Fragment>
                <section className="profile-section">
                  <div className="profile-section-heading">
                    <h5 className="profile-section-title">Personal Details</h5>
                    <p className="profile-section-description">
                      Update your contact details. Your login email cannot be changed here.
                    </p>
                  </div>

                  <div className="profile-grid">
                    <div className="form-group">
                      <label htmlFor="firstName">First Name</label>
                      <input
                        type="text"
                        autoComplete="off"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute("readonly")}
                        className="form-control"
                        id="firstName"
                        {...register("firstName", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} first name`,
                          },
                        })}
                      />
                      {errors?.firstName && (
                        <InputError
                          message={errors?.firstName?.message}
                          key={errors?.firstName?.message}
                        />
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
                      <input
                        type="text"
                        autoComplete="off"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute("readonly")}
                        className="form-control"
                        id="lastName"
                        {...register("lastName")}
                      />
                    </div>

                    <div className="form-group">
                      <label htmlFor="email">Email ID</label>
                      <input
                        type="email"
                        className="form-control profile-readonly"
                        id="email"
                        readOnly
                        {...register("email", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} email`,
                          },
                        })}
                      />
                      {errors?.email && (
                        <InputError
                          message={errors?.email?.message}
                          key={errors?.email?.message}
                        />
                      )}
                    </div>

                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
                      <input
                        type="tel"
                        maxLength={11}
                        className="form-control"
                        id="phone"
                        {...register("phone", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} phone`,
                          },
                          pattern: {
                            value: /^[0-9]+$/,
                            message: "Please enter a number",
                          },
                        })}
                      />
                      {errors?.phone && (
                        <InputError
                          message={errors?.phone?.message}
                          key={errors?.phone?.message}
                        />
                      )}
                    </div>
                  </div>
                </section>

                {isAdmin && (
                  <Fragment>
                    <section className="profile-section">
                      <div className="profile-section-heading">
                        <h5 className="profile-section-title">Administration</h5>
                        <p className="profile-section-description">
                          Role, access and organisation settings are Admin only.
                        </p>
                      </div>

                      <div className="profile-grid">
                        <div className="form-group">
                          <label htmlFor="role">Role</label>
                          <select
                            id="role"
                            {...register("role", {
                              required: {
                                value: true,
                                message: "Please select role.",
                              },
                            })}
                            className="form-control form-select"
                          >
                            <option value="" disabled>
                              Select Role
                            </option>
                            <option value={ROLE.ADMIN}>Admin</option>
                            <option value={ROLE.MANAGER}>Property Manager</option>
                            <option value={ROLE.SITE_ACTION_MANAGER}>
                              Site Action Manager
                            </option>
                            <option value={ROLE.SITE_USERS}>Site Users</option>
                            <option value={ROLE.CARE_TAKER}>Caretaker</option>
                            <option value={ROLE.CONTRACTOR}>Contractor</option>
                            <option value={ROLE.SURVEYOR}>Surveyor</option>
                            <option value={ROLE.TRADESMAN}>Tradesman</option>
                            <option value={ROLE.TESTER}>Tester</option>
                          </select>
                          {errors?.role && (
                            <InputError
                              message={errors?.role?.message}
                              key={errors?.role?.message}
                            />
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="userType">Internal/External</label>
                          <select
                            id="userType"
                            name="userType"
                            {...register("userType", {
                              required: {
                                value: true,
                                message: "Please select user type.",
                              },
                            })}
                            className="form-control form-select"
                          >
                            <option value="Internal">Internal</option>
                            <option value="External">External</option>
                          </select>
                          {errors?.userType && (
                            <InputError
                              message={errors?.userType?.message}
                              key={errors?.userType?.message}
                            />
                          )}
                        </div>

                        <div className="form-group">
                          <label htmlFor="status">Status</label>
                          <select
                            id="status"
                            name="status"
                            {...register("status", {
                              required: {
                                value: true,
                                message: "Please select user status.",
                              },
                            })}
                            className="form-control form-select"
                          >
                            <option value="" disabled>
                              Select Status
                            </option>
                            <option value="Active">Active</option>
                            <option value="Inactive">Inactive</option>
                          </select>
                          {errors?.status && (
                            <InputError
                              message={errors?.status?.message}
                              key={errors?.status?.message}
                            />
                          )}
                        </div>

                        <div className="profile-switch-field">
                          <label className="profile-switch-label" htmlFor="isCompany">
                            Is Company?
                          </label>
                          <div className="form-check form-switch profile-switch">
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="isCompany"
                              name="isCompany"
                              {...register("isCompany")}
                              onChange={(e) => {
                                const isChecked = e.target.checked;
                                setValue("isCompany", isChecked);
                                if (!isChecked) {
                                  setSelectedCompany(null);
                                }
                              }}
                            />
                            <label className="form-check-label" htmlFor="isCompany">
                              {values?.isCompany ? "Yes" : "No"}
                            </label>
                          </div>
                        </div>

                        {watch("isCompany") && (
                          <div className="form-group">
                            <label htmlFor="company">Company Name</label>
                            <Autocomplete
                              id="company"
                              onChange={(event, item) => {
                                setSelectedCompany(item?.key);
                              }}
                              value={getSelectedValue()}
                              options={companies?.map((option) => ({
                                key: option.companyId,
                                label: option.companyName,
                              }))}
                              getOptionLabel={(option) => option?.label || ""}
                              isOptionEqualToValue={(option, value) =>
                                String(option?.key) === String(value?.key)
                              }
                              renderInput={(params) => (
                                <div ref={params.InputProps.ref}>
                                  <input
                                    type="text"
                                    autoComplete="off"
                                    readOnly
                                    onFocus={(e) =>
                                      e.target.removeAttribute("readonly")
                                    }
                                    {...params.inputProps}
                                    className="form-control"
                                    placeholder="Select Company"
                                  />
                                </div>
                              )}
                            />
                          </div>
                        )}

                        {values?.userType === "External" && (
                          <div className="form-group">
                            <label htmlFor="trade">Trade (if external)</label>
                            <select
                              id="trade"
                              name="trade"
                              {...register("trade")}
                              className="form-control form-select"
                            >
                              <option value="">NA</option>
                              <option value="Electrician">Electrician</option>
                              <option value="Gas Engineer">Gas Engineer</option>
                              <option value="Asbestos Surveyor">
                                Asbestos Surveyor
                              </option>
                              <option value="AC Engineer">AC Engineer</option>
                              <option value="Fire Door Install">
                                Fire Door Install
                              </option>
                              <option value="General Company">General Company</option>
                              <option value="Life Maintenance">Life Maintenance</option>
                              <option value="Plumber">Plumber</option>
                              <option value="Auto Door Maintanance">
                                Auto Door Maintanance
                              </option>
                              <option value="Refuse Collector">Refuse Collector</option>
                              <option value="Fire Alarm">Fire Alarm</option>
                            </select>
                          </div>
                        )}

                        {values?.userType === "External" &&
                          values?.trade === "Gas Engineer" && (
                            <div className="form-group">
                              <label htmlFor="gasSafetyRegNo">
                                Gas Safety Reg No.*
                              </label>
                              <input
                                type="text"
                                min={0}
                                className="form-control"
                                id="gasSafetyRegNo"
                                {...register("gasSafetyRegNo", {
                                  required: {
                                    value:
                                      values?.userType === "External" &&
                                      values?.trade === "Gas Engineer",
                                    message:
                                      "Gas Safety Registration Number is required",
                                  },
                                })}
                              />
                              {errors?.gasSafetyRegNo && (
                                <InputError
                                  message={errors?.gasSafetyRegNo?.message}
                                  key={errors?.gasSafetyRegNo?.message}
                                />
                              )}
                            </div>
                          )}
                      </div>
                    </section>

                    <section className="profile-section">
                      <div className="profile-section-heading profile-section-heading-inline">
                        <div>
                          <h5 className="profile-section-title">Tagged Sites</h5>
                          <p className="profile-section-description">
                            Search for a site to add it. Tagged sites are shown below in one list.
                          </p>
                        </div>
                        <span className="profile-site-count">
                          {selectedTagSites.length} tagged
                        </span>
                      </div>

                      <div className="profile-tagged-sites">
                        <Autocomplete
                          multiple
                          disableCloseOnSelect
                          disableClearable
                          filterSelectedOptions
                          value={selectedTagSites}
                          onChange={(event, newValue) => {
                            setTagSite(newValue?.map((item) => item?.key) || []);
                          }}
                          options={(sites || []).map((option) => ({
                            key: option.siteId,
                            label: option.siteName,
                          }))}
                          getOptionLabel={(option) => option?.label || ""}
                          isOptionEqualToValue={(option, value) =>
                            String(option?.key) === String(value?.key)
                          }
                          renderTags={() => null}
                          renderInput={(params) => (
                            <TextField
                              {...params}
                              size="small"
                              placeholder="Search and add a site"
                            />
                          )}
                        />

                        <div className="profile-tag-list">
                          {selectedTagSites.length > 0 ? (
                            selectedTagSites.map((site) => (
                              <div className="profile-tag-row" key={site.key}>
                                <span>{site.label}</span>
                                <button
                                  type="button"
                                  className="profile-tag-remove"
                                  aria-label={`Remove ${site.label}`}
                                  title={`Remove ${site.label}`}
                                  onClick={() => removeTaggedSite(site.key)}
                                >
                                  ×
                                </button>
                              </div>
                            ))
                          ) : (
                            <div className="profile-tag-empty">No sites tagged.</div>
                          )}
                        </div>
                      </div>
                    </section>
                  </Fragment>
                )}

                <section className="profile-section">
                  <div className="profile-section-heading">
                    <h5 className="profile-section-title">Engineer Signature</h5>
                    <p className="profile-section-description">
                      This signature is used on Site Check forms and supported PDF certificates.
                    </p>
                  </div>

                  <div className="profile-signature-layout">
                    <div className="profile-signature-preview">
                      {loggedInUserData?.signature ? (
                        <img
                          onClick={() => {
                            window.open(
                              loggedInUserData?.signature + "?" + sasToken,
                              "_blank"
                            );
                          }}
                          src={loggedInUserData?.signature + "?" + sasToken}
                          alt="Current signature"
                        />
                      ) : (
                        <span>No signature uploaded yet</span>
                      )}
                    </div>

                    <div className="profile-signature-upload">
                      <label htmlFor="file" className="profile-upload-label">
                        {loggedInUserData?.signature
                          ? "Replace signature"
                          : "Upload signature"}
                      </label>
                      <input
                        type="file"
                        {...register("file")}
                        className="form-control"
                        name="file"
                        accept="image/png,image/jpeg,image/jpg"
                        id="file"
                      />
                      <small className="text-muted">
                        PNG or JPG image, maximum 5 MB.
                      </small>
                    </div>
                  </div>
                </section>

                <div className="profile-actions">
                  <button type="submit" className="btn btn-primary">
                    Save Profile
                  </button>
                </div>
              </Fragment>
            )}
          </div>
        </form>
      </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,

  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
})(EditProfile);
