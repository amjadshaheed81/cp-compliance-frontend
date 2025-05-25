import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { get, post } from "../../../../api";
import {
  getSiteAssets,
  getSiteById,
  getSiteDetailsById,
  getSites,
  getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";

const ExternalLightningCertificate = ({
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
  //const license = JSON.parse(localStorage.getItem("license"));

  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    job: "",
    param1Remark: "", // fittingTypes
    param2Remark: "", // fittingQuantity
    param3Remark: "", // fittingLocation
    report: "",
    param1: "", // job complete
    param2: "", // parts required
    param3: "", // timers checked
    param4: "", // fittings operational
    client: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    selectedAsset: null,
    signedDate: new Date().toISOString().split("T")[0],
    clientUser: null,
    siteContactUser: null,
  });

  const sites = useSelector((state) => state.site.sites);
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

  const handleMouseLeave = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

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
          param1: mostRecentItem.param1 || prev.param1,
          param2: mostRecentItem.param2 || prev.param2,
          param3: mostRecentItem.param3 || prev.param3,
          param4: mostRecentItem.param4 || prev.param4,
          param1Remark: mostRecentItem.param1Remark || prev.param1Remark,
          param2Remark: mostRecentItem.param2Remark || prev.param2Remark,
          param3Remark: mostRecentItem.param3Remark || prev.param3Remark,
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

          const currentSite = sites.find(
            (site) => site.siteId === siteSelectedForGlobal.siteId
          );
          const siteData = currentSite || siteSelectedForGlobal;
          // Properly construct the address
          if (siteData) {
            const addressParts = [
              siteSelectedForGlobal.address1,
              siteSelectedForGlobal.address2,
              siteSelectedForGlobal.city,
              siteSelectedForGlobal.area,
              siteSelectedForGlobal.postCode,
              siteSelectedForGlobal.country,
            ].filter((part) => part && part.trim() !== ""); // Filter out empty/null parts

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
      const dataToSave = {
        ...formData,
        assetId: formData.assetId,
        siteId: siteSelectedForGlobal?.siteId,
        checkId,
        subType,
        inspectionDate: formData.inspectionDate || new Date().toISOString(),
        job: formData.job,
        engineer: loggedInUserData?.id,
        signedDate: formData.signedDate || new Date().toISOString(),
        submittedDate: new Date().toISOString(),
        report: formData.report,
        param1: formData.param1, // jobComplete
        param2: formData.param2, // partsRequired
        param3: formData.param3, // walkTestComplete
        param4: formData.param4, // pirsCleaned
        param1Remark: formData.param1Remark, // walkTestRemarks
        param2Remark: formData.param2Remark, // pirsCleanedRemarks
        param3Remark: formData.param3Remark, // remoteSignallingRemarks
      };

      await post("/api/site-check/generic-inspection", dataToSave);
      toast.success("External lightning report saved successfully");
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
          value={formData.clientUser || null} // Use the stored clientUser
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
          value={formData.siteContactUser || null} // Use the stored siteContactUser
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
        <h4 className="mb-0">External Lighting Service Report</h4>
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
                name="inspectionDate"
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
            <h5 className="mb-0">Fitting Information</h5>
          </div>
          <div className="card-body">
            <div className="col">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Fitting Types</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.param1Remark} // Using param1Remark for fitting types
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
                    required
                    style={{ width: "1200px" }}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Fitting Quantity</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.param2Remark} // Using param2Remark for fitting quantity
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
                    required
                    style={{ width: "1200px" }}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Fitting Location</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.param3Remark} // Using param3Remark for fitting Location
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        param3Remark: e.target.value,
                      })
                    }
                    onMouseEnter={(e) =>
                      handleMouseEnter(e, formData.param3Remark)
                    }
                    onMouseLeave={handleMouseLeave}
                    disabled={isSubmitted && !canEditSubmittedReport}
                    required
                    style={{ width: "1200px" }}
                  />
                </div>
              </div>
            </div>
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
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Job Complete
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Parts Required
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
                        <option value="Fail">No</option>
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
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="mb-4 card">
          <div className="card-body col">
            <div className="card-header">
              <h6 className="mb-0" style={{ fontWeight: "bold" }}>
                Service Items Undertaken
              </h6>
            </div>
            <div className="table-responsive">
              <table className="table table-bordered">
                <tbody>
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Timers Checked
                    </td>
                    <td style={{ textAlign: "center" }}>
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
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Fittings Operational
                    </td>
                    <td style={{ textAlign: "center" }}>
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
})(ExternalLightningCertificate);
