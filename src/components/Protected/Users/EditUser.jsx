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

// Site Selection Dialog Component (same as in AddUser)
const SiteSelectionDialog = ({
  open,
  onClose,
  sites,
  selectedSites,
  onSave,
}) => {
  const [tempSelectedSites, setTempSelectedSites] = useState([]);

  useEffect(() => {
    if (open) {
      setTempSelectedSites(selectedSites);
    }
  }, [open]);

  const handleToggleSite = (siteId) => {
    setTempSelectedSites((prev) =>
      prev.includes(siteId)
        ? prev.filter((id) => id !== siteId)
        : [...prev, siteId]
    );
  };

  const handleSelectAll = () => {
    if (tempSelectedSites.length === sites.length) {
      setTempSelectedSites([]);
    } else {
      setTempSelectedSites(sites.map((site) => site.siteId));
    }
  };

  const handleSave = () => {
    onSave(tempSelectedSites);
    onClose();
  };

  const allSelected =
    sites.length > 0 && tempSelectedSites.length === sites.length;

  const selectedSet = new Set(tempSelectedSites);

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle
        sx={{ color: "black", textTransform: "none", fontWeight: "normal" }}
      >
        Select Sites
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ maxHeight: 400, overflow: "auto" }}>
          <MenuItem onClick={handleSelectAll}>
            <Checkbox checked={allSelected} />
            <ListItemText
              primary={`${allSelected ? "Deselect All" : "Select All"}`}
            />
          </MenuItem>

          {sites.map((site) => (
            <MenuItem
              key={site.siteId}
              onClick={() => handleToggleSite(site.siteId)}
              sx={{ pl: 4 }}
            >
              <Checkbox checked={selectedSet.has(site.siteId)} />
              <ListItemText primary={site.siteName} />
            </MenuItem>
          ))}
        </Box>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleSave} color="primary">
          Save
        </Button>
      </DialogActions>
    </Dialog>
  );
};

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
  const handleClose = () => {
    setShowEditModal(false);
    reset();
    setTagSite([]);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [companies, setcompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState();
  const [tagSite, setTagSite] = useState([]);
  const [showSiteSelection, setShowSiteSelection] = useState(false);

  const getSiteName = (siteId) => {
    const site = sites.find((s) => s.siteId === siteId);
    return site ? site.siteName : "";
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
      gasSafetyRegNo: selectedUser?.gasSafetyRegNo || "",
    });
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
    const license = JSON.parse(localStorage.getItem("license"));
    const url = "/api/companies/all?licenseId=" + license?.licenseId;
    let response = await get(url);
    response = response.filter((r) => r !== null);
    setcompanies(response);
  };

  const handleOpenSiteSelection = () => {
    setShowSiteSelection(true);
  };

  const handleSaveSelectedSites = (selectedSites) => {
    setTagSite(selectedSites);
  };

  const submitUser = async (formJson) => {
    formJson.company = selectedCompany;
    const data = {
      userId: selectedUser?.id,
      firstName: formJson?.firstName || "",
      lastName: formJson?.lastName || "",
      email: formJson?.email ? String(formJson?.email).toLowerCase() : "",
      phone: formJson?.phone || "",
      role: formJson?.role || "",
      userType: formJson?.userType || "",
      defaultSiteId:
        formJson?.userType === "Internal" ? selectedUser?.defaultSiteId : "",
      companyId: formJson?.company || "",
      trade: formJson?.userType === "External" ? formJson?.trade : "",
      status: formJson?.status || "",
      //f gas Id
      gasSafetyRegNo: formJson?.gasSafetyRegNo || "",
      licenseId: loggedInUserData?.licenseId,
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
      <SiteSelectionDialog
        open={showSiteSelection}
        onClose={() => setShowSiteSelection(false)}
        sites={sites}
        selectedSites={tagSite}
        onSave={handleSaveSelectedSites}
      />

      <Dialog
        open={showEditModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleSubmit(submitUser)}>
          <DialogTitle>Edit User</DialogTitle>
          <DialogContent dividers>
            {isLoading ? (
              <Box sx={{ display: "flex", justifyContent: "center", p: 4 }}>
                <CircularProgress />
              </Box>
            ) : (
              <Fragment>
                <div className="row">
                  <div className="col-md-4">
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
                  </div>
                  <div className="col-md-4">
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
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="email">Email ID</label>
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
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label htmlFor="phone">Phone Number</label>
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
                      <label htmlFor="role">Role</label>
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
                      <label htmlFor="userType">Internal/External</label>
                      <select
                        id="userType"
                        className="form-control form-select"
                        {...register("userType", {
                          required: {
                            value: true,
                            message: `Please select user type.`,
                          },
                        })}
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

                  {values?.isCompany && (
                    <div className="col-md-4 mt-2">
                      <div className="form-group">
                        <label>Company Name</label>
                        <Autocomplete
                          id="leadUserID"
                          onChange={(event, item) => {
                            setSelectedCompany(item?.key);
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
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label>Tag Sites</label>
                      <div>
                        <Button
                          variant="outlined"
                          fullWidth
                          sx={{
                            color: "#808080",
                            borderColor: "#d1d1d1",
                            textTransform: "none",
                            fontWeight: 400,
                            fontSize: "1rem",
                            "&:hover": {
                              borderColor: "#d1d1d1",
                              backgroundColor: "#f9f9f9",
                            },
                          }}
                          onClick={handleOpenSiteSelection}
                        >
                          {tagSite.length > 0
                            ? `${tagSite.length} Site(s) Selected`
                            : "Select Sites"}
                        </Button>
                      </div>
                      {tagSite.length > 0 && (
                        <Box mt={1} sx={{ maxHeight: 100, overflow: "auto" }}>
                          {tagSite.map((siteId) => (
                            <Box
                              key={siteId}
                              sx={{ display: "flex", alignItems: "center" }}
                            >
                              <Checkbox checked disabled size="small" />
                              <span>{getSiteName(siteId)}</span>
                            </Box>
                          ))}
                        </Box>
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 mt-2">
                    <div className="form-check form-switch">
                      <label className="form-check-label pt-4">
                        Is Company?
                      </label>
                      <input
                        className="mt-4 form-check-input"
                        type="checkbox"
                        id="isCompany"
                        {...register("isCompany")}
                      />
                    </div>
                  </div>

                  {values?.userType === "External" && (
                    <div className="col-md-4 mt-2">
                      <div className="form-group">
                        <label htmlFor="trade">Trade (if external)</label>
                        <select
                          id="trade"
                          className="form-control form-select"
                          {...register("trade")}
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

                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label htmlFor="status">Status</label>
                      <select
                        id="status"
                        className="form-control form-select"
                        {...register("status", {
                          required: {
                            value: true,
                            message: `Please select user status.`,
                          },
                        })}
                      >
                        <option value={""} disabled selected>
                          Select Status *
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
          </DialogContent>
          {!isLoading && (
            <DialogActions>
              <Button onClick={handleClose} variant="outlined">
                Close
              </Button>
              <Button type="submit" variant="contained" color="primary">
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
