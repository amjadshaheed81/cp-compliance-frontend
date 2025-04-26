import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getSiteAssets, getUsers } from "../../../../store/thunk/site";
import { get, post, uploadSiteCheckDoc, put } from "../../../../api";

const InspectionFireCertificate = ({
  checkId,
  sasToken,
  siteAssets = [],
  getSiteAssets,
  siteSelectedForGlobal = {},
  loggedInUserData = {},
  siteCheck = {},
}) => {
  const license = JSON.parse(localStorage.getItem("license"));

  const [formData, setFormData] = useState({
    inspectionChecks: [
      {
        check: 1,
        checkQ:
          "Fire alarm & detection devices have been tested for correct operation",
        checkSelected: false,
        remarks: "",
      },
      {
        check: 2,
        checkQ:
          "Fire alarm & detection devices are undamaged, unpainted & unobstructed",
        checkSelected: false,
        remarks: "",
      },
      {
        check: 3,
        checkQ:
          "Automatic transmission of all signals to alarm receiving centre verified",
        checkSelected: false,
        remarks: "",
      },
      {
        check: 4,
        checkQ:
          "All monitored circuits have been checked by simulation of fault condition",
        checkSelected: false,
        remarks: "",
      },
      {
        check: 5,
        checkQ:
          "Printers have been checked, text is legible and supplies available",
        checkSelected: false,
        remarks: "",
      },
    ],
    additionalComments: "",
    allFittingsPassed: false,
    installationSiteType: "",
    variationsChanges: "",
    inspectionDoneBy: "",
    summaryAddress: "",

    siteAssetId: "",
    files: [],
    user: loggedInUserData,
  });
  const [hoveredRemarksIndex, setHoveredRemarksIndex] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const getInspection = async () => {
    try {
      const apiData = await get(
        "/api/site-check/emergency-lighting/" + checkId
      );

      if (apiData) {
        setFormData((prev) => ({
          ...prev,
          id: apiData?.id || prev.id,
          installationName: apiData?.installationName || prev.installationName,
          installationAddress:
            apiData?.installationAddress || prev.installationAddress,
          inspectionDate: apiData?.inspectionDate || prev.inspectionDate,
          inspectionChecks: apiData?.inspectionChecks?.length
            ? prev.inspectionChecks.map((defaultCheck, index) => ({
                ...defaultCheck,
                ...(apiData.inspectionChecks[index] || {}),
                check: defaultCheck.check, // Always keep the original check text
              }))
            : prev.inspectionChecks,

          // Merge simple fields
          additionalComments:
            apiData?.additionalComments || prev.additionalComments,
          allFittingsPassed:
            apiData?.allFittingsPassed || prev.allFittingsPassed,
          installationSiteType:
            apiData?.installationSiteType || prev.installationSiteType,
          variationsChanges:
            apiData?.variationsChanges || prev.variationsChanges,
          inspectionDoneBy: apiData?.inspectionDoneBy || prev.inspectionDoneBy,
          summaryAddress: apiData?.summaryAddress || prev.summaryAddress,
          siteAssetId: apiData?.siteAssetId || prev.siteAssetId,
          file: apiData?.file || prev.file,
          user: apiData?.inspectionByUser || prev.user,
        }));

        setCompleted(true);
      }
    } catch (error) {
      toast.error("Failed to load inspection data");
      console.error("Inspection load error:", error);
    }
  };
  useEffect(() => {
    getUsers();
    getInspection();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal.siteId);
    }
  }, []);

  const handleInputChange = (e, field) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleCheckChange = (index, field, value) => {
    const updatedChecks = [...formData.inspectionChecks];
    updatedChecks[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      inspectionChecks: updatedChecks,
    }));
  };

  const FILE_VALIDATION_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
    MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB total
    ALLOWED_TYPES: ["image/jpeg", "image/png", "application/pdf"],
    MAX_FILE_COUNT: 10, // Maximum number of files allowed
  };

  const validateFiles = (newFiles, existingFiles = []) => {
    // Check if adding new files would exceed max count
    if (
      newFiles.length + existingFiles.length >
      FILE_VALIDATION_CONFIG.MAX_FILE_COUNT
    ) {
      return {
        isValid: false,
        error: `You can upload a maximum of ${FILE_VALIDATION_CONFIG.MAX_FILE_COUNT} files.`,
      };
    }

    // Check for invalid file types
    const invalidFiles = newFiles.filter(
      (file) => !FILE_VALIDATION_CONFIG.ALLOWED_TYPES.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      return {
        isValid: false,
        error: "Only JPG, PNG, PDF, DOC, and DOCX files are allowed.",
      };
    }

    // Check for oversized files
    const oversizedFiles = newFiles.filter(
      (file) => file.size > FILE_VALIDATION_CONFIG.MAX_FILE_SIZE
    );
    if (oversizedFiles.length > 0) {
      return {
        isValid: false,
        error: `Some files exceed the maximum size of ${
          FILE_VALIDATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024
        }MB.`,
      };
    }

    // Check total size limit
    const currentTotalSize = existingFiles.reduce(
      (sum, file) => sum + file.size,
      0
    );
    const newTotalSize =
      currentTotalSize + newFiles.reduce((sum, file) => sum + file.size, 0);

    if (newTotalSize > FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE) {
      return {
        isValid: false,
        error: `Total size exceeds ${
          FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024
        }MB limit.`,
      };
    }

    return { isValid: true };
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length === 0) return;
    const validation = validateFiles(selectedFiles, formData.files);
    if (!validation.isValid) {
      toast.error(validation.error);
      e.target.value = "";
      return;
    }

    // If validation passes, update state
    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...selectedFiles],
    }));

    e.target.value = "";
  };
  const handleFileDelete = (index) => {
    setFormData((prev) => {
      const updatedFiles = [...prev.files];
      updatedFiles.splice(index, 1);
      return {
        ...prev,
        files: updatedFiles,
      };
    });
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      inspectionDate: date || new Date(),
    }));
  };

  const submitInspection = async (e) => {
    e.preventDefault();
    if (formData.files.length > FILE_VALIDATION_CONFIG.MAX_FILE_COUNT) {
      toast.error(
        `Maximum ${FILE_VALIDATION_CONFIG.MAX_FILE_COUNT} files allowed.`
      );
      return;
    }

    const totalSize = formData.files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE) {
      toast.error(
        `Total file size exceeds ${
          FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024
        }MB limit.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        siteId: siteSelectedForGlobal?.siteId || "",
        checkId,
        inspectionBy: loggedInUserData?.id,
      };

      // Upload file if exists
      const certificateUrls = [];
      if (formData.files.length > 0) {
        try {
          // Upload all files in parallel
          const uploadPromises = formData.files.map((file) =>
            uploadSiteCheckDoc({
              file,
              siteId: siteSelectedForGlobal?.siteId,
              folderName: "EmergencyLighting",
            })
          );

          certificateUrls.push(...(await Promise.all(uploadPromises)));
          payload.certificateUrls = certificateUrls; // Changed from certificateUrl to certificateUrls (array)
        } catch (uploadError) {
          console.error("File upload failed:", uploadError);
          toast.error("File upload failed");
          return;
        }
      }

      // Submit inspection data
      await post("/api/site-check/fire-alarm", payload);

      toast.success("Inspection submitted successfully");
      setCompleted(true);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit inspection");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white">
        <h4>Fire Alarm Inspection & Test Certificate</h4>
        <small>BS5839 – 1: 2013</small>
      </div>
      <div className="card-body">
        <form onSubmit={submitInspection}>
          {/* Client Details Section */}
          <h5 className="mb-3">Details of the Client</h5>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Name</label>
                <input
                  disabled
                  type="text"
                  className="form-control"
                  value={license?.companyName}
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label className="form-label">Address</label>
                <textarea
                  disabled
                  rows={4}
                  className="form-control"
                  value={license?.companyAddress}
                />
              </div>
            </div>
          </div>

          {/* Installation Details Section */}
          <h5 className="mb-3">Details of the Installation</h5>
          <div className="row mb-3">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="installationName" className="form-label">
                  Name
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData?.installationName || ""}
                  onChange={(e) => handleInputChange(e, "installationName")}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="installationAddress" className="form-label">
                  Address
                </label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={formData?.installationAddress || ""}
                  onChange={(e) => handleInputChange(e, "installationAddress")}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="installationAddress" className="form-label">
                  The extent of liability of the signatory is limited to the
                  system described. Extent of system covered by this report:
                </label>
                <input
                  className="form-control"
                  value={formData?.installationSiteType || ""}
                  onChange={(e) => handleInputChange(e, "installationAddress")}
                  required
                />
              </div>
            </div>
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="installationAddress" className="form-label">
                  Variations from the recommendations of Clause 45 of BS
                  5839-1:2013 for periodic or annual inspection and test:
                </label>
                <input
                  className="form-control"
                  value={formData?.variationsChanges || ""}
                  onChange={(e) => handleInputChange(e, "installationAddress")}
                  required
                />
              </div>
            </div>
          </div>

          {/**Summary  of test inspection*/}
          <h5 className="mb-3">Summary of Test & Inspection</h5>
          <div className="col mb-3">
            <div className="col-md-6">
              <div className="mb-3">
                <label htmlFor="installationName" className="form-label">
                  Inspection & Test Carried Out By:
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData?.inspectionDoneBy || ""}
                  onChange={(e) => handleInputChange(e, "installationName")}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="installationName" className="form-label">
                  Address:
                </label>
                <textarea
                  rows={2}
                  className="form-control"
                  value={formData?.summaryAddress || ""}
                  onChange={(e) => handleInputChange(e, "installationAddress")}
                  required
                />
              </div>
            </div>
          </div>

          {/* Inspection Checks Section */}
          <h5 className="mb-3">Inspection & Test Carried Out By:</h5>
          <table className="table table-striped table-bordered mb-4">
            <thead>
              <tr>
                <th style={{ width: "60%" }}>Check</th>
                <th style={{ width: "20%" }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {formData?.inspectionChecks?.map((check, index) => (
                <tr key={index}>
                  <td>
                    <div className="form-check">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={check?.checkSelected || ""}
                        onChange={(e) =>
                          handleCheckChange(
                            index,
                            "checkSelected",
                            e.target.checked
                          )
                        }
                      />
                      <label className="form-check-label">
                        {check?.checkQ || ""}
                      </label>
                    </div>
                  </td>

                  <td style={{ position: "relative" }}>
                    <input
                      type="text"
                      className="form-control"
                      value={check?.remarks || ""}
                      onChange={(e) =>
                        handleCheckChange(index, "remarks", e.target.value)
                      }
                      onMouseEnter={() => setHoveredRemarksIndex(index)}
                      onMouseLeave={() => setHoveredRemarksIndex(null)}
                      placeholder="Enter remarks..."
                    />
                    {hoveredRemarksIndex === index && check.remarks && (
                      <div
                        style={{
                          position: "absolute",
                          top: "100%",
                          left: "-40px",
                          zIndex: 1000,
                          fontSize: "15px",
                          backgroundColor: "#fff",
                          border: "1px solid #ddd",
                          padding: "28px",
                          borderRadius: "4px",
                          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                        }}
                      >
                        {check.remarks}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Additional Comments Section */}
          <h5 className="mb-1">Additional Comments & Deviations</h5>
          <p
            className="mb-2"
            style={{
              fontSize: "12px",
              fontWeight: "normal",
              color: "#7b7b7b",
            }}
          >
            Please provide as much information on luminaire failures &
            deviations including locations, luminaire types, make & model
            numbers
          </p>
          <div className="mb-4">
            <textarea
              rows={4}
              className="form-control"
              value={formData?.additionalComments || ""}
              onChange={(e) => handleInputChange(e, "additionalComments")}
              placeholder="Please provide Information"
            />
          </div>

          {/* File Upload Section */}
          {/* File Upload Section */}
          <div className="mb-4">
            <label htmlFor="files" className="form-label">
              Upload Supporting Documents (Max{" "}
              {FILE_VALIDATION_CONFIG.MAX_FILE_COUNT} files,{" "}
              {FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024}MB total)
            </label>
            <input
              type="file"
              className="form-control"
              onChange={handleFileChange}
              multiple
              accept={FILE_VALIDATION_CONFIG.ALLOWED_TYPES.join(",")}
              id="files"
            />

            {/* Display file size information */}
            <small className="text-muted">
              Accepted formats: JPG, PNG, PDF, DOC, DOCX. Max{" "}
              {FILE_VALIDATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024}MB per file.
            </small>

            {/* Display uploaded files with size information */}
            {formData.files.length > 0 && (
              <div className="mt-3">
                <h6>Selected Files:</h6>
                <ul className="list-group">
                  {formData.files.map((file, index) => (
                    <li
                      key={index}
                      className="list-group-item d-flex justify-content-between align-items-center"
                    >
                      <div>
                        <span className="d-block">{file.name}</span>
                        <small className="text-muted">
                          {(file.size / 1024 / 1024).toFixed(2)} MB
                        </small>
                      </div>
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => handleFileDelete(index)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
                <div className="mt-2 text-end">
                  <small>
                    Total:{" "}
                    {formData.files.reduce((sum, file) => sum + file.size, 0) /
                      1024 /
                      1024}{" "}
                    MB /{FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024} MB
                  </small>
                </div>
              </div>
            )}
          </div>

          {/* Certification Statement */}
          <div className="border p-3 mb-4 bg-light">
            <p>
              We hereby certify that the emergency lighting system installation
              at the above premises has been inspected and tested by us in
              accordance with BS 5266-1: 2011, and to the best of our knowledge
              and belief, the installation complies at the time of inspection
              and testing with the recommendations given in BS 5266. Emergency
              lighting Part 1:2011. Code of practice for the Emergency lighting
              of premises, published by the BSI for a category (stated above)
              except as stated in the deviations above.
            </p>
          </div>

          {/* Inspector Details Section */}
          <h5 className="mb-3">For the Inspection & Test of the system:</h5>
          <div className="row mb-3">
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="inspector.name" className="form-label">
                  Name
                </label>
                <input
                  disabled
                  type="text"
                  className="form-control"
                  value={formData.user?.name || ""}
                />
              </div>
            </div>
            <div className="col-md-4">
              <div className="mb-3">
                <label htmlFor="inspector.position" className="form-label">
                  Position
                </label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.user?.role || ""}
                  disabled
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
                  src={formData.user?.signature + "?" + sasToken}
                />
              </div>
            </div>
            <div className="col-md-2">
              <div className="mb-3">
                <label htmlFor="inspector.date" className="form-label">
                  Date
                </label>
                <DatePicker
                  selected={formData.inspectionDate || ""}
                  onChange={handleDateChange}
                  className="form-control"
                  dateFormat="dd/MM/yyyy"
                  required
                />
              </div>
            </div>
          </div>
          <div className="d-flex justify-content-end">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isLoading}
            >
              {isLoading ? "Submitting..." : "Submit Inspection"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets || [],
  siteSelectedForGlobal: state.site.siteSelectedForGlobal || {},
  loggedInUserData: state.site.loggedInUserData || {},
  siteCheck: state.site.siteCheck || {},
});

export default connect(mapStateToProps, { getSiteAssets, getUsers })(
  InspectionFireCertificate
);
