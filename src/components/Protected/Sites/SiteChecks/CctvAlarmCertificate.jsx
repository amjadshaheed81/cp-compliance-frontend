import React, {useState, useEffect} from "react";
import {connect} from "react-redux";
import {toast} from "react-toastify";
import {post, get} from "../../../../api";
import {
    getSiteAssets,
    getSiteDetailsById,
    getSites,
    getUsers,
} from "../../../../store/thunk/site";
import {Autocomplete, TextField} from "@mui/material";
import {formatDate} from "../../../../utils/dateFormat";

const CctvAlarmCertificate = ({
                                  sasToken,
                                  checkId,
                                  subType,
                                  category,
                                  getSiteDetailsById,
                                  siteAssets,
                                  getSiteAssets,
                                  users,
                                  getUsers,
                                  siteSelectedForGlobal = {},
                                  loggedInUserData,
                              }) => {
    const [formData, setFormData] = useState({
      address: "",
      assetId: "",
      siteContact: "",
      inspectionDate: new Date().toISOString().split("T")[0],
      siteContactNo: "",
      job: "",
      report: "",
      // Using generic parameters for yes/no fields
      param1: "", // jobComplete
      param2: "", // partsRequired
      param3: "", // imageQualityCheck
      param4: "", // lensesCleaned
      param5: "", // dvrRecordingCheck
      param6: "", // electricalConnectionCheck
      // Using generic parameters for remarks
      param1Remark: "", // imageQualityRemarks
      param2Remark: "", // lensesCleanedRemarks
      param3Remark: "", // dvrRecordingRemarks
      param4Remark: "", // electricalConnectionRemarks
      client: "",
      user: loggedInUserData || {},
      engineer: loggedInUserData?.id || "",
      selectedAsset: null,
      signedDate: new Date().toISOString().split("T")[0],
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const selectedAsset = siteAssets.find(
      (asset) => asset.assetId === formData.assetId
    );

    const [popup, setPopup] = useState({
      show: false,
      content: "",
      position: { x: 0, y: 0 },
    });

    const handleMouseEnter = (e, content) => {
      if (!content) return;

      setPopup({
        show: true,
        content,
        position: {
          x: e.target.getBoundingClientRect().left,
          y: e.target.getBoundingClientRect().top - 10,
        },
      });
    };

    const fetchInspectionData = async () => {
      try {
        if (!checkId) return;

        const apiData = await get(
          `/api/site-check/generic-inspection/${checkId}`
        );
        if (apiData && apiData.length > 0) {
          // Take the last item as it will be the most recent submission
          const mostRecentItem = apiData[apiData.length - 1];

          // Find the asset in siteAssets that matches the assetId
          const selectedAsset = siteAssets.find(
            (asset) => asset.assetId === mostRecentItem.assetId
          );

          const engineerUser =
            users.find((user) => user.id === mostRecentItem.engineer) ||
            loggedInUserData;
          setFormData((prev) => ({
            ...prev,
            address: prev.address, // Keep existing address if not in response
            assetId: mostRecentItem.assetId || prev.assetId,
            siteContact: mostRecentItem.siteContact || prev.siteContact,
            inspectionDate:
              mostRecentItem.inspectionDate || prev.inspectionDate,
            siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
            job: mostRecentItem.job || prev.job,
            report: mostRecentItem.report || prev.report,
            // Map generic parameters
            param1: mostRecentItem.param1 || prev.param1, // jobComplete
            param2: mostRecentItem.param2 || prev.param2, // partsRequired
            param3: mostRecentItem.param3 || prev.param3, // imageQualityCheck
            param4: mostRecentItem.param4 || prev.param4, // lensesCleaned
            param5: mostRecentItem.param5 || prev.param5, // dvrRecordingCheck
            param6: mostRecentItem.param6 || prev.param6, // electricalConnectionCheck
            param1Remark: mostRecentItem.param1Remark || prev.param1Remark, // imageQualityRemarks
            param2Remark: mostRecentItem.param2Remark || prev.param2Remark, // lensesCleanedRemarks
            param3Remark: mostRecentItem.param3Remark || prev.param3Remark, // dvrRecordingRemarks
            param4Remark: mostRecentItem.param4Remark || prev.param4Remark, // electricalConnectionRemarks
            client: mostRecentItem.client || "",
            engineer:
              mostRecentItem.engineer || prev.engineer || loggedInUserData?.id,
            user: engineerUser,
            selectedAsset: selectedAsset || prev.selectedAsset,
            signedDate: mostRecentItem.signedDate || prev.signedDate,
          }));
        }
      } catch (error) {
        console.error("Error fetching inspection data:", error);
        toast.error("Failed to load inspection data");
      }
    };
    const handleMouseLeave = () => {
      setPopup((prev) => ({ ...prev, show: false }));
    };

    const isInternalUserTaggedWithSite =
      loggedInUserData?.userType === "Internal" &&
      loggedInUserData?.taggedSites?.some(
        (site) => site.id === siteSelectedForGlobal?.siteId
      );

    useEffect(() => {
      fetchInspectionData();
      if (isInternalUserTaggedWithSite && users.length === 0) {
        getUsers();
      }
      const fetchData = async () => {
        setIsLoading(true);
        try {
          if (siteSelectedForGlobal?.siteId) {
            await Promise.all([
              getSiteAssets(siteSelectedForGlobal.siteId),
              getSiteDetailsById(siteSelectedForGlobal.siteId),
            ]);
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
    }, [isInternalUserTaggedWithSite, users.length, getUsers]);

    const filteredAssets =
      siteAssets?.filter(
        (asset) =>
          asset.category === "Electrical" && asset.subCategory === "CCTV"
      ) || [];

    const handleAssetSelect = (event, newValue) => {
      setFormData((prev) => ({
        ...prev,
        assetId: newValue ? newValue.assetId : "",
      }));
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
          inspectionDate: formData.inspectionDate || new Date().toISOString(),
          job: formData.job,
          engineer: formData.user?.id || loggedInUserData?.id,
          signedDate: formData.signedDate || new Date().toISOString(),
          submittedDate: new Date().toISOString(),
          report: formData.report,
          param1: formData.param1, // jobComplete
          param2: formData.param2, // partsRequired
          param3: formData.param3, // imageQualityCheck
          param4: formData.param4, // lensesCleaned
          param5: formData.param5, // dvrRecordingCheck
          param6: formData.param6, // electricalConnectionCheck
          param1Remark: formData.param1Remark, // imageQualityRemarks
          param2Remark: formData.param2Remark, // lensesCleanedRemarks
          param3Remark: formData.param3Remark, // dvrRecordingRemarks
          param4Remark: formData.param4Remark, // electricalConnectionRemarks
        };

        await post("/api/site-check/generic-inspection", dataToSave);
        toast.success("Fire refuge report saved successfully");
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
            value={
              filteredUsers.find((user) => user.id === formData.client) || null
            }
            onChange={(event, newValue) => {
              setFormData((prev) => ({
                ...prev,
                client: newValue?.id || "",
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
          value={users.find((u) => u.id === formData.client)?.name || ""}
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
            value={
              filteredUsers.find((user) => user.id === formData.siteContact) ||
              null
            }
            onChange={(event, newValue) => {
              setFormData((prev) => ({
                ...prev,
                siteContact: newValue?.id || "",
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
          value={users.find((u) => u.id === formData.siteContact)?.name || ""}
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
          <h4 className="mb-0">CCTV Service Report</h4>
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
                  className="form-control"
                  name="job"
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
                    disabled={isSubmitted && !canEditSubmittedReport}
                    options={filteredAssets}
                    getOptionLabel={(option) =>
                      `${option.assetId} - ${option.assetName} (${
                        option.position || "NA"
                      } > ${option.floor || "NA"} > ${option.room || "NA"})`
                    }
                    value={selectedAsset} // Use the computed selectedAsset
                    onChange={handleAssetSelect}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select a CCTV Device"
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
                      <label className="form-label">DVR Manufacturer</label>
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
                      <label className="form-label">DVR Model Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="model"
                        value={selectedAsset.model}
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
            </div>
          </div>

          {/*  Engineers Comments Section */}
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
                  disabled={isSubmitted && !canEditSubmittedReport}
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
                      <td>
                        <div className="mb-3">
                          <label className="form-label">Job Complete</label>
                          <select
                            className="form-select"
                            value={formData.param1} // jobComplete
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param1: e.target.value,
                              })
                            }
                            disabled={isSubmitted && !canEditSubmittedReport}
                          >
                            <option value="">Select</option>
                            <option value="Pass">Yes</option>
                            <option value="Fail">No</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">Parts Required</label>
                          <select
                            className="form-select"
                            value={formData.param2} // partsRequired
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param2: e.target.value,
                              })
                            }
                            disabled={isSubmitted && !canEditSubmittedReport}
                          >
                            <option value="">Select</option>
                            <option value="Pass">Yes</option>
                            <option value="Fail">No</option>
                          </select>
                        </div>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mb-4">
            {popup.show && (
              <div
                className="remark-popup"
                style={{
                  position: "fixed",
                  left: `${popup.position.x}px`,
                  top: `${popup.position.y}px`,
                  transform: "translateY(-100%)",
                  zIndex: 1000,
                  maxWidth: "400px",
                  padding: "10px",
                  backgroundColor: "#fff",
                  border: "1px solid #ddd",
                  borderRadius: "4px",
                  boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                  wordBreak: "break-word",
                }}
              >
                {popup.content}
              </div>
            )}
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                    {/* Your table headers */}
                    <tr style={{ fontSize: "18px" }}>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "400px",
                        }}
                      >
                        Service Items Undertaken
                      </td>
                      <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "400px",
                        }}
                      >
                        Remarks
                      </td>
                    </tr>

                    {/* Image Quality Check Row */}
                    <tr style={{ fontSize: "22px" }}>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">
                            Image Quality Check
                          </label>
                          <select
                            className="form-select"
                            value={formData.param3} // imageQualityCheck
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param3: e.target.value,
                              })
                            }
                            disabled={isSubmitted && !canEditSubmittedReport}
                          >
                            <option value="">Select</option>
                            <option value="Pass">Yes</option>
                            <option value="Fail">No</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">Remarks</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.param1Remark} // imageQualityRemarks
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param1Remark: e.target.value,
                              })
                            }
                            onMouseEnter={(e) =>
                              handleMouseEnter(e, formData.param1Remark)
                            }
                            onMouseLeave={handleMouseLeave}
                            disabled={isSubmitted && !canEditSubmittedReport}
                            placeholder="Enter remarks"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Lenses Cleaned Row */}
                    <tr>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">Lenses Cleaned</label>
                          <select
                            className="form-select"
                            value={formData.param4} // lensesCleaned
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param4: e.target.value,
                              })
                            }
                            disabled={isSubmitted && !canEditSubmittedReport}
                          >
                            <option value="">Select</option>
                            <option value="Pass">Yes</option>
                            <option value="Fail">No</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">Remarks</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.param2Remark} // lensesCleanedRemarks
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param2Remark: e.target.value,
                              })
                            }
                            onMouseEnter={(e) =>
                              handleMouseEnter(e, formData.param2Remark)
                            }
                            onMouseLeave={handleMouseLeave}
                            disabled={isSubmitted && !canEditSubmittedReport}
                            placeholder="Enter remarks"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* DVR Recording Check Row */}
                    <tr>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">
                            DVR Recording Check
                          </label>
                          <select
                            className="form-select"
                            value={formData.param5} // Use param5 instead of dvrRecordingCheck
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param5: e.target.value, // Update param5
                              })
                            }
                            disabled={isSubmitted && !canEditSubmittedReport}
                          >
                            <option value="">Select</option>
                            <option value="Pass">Yes</option>
                            <option value="Fail">No</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">Remarks</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.param3Remark} // Use param3Remark instead of dvrRecordingRemarks
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param3Remark: e.target.value, // Update param3Remark
                              })
                            }
                            onMouseEnter={(e) =>
                              handleMouseEnter(e, formData.param3Remark)
                            }
                            onMouseLeave={handleMouseLeave}
                            disabled={isSubmitted && !canEditSubmittedReport}
                            placeholder="Enter remarks"
                          />
                        </div>
                      </td>
                    </tr>

                    {/* Electrical Connection Check Row */}
                    <tr>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">
                            Electrical Connection Check
                          </label>
                          <select
                            className="form-select"
                            value={formData.param6} // electricalConnectionCheck
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param6: e.target.value,
                              })
                            }
                            disabled={isSubmitted && !canEditSubmittedReport}
                          >
                            <option value="">Select</option>
                            <option value="Pass">Yes</option>
                            <option value="Fail">No</option>
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="mb-3">
                          <label className="form-label">Remarks</label>
                          <input
                            type="text"
                            className="form-control"
                            value={formData.param4Remark} // electricalConnectionRemarks
                            onChange={(e) =>
                              setFormData({
                                ...formData,
                                param4Remark: e.target.value,
                              })
                            }
                            onMouseEnter={(e) =>
                              handleMouseEnter(e, formData.param4Remark)
                            }
                            onMouseLeave={handleMouseLeave}
                            disabled={isSubmitted && !canEditSubmittedReport}
                            placeholder="Enter remarks"
                          />
                        </div>
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
                  name="signedDate"
                  value={formatDate(formData.signedDate)}
                  onChange={handleInputChange}
                  required
                  disabled={isSubmitted && !canEditSubmittedReport}
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
    siteSelectedForGlobal: state.site.siteSelectedForGlobal || {},
    loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
    getSiteDetailsById,
    getSiteAssets,
    getSites,
    getUsers,
})(CctvAlarmCertificate);
