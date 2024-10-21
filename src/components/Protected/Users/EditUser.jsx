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
import { addUser, addUserTagSite, getSites } from "../../../store/thunk/site";
import { toast } from "react-toastify";
import { InputError } from "../../common/InputError";
import { Validation } from "../../../Constant/Validation";
import { ROLE } from "../../../Constant/Role";
import { get } from "../../../api";
import { MenuProps } from "./AddUser";
import Tooltip from "@mui/material/Tooltip";
import TagSites from "./TagSites";

const ViewUsers = ({
  showEditModal,
  setShowEditModal,
  refresh,
  selectedUser,
  sites,
  getSites,
  addUser,
  addUserTagSite,
  loggedInUserData,
}) => {
  const handleOpen = () => setShowEditModal(true);
  const handleClose = () => setShowEditModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [companies, setcompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState();
  const [tagSite, setTagSite] = useState([]);
  const [showSiteTagModal, setShowSiteTagModal] = useState(false);
  const [taggedSites, setTaggedSites] = useState([]);
  const handleChange = (event) => {
    const {
      target: { value },
    } = event;
    console.log("event", event);
    event?.view?.focus();
    console.log("value", value);
    setTagSite(typeof value ? value : value);
  };
  const {
    register,
    reset,
    watch,
    formState: { errors },
    handleSubmit,
    getValues,
  } = useForm({});
  const values = watch();
  useEffect(() => {
    const name = selectedUser?.name?.split(" ");
    reset({
      ...selectedUser,
      firstName: name?.[0] || "",
      lastName: name?.[1] || "",
      isCompany: selectedUser?.companyId ? true : false,
    });
    console.log("selectedUser", selectedUser);
    setTagSite(
      selectedUser?.taggedSites
        ? selectedUser?.taggedSites?.map((itm) => itm?.id)
        : []
    );
    setSelectedCompany(selectedUser?.companyId);
    getSites(loggedInUserData);
    getCompanies();
  }, []);
  const getCompanies = async () => {
    const url = `/api/companies/all`;
    let response = await get(url);
    response = response.filter((r) => r !== null);
    setcompanies(response);
  };
  const getSelectedTagValue = () => {
    const selectedSites = tagSite;
    const arr = [];
    if(selectedSites) {
      for (const iterator of selectedSites) {
        const selectedValue =
        sites.find((itm) => itm.siteId == iterator) ||
        null;
        if (selectedValue) {
          arr.push({ key: selectedValue?.siteId, label: selectedValue?.siteName });
        }
      }
    }
    return arr;
  };
  const submitUser = async (formJson) => {
    formJson.company = selectedCompany;
    const data = {
      userId: selectedUser?.id,
      firstName: formJson?.firstName || "",
      lastName: formJson?.lastName || "",
      email: formJson?.email || "",
      phone: formJson?.phone || "",
      role: formJson?.role || "",
      userType: formJson?.userType || "",
      defaultSiteId:
        formJson?.userType === "Internal" ? selectedUser?.defaultSiteId : "",
      companyId: formJson?.company || "",
      trade: formJson?.userType === "External" ? formJson?.trade : "",
      status: formJson?.status || "",
    };
    setIsLoading(true);
    try {
      const res = await addUser(data);
      if (res.id) {
        const tagSiteValue = {
          addedSites: tagSite,
          removedSites: [],
        };
        if (selectedUser?.taggedSites) {
          for (const iterator of selectedUser?.taggedSites) {
            if (!tagSite?.includes(iterator?.id)) {
              tagSiteValue.removedSites.push(iterator?.id);
            }
          }
        }
        const tagRes = await addUserTagSite(data?.userId, tagSiteValue);
        toast.success(
          `${formJson?.firstName} user has been updated successfully.`
        );
        refresh();
        reset({});
        handleClose();
      } else {
        toast.error(
          `Something went wrong while updating ${formJson?.firstName}.`
        );
      }
      setIsLoading(false);
    } catch (e) {
      console.log(e);
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
      {showSiteTagModal && (
        <TagSites
          taggedSites={taggedSites}
          showSiteTagModal={showSiteTagModal}
          setShowSiteTagModal={setShowSiteTagModal}
        />
      )}
      <Dialog
        open={showEditModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(submitUser)}>
          <DialogTitle>Edit User</DialogTitle>
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
                  {/* <div className="col-md-4">
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
                  </div> */}
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
                        value={getSelectedTagValue()}
                        onChange={(event, newValue) => {
                          const keys = newValue
                            ?.map((itm) => itm?.key);
                            console.log("keys", keys);
                            setTagSite(keys)
                        }}
                        options={sites.filter(s=> {
                          const taggedSits = getSelectedTagValue();
                          const taggedSits2 = taggedSits.map(s => s.siteId);
                          return !taggedSits2.includes(s.siteId)
                        
                        }).map((option) => {
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
                          value={getSelectedValue()}
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
                  {tagSite && (
                    <div className="col-md-4 mt-2">
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
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getSites, addUser, addUserTagSite })(
  ViewUsers
);
