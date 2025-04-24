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
import { DeleteForever } from "@mui/icons-material";
import { formatDate } from "../../../../utils/dateFormat";

const SounderAudibilityForm = ({
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
    locations: Array(8).fill({
      description: "",
      spl: "",
      backgroundNoise: "",
      notes: "",
    }),
    clientName: "",
    engineerName: loggedInUserData?.name || "", // Pre-fill with logged in user's name
    selectedAsset: null,
    clientDate: new Date().toISOString().split("T")[0],
    engineerDate: new Date().toISOString().split("T")[0],
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if user is internal and tagged with selected site
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
            console.log(siteSelectedForGlobal);

            const fullAddress = addressParts.join(", ");
            setFormData((prev) => ({ ...prev, address: fullAddress }));
          }

          // Set site contact information from selected site
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

  // Filter assets by category: Electrical > Fire Alarm > Sounder
  const filteredAssets =
    siteAssets?.filter(
      (asset) =>
        asset.category === "Electrical" &&
        asset.subCategory === "Fire Alarm" &&
        asset.subCategory2 === "Sounder"
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

  const handleLocationChange = (index, field, value) => {
    const updatedLocations = [...formData.locations];
    updatedLocations[index] = {
      ...updatedLocations[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      locations: updatedLocations,
    }));
  };

  const addLocation = () => {
    setFormData((prev) => ({
      ...prev,
      locations: [
        ...prev.locations,
        {
          description: "",
          spl: "",
          backgroundNoise: "",
          sounderType: "Electronic",
          compliant: false,
          notes: "",
        },
      ],
    }));
  };

  const removeLocation = (index) => {
    if (formData.locations.length <= 1) return;
    const updatedLocations = [...formData.locations];
    updatedLocations.splice(index, 1);
    setFormData((prev) => ({
      ...prev,
      locations: updatedLocations,
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
      };

      await post("/api/site-check/audibility-report", dataToSave);
      toast.success("Sounder audibility report saved successfully");
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
              label="Select Client"
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
              siteContactNo: newValue?.phone || "", // Automatically update contact number
            }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Site Contact"
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
        <h4 className="mb-0">BS5839 Sounder Audibility Report</h4>
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

        {/* Rest of the form remains the same */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Select Sounder Device</h5>
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
                      label="Select a Sounder Device"
                      variant="outlined"
                      placeholder="Search sounders..."
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
                    <label className="form-label">Asset ID</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.selectedAsset.assetId}
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}

            {formData.selectedAsset && (
              <div className="row">
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

        {/* Sound Pressure Level Measurements Section */}
        <div className="mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>Sound Pressure Level Measurements</h5>
            {!isSubmitted && (
              <button
                type="button"
                className="btn btn-outline-primary print-hide"
                onClick={addLocation}
              >
                <span style={{ marginRight: "5px" }}>+</span>
                Add Location
              </button>
            )}
          </div>
          <hr className="mb-3" />

          <div className="table-responsive mb-4">
            <table className="table table-bordered">
              <thead>
                <tr style={{ textAlign: "center" }}>
                  <th width="10%">Location No#</th>
                  <th width="25%">Location Description</th>
                  <th width="15%">SPL (dB(A))</th>
                  <th width="15%">Background (dB(A))</th>
                  <th width="20%">Notes</th>
                  {!isSubmitted && (
                    <th width="5%" className="print-hide">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {formData.locations.map((location, index) => (
                  <tr key={index}>
                    <td>{index + 1}</td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={location.description}
                        onChange={(e) =>
                          handleLocationChange(
                            index,
                            "description",
                            e.target.value
                          )
                        }
                        disabled={isSubmitted}
                      />
                    </td>
                    <td>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={location.spl}
                          onChange={(e) =>
                            handleLocationChange(index, "spl", e.target.value)
                          }
                          disabled={isSubmitted}
                        />
                        <span className="input-group-text">dB(A)</span>
                      </div>
                    </td>
                    <td>
                      <div className="input-group">
                        <input
                          type="text"
                          className="form-control"
                          value={location.backgroundNoise}
                          onChange={(e) =>
                            handleLocationChange(
                              index,
                              "backgroundNoise",
                              e.target.value
                            )
                          }
                          disabled={isSubmitted}
                        />
                        <span className="input-group-text">dB(A)</span>
                      </div>
                    </td>
                    <td>
                      <input
                        type="text"
                        className="form-control"
                        value={location.notes}
                        onChange={(e) =>
                          handleLocationChange(index, "notes", e.target.value)
                        }
                        disabled={isSubmitted}
                      />
                    </td>
                    {!isSubmitted && (
                      <td className="text-center print-hide">
                        <button
                          type="button"
                          onClick={() => removeLocation(index)}
                          disabled={formData.locations.length <= 1}
                          className="btn btn-link p-0 border-0"
                          style={{ color: "red" }}
                        >
                          <span style={{ fontSize: "1.2rem" }}>
                            <DeleteForever />
                          </span>
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
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
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
                disabled={isSubmitted}
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
})(SounderAudibilityForm);
