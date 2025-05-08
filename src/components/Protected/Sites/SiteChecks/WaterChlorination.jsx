import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { post, uploadSiteCheckDoc } from "../../../../api";
import {
  getSiteAssets,
  getSiteById,
  getSiteDetailsById,
  getSites,
  getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";

const WaterChlorination = ({
  sasToken,
  checkId,
  subType,
  category,
  getSiteDetailsById,
  siteAssets,
  getSiteAssets,
  users,
  getUsers,
  siteSelectedForGlobal,
  loggedInUserData,
}) => {
  const license = JSON.parse(localStorage.getItem("license"));

  const [formData, setFormData] = useState({
    address: "",
    clientAddress: license.companyAddress || "",
    siteContact: "",
    date: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    jobNo: "",
    manufacturer: "",
    modelNumber: "",
    tankSize: "",
    position: "",
    floor: "",
    room: "",
    engineersReport: "",
    jobComplete: "",
    partsRequired: "",
    sounderTest: "",
    clientName: "",
    engineerName: loggedInUserData?.name || "",
    engineerSign: loggedInUserData?.signature || "",
    selectedAsset: null,
    clientDate: new Date().toISOString().split("T")[0],
    engineerDate: new Date().toISOString().split("T")[0],
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [photoPreviews, setPhotoPreviews] = useState([]);

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
      (asset) =>
        asset.category === "Mechanical" &&
        asset.subCategory === "Water Services"
    ) || [];

  const handleAssetSelect = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        selectedAsset: newValue,
        manufacturer: newValue.manufacturer || "",
        modelNumber: newValue.model || "",
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

  //   const handlePhotoUpload = async (e) => {
  //     const files = Array.from(e.target.files);
  //     if (files.length === 0) return;

  //     setUploadingPhotos(true);

  //     try {
  //       const uploadPromises = files.map(async (file) => {
  //         // Create preview URL
  //         const previewUrl = URL.createObjectURL(file);

  //         // Upload the file
  //         const reqData = {
  //           siteId: siteSelectedForGlobal?.siteId,
  //           file,
  //           folderName: "storage-tank-photos",
  //         };

  //         const uploadResponse = await uploadSiteCheckDoc(reqData);

  //         return {
  //           url: uploadResponse.url,
  //           previewUrl,
  //           fileName: file.name,
  //         };
  //       });

  //       const uploadedFiles = await Promise.all(uploadPromises);

  //       // Update state with new photos
  //       setUploadedPhotos((prev) => [...prev, ...uploadedFiles]);
  //       setPhotoPreviews((prev) => [
  //         ...prev,
  //         ...uploadedFiles.map((f) => f.previewUrl),
  //       ]);

  //       // Add image references to comments
  //       const imageTags = uploadedFiles
  //         .map((file) => `\n[img:${file.fileName}](${file.url})`)
  //         .join("");

  //       setFormData((prev) => ({
  //         ...prev,
  //         engineersReport: prev.engineersReport + imageTags,
  //       }));

  //       toast.success("Photos uploaded successfully");
  //     } catch (error) {
  //       console.error("Error uploading photos:", error);
  //       toast.error("Failed to upload some photos");
  //     } finally {
  //       setUploadingPhotos(false);
  //     }
  //   };

  //   const handleRemovePhoto = (index) => {
  //     const updatedPhotos = [...uploadedPhotos];
  //     const removedPhoto = updatedPhotos.splice(index, 1)[0];

  //     // Remove the photo reference from comments
  //     const photoRef = `[img:${removedPhoto.fileName}](${removedPhoto.url})`;
  //     const updatedComments = formData.engineersReport.replace(photoRef, "");

  //     setUploadedPhotos(updatedPhotos);
  //     setPhotoPreviews(updatedPhotos.map((p) => p.previewUrl));
  //     setFormData((prev) => ({
  //       ...prev,
  //       engineersReport: updatedComments,
  //     }));

  //     // Revoke the object URL to free memory
  //     URL.revokeObjectURL(removedPhoto.previewUrl);
  //   };

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
        engineersReport: formData.engineersReport,
        tankSize: formData.tankSize,
        // uploadedPhotos: uploadedPhotos.map((photo) => ({
        //   url: photo.url,
        //   fileName: photo.fileName,
        // })),
      };

      await post("/api/site-check/storage-chlorination-report", dataToSave);
      toast.success("Water chlorination report saved successfully");
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
        <h4 className="mb-0">
          Service Record for Visual Inspection of Storage Tank
        </h4>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="row">
            <div className="row">
              {" "}
              {/* This creates a row for side-by-side layout */}
              {/* Left Address */}
              <div className="col-md-6">
                <div className="mb-3 d-flex flex-column">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Address
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="address"
                    value={formData.address || ""}
                    disabled
                    style={{
                      width: "100%",
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
              {/* Right Address */}
              <div className="col-md-6">
                <div className="mb-3 d-flex flex-column">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Client Address
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="clientAddress"
                    value={formData.clientAddress || ""}
                    disabled
                    style={{
                      width: "100%",
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
                      label="Select a Refuge Intercom Device"
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
                {/* <div className="col-md-4">
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
                </div> */}
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
            <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Tank Size</label>
                <input
                  type="text"
                  className="form-control"
                  name="tankSize"
                  value={formData.tankSize}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>
          </div>
        </div>

        {/*  Engineers Comments Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Details of Work Carried Out</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <TextField
                multiline
                rows={16}
                fullWidth
                variant="outlined"
                value={formData.engineersReport || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    engineersReport: e.target.value,
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
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Job Complete
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Parts Required{" "}
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <select
                        className="form-select"
                        value={formData.jobComplete}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            jobComplete: e.target.value,
                          })
                        }
                        disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">NO</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={formData.partsRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            partsRequired: e.target.value,
                          })
                        }
                        disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="row mt-4">
          {/* First row: Client Name, Engineer Name, Signature */}
          <div className="col-md-5">
            <div className="mb-3">
              <label className="form-label fw-bold">Client's Name</label>
              {renderClientNameField()}
            </div>
          </div>

          <div className="col-md-5">
            <div className="mb-3">
              <label className="form-label fw-bold">Engineer's Name</label>
              <input
                type="text"
                className="form-control"
                name="engineerName"
                value={formData.engineerName}
                onChange={handleInputChange}
                required
                readOnly
                disabled={isSubmitted}
              />
            </div>
          </div>

          <div className="col-md-2">
            <div className="mb-3">
              <label htmlFor="inspector.signature" className="form-label">
                Signature
              </label>
              <br />
              <img
                width="200"
                height="50"
                style={{ border: "1px solid" }}
                src={formData.engineerSign + "?" + sasToken}
              />
            </div>
          </div>
        </div>

        {/* Second row: Dates */}
        <div className="row">
          <div className="col-md-5">
            <div className="mb-3">
              <label className="form-label">Client Date</label>
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

          <div className="col-md-5">
            <div className="mb-3">
              <label className="form-label">Engineer Date</label>
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

          <div className="col-md-2">
            {/* Empty column to maintain alignment with the row above */}
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
})(WaterChlorination);
