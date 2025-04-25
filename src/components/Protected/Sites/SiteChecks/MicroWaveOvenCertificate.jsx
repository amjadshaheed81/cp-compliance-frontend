import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { post } from "../../../../api";
import {
  getSiteAssets,
  getSiteById,
  getSiteDetailsById,
  getSites,
  getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";

const MicroWaveOvenCertificate = ({
  sasToken,
  checkId,
  subType,
  category,
  getSiteDetailsById,
  siteDetailsById,
  siteAssets,
  getSiteAssets,
  users,
  getUsers,
  siteSelectedForGlobal,
  loggedInUserData,
}) => {
  const [formData, setFormData] = useState({
    address: "",
    siteContact: "",
    date: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    jobNo: "",
    manufacturer: "",
    modelNumber: "",
    position: "",
    floor: "",
    room: "",
    engineersReports: "",
    emissionLevelCheck: "",
    interlockCheck: "",
    passOrFail: "",
    clientName: "",
    engineerName: loggedInUserData?.name || "",
    selectedAsset: null,
    clientDate: new Date().toISOString().split("T")[0],
    engineerDate: new Date().toISOString().split("T")[0],
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const isInternalUserTaggedWithSite =
    loggedInUserData?.userType === "Internal" &&
    loggedInUserData?.taggedSites?.some(
      (site) => site.id === siteSelectedForGlobal?.siteId
    );

  useEffect(() => {
    if (isInternalUserTaggedWithSite && users.length === 0) {
      getUsers();
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (siteSelectedForGlobal?.siteId) {
          await getSiteAssets(siteSelectedForGlobal?.siteId);
          await getSiteDetailsById(siteSelectedForGlobal?.siteId);

          if (siteSelectedForGlobal) {
            const addressParts = [
              siteSelectedForGlobal.address1,
              siteSelectedForGlobal.address2,
              siteSelectedForGlobal.city,
              siteSelectedForGlobal.area,
              siteSelectedForGlobal.postCode,
              siteSelectedForGlobal.country,
            ].filter((part) => part);

            const fullAddress = addressParts.join(", ");
            setFormData((prev) => ({ ...prev, address: fullAddress }));
          }

          if (siteSelectedForGlobal.siteContact) {
            setFormData((prev) => ({
              ...prev,
              siteContact: siteSelectedForGlobal.siteContact.name || "",
              siteContactNo: siteSelectedForGlobal.siteContact.phone || "",
            }));
          }
        }
      } catch (error) {
        console.error("Error fetching site data:", error);
        toast.error("Failed to load site details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [
    siteSelectedForGlobal,
    getSiteAssets,
    users.length,
    isInternalUserTaggedWithSite,
    getUsers,
  ]);

  const filteredAssets =
    siteAssets?.filter(
      (asset) => asset.category === "Electrical" //&&
      // asset.subCategory === "Fire Alarm" &&
      // asset.subCategory2 === "Disabled Refuge Outstation"
    ) || [];

  const handleAssetSelect = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        selectedAsset: newValue,
        manufacturer: newValue.manufacturer || "",
        modelNumber: newValue.modelNumber || "",
        position: newValue.position || "",
        floor: newValue.floor || "",
        room: newValue.room || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedAsset: null,
        manufacturer: "",
        modelNumber: "",
        position: "",
        floor: "",
        room: "",
      }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.selectedAsset) {
        toast.error("Please select an asset first");
        return;
      }

      const dataToSave = {
        ...formData,
        assetId: formData.selectedAsset.assetId,
        siteId: siteSelectedForGlobal?.siteId,
        checkId,
        subType,
        submittedDate: new Date().toISOString(),
        engineersComments: formData.engineersComments,
      };

      await post("/api/site-check/fire-refuge-report", dataToSave);
      toast.success("Fire refuge report saved successfully");
      setIsSubmitted(true);
    } catch (error) {
      toast.error("Failed to save report");
      console.error(error);
    }
  };

  const renderClientNameField = () => {
    if (isInternalUserTaggedWithSite) {
      const filteredUsers =
        users?.filter((user) =>
          user.taggedSites?.some(
            (site) => site.id === siteSelectedForGlobal?.siteId
          )
        ) || [];

      return (
        <Autocomplete
          options={filteredUsers}
          getOptionLabel={(user) => user.name}
          value={
            filteredUsers.find((user) => user.name === formData.clientName) ||
            null
          }
          onChange={(event, newValue) => {
            setFormData((prev) => ({
              ...prev,
              clientName: newValue?.name || "",
            }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              required
              style={{
                height: "40px",
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                },
                "& .MuiAutocomplete-input": {
                  padding: "8.5px 4px !important",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                  padding: "0 5px",
                },
              }}
            />
          )}
          disabled={isSubmitted}
        />
      );
    }
    return (
      <input
        type="text"
        className="form-control"
        name="clientName"
        value={formData.clientName}
        onChange={handleInputChange}
        required
        disabled={isSubmitted}
      />
    );
  };

  const renderSiteContactField = () => {
    if (isInternalUserTaggedWithSite) {
      const filteredUsers =
        users?.filter((user) =>
          user.taggedSites?.some(
            (site) => site.id === siteSelectedForGlobal?.siteId
          )
        ) || [];

      return (
        <Autocomplete
          options={filteredUsers}
          getOptionLabel={(user) => user.name}
          value={
            filteredUsers.find((user) => user.name === formData.siteContact) ||
            null
          }
          onChange={(event, newValue) => {
            setFormData((prev) => ({
              ...prev,
              siteContact: newValue?.name || "",
              siteContactNo: newValue?.phone || "",
            }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              required
              style={{
                height: "40px",
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                },
                "& .MuiAutocomplete-input": {
                  padding: "8.5px 4px !important",
                },
              }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                  padding: "0 5px",
                },
              }}
            />
          )}
          disabled={isSubmitted}
        />
      );
    }
    return (
      <input
        type="text"
        className="form-control"
        name="siteContact"
        value={formData.siteContact}
        onChange={handleInputChange}
        required
        disabled={isSubmitted}
      />
    );
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="header text-center bg-light p-4 mb-4 rounded">
        <h4 className="mb-0">Microwave Oven Test Certificate</h4>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="col-md-6">
            <div className="mb-3 d-flex">
              <label
                className="form-label"
                style={{ fontWeight: "bold", marginRight: "20px" }}
              >
                Address
              </label>
              <textarea
                className="form-control"
                rows={3}
                name="address"
                value={formData.address || ""}
                disabled
                style={{
                  width: "300px",
                  height: "150px",
                  overflowY: "auto",
                  whiteSpace: "pre-wrap",
                  wordWrap: "break-word",
                  backgroundColor: "#f8f9fa",
                  fontWeight: "normal",
                  fontSize: "15px",
                }}
              />
            </div>
          </div>
          <div className="col-md-3">
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                name="date"
                value={formatDate(formData.date)}
                onChange={handleInputChange}
                required
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
                disabled={isSubmitted}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Site Contact</label>
              {renderSiteContactField()}
            </div>
          </div>
          <div className="col-md-3">
            <div className="mb-3">
              <label className="form-label">Site Contact No.</label>
              <input
                type="text"
                className="form-control"
                name="siteContactNo"
                value={formData.siteContactNo}
                onChange={handleInputChange}
                disabled={isSubmitted}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Job No.</label>
              <input
                type="text"
                className="form-control"
                name="jobNo"
                value={formData.jobNo}
                onChange={handleInputChange}
                disabled={isSubmitted}
              />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Device Information</h5>
          </div>
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-12">
                <Autocomplete
                  disabled={isSubmitted}
                  options={filteredAssets}
                  getOptionLabel={(option) =>
                    `${option.assetId} - ${option.assetName} (${
                      option.position || "NA"
                    } > ${option.floor || "NA"} > ${option.room || "NA"})`
                  }
                  value={formData.selectedAsset}
                  onChange={handleAssetSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select a Microwave Oven Testing Device"
                      variant="outlined"
                      placeholder="Search devices..."
                    />
                  )}
                  sx={{ width: "100%" }}
                />
              </div>
            </div>

            {formData.selectedAsset && (
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Manufacturer</label>
                    <input
                      type="text"
                      className="form-control"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Model Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="modelNumber"
                      value={formData.modelNumber}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Position</label>
                    <input
                      type="text"
                      className="form-control"
                      name="position"
                      value={formData.position}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Floor</label>
                    <input
                      type="text"
                      className="form-control"
                      name="floor"
                      value={formData.floor}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Room</label>
                    <input
                      type="text"
                      className="form-control"
                      name="room"
                      value={formData.room}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/*  Engineers Comments Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Engineers Reports</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <TextField
                multiline
                rows={16}
                fullWidth
                variant="outlined"
                value={formData.engineersReports || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    engineersReports: e.target.value,
                  })
                }
                style={{ height: "400px" }}
                disabled={isSubmitted}
              />
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="card-body">
            <div className="table-responsive">
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Emission Level Check
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Interlock Check
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Pass/Fail
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <select
                        className="form-select"
                        value={formData.emissionLevelCheck}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            emissionLevelCheck: e.target.value,
                          })
                        }
                        disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={formData.interlockCheck}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            interlockCheck: e.target.value,
                          })
                        }
                        disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={formData.passOrFail}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            passOrFail: e.target.value,
                          })
                        }
                        disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="row mt-4">
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold">Client's Name</label>
              {renderClientNameField()}
            </div>

            <div className="mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                name="clientDate"
                value={formatDate(formData.clientDate)}
                onChange={handleInputChange}
                required
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
                disabled={isSubmitted}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold">Engineer's Name</label>
              <input
                type="text"
                className="form-control"
                name="engineerName"
                value={formData.engineerName}
                onChange={handleInputChange}
                required
                disabled={isSubmitted}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                name="engineerDate"
                value={formatDate(formData.engineerDate)}
                onChange={handleInputChange}
                required
                disabled={isSubmitted}
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
              />
            </div>
          </div>
        </div>

        {!isSubmitted && (
          <div className="d-flex justify-content-end gap-2 mt-4 print-hide">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary">
              Submit Report
            </button>
          </div>
        )}

        {isSubmitted && (
          <div className="alert alert-success mt-4 print-hide">
            Report submitted successfully on {new Date().toLocaleDateString()}
          </div>
        )}
      </form>

      <style>{`
        @media print {
          .print-hide {
            display: none !important;
          }
          body {
            padding: 0;
            margin: 0;
          }
          .container {
            max-width: 100%;
            padding: 0;
          }
        }
      `}</style>
    </div>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  users: state.site.users,
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
  getSiteDetailsById,
  getSiteById,
  getSiteAssets,
  getSites,
  getUsers,
})(MicroWaveOvenCertificate);
