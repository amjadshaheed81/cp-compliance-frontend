import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get, post } from "../../../../api";

import { Button, Chip, DialogContent, DialogTitle, DialogActions, Dialog, Typography, Grid, Autocomplete } from "@mui/material";
import { getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";

const SurveyWaterOutletTemperature = ({ checkId, siteAssets, siteLayout, getSiteAssets, siteSelectedForGlobal, getSiteLayout }) => {
  const navigate = useNavigate();
  const [outletoptions, setoutletoptions] = useState([]);
  const [tempratureoptions, settempratureoptions] = useState([]);
  const [normruntime, setnormruntime] = useState([]);
  const [readingPop, setReadingPop] = useState(null);

  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId)

    }
    getSurvey();
  }, []);

  const getSurvey = async () => {
    const outlettypes = await get("/api/lov/SITE_CHECK_SURVEY_OUTLET_TYPE");
    setoutletoptions(outlettypes.map(l => l.lovValue));
    const tempratureoptionstypes = await get("/api/lov/SITE_CHECK_SURVEY_TEMPRATURE");
    settempratureoptions(tempratureoptionstypes.map(l => l.lovValue));
    const normruntimetypes = await get("/api/lov/SITE_CHECK_SURVEY_NORM_RUN_TIME");
    setnormruntime(normruntimetypes.map(l => l.lovValue));
    const data = await get("/api/site-check/water-outlet-temp/" + checkId);
    if (data.length > 0) {
      setFormData(data);
      setCompleted(true)
    }
  }

  const [formData, setFormData] = useState([{}]);
  const [completed, setCompleted] = useState(false);

  const getName = (idx) => {
    let res = "";
    const floor = siteLayout.filter(s => String(s.id) === String(formData[idx]?.floor));
    const room = siteLayout.filter(s => String(s.id) === String(formData[idx]?.room));
    if (floor.length > 0) {
      res = res + floor[0].nodeName;
    }
    if (room.length > 0) {
      res = res + " > " + room[0].nodeName;
    }
    return res;
  }

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


  const addSiteCheckSurvey = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    for (const data of formData) {
      data.checkId = checkId;
      data.status = "Open";
      if (data.r1Date) {
        data.r1Date = new Date(data.r1Date);
      }
      if (data.r2Date) {
        data.r2Date = new Date(data.r2Date);
      }
      if (data.r3Date) {
        data.r3Date = new Date(data.r3Date);
      }

      await post("/api/site-check/water-outlet-temp", data)
      toast.success("Fault data saved")
    }

    setCompleted(true);
  }


  return (
    <>
      <Dialog open={readingPop !== null} onClose={() => { setReadingPop(null) }} maxWidth="lg" fullWidth>
        <DialogTitle>Add Reading {formData[readingPop]?.assetId ? "("+siteAssets.filter(a => a.assetId == formData[readingPop].assetId).map(option => option.assetName + " - " + option.category)?.[0]+")" : ""}</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <Grid container>
              <Grid sm={4}>
                <label for="outletType">Outlet Type</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="outletType"
                  className="form-control"
                  id="outletType"
                  disabled
                  value={formData?.[readingPop]?.outletType}

                />
              </Grid>
              <Grid sm={4}>
                <label for="outletType">Temperature</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="outletType"
                  className="form-control"
                  id="outletType"
                  disabled
                  value={formData?.[readingPop]?.temperature}

                />
              </Grid>
              <Grid sm={4}>
                <label for="outletType">Location</label>
                <input
                  style={{ maxWidth: '300px' }}
                  type="outletType"
                  className="form-control"
                  id="outletType"
                  disabled
                  value={getName(readingPop)}

                />
              </Grid>
              <Grid sm={12}>
                <div className="table-responsive" style={{ marginTop: '30px' }} >
                  <table className="table table-bordered f-11">
                    <thead className="table-dark">
                      <tr>
                        <th></th>
                        <th>Test Date</th>
                        <th>Reading</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>READING 1</td>
                        <td><input
                          type="date"
                          className="form-control"
                          name="r1Date"
                          onChange={(e) => handleInputChange(e, readingPop)}
                        />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            name="reading1"
                            onChange={(e) => handleInputChange(e, readingPop)}
                          />

                        </td>
                      </tr>
                      <tr>
                        <td>READING 2</td>
                        <td><input
                          type="date"
                          className="form-control"
                          name="r2Date"
                          onChange={(e) => handleInputChange(e, readingPop)}
                        />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            name="reading2"
                            onChange={(e) => handleInputChange(e, readingPop)}
                          />

                        </td>
                      </tr>
                      <tr>
                        <td>READING 3</td>
                        <td><input
                          type="date"
                          className="form-control"
                          name="r3Date"
                          onChange={(e) => handleInputChange(e, readingPop)}
                        />
                        </td>
                        <td>
                          <input
                            type="number"
                            className="form-control"
                            name="reading3"
                            onChange={(e) => handleInputChange(e, readingPop)}
                          />

                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Grid>
            </Grid>

          </Fragment>

        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReadingPop(null)} className="bg-light text-primary">
            Cancel
          </Button>
          <Button className="bg-primary text-white" onClick={() => setReadingPop(null)}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <form onSubmit={addSiteCheckSurvey}>
      <Grid container >
        <Grid sm={4}>
          <Typography variant="h6" gutterBottom>
            Water - Outlet Temperature - Tests <Chip color={completed ? 'success' : 'warning'} label={completed ? 'Closed' : 'Open'} />
          </Typography>
        </Grid>
        <Grid sm={4}>

        </Grid>
        <Grid sm={4}>
          {!completed &&
            <button
              style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
              className="btn btn-primary btn-light"
              onClick={() => {
                const uformData = [...formData];
                uformData.push({});
                setFormData(uformData)
              }}
            >
              Record New
            </button>}

        </Grid>

        <Grid sm={12}>
          <div className="table-responsive">
            <table className="table table-bordered f-11">
              <thead className="table-dark">
                <tr>
                  <th scope="col">Asset</th>
                  <th scope="col">Outlet Type</th>
                  <th scope="col">Temperature</th>
                  <th scope="col">Norm Run Time</th>
                  <th scope="col">Usage Frequency</th>
                  <th scope="col">Floor</th>
                  <th scope="col">Room</th>
                  <th scope="col">Readings</th>
                  <th scope="col"></th>
                </tr>
              </thead>
              <tbody>
                {formData.map((d, idx) => {
                  const assetName = siteAssets.filter(a => a.assetId == formData[idx].assetId).map(option => option.assetName + " - " + option.category)?.[0];
                  return (
                    <tr>
                      <td>
                        {completed && <input type="text"
                          disabled={completed}
                          className="form-control"
                          value={assetName} />}
                        {!completed && <Autocomplete
                          id="assetId"
                          disabled={completed}
                          onChange={(event, item) => {
                            const uformData = [...formData]
                            uformData[idx].assetId = item?.key;
                            setFormData(uformData);
                          }}

                          options={siteAssets.map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}
                          getOptionLabel={(option) => option.label}
                          renderInput={(params) => (
                            <div ref={params.InputProps.ref} >

                              <input type="text"
                                {...params.inputProps}
                                required
                                disabled={completed} className="form-control" />
                            </div>

                          )}
                        />
                        }
                      </td>
                      <td>
                        <select
                          disabled={completed}
                          name="outletType"
                          className="form-control form-select"
                          id="outletType"
                          value={formData?.[idx]?.outletType}
                          required
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select Outlet Type</option>
                          {outletoptions.map(option => (<option value={option}>{option}</option>))}

                        </select>
                      </td>
                      <td>
                        <select
                          disabled={completed}
                          name="temperature"
                          className="form-control form-select"
                          id="temperature"
                          required
                          value={formData?.[idx]?.temperature}
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select temperature</option>
                          {tempratureoptions.map(option => (<option value={option}>{option}</option>))}

                        </select>
                      </td>

                      <td style={{ width: '150px' }}>
                        <select
                          disabled={completed}
                          name="normalRunTime"
                          className="form-control form-select"
                          id="normalRunTime"
                          required
                          value={formData?.[idx]?.normalRunTime}
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select</option>
                          {normruntime.map(option => (<option value={option}>{option}</option>))}

                        </select>
                      </td>
                      <td>
                        <select
                          disabled={completed}
                          name="usageFrequency"
                          className="form-control form-select"
                          id="usageFrequency"
                          required
                          value={formData?.[idx]?.usageFrequency}
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select frequency</option>
                          <option value="None">None</option>
                          <option value="Daily">Daily</option>
                          <option value="Weekly">Weekly</option>
                          <option value="Monthly">Monthly</option>
                          <option value="Yearly">Yearly</option>

                        </select>
                      </td>
                      <td>
                        <select
                          disabled={completed}
                          className="form-control form-select"
                          name="floor"
                          value={formData?.[idx]?.floor}
                          required
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select </option>
                          {siteLayout.filter(site => site.nodeType === "floor").map(site =>
                          (
                            <option value={site.id}>{site.nodeName} </option>
                          ))
                          }
                        </select>
                      </td>
                      <td>
                        <select
                          disabled={completed}
                          className="form-control form-select"
                          name="room"
                          value={formData?.[idx]?.room}
                          required
                          onChange={(e) => handleInputChange(e, idx)}
                        >
                          <option value="">Select </option>
                          {siteLayout.filter(site => site.nodeType === "room").map(site =>
                          (
                            <option value={site.id}>{site.nodeName} </option>
                          ))
                          }
                        </select>
                      </td>
                      <td style={{ width: '200px' }}>
                        <p style={{ lineHeight: '3px' }}>1st : {formData?.[idx]?.reading1 ?? ""} {formData?.[idx]?.r1Date ? "("+String(formData?.[idx]?.r1Date)?.substring(0, 10)+")" : "N/A"}</p>
                        <p style={{ lineHeight: '3px' }}>2nd : {formData?.[idx]?.reading2 ?? ""} {formData?.[idx]?.r2Date ? "(" + String(formData?.[idx]?.r2Date)?.substring(0, 10) + ")" : "N/A"}</p>
                        <p style={{ lineHeight: '3px' }}>3rd : {formData?.[idx]?.reading3 ?? ""} {formData?.[idx]?.r3Date ? "(" + String(formData?.[idx]?.r3Date)?.substring(0, 10) + ")" : "N/A"}</p>
                      </td>

                      <td style={{ width: '90px' }}>
                        <button
                          disabled={completed}
                          className="btn btn-sm btn-light text-dark"
                          onClick={() => {
                            setReadingPop(idx)
                          }}
                        >
                          <i className="fas fa-chart-line"></i>
                        </button>
                        &nbsp;
                        &nbsp;
                        <button
                          disabled={completed}
                          className="btn btn-sm btn-light text-dark"
                          onClick={() => {
                            const uformData = [...formData];
                            uformData.splice(idx, 1);
                            setFormData(uformData)
                          }}
                        >
                          <i className="fas fa-trash"></i>
                        </button>
                      </td>
                    </tr>
                  )
                }
                )}
              </tbody>
            </table>
          </div>

        </Grid>
        {!completed && <Grid sm={12}>

          <button
            style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
            className="btn btn-primary text-white pr-2"
              //onClick={() => { addSiteCheckSurvey() }}
              type="submit"
          >
            Save
          </button>
        </Grid>}
        </Grid>
        </form>
    </>
  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, { getSiteAssets, getSiteLayout })(
  SurveyWaterOutletTemperature
);

