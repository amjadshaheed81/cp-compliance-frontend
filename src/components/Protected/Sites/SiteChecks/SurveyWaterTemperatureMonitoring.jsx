import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { get, post, put } from "../../../../api";
import DatePicker from "../../../common/DatePicker";
import CircularProgress from "@mui/material/CircularProgress";
import moment from "moment";
import {
  Button,
  Chip,
  DialogContent,
  DialogTitle,
  DialogActions,
  Dialog,
  Typography,
  Grid,
  Autocomplete,
  Box,
} from "@mui/material";
import { getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";
import { blueGrey } from "@mui/material/colors";

const SurveyWaterTemperatureMonitoring = ({
  checkId,
  siteAssets,
  siteLayout,
  getSiteAssets,
  siteSelectedForGlobal,
  getSiteLayout,
  loggedInUserData,
  repeatFrequency
}) => {
  const navigate = useNavigate();
  const [outletoptions, setoutletoptions] = useState([]);
  const [tempratureoptions, settempratureoptions] = useState([]);
  const [action, setAction] = useState(false);
  const [action2, setAction2] = useState(false);
  const [normruntime, setnormruntime] = useState([]);
  const [readingPop, setReadingPop] = useState(null);
  const [showHistory, setShowHistory] = useState(null);
  const [formData, setFormData] = useState([{}]);
  const [formData2, setFormData2] = useState({});
  const [completed, setCompleted] = useState(false);
  const [alldata, setalldata] = useState([]);
  const [isLoading, setIsLoading] = useState(false);


  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId);
    }
    getSurvey();
  }, []);

  const getSurvey = async () => {
    setIsLoading(true);
    const outlettypes = await get("/api/lov/SITE_CHECK_SURVEY_OUTLET_TYPE");
    setoutletoptions(outlettypes.map((l) => l.lovValue));
    const tempratureoptionstypes = await get(
      "/api/lov/SITE_CHECK_SURVEY_TEMPRATURE"
    );
    settempratureoptions(tempratureoptionstypes.map((l) => l.lovValue));
    const normruntimetypes = await get(
      "/api/lov/SITE_CHECK_SURVEY_NORM_RUN_TIME"
    );
    setnormruntime(normruntimetypes.map((l) => l.lovValue));
    let data = await get("/api/site-check/water-outlet-temp/" + checkId);
    if (data.length > 0) {
      data.forEach((_) => {
        _.completed = true;
      });
      setalldata(data);
      //data = data.reverse();
      data = removeduplciate(data);
      setFormData(data);
    }
    setIsLoading(false);
  };

  const removeduplciate = (array) => {
    const seen = new Map();

    return array.filter((item) => {
      const key = `${item.assetId}-${item.outletType}-${item.temperature}-${item.normalRunTime}-${item.floor}-${item.room}`;
      //check for date
      if (!seen.has(key)) {
        seen.set(key, true);
        return true;
      }
      return false;
    });
  };

  const isDuplicate = (newItem) => {
    const completedItems = formData.filter((item) => item.completed);
    return (
      completedItems.filter(
        (i) =>
          newItem?.assetId === i?.assetId &&
          newItem?.floor === i?.floor &&
          newItem?.normalRunTime === i?.normalRunTime &&
          newItem?.outletType === i?.outletType &&
          newItem?.temperature === i?.temperature &&
          newItem?.room === i?.room
      )?.length > 0
    );
  };

  useEffect(() => {
    formData.forEach((item, idx) => {
      if (!item.completed) {
        if (isDuplicate(item)) {
          toast.error("Duplicate item found:");
        }
      }
    });
  }, [formData]);

  const getName = (idx) => {
    let res = "";
    const floor = siteLayout.filter(
      (s) => String(s.id) === String(formData[idx]?.floor)
    );
    const room = siteLayout.filter(
      (s) => String(s.id) === String(formData[idx]?.room)
    );
    if (floor.length > 0) {
      res = res + floor[0].nodeName;
    }
    if (room.length > 0) {
      res = res + " > " + room[0].nodeName;
    }
    return res;
  };

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uformData = [...formData];
    const udata = {
      ...formData[idx],
      [name]: value,
      update: true,
    };
    uformData[idx] = udata;
    setFormData(uformData);
  };

  const handleInputChange2 = (e) => {
    const { name, value } = e.target;
    const udata = {
      ...formData2,
      [name]: value
    };
    setFormData2(udata);
  };

  useEffect(() => {
    setAction(false);
    setAction2(false);
  }, []);

  const addSiteCheckSurvey = async (event) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    for (const data of formData) {
      if (!data.completed || data.update) {
        if (isDuplicate(data) && !data.update) {
          toast.error("Duplicate data!!!");
          return;
        }
        data.checkId = checkId;
        data.status = "Open";
        if (data.update) {
          data.id = undefined;
        }
        if (data.r1Date) {
          //data.r1Date = new Date(data.r1Date.toISOString().slice(0, 10));
          data.r2Date = data.r1Date;
          data.r3Date = data.r1Date;
        }
        await post("/api/site-check/water-outlet-temp", data);
        toast.success("Water outlet temperature data saved.");
      }
    }
    getSurvey();
  };

  const addReadingSave = (event) => {
    event.preventDefault();

    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const isReading1ok =
      (formData?.[readingPop]?.temperature === "Hot" &&
        Number(formData[readingPop].reading1) < 50) ||
      (formData?.[readingPop]?.temperature === "Cold" &&
        Number(formData[readingPop].reading1) > 20);
    const isReading2ok =
      (formData?.[readingPop]?.temperature === "Hot" &&
        Number(formData[readingPop].reading2) < 50) ||
      (formData?.[readingPop]?.temperature === "Cold" &&
        Number(formData[readingPop].reading2) > 20);
    const isReading3ok =
      (formData?.[readingPop]?.temperature === "Hot" &&
        Number(formData[readingPop].reading3) < 50) ||
      (formData?.[readingPop]?.temperature === "Cold" &&
        Number(formData[readingPop].reading3) > 20);
    if (!isReading1ok && !isReading2ok && !isReading3ok) {
      setReadingPop(null);
      setAction(false);
      setAction2(false);
      addSiteCheckSurvey(event);
      return;
    }
    if (action2) {
      setReadingPop(null);
      setAction(false);
      setAction2(false);
      addSiteCheckSurvey(event);
      const body = {
        type: "Survey",
        status: "Reported",
        observation: formData2.observation,
        desc: `Surevy Water - Outlet Temprature - ${moment(new Date()).format("DD/MM/YYYY")}`,
        requiredAction: formData2.requiredAction,
        riskScore: Number(formData2.likelihood) * Number(formData2.consequence),
        dueDate: new Date(),
        siteId: siteSelectedForGlobal?.siteId,
        userId: loggedInUserData?.id,
      }
    put("/api/site/actions", body);
    } else if (action && !action2) {
      setReadingPop(null);
      setAction2(false);
      setAction(false);
      addSiteCheckSurvey(event);
    } else {
      setAction2(false);
      setAction(true);
    }
  };

  const dateFormat = (date) => {
    return moment(date, "YYYY-MM-DD").format("DD/MM/YYYY");
  };

  const dateFormatFromFrequency = (date) => {
    let daysToAdd = 0;
    if(repeatFrequency === "Daily") {
      daysToAdd = 1
    } else  if(repeatFrequency === "Weekly") {
      daysToAdd = 7
    } else if(repeatFrequency === "Monthly") {
      daysToAdd = 30
    } else if(repeatFrequency === "Yearly") {
      daysToAdd = 365
    }
    return moment(date, "YYYY-MM-DD").add('days', daysToAdd).format("DD/MM/YYYY");
  };


  return (
    <>
      <Dialog
        open={readingPop !== null}
        onClose={() => {
          setReadingPop(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <form onSubmit={addReadingSave}>
          <DialogTitle>
            Add Reading{" "}
            {formData[readingPop]?.assetId
              ? "(" +
                siteAssets
                  .filter((a) => a.assetId == formData[readingPop].assetId)
                  .map(
                    (option) => option.assetName + " - " + option.category
                  )[0] +
                ")"
              : ""}
          </DialogTitle>
          <DialogContent dividers>
            <Fragment>
              <Grid container>
                {!action2 && !action && (
                  <>
                    <Grid sm={4}>
                      <label htmlFor="outletType">Outlet Type</label>
                      <input
                        style={{ maxWidth: "300px" }}
                        type="text"
                        className="form-control"
                        id="outletType"
                        disabled
                        value={formData?.[readingPop]?.outletType}
                      />
                    </Grid>
                    <Grid sm={4}>
                      <label htmlFor="outletType">Temperature</label>
                      <input
                        style={{ maxWidth: "300px" }}
                        type="text"
                        className="form-control"
                        id="outletType"
                        disabled
                        value={formData?.[readingPop]?.temperature}
                      />
                    </Grid>
                    <Grid sm={4}>
                      <label htmlFor="outletType">Location</label>
                      <input
                        style={{ maxWidth: "300px" }}
                        type="text"
                        className="form-control"
                        id="outletType"
                        disabled
                        value={getName(readingPop)}
                      />
                    </Grid>
                    <Grid sm={12}>
                      <div
                        className="table-responsive"
                        style={{ marginTop: "30px" }}
                      >
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
                              <td>
                                Reading 1{" "}
                                <b style={{ color: "red" }}> 30 seconds </b>
                              </td>
                              <td
                                rowSpan={3}
                                style={{ verticalAlign: "middle" }}
                              >
                                <DatePicker
                                  value={
                                    formData?.[readingPop]?.update
                                      ? formData?.[readingPop]?.r1Date
                                      : null
                                  }
                                  onChange={(date) => {
                                    const uformData = [...formData];
                                    const udata = {
                                      ...formData[readingPop],
                                      r1Date: new Date(
                                        date.getTime() -
                                          date.getTimezoneOffset() * 60000
                                      ).toISOString(),
                                      update: true,
                                    };
                                    uformData[readingPop] = udata;
                                    setFormData(uformData);
                                  }}
                                />
                                {/* // <input
                              //   type="date"
                              //   className="form-control"
                              //     name="r1Date"
                              //     required
                              //   onChange={(e) => handleInputChange(e, readingPop)}
                              // /> */}
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  name="reading1"
                                  required
                                  style={{
                                    color:
                                      (formData?.[readingPop]?.temperature ===
                                        "Hot" &&
                                        Number(formData[readingPop].reading1) <
                                          50) ||
                                      (formData?.[readingPop]?.temperature ===
                                        "Cold" &&
                                        Number(formData[readingPop].reading1) >
                                          20)
                                        ? "red"
                                        : "green",
                                    fontWeight: "600",
                                  }}
                                  onChange={(e) =>
                                    handleInputChange(e, readingPop)
                                  }
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>
                                {" "}
                                <b style={{ color: "red" }}> 60 seconds </b>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className="form-control"
                                  name="reading2"
                                  required
                                  style={{
                                    color:
                                      (formData?.[readingPop]?.temperature ===
                                        "Hot" &&
                                        Number(formData[readingPop].reading2) <
                                          50) ||
                                      (formData?.[readingPop]?.temperature ===
                                        "Cold" &&
                                        Number(formData[readingPop].reading2) >
                                          20)
                                        ? "red"
                                        : "green",
                                    fontWeight: "600",
                                  }}
                                  onChange={(e) =>
                                    handleInputChange(e, readingPop)
                                  }
                                />
                              </td>
                            </tr>
                            <tr>
                              <td>
                                Reading 3{" "}
                                <b style={{ color: "red" }}> 120 seconds </b>
                              </td>
                              <td>
                                <input
                                  type="number"
                                  required
                                  className="form-control"
                                  name="reading3"
                                  style={{
                                    color:
                                      (formData?.[readingPop]?.temperature ===
                                        "Hot" &&
                                        Number(formData[readingPop].reading3) <
                                          50) ||
                                      (formData?.[readingPop]?.temperature ===
                                        "Cold" &&
                                        Number(formData[readingPop].reading3) >
                                          20)
                                        ? "red"
                                        : "green",
                                    fontWeight: "600",
                                  }}
                                  onChange={(e) =>
                                    handleInputChange(e, readingPop)
                                  }
                                />
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </Grid>
                  </>
                )}
                {action && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Action
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <button
                          type="button"
                          className="btn btn-sm btn-danger text-light"
                          onClick={() => {
                            setAction2(true);
                            setAction(false);
                          }}
                        >
                          <i className="fas fa-circle-exclamation" /> Add Action
                        </button>
                      </Grid>
                    </Grid>
                  </Grid>
                )}
                {action2 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Action
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Grid item xs={12} sm={12}>
                          <label htmlFor="consequence" name="consequence">
                            Consequence
                          </label>
                          <select
                            required
                            className="form-control form-select"
                            name="consequence"
                            onChange={(e) => handleInputChange2(e)}
                          >
                            <option value="">Select </option>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option value={num}>{num} </option>
                            ))}
                          </select>
                        </Grid>
                        <Grid item xs={12} sm={12}>
                          <label htmlFor="likelihood" name="likelihood">
                            Likelihood
                          </label>
                          <select
                            required
                            className="form-control form-select"
                            name="likelihood"
                            onChange={(e) => handleInputChange2(e)}
                          >
                            <option value="">Select </option>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <option value={num}>{num} </option>
                            ))}
                          </select>
                        </Grid>
                      </Grid>
                      <Grid item xs={12} sm={8}>
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          p={2}
                          mb={2}
                          style={{
                            height: "290px",
                            marginTop: "-20px",
                          }}
                        >
                          <img
                            src="/RiskScore.png"
                            alt="Risk Score Matrix"
                            style={{ width: "100%", height: "100%" }}
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <label htmlFor="observation" name="observation">
                          Observation
                        </label>
                        <textarea
                          //disabled={quest[idx]?.completed}
                          name="observation"
                          className="form-control"
                          id="observation"
                          rows="2"
                          required
                          onChange={(e) => handleInputChange2(e)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            margin: "8px 0",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <label htmlFor="requiredAction" name="requiredAction">
                          Required Action
                        </label>
                        <textarea
                          name="requiredAction"
                          className="form-control"
                          id="requiredAction"
                          rows="2"
                          required
                          onChange={(e) => handleInputChange2(e)}
                          style={{
                            width: "100%",
                            padding: "10px",
                            margin: "8px 0",
                            borderRadius: "4px",
                            border: "1px solid #ccc",
                          }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Fragment>
          </DialogContent>
          <DialogActions>
            <Button
              type="cancel"
              onClick={() => setReadingPop(null)}
              className="bg-light text-primary"
            >
              Cancel
            </Button>
            <button
              type="submit"
              //onClick={addReadingSave}
              style={{
                width: "150px",
                marginBottom: "20px",
                margin: "10px",
                float: "right",
              }}
              className="btn btn-primary text-white pr-2"
            >
              Save
            </button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog
        open={showHistory !== null}
        onClose={() => {
          setShowHistory(null);
        }}
        maxWidth="lg"
        fullWidth
      >
        <DialogTitle>Reading History</DialogTitle>
        <DialogContent dividers>
          <Fragment>
            <Grid container>
              <Grid sm={12}>
                <div className="table-responsive" style={{ marginTop: "30px" }}>
                  <table className="table table-bordered f-11">
                    <thead className="table-dark">
                      <tr>
                        <th>Test Date</th>
                        <th>Expiry Date</th>
                        <th>Reading 1</th>
                        <th>Reading 2</th>
                        <th>Reading 3</th>
                      </tr>
                    </thead>
                    <tbody>
                      {alldata
                        ?.filter(
                          (a) =>
                            a.assetId === formData[showHistory]?.assetId &&
                            a.temperature ===
                              formData[showHistory]?.temperature &&
                            a.normalRunTime ===
                              formData[showHistory]?.normalRunTime &&
                            a.outletType ===
                              formData[showHistory]?.outletType &&
                            a.usageFrequency ===
                              formData[showHistory]?.usageFrequency &&
                            a.floor === formData[showHistory]?.floor &&
                            a.room === formData[showHistory]?.room
                        )
                        ?.map((i) => (
                          <tr>
                            <td>
                              {i?.r1Date
                                ? moment(i?.r1Date).format("DD/MM/YYYY")
                                : ""}
                            </td>
                            <td>
                              {i?.r1Date
                                ? dateFormatFromFrequency(
                                    i?.r1Date?.split("T")?.[0]
                                  )
                                : ""}
                            </td>
                            <td
                              style={{
                                color:
                                  (i?.temperature === "Hot" &&
                                    Number(i?.reading1) < 50) ||
                                  (i?.temperature === "Cold" &&
                                    Number(i?.reading1) > 20)
                                    ? "red"
                                    : "green",
                                fontWeight: "600",
                              }}
                            >
                              {i?.reading1}
                            </td>
                            <td
                              style={{
                                color:
                                  (i?.temperature === "Hot" &&
                                    Number(i?.reading1) < 50) ||
                                  (i?.temperature === "Cold" &&
                                    Number(i?.reading1) > 20)
                                    ? "red"
                                    : "green",
                                fontWeight: "600",
                              }}
                            >
                              {i?.reading2}
                            </td>
                            <td
                              style={{
                                color:
                                  (i?.temperature === "Hot" &&
                                    Number(i?.reading1) < 50) ||
                                  (i?.temperature === "Cold" &&
                                    Number(i?.reading1) > 20)
                                    ? "red"
                                    : "green",
                                fontWeight: "600",
                              }}
                            >
                              {i?.reading3}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </Grid>
            </Grid>
          </Fragment>
        </DialogContent>
        <DialogActions>
          <Button
            className="bg-primary text-white"
            onClick={() => {
              setShowHistory(null);
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <form onSubmit={addSiteCheckSurvey}>
        <Grid container>
          <Grid sm={4}>
            <Typography variant="h6" gutterBottom>
              Water - Outlet Temperature - Tests{" "}
              <Chip
                color={completed ? "success" : "warning"}
                label={"In progress"}
              />
            </Typography>
          </Grid>
          <Grid sm={4}></Grid>
          <Grid sm={4}>
            <button
              type="button"
              style={{
                width: "150px",
                marginBottom: "20px",
                margin: "10px",
                float: "right",
              }}
              className="btn btn-primary btn-light"
              onClick={(e) => {
                e.preventDefault();
                const uformData = [...formData];
                uformData.push({});
                setFormData(uformData);
              }}
            >
              Add outlet
            </button>
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
                {isLoading && (
                  <tr>
                  <td colSpan={9} align="center"><CircularProgress /></td>
                </tr>
            )}
            {!isLoading && 
                  formData.map((d, idx) => {
                    const isAllFilled =
                      formData[idx].assetId &&
                      formData?.[idx]?.outletType &&
                      formData?.[idx]?.temperature &&
                      formData?.[idx]?.normalRunTime &&
                      formData?.[idx]?.usageFrequency &&
                      formData?.[idx]?.floor &&
                      formData?.[idx]?.room;
                    const assetName = siteAssets
                      .filter((a) => a.assetId == formData[idx].assetId)
                      .map(
                        (option) => option.assetName + " - " + option.category
                      )?.[0];
                    return (
                      <tr key={idx}>
                        <td>
                          {formData?.[idx]?.completed ? (
                            <input
                              type="text"
                              disabled={formData?.[idx]?.completed}
                              className="form-control"
                              value={assetName}
                            />
                          ) : (
                            <Autocomplete
                              id="assetId"
                              disabled={formData?.[idx]?.completed}
                              onChange={(event, item) => {
                                const uformData = [...formData];
                                uformData[idx].assetId = item?.key;
                                setFormData(uformData);
                              }}
                              options={siteAssets.map((option) => ({
                                key: option.assetId,
                                label:
                                  option.assetName + " - " + option.category,
                              }))}
                              getOptionLabel={(option) => option.label}
                              renderInput={(params) => (
                                <div ref={params.InputProps.ref}>
                                  <input
                                    type="text"
                                    {...params.inputProps}
                                    required
                                    disabled={formData?.[idx]?.completed}
                                    className="form-control"
                                  />
                                </div>
                              )}
                            />
                          )}
                        </td>
                        <td>
                          <select
                            disabled={formData?.[idx]?.completed}
                            name="outletType"
                            className="form-control form-select"
                            id="outletType"
                            value={formData?.[idx]?.outletType}
                            required
                            onChange={(e) => handleInputChange(e, idx)}
                          >
                            <option value="">Select Outlet Type</option>
                            {outletoptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            disabled={formData?.[idx]?.completed}
                            name="temperature"
                            className="form-control form-select"
                            id="temperature"
                            required
                            value={formData?.[idx]?.temperature}
                            onChange={(e) => handleInputChange(e, idx)}
                          >
                            <option value="">Select temperature</option>
                            {tempratureoptions.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td style={{ width: "150px" }}>
                          <select
                            disabled={formData?.[idx]?.completed}
                            name="normalRunTime"
                            className="form-control form-select"
                            id="normalRunTime"
                            required
                            value={formData?.[idx]?.normalRunTime}
                            onChange={(e) => handleInputChange(e, idx)}
                          >
                            <option value="">Select</option>
                            {normruntime.map((option) => (
                              <option key={option} value={option}>
                                {option}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <select
                            disabled={formData?.[idx]?.completed}
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
                            disabled={formData?.[idx]?.completed}
                            className="form-control form-select"
                            name="floor"
                            value={formData?.[idx]?.floor}
                            required
                            onChange={(e) => handleInputChange(e, idx)}
                          >
                            <option value="">Select </option>
                            {siteLayout
                              .filter((site) => site.nodeType === "floor")
                              .map((site) => (
                                <option key={site.id} value={site.nodeName}>
                                  {site.nodeName}{" "}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td>
                          <select
                            disabled={formData?.[idx]?.completed}
                            className="form-control form-select"
                            name="room"
                            value={formData?.[idx]?.room}
                            required
                            onChange={(e) => handleInputChange(e, idx)}
                          >
                            <option value="">Select </option>
                            {siteLayout
                              .filter((site) => site.nodeType === "room")
                              .map((site) => (
                                <option key={site.id} value={site.nodeName}>
                                  {site.nodeName}{" "}
                                </option>
                              ))}
                          </select>
                        </td>
                        <td style={{ width: "200px" }}>
                          <p style={{ lineHeight: "3px" }}>
                            1st : {formData?.[idx]?.reading1 ?? ""}{" "}
                            {formData?.[idx]?.r1Date
                              ? "(" +
                                String(formData?.[idx]?.r1Date)?.substring(
                                  0,
                                  10
                                ) +
                                ")"
                              : "N/A"}
                          </p>
                          <p style={{ lineHeight: "3px" }}>
                            2nd : {formData?.[idx]?.reading2 ?? ""}{" "}
                            {formData?.[idx]?.r2Date
                              ? "(" +
                                String(formData?.[idx]?.r2Date)?.substring(
                                  0,
                                  10
                                ) +
                                ")"
                              : "N/A"}
                          </p>
                          <p style={{ lineHeight: "3px" }}>
                            3rd : {formData?.[idx]?.reading3 ?? ""}{" "}
                            {formData?.[idx]?.r3Date
                              ? "(" +
                                String(formData?.[idx]?.r3Date)?.substring(
                                  0,
                                  10
                                ) +
                                ")"
                              : "N/A"}
                          </p>
                        </td>

                        <td style={{ width: "120px" }}>
                          {isAllFilled && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light text-dark"
                              onClick={() => {
                                setReadingPop(idx);
                              }}
                            >
                              <i className="fas fa-chart-line"></i>
                            </button>
                          )}
                          &nbsp;
                          {isAllFilled && (
                            <button
                              type="button"
                              className="btn btn-sm btn-light text-dark"
                              onClick={() => {
                                setShowHistory(idx);
                              }}
                            >
                              <i className="fas fa-clock"></i>
                            </button>
                          )}
                          &nbsp;
                          <button
                            disabled={formData?.[idx]?.completed}
                            className="btn btn-sm btn-light text-dark"
                            onClick={() => {
                              const uformData = [...formData];
                              uformData.splice(idx, 1);
                              setFormData(uformData);
                            }}
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
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
    </>
  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { getSiteAssets, getSiteLayout })(
  SurveyWaterTemperatureMonitoring
);
