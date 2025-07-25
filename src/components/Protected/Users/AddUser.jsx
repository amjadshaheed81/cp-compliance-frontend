import React, { Fragment, useEffect, useState } from "react";
import {
  Button,
  Box,
  CircularProgress,
  Checkbox,
  ListItemText,
  MenuItem,
} from "@mui/material";
import { connect } from "react-redux";
import { useForm } from "react-hook-form";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { getSites, addUser, addUserTagSite } from "../../../store/thunk/site";
import { get, getSasToken, uploadPhoto, uploadSiteCheckDoc } from "../../../api";
import { toast } from "react-toastify";
import { Validation } from "../../../Constant/Validation";
import { InputError } from "../../common/InputError";
import { ROLE } from "../../../Constant/Role";
import imageCompression from 'browser-image-compression';


// Site Selection Dialog Component
const SiteSelectionDialog = ({
  open,
  onClose,
  sites,
  selectedSites,
  onSave,
}) => {
  const [tempSelectedSites, setTempSelectedSites] = useState([]);
  const [sasToken, setSasToken] = useState(''); // Add this line


  useEffect(() => {
    const fetchSasToken = async () => {
      try {
        const token = await getSasToken();
        setSasToken(token);
      } catch (error) {
        console.error('Failed to fetch SAS token:', error);
      }
    };

    fetchSasToken();
  }, []);

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
  // Calculate if all sites are selected
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
  const handleClose = () => {
    setShowAddModal(false);
    reset();
    setTagSite([]);
    setSignatureUrl(null);
  };

  const [isLoading, setIsLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [tagSite, setTagSite] = useState([]);
  const [showSiteSelection, setShowSiteSelection] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [signatureUrl, setSignatureUrl] = useState(null); // State for signature URL
  const [isUploadingSignature, setIsUploadingSignature] = useState(false); // Loading state for
  const [signatureFile, setSignatureFile] = useState(null);
  const [sasToken, setSasToken] = useState(''); // Add this line



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
    if (showAddModal) {
      reset(selectedUser || {});
      getSites(loggedInUserData);
      getCompanies();
    }
  }, [showAddModal]);

  useEffect(() => {
    const fetchSasToken = async () => {
      try {
        const token = await getSasToken();
        setSasToken(token);
      } catch (error) {
        console.error('Failed to fetch SAS token:', error);
      }
    };

    fetchSasToken();
  }, []);

  const getCompanies = async () => {
    const license = JSON.parse(localStorage.getItem("license"));
    const url = "/api/companies/all?licenseId=" + license?.licenseId;
    let response = await get(url);
    response = response.filter((r) => r !== null);
    setCompanies(response);
  };

  const handleSignatureChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Reject files >2MB
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Signature must be ≤2MB");
      return;
    }

    setIsUploadingSignature(true);

    try {
      let finalFile = file;

      // Compress if >1MB
      if (file.size > 1 * 1024 * 1024) {
        finalFile = await imageCompression(file, {
          maxSizeMB: 1,
          maxWidthOrHeight: 800,
          useWebWorker: true,
          fileType: "image/jpeg",
        });
      }

      // Create temporary URL for preview
      const previewUrl = URL.createObjectURL(finalFile);
      setSignatureUrl(previewUrl);

      // Prepare data for upload
      const uploadData = {
        file: finalFile,
        siteId: loggedInUserData?.licenseId, // Using licenseId as context
        userId: selectedUser?.id,
        type: "user-signature"
      };

      // Upload the file using uploadSiteCheckDoc
      const uploadedUrl = await uploadSiteCheckDoc(uploadData);

      // Store the URL for later use
      setSignatureFile(uploadedUrl);

    } catch (error) {
      console.error("Error uploading signature:", error);
      toast.error("Error uploading signature");
    } finally {
      setIsUploadingSignature(false);
    }
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
        formJson?.userType === "Internal" ? siteSelectedForGlobal?.siteId : "",
      companyId: formJson?.company || "",
      trade: formJson?.userType === "External" ? formJson?.trade : "",
      gasSafetyRegNo: formJson?.gasSafetyRegNo || "",
      status: formJson?.status || "",
      licenseId: loggedInUserData?.licenseId,
      signature: signatureFile || selectedUser?.signature || null, // Send Base64 string
    };

    setIsLoading(true);
    try {
      const res = await addUser(data);
      if (res?.id) {
        const tagSiteArray = {
          addedSites: tagSite,
          removedSites: [],
        };
        await addUserTagSite(res?.id, tagSiteArray);
        toast.success(`${formJson?.firstName} has been added successfully.`);
        refresh();
        handleClose();
      } else if (res?.includes("User Email Already Registered")) {
        toast.error(
          "User Email Already Registered. Please try again with new email address."
        );
      } else {
        toast.error(
          `Something went wrong while adding ${formJson?.firstName}.`
        );
      }
    } catch (e) {
      toast.error("An error occurred while adding the user.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenSiteSelection = () => {
    setShowSiteSelection(true);
  };

  const handleSaveSelectedSites = (selectedSites) => {
    setTagSite(selectedSites);
  };



  const getSiteName = (siteId) => {
    const site = sites.find((s) => s.siteId === siteId);
    return site ? site.siteName : "";
  };

  return (
    <>
      <SiteSelectionDialog
        open={showSiteSelection}
        onClose={() => setShowSiteSelection(false)}
        sites={sites}
        selectedSites={tagSite}
        onSave={handleSaveSelectedSites}
      />

      <Dialog open={showAddModal} onClose={handleClose} maxWidth="sm" fullWidth>
        <form onSubmit={handleSubmit(submitUser)}>
          <DialogTitle>{selectedUser ? "Edit User" : "Add User"}</DialogTitle>
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
                      <label htmlFor="firstName">First Name*</label>
                      <input
                        type="text"
                        className="form-control"
                        id="firstName"
                        {...register("firstName", {
                          required: `${Validation.REQUIRED} first name`,
                        })}
                      />
                      {errors?.firstName && (
                        <InputError message={errors?.firstName?.message} />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="lastName">Last Name</label>
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
                      <label htmlFor="email">Email ID*</label>
                      <input
                        type="email"
                        className="form-control"
                        id="email"
                        {...register("email", {
                          required: `${Validation.REQUIRED} email`,
                        })}
                      />
                      {errors?.email && (
                        <InputError message={errors?.email?.message} />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="form-group">
                      <label htmlFor="password">Password*</label>
                      <input
                        type="password"
                        className="form-control"
                        id="password"
                        {...register("password", {
                          required: `${Validation.REQUIRED} password`,
                        })}
                      />
                      {errors?.password && (
                        <InputError message={errors?.password?.message} />
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
                      <label htmlFor="role">Role*</label>
                      <select
                        {...register("role", {
                          required: "Please select role",
                        })}
                        className="form-control form-select"
                      >
                        <option value="">Select Role</option>
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
                        <InputError message={errors?.role?.message} />
                      )}
                    </div>
                  </div>
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label htmlFor="userType">Internal/External*</label>
                      <select
                        id="userType"
                        className="form-control form-select"
                        {...register("userType", {
                          required: "Please select user type",
                        })}
                      >
                        <option value="">Select Type</option>
                        <option value="Internal">Internal</option>
                        <option value="External">External</option>
                      </select>
                      {errors?.userType && (
                        <InputError message={errors?.userType?.message} />
                      )}
                    </div>
                  </div>
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
                  {/* Add the signature upload section here */}
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label>Upload Signature</label>
                      <div>
                        <input
                            type="file"
                            id="signatureUpload"
                            accept="image/*"
                            style={{ display: 'none' }}
                            onChange={handleSignatureChange}
                        />
                        <label htmlFor="signatureUpload">
                          <Button
                              variant="outlined"
                              component="span"
                              fullWidth
                              disabled={isUploadingSignature}
                              sx={{
                                color: "#808080",
                                borderColor: "#d1d1d1",
                                textTransform: "none",
                                "&:hover": { borderColor: "#d1d1d1" },
                              }}
                          >
                            {isUploadingSignature ? (
                                <CircularProgress size={24} />
                            ) : signatureUrl ? (
                                "Signature Uploaded"
                            ) : (
                                "Upload Signature (Max 2MB)"
                            )}
                          </Button>
                        </label>
                      </div>
                      {signatureUrl && (
                          <Box mt={1}>
                            <img
                              src={`${signatureUrl}?${sasToken}`}
                                alt="Signature Preview"
                                style={{
                                  maxWidth: '100%',
                                  maxHeight: '100px',
                                  border: '1px solid #ddd'
                                }}
                            />
                            <Box fontSize={12} color="text.secondary" mt={0.5}>
                              {signatureFile?.length && `Size: ${Math.round(signatureFile.length / 1024)}KB`}
                            </Box>
                          </Box>
                      )}
                    </div>
                  </div>
                  {values?.isCompany && (
                    <div className="col-md-4 mt-2">
                      <div className="form-group">
                        <label>Company Name</label>
                        <select
                          className="form-control form-select"
                          onChange={(e) => setSelectedCompany(e.target.value)}
                          value={selectedCompany || ""}
                        >
                          <option value="">Select Company</option>
                          {companies.map((company) => (
                            <option
                              key={company.companyId}
                              value={company.companyId}
                            >
                              {company.companyName}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                  {values?.userType === "External" && (
                    <div className="col-md-4 mt-2">
                      <div className="form-group">
                        <label htmlFor="trade">Trade (if external)</label>
                        <select
                          id="trade"
                          className="form-control form-select"
                          {...register("trade")}
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
                          <option value="General Company">
                            General Company
                          </option>
                          <option value="Life Maintenance">
                            Life Maintenance
                          </option>
                          <option value="Plumber">Plumber</option>
                          <option value="Auto Door Maintanance">
                            Auto Door Maintanance
                          </option>
                          <option value="Refuse Collector">
                            Refuse Collector
                          </option>
                          <option value="Fire Alarm">Fire Alarm</option>
                        </select>
                      </div>
                    </div>
                  )}
                  <div className="col-md-4 mt-2">
                    <div className="form-group">
                      <label htmlFor="status">Status*</label>
                      <select
                        id="status"
                        className="form-control form-select"
                        {...register("status", {
                          required: "Please select user status",
                        })}
                      >
                        <option value="">Select Status</option>
                        <option value="Active">Active</option>
                        <option value="Inactive">Inactive</option>
                      </select>
                      {errors?.status && (
                        <InputError message={errors?.status?.message} />
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
                            required
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
                Cancel
              </Button>
              <Button type="submit" variant="contained" color="primary">
                Save
              </Button>
            </DialogActions>
          )}
        </form>
      </Dialog>
    </>
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
