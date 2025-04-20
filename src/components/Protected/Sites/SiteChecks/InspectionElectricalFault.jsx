import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, uploadSiteCheckDoc, put } from "../../../../api";
import moment from "moment";
import { Typography, Grid, Autocomplete, Chip, Divider } from "@mui/material";
import { getSiteAssets } from "../../../../store/thunk/site";

const InspectionElectricalFault = ({
  sasToken,
  checkId,
  siteAssets,
  getSiteAssets,
  siteSelectedForGlobal,
  siteCheck,
  loggedInUserData,
}) => {
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
    }
    getIpection();
  }, []);

  const getIpection = async () => {
    const data = await get("/api/site-check/inspection/fault/" + checkId);
    if (data.length > 0) {
      setFormData(data);
      setCompleted(true);
    }
  };

  const [formData, setFormData] = useState([{ add: true }]);
  const [completed, setCompleted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDuration, setSelectedDuration] = useState("select");

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uformData = [...formData];
    const udata = { ...formData[idx], [name]: value };
    uformData[idx] = udata;
    setFormData(uformData);
  };

  const handleFileChange = (e, idx) => {
    const uformData = [...formData];
    const udata = { ...formData[idx], file: e.target.files[0] };
    uformData[idx] = udata;
    setFormData(uformData);
  };

  const addSiteCheckFault = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    for (const data of formData) {
      if (data.add) {
        if (data?.file?.name) {
          data.siteId = siteSelectedForGlobal?.siteId;
          data.folderName = "Electrical Faults";
          data.imageUrl = await uploadSiteCheckDoc(data);
          delete data.file;
        }
        data.dateRaised = new Date(data.dateRaised);
        data.checkId = checkId;
        data.status = "Open";
        await post("/api/site-check/inspection/fault", data);
        getIpection();
        const actionData = {
          type: "Inspection",
          status: "Reported",
          observation: data.faultDescription,
          desc: `${siteCheck?.type} - ${siteCheck?.subType} - ${
            siteCheck?.category
          } - ${moment(new Date()).format("DD/MM/YYYY")}`,
          requiredAction: data.action,
          riskScore: Number(data.severity) * Number(data.likelihood),
          dueDate: new Date(),
          createdAt: new Date(),
          siteId: siteSelectedForGlobal?.siteId,
          userId: loggedInUserData?.id,
          actionImage: data.imageUrl,
          taggedAsset: data.assetId,
        };
        await put("/api/site/actions", actionData);
      }
    }
    toast.success("Fault data saved");
    setCompleted(true);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <form onSubmit={addSiteCheckFault}>
        {/* Fault Details Section */}
        <div
          className="form-control d-flex flex-row mb-2 justify-content-start align-items-center p-2"
          style={{ border: "1px solid #989898", padding: "8px" }}
        >
          <h6 className="mb-0" style={{ marginRight: "70px" }}>
            BSI Installation Category
          </h6>

          <div
            className="vr mx-3"
            style={{
              opacity: 1,
              color: "#989898",
              alignSelf: "stretch",
            }}
          />
          <div
            className="d-flex flex-row justify-content-between"
            style={{ marginLeft: "50px", gap: "120px" }}
          >
            <div className="form-group mb-0">
              <label htmlFor="Type" className="form-label">
                Type
              </label>
              <input
                type="text"
                className="form-control form-control-md"
                id="Type"
                name="Type"
                style={{ width: "120px" }}
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="Mode" className="form-label">
                Mode
              </label>
              <input
                type="text"
                className="form-control form-control-md"
                id="Mode"
                name="Mode"
                style={{ width: "120px" }}
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="Facilities" className="form-label">
                Facilities
              </label>
              <input
                type="text"
                className="form-control form-control-md"
                id="Facilities"
                name="Facilities"
                style={{ width: "120px" }}
              />
            </div>

            <div className="form-group mb-0">
              <label htmlFor="Duration" className="form-label">
                Duration
              </label>
              <div className="d-flex align-items-center">
                <div className="dropdown">
                  <button
                    className="btn btn-md btn-outline-secondary dropdown-toggle"
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                  >
                    {selectedDuration}
                  </button>
                  {isOpen && (
                    <ul className="dropdown-menu show">
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedDuration("30");
                            setIsOpen(false);
                          }}
                        >
                          30
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedDuration("60");
                            setIsOpen(false);
                          }}
                        >
                          60
                        </button>
                      </li>
                      <li>
                        <button
                          className="dropdown-item"
                          onClick={() => {
                            setSelectedDuration("120");
                            setIsOpen(false);
                          }}
                        >
                          120
                        </button>
                      </li>
                    </ul>
                  )}
                </div>
                <small className="text-muted ms-2">
                  (In minutes, for self-contained systems)
                </small>
              </div>
            </div>
          </div>
        </div>
        <div
          className="form-control p-2 mb-3"
          style={{
            width: "50%",
            backgroundColor: "#1f497d",
            color: "white",
          }}
        >
          <h6 style={{ fontWeight: "bold" }}>Summary of Inspection</h6>
        </div>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
          }}
        >
          <thead>
            <tr>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "8px",
                  width: "20%",
                }}
              >
                Summary of Inspection
              </th>
              <th
                style={{
                  border: "1px solid #000",
                  padding: "8px",
                  width: "25%",
                }}
              >
                Fault Description
              </th>
            </tr>
          </thead>
          <tbody>
            {formData?.map((d, idx) => {
              const completed =
                formData?.[idx]?.faultId && !formData?.[idx]?.edit;
              const assetName = siteAssets
                .filter((a) => a.assetId == formData[idx].assetId)
                .map(
                  (option) => option.assetName + " - " + option.category
                )?.[0];

              return (
                <tr key={idx}>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    {completed ? (
                      <input
                        type="text"
                        className="form-control"
                        value={assetName || ""}
                        readOnly
                      />
                    ) : (
                      <Autocomplete
                        id="assetId"
                        onChange={(event, item) => {
                          const uformData = [...formData];
                          uformData[idx].assetId = item?.key;
                          setFormData(uformData);
                        }}
                        options={siteAssets?.map((option) => ({
                          key: option.assetId,
                          label: option.assetName + " - " + option.category,
                        }))}
                        openOnFocus
                        filterOptions={(options, state) =>
                          options.filter((option) =>
                            option.label
                              .toLowerCase()
                              .includes(state.inputValue.toLowerCase())
                          )
                        }
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
                              required
                              className="form-control"
                              {...params.inputProps}
                            />
                          </div>
                        )}
                      />
                    )}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    <input
                      type="text"
                      className="form-control"
                      name="faultDescription"
                      value={formData?.[idx]?.faultDescription || ""}
                      onChange={(e) => handleInputChange(e, idx)}
                      required
                      readOnly={completed}
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    <input
                      type="date"
                      className="form-control"
                      name="dateRaised"
                      value={
                        String(formData?.[idx]?.dateRaised)?.substring(0, 10) ||
                        ""
                      }
                      onChange={(e) => handleInputChange(e, idx)}
                      required
                      readOnly={completed}
                    />
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    <select
                      className="form-control"
                      name="likelihood"
                      value={formData?.[idx]?.likelihood || ""}
                      onChange={(e) => handleInputChange(e, idx)}
                      required
                      disabled={completed}
                    >
                      <option value="">Select</option>
                      <option value="1">1 (Low)</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5 (High)</option>
                    </select>
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    <select
                      className="form-control"
                      name="severity"
                      value={formData?.[idx]?.severity || ""}
                      onChange={(e) => handleInputChange(e, idx)}
                      required
                      disabled={completed}
                    >
                      <option value="">Select</option>
                      <option value="1">1 (Low)</option>
                      <option value="2">2</option>
                      <option value="3">3</option>
                      <option value="4">4</option>
                      <option value="5">5 (High)</option>
                    </select>
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {completed && formData?.[idx]?.imageUrl ? (
                      <a
                        href={formData?.[idx]?.imageUrl + "?" + sasToken}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <button type="button" className="btn btn-sm btn-light">
                          <i className="fas fa-download"></i>
                        </button>
                      </a>
                    ) : (
                      <input
                        type="file"
                        className="form-control"
                        name="file"
                        onChange={(e) => handleFileChange(e, idx)}
                        required
                      />
                    )}
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    <input
                      type="text"
                      className="form-control"
                      name="action"
                      value={formData?.[idx]?.action || ""}
                      onChange={(e) => handleInputChange(e, idx)}
                      required
                      readOnly={completed}
                    />
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {!completed && (
                      <button
                        type="button"
                        className="btn btn-sm btn-danger"
                        onClick={() => {
                          const uformData = [...formData];
                          if (uformData.length > 1) {
                            uformData.splice(idx, 1);
                          } else {
                            uformData.length = 0;
                          }
                          setFormData(uformData);
                        }}
                      >
                        <i className="fas fa-trash"></i>
                      </button>
                    )}
                    {completed && (
                      <button
                        type="button"
                        className="btn btn-sm btn-primary"
                        onClick={() => {
                          const uformData = [...formData];
                          uformData[idx].edit = true;
                          setFormData(uformData);
                        }}
                      >
                        <i className="fas fa-edit"></i>
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "20px",
          }}
        >
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              const uformData = [...formData];
              uformData.push({ add: true });
              setFormData(uformData);
            }}
          >
            <i className="fas fa-plus"></i> Add Another Fault
          </button>

          <button
            type="submit"
            className="btn btn-success"
            disabled={formData.length === 0}
          >
            <i className="fas fa-save"></i> Save All Faults
          </button>
        </div>

        {/* Risk Assessment Summary */}
        {formData.some((item) => item.likelihood && item.severity) && (
          <>
            <h3>Risk Assessment Summary</h3>
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                marginBottom: "20px",
              }}
            >
              <thead>
                <tr>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>
                    Risk Level
                  </th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>
                    Score Range
                  </th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>
                    Action Required
                  </th>
                  <th style={{ border: "1px solid #000", padding: "8px" }}>
                    Count
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      backgroundColor: "#ffcccc",
                    }}
                  >
                    High (15-25)
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    Immediate action required
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    Urgent repair/replacement
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {
                      formData.filter(
                        (item) =>
                          item.likelihood &&
                          item.severity &&
                          item.likelihood * item.severity >= 15
                      ).length
                    }
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      backgroundColor: "#fff3cd",
                    }}
                  >
                    Medium (8-14)
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    Action required
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    Schedule repair
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {
                      formData.filter(
                        (item) =>
                          item.likelihood &&
                          item.severity &&
                          item.likelihood * item.severity >= 8 &&
                          item.likelihood * item.severity < 15
                      ).length
                    }
                  </td>
                </tr>
                <tr>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      backgroundColor: "#d4edda",
                    }}
                  >
                    Low (1-7)
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    Monitor
                  </td>
                  <td style={{ border: "1px solid #000", padding: "8px" }}>
                    Routine maintenance
                  </td>
                  <td
                    style={{
                      border: "1px solid #000",
                      padding: "8px",
                      textAlign: "center",
                    }}
                  >
                    {
                      formData.filter(
                        (item) =>
                          item.likelihood &&
                          item.severity &&
                          item.likelihood * item.severity < 8
                      ).length
                    }
                  </td>
                </tr>
              </tbody>
            </table>
          </>
        )}

        {/* Inspector Details */}
        <h3>Inspector Details</h3>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            marginBottom: "20px",
          }}
        >
          <tbody>
            <tr>
              <td
                style={{
                  border: "1px solid #000",
                  padding: "8px",
                  width: "20%",
                }}
              >
                Inspector Name:
              </td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>
                {loggedInUserData?.name || "N/A"}
              </td>
            </tr>
            <tr>
              <td style={{ border: "1px solid #000", padding: "8px" }}>
                Inspection Date:
              </td>
              <td style={{ border: "1px solid #000", padding: "8px" }}>
                {moment(new Date()).format("DD/MM/YYYY")}
              </td>
            </tr>
          </tbody>
        </table>
      </form>
    </div>
  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { getSiteAssets })(
  InspectionElectricalFault
);
