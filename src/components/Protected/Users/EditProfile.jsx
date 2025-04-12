import React, { Fragment, useEffect, useState } from "react";
import { Box, Autocomplete, TextField } from "@mui/material";
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
import { get } from "../../../api";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import { isAdminLogin } from "../../../utils/isManagerAdminLogin";

const EditProfile = ({
  sites,
  getSites,
  addUser,
  addUserTagSite,
  loggedInUserData,
  setLoggedInUser,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setcompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState();
  const [tagSite, setTagSite] = useState([]);
  const [showSiteTagModal, setShowSiteTagModal] = useState(false);
  const [taggedSites, setTaggedSites] = useState([]);
  const {
    register,
    reset,
    watch,
    formState: { errors },
    handleSubmit,
    getValues,
    setValue,
  } = useForm({});
  const values = watch();
  useEffect(() => {
    const name = loggedInUserData?.name?.split(" ");
    reset({
      ...loggedInUserData,
      firstName: name?.[0] || "",
      lastName: name?.[1] || "",
      isCompany: loggedInUserData?.companyId ? true : false,
    });
    setTagSite(
      loggedInUserData?.taggedSites
        ? loggedInUserData?.taggedSites?.map((itm) => itm?.id)
        : []
    );
    setSelectedCompany(loggedInUserData?.companyId);
    getSites(loggedInUserData);
    getCompanies();
  }, []);
  const getCompanies = async () => {
    const license = JSON.parse(localStorage.getItem("license"));
    const url = "/api/companies/all?licenseId=" + license?.licenseId;
    let response = await get(url);
    response = response.filter((r) => r !== null);
    setcompanies(response);
  };
  const getSelectedTagValue = () => {
    const selectedSites = tagSite;
    const arr = [];
    if (selectedSites) {
      for (const iterator of selectedSites) {
        const selectedValue =
          sites.find((itm) => itm.siteId == iterator) || null;
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
    formJson.company = selectedCompany;
    const data = {
      userId: loggedInUserData?.id,
      firstName: formJson?.firstName || null,
      lastName: formJson?.lastName || null,
      email: formJson?.email || null,
      phone: Number(formJson?.phone) || null,
      role: formJson?.role || null,
      userType: formJson?.userType || null,
      defaultSiteId:
        formJson?.userType === "Internal"
          ? loggedInUserData?.defaultSiteId
          : null,
      companyId: formJson?.company || null,
      trade: formJson?.userType === "External" ? formJson?.trade : null,
      gasSafetyRegNo: formJson?.gasSafetyRegNo || "",
      status: formJson?.status || null,
    };
    setIsLoading(true);
    try {
      const res = await addUser(data);
      if (res.id) {
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
        const tagRes = await addUserTagSite(data?.userId, tagSiteValue);
        toast.success(
          `${formJson?.firstName} user has been updated successfully.`
        );
        const res = await get(`/api/user/${data?.userId}/details`);
        setLoggedInUser(res);
      } else {
        toast.error(
          `Something went wrong while updating ${formJson?.firstName}.`
        );
      }
      setIsLoading(false);
    } catch (e) {
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
  return (
    <React.Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <form onSubmit={handleSubmit(submitUser)}>
          <div className="container-fluid">
            <BreadCrumHeader
              header={`Edit ${loggedInUserData?.name} Profile`}
              page={"Edit Profile"}
            />
            {!isLoading && (
              <Fragment>
                <div className="row">
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="firstName">First Name</label>
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
                  </div>
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="lastName">Last Name</label>
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
                  </div>
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="email">Email ID</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
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
                  </div>
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="phone">Phone Number</label>
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
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="role">Role</label>
                      <select
                        {...register("role", {
                          required: {
                            value: true,
                            message: `Please select role.`,
                          },
                        })}
                        className="form-control form-select"
                      >
                        <option value={""} disabled selected>
                          Select Action Manager
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
                  </div>
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="userType">Internal/External</label>
                      <select
                        id="userType"
                        name="userType"
                        {...register("userType", {
                          required: {
                            value: true,
                            message: `Please select user type.`,
                          },
                        })}
                        className="form-control form-select"
                      >
                        <option value={"Internal"}>Internal</option>
                        <option value={"External"}>External</option>
                      </select>
                      {errors?.userType && (
                        <InputError
                          message={errors?.userType?.message}
                          key={errors?.userType?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="tagSite">Tag Site</label>
                      <Autocomplete
                        multiple
                        value={getSelectedTagValue()}
                        onChange={(event, newValue) => {
                          const keys = newValue?.map((itm) => itm?.key);
                          setTagSite(keys);
                        }}
                        options={sites?.map((option) => {
                          return {
                            key: option.siteId,
                            label: option.siteName,
                          };
                        })}
                        getOptionLabel={(option) => option.label || ""}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Tag Site"
                            placeholder="Tag Site"
                          />
                        )}
                      />
                    </div>
                  </div>
                  <div className="col-md-4 mt-4">
                    <div className="form-check form-switch">
                      <label
                        className="form-check-label pt-4"
                        htmlFor="flexSwitchCheckChecked"
                      >
                        Is Company?
                      </label>
                      <input
                        className="mt-4 form-check-input"
                        type="checkbox"
                        id="isCompany"
                        name="isCompany"
                        {...register("isCompany")}
                        onChange={(e) => {
                          const isChecked = e.target.checked;

                          // Update form state immediately
                          setValue("isCompany", isChecked);

                          // Clear selected company if unchecked
                          if (!isChecked) {
                            setSelectedCompany(null);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Conditionally render the Autocomplete only if the checkbox is checked */}
                  {watch("isCompany") && (
                    <div className="col-md-4 mt-4">
                      <div className="form-group">
                        <label htmlFor="company">Company Name</label>
                        <Autocomplete
                          id="leadUserID"
                          onChange={(event, item) => {
                            setSelectedCompany(item?.key); // Set selected company
                          }}
                          value={getSelectedValue()}
                          options={companies?.map((option) => {
                            return {
                              key: option.companyId,
                              label: option.companyName,
                            };
                          })}
                          getOptionLabel={(option) => option.label}
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
                    </div>
                  )}
                  {values?.userType === "External" && (
                    <div className="col-md-4 mt-4">
                      <div className="form-group">
                        <label for="trade">Trade (if external)</label>
                        <select
                          id="trade"
                          name="trade"
                          {...register("trade")}
                          className="form-control form-select"
                        >
                          <option value={""} selected>
                            NA
                          </option>
                          <option value={"Electrician"}>Electrician</option>
                          <option value={"Gas Engineer"}>Gas Engineer</option>
                          <option value={"Asbestos Surveyor"}>
                            Asbestos Surveyor
                          </option>
                          <option value={"AC Engineer"}>AC Engineer</option>
                          <option value={"Fire Door Install"}>
                            Fire Door Install
                          </option>
                          <option value={"General Company"}>
                            General Company
                          </option>
                          <option value={"Life Maintenance"}>
                            Life Maintenance
                          </option>
                          <option value={"Plumber"}>Plumber</option>
                          <option value={"Auto Door Maintanance"}>
                            Auto Door Maintanance
                          </option>
                          <option value={"Refuse Collector"}>
                            Refuse Collector
                          </option>
                          <option value={"Fire Alarm"}>Fire Alarm</option>
                        </select>
                      </div>
                    </div>
                  )}
                  {tagSite && (
                    <div className="col-md-4 mt-4">
                      <div className="form-group">
                        <div>
                          {tagSite?.length > 3 && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-light text-primary"
                                onClick={() => {
                                  setTaggedSites(
                                    tagSite?.map(
                                      (itm) =>
                                        sites?.filter(
                                          (site) => site?.siteId == itm
                                        )?.[0]?.siteName
                                    )
                                  );
                                  setShowSiteTagModal(true);
                                }}
                              >
                                {tagSite?.length} Site Tagged
                              </button>
                            </>
                          )}
                          {tagSite?.length < 4 &&
                            tagSite?.map((itm) => {
                              return (
                                <button className="btn btn-sm btn-light text-primary">
                                  {
                                    sites?.filter(
                                      (site) => site?.siteId == itm
                                    )?.[0]?.siteName
                                  }
                                </button>
                              );
                            })}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="col-md-4 mt-4">
                    <div className="form-group">
                      <label for="status">Status</label>
                      <select
                        id="status"
                        name="status"
                        {...register("status", {
                          required: {
                            value: true,
                            message: `Please select user status.`,
                          },
                        })}
                        className="form-control form-select"
                      >
                        <option value={""} disabled selected>
                          Select Status
                        </option>
                        <option value={"Active"}>Active</option>
                        <option value={"Inactive"}>Inactive</option>
                      </select>
                      {errors?.status && (
                        <InputError
                          message={errors?.status?.message}
                          key={errors?.status?.message}
                        />
                      )}
                    </div>
                  </div>
                  {values?.userType === "External" &&
                    values?.trade === "Gas Engineer" && (
                      <div className="col-md-4 mt-2">
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
                      </div>
                    )}
                </div>
              </Fragment>
            )}
            <div className="mt-4 mb-2">
              {isLoading && (
                <Box sx={{ display: "flex" }}>
                  <CircularProgress />
                </Box>
              )}
              {!isLoading && isAdminLogin(loggedInUserData) && (
                <button type="submit" className="btn btn-sm btn-primary mt-4">
                  Save
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
})(EditProfile);
