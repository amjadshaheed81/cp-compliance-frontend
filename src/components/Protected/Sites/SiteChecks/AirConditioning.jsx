import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, uploadSiteCheckDoc } from "../../../../api";
import {
  getSiteAssets,
  getSiteById,
  getSiteDetailsById,
  getSites,
  getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";

const AirConditioning = ({
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
  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    job: "",
    manufacturer: "",
    modelNumber: "",
    position: "",
    floor: "",
    room: "",
    serialNo: "",
    report: "", // Engineers report
    param1: "", //jobComplete
    param2: "", // partsRequired
    param3: "", // fGasCheck
    param4: "", // filtersCleaned
    param5: "", // indoorCoilCleaned
    param6: "", // outdoorCoilCleaned
    param7: "", // systemLeakCheck
    param8: "", // drainPumpTest
    param9: "", // electricalConnectionsCheck
    param10: "", // temperatureChecks

    param1Remark: "", // ofn
    param2Remark: "", // welding
    param3Remark: "", // refrigerant
    param4Remark: "", // reclaimCylinder
    param5Remark: "", // cleaningChemicals
    param6Remark: "", // airSpray

    client: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    selectedAsset: null,
    signedDate: new Date().toISOString().split("T")[0],
    clientUser: null,
    siteContactUser: null,
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);

  const selectedAsset = siteAssets.find(
    (asset) => asset.assetId === formData.assetId
  );

  const isInternalUserTaggedWithSite =
    loggedInUserData?.userType === "Internal" &&
    loggedInUserData?.taggedSites?.some(
      (site) => site.id === siteSelectedForGlobal?.siteId
    );

  const fetchInspectionData = async () => {
    try {
      if (!checkId) return;

      if (isInternalUserTaggedWithSite && users.length === 0) {
        await getUsers();
      }

      const apiData = await get(
        `/api/site-check/generic-inspection/${checkId}`
      );
      if (apiData && apiData.length > 0) {
        const mostRecentItem = apiData[apiData.length - 1];
        const selectedAsset = siteAssets.find(
          (asset) => asset.assetId === mostRecentItem.assetId
        );

        const clientUser = users.find(
          (user) => user.id === mostRecentItem.client
        );
        const engineerUser = users.find(
          (user) => user.id === mostRecentItem.engineer
        );
        const siteContactUser = users.find(
          (user) => user.id === mostRecentItem.siteContact
        );

        setFormData((prev) => ({
          ...prev,
          address: prev.address,
          assetId: mostRecentItem.assetId || prev.assetId,
          siteContact: mostRecentItem.siteContact || prev.siteContact,
          inspectionDate: mostRecentItem.inspectionDate || prev.inspectionDate,
          siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
          job: mostRecentItem.job || prev.job,
          report: mostRecentItem.report || prev.report,
          param1: mostRecentItem.jobComplete || prev.param1,
          param2: mostRecentItem.partsRequired || prev.param2,
          param3: mostRecentItem.fGasCheck || prev.param3,
          param4: mostRecentItem.filtersCleaned || prev.param4,
          param5: mostRecentItem.indoorCoilCleaned || prev.param5,
          param6: mostRecentItem.outdoorCoilCleaned || prev.param6,
          param7: mostRecentItem.systemLeakCheck || prev.param7,
          param8: mostRecentItem.drainPumpTest || prev.param8,
          param9: mostRecentItem.electricalConnectionsCheck || prev.param9,
          param10: mostRecentItem.temperatureChecks || prev.param10,
          param1Remark: mostRecentItem.ofn || prev.param1Remark,
          param2Remark: mostRecentItem.welding || prev.param2Remark,
          param3Remark: mostRecentItem.refrigerant || prev.param3Remark,
          param4Remark: mostRecentItem.reclaimCylinder || prev.param4Remark,
          param5Remark: mostRecentItem.cleaningChemicals || prev.param5Remark,
          param6Remark: mostRecentItem.airSpray || prev.param6Remark,
          client: mostRecentItem.client || "",
          engineer:
            mostRecentItem.engineer || prev.engineer || loggedInUserData?.id,
          user: engineerUser || loggedInUserData || prev.user,
          selectedAsset: selectedAsset || prev.selectedAsset,
          signedDate: mostRecentItem.signedDate || prev.signedDate,
          clientUser: clientUser || null,
          siteContactUser: siteContactUser || null,
        }));
      }
    } catch (error) {
      console.error("Error fetching inspection data:", error);
      toast.error("Failed to load inspection data");
    }
  };
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

          await fetchInspectionData();

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
        asset.subCategory === "Air Conditioning"
    ) || [];

  const handleAssetSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      assetId: newValue ? newValue.assetId : "",
      selectedAsset: newValue,
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
      if (!formData.assetId) {
        toast.error("Please select an asset first");
        return;
      }

      const dataToSave = {
        ...formData,
        assetId: formData.assetId,
        siteId: siteSelectedForGlobal?.siteId,
        checkId,
        subType,
        category,
        inspectionDate: formData.inspectionDate || new Date().toISOString(),
        job: formData.job || "",
        engineer: loggedInUserData?.id,
        signedDate: formData.signedDate || new Date().toISOString(),
        submittedDate: new Date().toISOString(),
        report: formData.report,
        param1: formData.param1, // jobComplete
        param2: formData.param2, // partsRequired
        param3: formData.param3, // fGasCheck
        param4: formData.param4, // filtersCleaned
        param5: formData.param5, // indoorCoilCleaned
        param6: formData.param6, // outdoorCoilCleaned
        param7: formData.param7, // systemLeakCheck
        param8: formData.param8, // drainPumpTest
        param9: formData.param9, // electricalConnectionsCheck
        param10: formData.param10, // temperatureChecks
        param1Remark: formData.param1Remark,
        param2Remark: formData.param2Remark,
        param3Remark: formData.param3Remark,
        param4Remark: formData.param4Remark,
        param5Remark: formData.param5Remark,
        param6Remark: formData.param6Remark,
      };

      await post("/api/site-check/generic-inspection", dataToSave);
      toast.success("Air Conditioning report saved successfully");
      setIsSubmitted(true);
      setSubmissionSuccess(true);
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
          value={formData.clientUser || null}
          onChange={(event, newValue) => {
            setFormData((prev) => ({
              ...prev,
              client: newValue?.id || "",
              clientUser: newValue || null,
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
        value={formData.clientUser?.name || ""}
        onChange={(e) => {
          setFormData((prev) => ({
            ...prev,
            client: e.target.value,
            clientNameText: e.target.value,
          }));
        }}
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
          value={formData.siteContactUser || null}
          onChange={(event, newValue) => {
            setFormData((prev) => ({
              ...prev,
              siteContact: newValue?.id || "",
              siteContactNo: newValue?.phone || "",
              siteContactUser: newValue || null,
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
        value={formData.siteContactUser?.name || ""}
        onChange={(e) => {
          setFormData((prev) => ({
            ...prev,
            siteContact: e.target.value,
            siteContactName: e.target.value,
          }));
        }}
        required
        disabled={isSubmitted}
      />
    );
  };

  const canEditSubmittedReport = loggedInUserData?.role === "Admin";

  return (
    <div className="container mt-4 mb-5">
      <div className="header text-center bg-light p-4 mb-4 rounded">
        <h4 className="mb-0">Water Heater Service Report</h4>
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
                value={formatDate(formData.inspectionDate)}
                onChange={handleInputChange}
                required
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
                disabled={isSubmitted && !canEditSubmittedReport}
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
                disabled={isSubmitted && !canEditSubmittedReport}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Job No.</label>
              <input
                type="text"
                name="job"
                className="form-control"
                value={formData.job}
                onChange={handleInputChange}
                disabled={isSubmitted && !canEditSubmittedReport}
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
                  value={selectedAsset}
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

            {selectedAsset && (
              <div className="row">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Manufacturer</label>
                    <input
                      type="text"
                      className="form-control"
                      name="manufacturer"
                      value={selectedAsset.manufacturer}
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
                      value={selectedAsset.modelNumber}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Serial Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="serialNo"
                      value={selectedAsset.serialNo}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Asset No</label>
                    <input
                      type="text"
                      className="form-control"
                      name="assetId"
                      value={`Asset No - ${selectedAsset.assetId}`}
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
                      value={selectedAsset.position}
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
                      value={selectedAsset.floor}
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
                      value={selectedAsset.room}
                      onChange={handleInputChange}
                      required
                      disabled
                    />
                  </div>
                </div>
              </div>
            )}
            {/* <div className="col-md-4">
              <div className="mb-3">
                <label className="form-label">Storage(ltrs)</label>
                <input
                  type="text"
                  className="form-control"
                  name="tankSize"
                  value={formData.tankSize}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div> */}
          </div>
        </div>

        {/*  Engineers Report Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Engineers Report</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <TextField
                multiline
                rows={16}
                fullWidth
                variant="outlined"
                value={formData.report || ""}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    report: e.target.value,
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
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      F Gas Check Complete
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <select
                        className="form-select"
                        value={formData.param1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param1: e.target.value,
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
                        value={formData.param2}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param2: e.target.value,
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
                        value={formData.param3}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param3: e.target.value,
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

        <div className="mb-4 card">
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h5>Service Items Undertaken</h5>
                <div className="d-flex flex-column gap-3 mt-3">
                  <div>
                    <label className="form-label fw-bold">
                      Filters Cleaned
                    </label>
                    <select
                      className="form-select"
                      value={formData.param4}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param4: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label fw-bold">
                      Indoor Coil Cleaned
                    </label>
                    <select
                      className="form-select"
                      value={formData.param5}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param5: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label fw-bold">
                      Outdoor Coil Cleaned
                    </label>
                    <select
                      className="form-select"
                      value={formData.param6}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param6: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label fw-bold">
                      System Leak Check
                    </label>
                    <select
                      className="form-select"
                      value={formData.param7}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param7: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label fw-bold">
                      Drain/Pump Test
                    </label>
                    <select
                      className="form-select"
                      value={formData.param8}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param8: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label fw-bold">
                      Electrical Connections Check
                    </label>
                    <select
                      className="form-select"
                      value={formData.param9}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param9: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label fw-bold">
                      Temperature Checks
                    </label>
                    <select
                      className="form-select"
                      value={formData.param10}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param10: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Right Column - Materials Used (Text Inputs) */}
              <div className="col-md-6">
                <h5>Materials Used</h5>
                <div className="d-flex flex-column gap-3 mt-3">
                  <div>
                    <label className="form-label fw-bold">OFN</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.param1Remark}
                      onChange={(e) =>
                        setFormData({ ...formData, param1Remark: e.target.value })
                      }
                      disabled={isSubmitted}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold">Welding</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.param2Remark}
                      onChange={(e) =>
                        setFormData({ ...formData, param2Remark: e.target.value })
                      }
                      disabled={isSubmitted}
                    />
                  </div>

                  <div>
                    <label className="form-label fw-bold">Refrigerant </label>
                    <select
                      className="form-select"
                      value={formData.param3Remark}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param3Remark: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    >
                      <option value="">Select</option>
                      <option value="Yes">Type</option>
                      <option value="No">Quant</option>
                    </select>
                  </div>
                  <div>
                    <label className="form-label fw-bold">
                      Reclaim Cylinder
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.param4Remark}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param4Remark: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    />
                  </div>
                  <div>
                    <label className="form-label fw-bold">
                      Cleaning Chemicals
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.param5Remark}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          param5Remark: e.target.value,
                        })
                      }
                      disabled={isSubmitted}
                    />
                  </div>
                  <div>
                    <label className="form-label fw-bold">Air Spray</label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.param6Remark}
                      onChange={(e) =>
                        setFormData({ ...formData, param6Remark: e.target.value })
                      }
                      disabled={isSubmitted}
                    />
                  </div>
                </div>
              </div>
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
                name="signedDate"
                value={formatDate(formData.signedDate)}
                onChange={handleInputChange}
                required
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
                disabled={isSubmitted && !canEditSubmittedReport}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold">Engineer's Name</label>
              <input
                type="text"
                className="form-control"
                name="engineer name"
                readOnly
                value={formData.user.name}
                required
                disabled
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                value={formatDate(formData.signedDate)}
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

        {submissionSuccess && (
          <div className="alert alert-success mt-4 print-hide">
            Report submitted successfully on{" "}
            {new Date().toISOString().split("T")[0]}
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
})(AirConditioning);
