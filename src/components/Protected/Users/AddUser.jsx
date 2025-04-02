import React, { Fragment, useEffect, useState } from "react";
import {
  Button,
  Box,
  Autocomplete,
  Select,
  OutlinedInput,
  MenuItem,
  Checkbox,
  ListItemText,
  TextField,
} from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { getSites, addUser, addUserTagSite } from "../../../store/thunk/site";
import { get } from "../../../api";
import { toast } from "react-toastify";
import { Validation } from "../../../Constant/Validation";
import { InputError } from "../../common/InputError";
import { ROLE } from "../../../Constant/Role";
import Tooltip from "@mui/material/Tooltip";
import TagSites from "./TagSites";

export const ITEM_HEIGHT = 48;
export const ITEM_PADDING_TOP = 8;
export const MenuProps = {
  PaperProps: {
    style: {
      maxHeight: ITEM_HEIGHT * 4.5 + ITEM_PADDING_TOP,
    },
  },
};

const AddUser = ({
  showAddModal,
  setShowAddModal,
  refresh,
  selectedUser,
  getSites,
  sites,
  addUser,
  siteSelectedForGlobal,
  addUserTagSite,
  loggedInUserData,
}) => {
  const handleOpen = () => setShowAddModal(true);
  const handleClose = () => setShowAddModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setcompanies] = useState([]);
  const [tagSite, setTagSite] = useState([]);
  const [showSiteTagModal, setShowSiteTagModal] = useState(false);
  // const [taggedSites, setTaggedSites] = useState([]);
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    event?.view?.focus();
    setTagSite(typeof value ? value : value);
  };
  const [selectedCompany, setSelectedCompany] = useState();
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
    reset(selectedUser);
    getSites(loggedInUserData);
    getCompanies();
  }, []);

  const getCompanies = async () => {
    const license = JSON.parse(localStorage.getItem('license'));
    const url = "/api/companies/all?licenseId="+license?.licenseId;
    
    let response = await get(url);
    response = response.filter((r) => r !== null);
    setcompanies(response);
  };
  const submitUser = async (formJson) => {
    formJson.company = selectedCompany;
    const data = {
      userId: null,
      firstName: formJson?.firstName || "",
      lastName: formJson?.lastName || "",
      email: formJson?.email ? String(formJson?.email).toLowerCase() : "",
      password: formJson?.password || "",
      phone: formJson?.phone || "",
      role: formJson?.role || "",
      userType: formJson?.userType || "",
      defaultSiteId:
        formJson?.userType === "Internal"
          ? siteSelectedForGlobal?.siteId
          : "",
      companyId: formJson?.company || "",
      trade: formJson?.userType === "External" ? formJson?.trade : "",
      status: formJson?.status || "",
      licenseId: loggedInUserData?.licenseId
    };
    setIsLoading(true);
    try {
      const res = await addUser(data);
      if (res?.id) {
        const tagSiteArray = {
          addedSites: tagSite,
          removedSites: [],
        };
        const tagRes = await addUserTagSite(res?.id, tagSiteArray);
        toast.success(`${formJson?.firstName} has been added successfully.`);
        refresh();
        reset({});
        handleClose();
        setIsLoading(false);
        return;
      } else {
        if (res?.includes("User Email Already Registered")) {
          toast.error(
            "User Email Already Registered. Please try again with new email address."
          );
          setIsLoading(false);
          return;
        } else {
          toast.error(
            `Something went wrong while adding ${formJson?.firstName}.`
          );
          setIsLoading(false);
        }
      }
      setIsLoading(false);
    } catch (e) {
      setIsLoading(false);
    }
  };

  const handleTagSiteChange = (event, newValue) => {
    const isSelectAllSelected = newValue.some(
      (option) => option.key === "select-all"
    );

    if (isSelectAllSelected) {
      // If "Select All" is selected, include all options except "Select All"
      const allOptions = sites?.map((site) => ({
        key: site.siteId,
        label: site.siteName,
      }));

      setTagSite(allOptions?.map((opt) => opt.key)); // Store keys
    } else {
      // Otherwise, update normally
      const keys = newValue?.map((item) => item.key);
      setTagSite(keys);
    }
  };
  const options = [
    { key: "select-all", label: "Select All" },
    ...sites.map((option) => ({
      key: option.siteId,
      label: option.siteName,
    })),
  ];
  const getSiteName = (siteId) => {
    const filters = sites.filter(s=> s.siteId === siteId);
    if(filters.length) {
      return `${filters[0].siteName}`
    }
    return '';
  }
  return (
    <React.Fragment>
      {showSiteTagModal && (
        <TagSites
          isUserModal={true}
          setTagSite={setTagSite}
          getSiteName={getSiteName}
          taggedSites={tagSite}
          showSiteTagModal={showSiteTagModal}
          setShowSiteTagModal={setShowSiteTagModal}
        />
      )}
      <Dialog open={showAddModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(submitUser)}>
          <DialogTitle>Add User</DialogTitle>
          <DialogContent dividers>
            {isLoading && (
              <Box sx={{ display: "flex" }}>
                <CircularProgress />
              </Box>
            )}
            {!isLoading && (
              <Fragment>
                <div className="row">
                  <div className="col-md-4">
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
                  <div className="col-md-4">
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
                  <div className="col-md-4">
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
                  <div className="col-md-4">
                    <div className="form-group">
                      <label for="password">Password</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        {...register("password", {
                          required: {
                            value: true,
                            message: `${Validation.REQUIRED} password`,
                          },
                        })}
                      />
                      {errors?.password && (
                        <InputError
                          message={errors?.password?.message}
                          key={errors?.password?.message}
                        />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="phone">Phone Number</label>
                      <input
                        type="tel"
                        maxLength={11}
                        className="form-control"
                        id="phone"
                        {...register("phone")}
                      />
                    </div>
                  </div>
                  <div className="col-md-4 mt-2">
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
                  <div className="col-md-4 mt-2">
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
                        <option value={""} selected disabled>
                          Select Internal/External
                        </option>
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
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label for="tagSite">Tag Site</label>
                      <Autocomplete
                        multiple
                        onChange={handleTagSiteChange}
                        // onChange={(event, newValue) => {
                        //   const keys = newValue
                        //     ?.map((itm) => itm?.key);
                        //     setTagSite(keys)
                        // }}
                        options={options}
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

                  <div className="col-md-4 mt-2">
                    <div className="form-check form-switch">
                      <label
                        className="form-check-label pt-4"
                        for="flexSwitchCheckChecked"
                      >
                        Is Company ?
                      </label>
                      <input
                        className="mt-4 form-check-input"
                        type="checkbox"
                        id="isCompany"
                        name="isCompany"
                        {...register("isCompany")}
                      />
                    </div>
                  </div>
                  {values?.isCompany && (
                    <div className="col-md-4 mt-2">
                      <div className="form-group">
                        <label for="company">Company Name</label>
                        <Autocomplete
                          id="leadUserID"
                          onChange={(event, item) => {
                            setSelectedCompany(item?.key);
                          }}
                          options={companies.map((option) => {
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
          onFocus={(e) => e.target.removeAttribute("readonly")}
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
                    <div className="col-md-4 mt-2">
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
                  {tagSite?.length > 0 && (
                    <div className="col-md-4 mt-2">
                      <div className="form-group">
                        <label for="trade">Selected Sites</label>
                        <div>
                          {tagSite?.length > 3 && (
                            <>
                              <button
                                type="button"
                                className="btn btn-sm btn-light text-primary"
                                onClick={() => {
                                  // setTaggedSites(
                                  //   tagSite?.map(
                                  //     (itm) =>
                                  //       sites?.filter(
                                  //         (site) => site?.siteId == itm
                                  //       )?.[0]?.siteName
                                  //   )
                                  // );
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
                  <div className="col-md-4 mt-2">
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
                </div>
              </Fragment>
            )}
          </DialogContent>
          {!isLoading && (
            <DialogActions>
              <Button onClick={handleClose} className="bg-light text-primary">
                Close
              </Button>
              <Button type="submit" className="bg-primary text-white">
                Save
              </Button>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getSites, addUser, addUserTagSite })(
  AddUser
);
