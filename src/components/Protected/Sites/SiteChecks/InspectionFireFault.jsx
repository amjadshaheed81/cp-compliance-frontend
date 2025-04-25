import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, uploadSiteCheckDoc, put } from "../../../../api";
import moment from 'moment';
import { Typography, Grid, Autocomplete, Chip, Divider } from "@mui/material";
import { getSiteAssets } from "../../../../store/thunk/site";

const InspectionFireFault = ({ sasToken, checkId, siteAssets, getSiteAssets, siteSelectedForGlobal, siteCheck, loggedInUserData }) => {

  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
    }
    getInspection();
  }, []);

  const getInspection = async () => {
    const data = await get("/api/site-check/inspection/fault/" + checkId);
    if (data.length > 0) {
      setFormData(data);
      setCompleted(true)
    }
  }
  
  const [formData, setFormData] = useState([{
    add: true
  }]);
  
  const [completed, setCompleted] = useState(false);

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uformData = [...formData]
    const udata = {
      ...formData[idx],
      [name]: value,
    }
    uformData[idx] = udata
    setFormData(uformData);
  };

  const handleFileChange = (e, idx) => {
    const uformData = [...formData]
    const udata = {
      ...formData[idx],
      file: e.target.files[0],
    }
    uformData[idx] = udata
    setFormData(uformData);
  };

  // Fire Alarm specific checkboxes state
  const [devicesTested, setDevicesTested] = useState({
    fireAlarmDevices: false,
    undamagedDevices: false, 
    signalTransmission: false,
    circuitMonitoring: false,
    printerChecks: false,
    cieFunctions: false,
    controlEquipment: false,
    buildingStructure: false,
    logbookExamined: false
  });

  const handleCheckboxChange = (e) => {
    const { name, checked } = e.target;
    setDevicesTested({
      ...devicesTested,
      [name]: checked
    });
  };

  const addSiteCheckFault = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    // Save fire alarm testing checkboxes data
    try {
      const checkboxData = {
        fireAlarmDevices: devicesTested.fireAlarmDevices,
        undamagedDevices: devicesTested.undamagedDevices,
        signalTransmission: devicesTested.signalTransmission,
        circuitMonitoring: devicesTested.circuitMonitoring,
        printerChecks: devicesTested.printerChecks,
        cieFunctions: devicesTested.cieFunctions,
        controlEquipment: devicesTested.controlEquipment,
        buildingStructure: devicesTested.buildingStructure,
        logbookExamined: devicesTested.logbookExamined,
        checkId: checkId,
        inspectionType: "FireAlarm"
      };
      
      await post("/api/site-check/inspection/fire-alarm-testing", checkboxData);
    } catch (error) {
      console.error("Error saving fire alarm testing data:", error);
      toast.error("Failed to save fire alarm testing data");
    }
    
    // Process faults
    for (const data of formData) {
      if (data.add) {
        if (data?.file?.name) {
          data.siteId = siteSelectedForGlobal?.siteId;
          data.folderName = "Fire Alarm Testing";
          data.imageUrl = await uploadSiteCheckDoc(data);
          delete data.file;
        }
        data.dateRaised = new Date(data.dateRaised);
        data.checkId = checkId;
        data.status = "Open";
        await post("/api/site-check/inspection/fault", data);
        
        getInspection();
        
        // Create action
        const actionData = {
          type: "Inspection",
          status: "Reported",
          observation: data.faultDescription,
          desc: `${siteCheck?.type} - ${siteCheck?.subType} - ${siteCheck?.category} - ${moment(new Date()).format("DD/MM/YYYY")}`,
          requiredAction: data.action,
          riskScore: Number(data.severity) * Number(data.likelihood),
          dueDate: new Date(),
          createdAt: new Date(),
          siteId: siteSelectedForGlobal?.siteId,
          userId: loggedInUserData?.id,
          actionImage: data.imageUrl,
          taggedAsset: data.assetId
        }
        await put("/api/site/actions", actionData);
      } 
    }
    toast.success("Fire alarm fault data saved")
    setCompleted(true);
  }

  return (
    <form onSubmit={addSiteCheckFault}>
      <Grid container>
        <Grid sm={4}>
          <br />
          <Typography variant="h6" gutterBottom>
            Fire Alarm Testing <Chip color={"warning"} label={"Open"} />
          </Typography>
          <br />
        </Grid>
        
        <Grid sm={12}>
          <div className="card mb-4">
            <div className="card-header bg-dark text-white">
              Fire Alarm Checks (BS5839)
            </div>
            <div className="card-body">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="fireAlarmDevices"
                      name="fireAlarmDevices"
                      checked={devicesTested.fireAlarmDevices}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="fireAlarmDevices">
                      Fire alarm & detection devices have been tested for correct operation
                    </label>
                  </div>
                  
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="undamagedDevices"
                      name="undamagedDevices"
                      checked={devicesTested.undamagedDevices}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="undamagedDevices">
                      Fire alarm & detection devices are undamaged, unpainted & unobstructed
                    </label>
                  </div>
                  
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="signalTransmission"
                      name="signalTransmission"
                      checked={devicesTested.signalTransmission}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="signalTransmission">
                      Automatic transmission of all signals to alarm receiving centre verified
                    </label>
                  </div>
                  
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="circuitMonitoring"
                      name="circuitMonitoring"
                      checked={devicesTested.circuitMonitoring}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="circuitMonitoring">
                      All monitored circuits have been checked by simulation of fault condition
                    </label>
                  </div>

                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="printerChecks"
                      name="printerChecks"
                      checked={devicesTested.printerChecks}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="printerChecks">
                      Printers have been checked, text is legible and supplies available
                    </label>
                  </div>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="cieFunctions"
                      name="cieFunctions"
                      checked={devicesTested.cieFunctions}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="cieFunctions">
                      CIE functions checked for correct operation
                    </label>
                  </div>
                  
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="controlEquipment"
                      name="controlEquipment"
                      checked={devicesTested.controlEquipment}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="controlEquipment">
                      The control equipment is in overall good condition
                    </label>
                  </div>
                  
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="buildingStructure"
                      name="buildingStructure"
                      checked={devicesTested.buildingStructure}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="buildingStructure">
                      The building's structure, occupancy and layout have not changed
                    </label>
                  </div>
                  
                  <div className="form-check mb-3">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id="logbookExamined"
                      name="logbookExamined"
                      checked={devicesTested.logbookExamined}
                      onChange={handleCheckboxChange}
                    />
                    <label className="form-check-label" htmlFor="logbookExamined">
                      System log book examined & faults recorded have been attended to
                    </label>
                  </div>
                </Grid>
              </Grid>
            </div>
          </div>
        </Grid>
        
        <Grid sm={12}>
          <Typography variant="h6" gutterBottom>
            Faults Identified <Chip color={"warning"} label={"Open"} />
          </Typography>
        </Grid>
        
        <Grid sm={4}></Grid>
        <Grid sm={4}></Grid>
        <Grid sm={4}>
          <button
            style={{
              width: "150px",
              marginBottom: "20px",
              margin: "10px",
              float: "right",
            }}
            className="btn btn-primary btn-light"
            onClick={() => {
              const uformData = [...formData];
              uformData.push({ add: true });
              setFormData(uformData);
            }}
          >
            Record New
          </button>
        </Grid>

        <Grid sm={12}>
          <div className="table-responsive">
            <table className="table table-bordered f-11">
              <thead className="table-dark">
                <tr>
                  <th scope="col">ASSET</th>
                  <th scope="col">FAULT</th>
                  <th scope="col">DATE RAISED</th>
                  <th scope="col">Likelihood</th>
                  <th scope="col">Severity</th>
                  <th scope="col">IMAGE</th>
                  <th scope="col">SUGGESTED ACTION</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {formData?.length === 0 && (
                  <tr>
                    <td colSpan={8}>No Result Available!!</td>
                  </tr>
                )}
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
                      <td>
                        {completed && (
                          <input
                            type="text"
                            autoComplete="off"
                            readOnly
                            onFocus={(e) => e.target.removeAttribute("readonly")}
                            disabled={completed}
                            className="form-control"
                            value={assetName}
                          />
                        )}
                        {!completed && (
                          <Autocomplete
                            id="assetId"
                            disabled={completed}
                            onChange={(event, item) => {
                              const uformData = [...formData];
                              uformData[idx].assetId = item?.key;
                              setFormData(uformData);
                            }}
                            options={siteAssets?.map((option) => {
                              return {
                                key: option.assetId,
                                label:
                                  option.assetName + " - " + option.category,
                              };
                            })}
                            openOnFocus 
                            filterOptions={(options, state) => 
                              options.filter((option) =>
                                option.label.toLowerCase().includes(state.inputValue.toLowerCase())
                              )
                            }
                            getOptionLabel={(option) => option.label}
                            renderInput={(params) => (
                              <div ref={params.InputProps.ref}>
                                <i
                                  style={{
                                    position: "absolute",
                                    padding: "13px",
                                    color: "lightgrey",
                                    paddingLeft: "10rem",
                                    float: "right",
                                  }}
                                  className="fas fa-search"
                                ></i>
                                <input
                                  type="text"
                                  autoComplete="off"
                                  readOnly
                                  onFocus={(e) => e.target.removeAttribute("readonly")}
                                  {...params.inputProps}
                                  required
                                  disabled={completed}
                                  className="form-control"
                                />
                              </div>
                            )}
                          />
                        )}
                      </td>
                      <td>
                        <input
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          disabled={completed}
                          required
                          name="faultDescription"
                          className="form-control"
                          id="faultDescription"
                          value={formData?.[idx]?.faultDescription}
                          onChange={(e) => handleInputChange(e, idx)}
                        />
                      </td>
                      <td>
                        <input
                          disabled={completed}
                          type="date"
                          required
                          name="dateRaised"
                          value={String(formData?.[idx]?.dateRaised)?.substring(
                            0,
                            10
                          )}
                          className="form-control"
                          id="dateRaised"
                          onChange={(e) => handleInputChange(e, idx)}
                        />
                      </td>
                      <td>
                        <select
                          disabled={completed}
                          name="likelihood"
                          required
                          className="form-control form-select"
                          id="likelihood"
                          value={formData?.[idx]?.likelihood}
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select Likelihood</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </td>
                      <td>
                        <select
                          disabled={completed}
                          name="severity"
                          required
                          className="form-control form-select"
                          id="severity"
                          value={formData?.[idx]?.severity}
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select Severity</option>
                          <option value={1}>1</option>
                          <option value={2}>2</option>
                          <option value={3}>3</option>
                          <option value={4}>4</option>
                          <option value={5}>5</option>
                        </select>
                      </td>
                      <td align="center">
                        {completed && formData?.[idx]?.imageUrl && (
                          <a
                            href={formData?.[idx]?.imageUrl + "?" + sasToken}
                            target="_blank"
                          >
                            <button
                              disabled={completed}
                              className="btn btn-sm btn-light text-dark"
                              onClick={() => {}}
                            >
                              <i className="fas fa-download"></i>
                            </button>
                          </a>
                        )}
                        {!completed && (
                          <input
                            disabled={completed}
                            type="file"
                            name="file"
                            className="form-control"
                            id="file"
                            required
                            onChange={(e) => handleFileChange(e, idx)}
                          />
                        )}
                      </td>
                      <td>
                        <input
                          disabled={completed}
                          value={formData?.[idx]?.action}
                          type="text"
                          autoComplete="off"
                          readOnly
                          onFocus={(e) => e.target.removeAttribute("readonly")}
                          name="action"
                          className="form-control"
                          id="action"
                          required
                          onChange={(e) => handleInputChange(e, idx)}
                        />
                      </td>
                      <td>
                        {!completed && !formData?.[idx]?.edit && (
                          <button
                            disabled={completed}
                            type="button"
                            className="btn btn-sm btn-light text-dark"
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
                            className="btn btn-sm btn-light text-dark"
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
          </div>
        </Grid>

        <Grid sm={12}>
          <div className="card mb-4">
            <div className="card-header bg-dark text-white">
              Battery Information
            </div>
            <div className="card-body">
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <div className="form-group mb-3">
                    <label htmlFor="batteryCount">Number of Batteries</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="batteryCount" 
                      min="0"
                      max="10"
                    />
                  </div>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="batteryVoltage">Battery Voltage</label>
                    <div className="input-group">
                      <input 
                        type="number" 
                        className="form-control" 
                        id="batteryVoltage"
                        step="0.1" 
                      />
                      <span className="input-group-text">V</span>
                    </div>
                  </div>
                  
                  <div className="form-group mb-3">
                    <label htmlFor="falseAlarms">False alarms in past 12 months</label>
                    <input 
                      type="number" 
                      className="form-control" 
                      id="falseAlarms" 
                      min="0"
                    />
                  </div>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <div className="form-group mb-3">
                    <label>Battery A</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">Voltage</span>
                          <input type="text" className="form-control" placeholder="V" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">Charge</span>
                          <input type="text" className="form-control" placeholder="Ah" />
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="form-group mb-3">
                    <label>Battery B</label>
                    <div className="row g-2">
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">Voltage</span>
                          <input type="text" className="form-control" placeholder="V" />
                        </div>
                      </div>
                      <div className="col-6">
                        <div className="input-group">
                          <span className="input-group-text">Charge</span>
                          <input type="text" className="form-control" placeholder="Ah" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Grid>
                
                <Grid item xs={12}>
                  <div className="form-group">
                    <label htmlFor="workRequired">Work/action considered necessary</label>
                    <textarea 
                      className="form-control" 
                      id="workRequired" 
                      rows="3"
                      placeholder="Enter any required work or actions..."
                    ></textarea>
                  </div>
                </Grid>
              </Grid>
            </div>
          </div>
        </Grid>
        
        <Grid sm={12}>
          <button
            style={{
              width: "150px",
              marginBottom: "20px",
              margin: "10px",
              float: "right",
            }}
            className="btn btn-primary text-white pr-2"
            type="submit"
          >
            Save
          </button>
        </Grid>
      </Grid>
    </form>
  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { getSiteAssets })(InspectionFireFault); 