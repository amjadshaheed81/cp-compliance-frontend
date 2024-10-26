import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, put, uploadSiteCheckDoc } from "../../../../api";
import {
  Grid, TextField, Checkbox, Typography, Box, IconButton, FormGroup, Select, InputLabel, FormControl, FormControlLabel,
  Accordion, Chip, AccordionSummary, AccordionDetails, Card, CardContent, Autocomplete
} from '@mui/material';
import { UploadFile, Close, ExpandMore } from '@mui/icons-material';
import { deleteUser, getSites, getUsers, getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";

const AssessmentFireRisk = ({ sasToken, checkId,subType, siteAssets, getSiteAssets, siteSelectedForGlobal, getSiteLayout, siteLayout }) => {
  const [risks, setrisks] = useState([0, 0, 0, 0])
  const [quest, setquest] = useState([]);
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    getQuestions();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId)
    }
  }, []);

  // const defaultQuestions = [
  //   {
  //     q: "Are all means of escape free from combustible and other storage?",
  //     s: "Open"
  //   },
  //   {
  //     q: "Are sufficiently robust and applicable systems in place for the safe storage and use of flammable substances?",
  //     s: "Closed"
  //   },
  //   {
  //     q: "Are all means of escape free from combustible and other storage?",
  //     s: "Open"
  //   },
  //   {
  //     q: "All means provided to ensure adequate Means Of Escape (other than floors walls and ceilings, see above) must be properly maintained",
  //     s: "Open"
  //   },
  //   {
  //     q: "Is the building provided with signs and notices in accordance with the Signs and Signals Regulations 1996?",
  //     s: "Open"
  //   },
  //   {
  //     q: "Were there is a need for a degree of fire resistance, are doors provided constructed in accordance with relevant part of B.S. 476?",
  //     s: "Open"
  //   },
  //   {
  //     q: "Is emergency lighting provided and maintained in accordance with B.S.5266: 2003?",
  //     s: "Open"
  //   },
  //   {
  //     q: "Is the building provided with fire fighting equipment in compliance with B.S 5306, Part 3?",
  //     s: "Open"
  //   },
  //   {
  //     q: "Are all means of escape free from combustible and other storage?",
  //     s: "Open"
  //   },
  // ]

  // const temp = async () => {
  //   for (let d of defaultQuestions) {
  //     const data = {
  //       question: d.q,
  //       category: "assessment-fire-risk"
  //     }
  //     await post("/api/site-check/assessment/questions", data)
  //   }


  // }

  const getQuestions = async () => {
    const questionsFromDB = await get("/api/site-check/assessment/questions/"+subType)
    const questionsResponse = await get("/api/site-check/assessment/response/" + checkId)
    questionsFromDB.forEach(q => {
      const resIdx = questionsResponse.findIndex(r => r.qid === q.qid);
      if (resIdx >= 0) {
        q.status = "Closed";
        q.response = questionsResponse[resIdx]
        q.completed = true
      } else {
        q.status = "Open";
        q.response = {}
        q.completed = false
      }
    })
    const risksN = [0, 0, 0, 0]
    questionsResponse.forEach(r => {
      if (r.totalRiskScore > 17) {
        risksN[0] = risksN[0] + 1;
      } else if (r.totalRiskScore > 10) {
        risksN[1] = risksN[1] + 1;
      } else if (r.totalRiskScore > 5) {
        risksN[2] = risksN[2] + 1;
      } else {
        risksN[3] = risksN[3] + 1;
      }

    })
    setrisks(risksN)
    const body = {
      riskScoreRed: risksN[0],
      riskScoreAmber: risksN[1],
      riskScoreYellow: risksN[2],
      riskScoreGreen: risksN[3],
    }
    await put("/api/site-check/" + checkId, body);
    setquest(questionsFromDB);
  }




  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uquest = [...quest]
    const udata = {
      ...quest[idx].response,
      [name]: value,
    }
    uquest[idx].response = udata
    setquest(uquest);
  };

  const setResponseCheck = (e, idx) => {
    if (e.target.checked) {
      const uquest = [...quest]
      const udata = {
        ...quest[idx].response,
        response: "Yes"
      }
      uquest[idx].response = udata
      setquest(uquest);
    }
  };

  const setResponseCheck2 = (e, idx) => {
    if (e.target.checked) {
      const uquest = [...quest]
      const udata = {
        ...quest[idx].response,
        response: "No"
      }
      uquest[idx].response = udata
      setquest(uquest);
    }
  };

  const handleFileChange = (e, idx) => {
    const uquest = [...quest]
    uquest[idx].response.file = e.target.files[0]
    setquest(uquest);
  };

  const handleFileDelete = (idx) => {
    const uquest = [...quest]
    uquest[idx].response.file = null
    setquest(uquest);
  };

  const saveAssessmentResponse = async (event, index) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const dataToSave = quest[index].response;
    if (dataToSave?.file?.name) {
      dataToSave.siteId = siteSelectedForGlobal?.siteId;
      dataToSave.file = await uploadSiteCheckDoc(dataToSave);
    }
    dataToSave.responseDate = new Date();
    dataToSave.checkId = checkId;
    dataToSave.qid = quest[index].qid;
    dataToSave.status = "Closed";
    dataToSave.totalRiskScore = Number(dataToSave.consequence ?? 0) * Number(dataToSave.likelihood ?? 0)
    await post("/api/site-check/assessment/response", dataToSave);
    await getQuestions();
    toast.success("Assessment response saved")
  }


  return (

    <Box p={3}>
      <Card>
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid item>
              <Typography variant="h6">Questions</Typography>
            </Grid>
            <Grid item>
              <Box display="flex" alignItems="center">
                <Typography variant="body1" style={{ backgroundColor: '#E0E7FF', padding: '4px 8px', borderRadius: '4px' }}>
                  Total: {quest.length}, Open: {quest.filter(q => q.status === "Open").length}, Closed: {quest.filter(q => q.status === "Closed").length}
                </Typography>
                <Box ml={2} display="flex" alignItems="center">
                  <Box width={24} height={24} bgcolor="#F44336" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    {/* <Typography variant="body2" color="white">{risks[0]}</Typography> */}
                    <span className="badge bg-danger p-2 m-1 risk-span">
                      {risks[0]}
                    </span>
                   
                   
                  
                  </Box>
                  <Box width={24} height={24} bgcolor="#FF9800" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    {/* <Typography variant="body2" color="white">{risks[1]}</Typography> */}
                    <span className="badge bg-warning p-2 m-1 risk-span">
                      {risks[1]}
                    </span>
                  </Box>
                  <Box width={24} height={24} bgcolor="#FFEB3B" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    {/* <Typography variant="body2" color="white">{risks[2]}</Typography> */}
                    <span className="badge bg-info p-2 m-1 risk-span">
                      {risks[2]}
                    </span>
                  </Box>
                  <Box width={24} height={24} bgcolor="#4CAF50" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    {/* <Typography variant="body2" color="white">{risks[3]}</Typography> */}
                    <span className="badge bg-success p-2 m-1 risk-span">
                      {risks[3]}
                    </span>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>

          {quest.map((q, idx) =>
            <Accordion defaultExpanded={idx === openIndex} >
              <AccordionSummary expandIcon={<ExpandMore />} >
                <Typography>Q{idx + 1}. {q.question}
                  <Checkbox disabled={quest[idx]?.completed} checked={quest[idx]?.response?.response === "Yes"} onChange={(e)=>setResponseCheck(e, idx)}/> Yes
                  <Checkbox disabled={quest[idx]?.completed} checked={quest[idx]?.response?.response === "No"} onChange={(e) => setResponseCheck2(e, idx)} /> No
                </Typography> 
                &nbsp;&nbsp;&nbsp;&nbsp;<Chip style={{ margin: '5px', marginLeft: '30px'}} color={q.status === "Closed" ? "success" : "primary"} label={q.status} />
              </AccordionSummary>
              {quest[idx]?.response?.response === "No" && <AccordionDetails>
                <form onSubmit={(e) => {
                  setOpenIndex(idx + 1);
                  saveAssessmentResponse(e, idx);
                }}>
                  <Grid container spacing={2}>
                    {/* <Grid item xs={6}>
                      <label htmlFor="response" name="response">
                        Response
                      </label>
                      <select
                        disabled={quest[idx]?.completed}
                        className="form-control form-select"
                        name="response"
                        required
                        value={quest[idx]?.response?.response}
                        onChange={(e) => handleInputChange(e, idx)}
                      >
                        <option value="">Select </option>
                        {["Yes", "No"].map((num) => (
                          <option value={num}>{num} </option>
                        ))}
                      </select>

                    </Grid> */}
                    <Grid item xs={12} sm={6}>
                      <label htmlFor="riskType" name="riskType">
                        Internal/External
                      </label>
                      <select
                        disabled={quest[idx]?.completed}
                        className="form-control form-select"
                        name="riskType"
                        required

                        onChange={(e) => handleInputChange(e, idx)}
                        value={quest[idx]?.response?.riskType}
                      >
                        <option value="">Select </option>
                        {["Internal", "External"].map((num) => (
                          <option value={num}>{num} </option>
                        ))}
                      </select>

                    </Grid>
                    <Grid item xs={12} sm={6}>

                      <label htmlFor="floor" name="floor">
                        Floor
                      </label>
                      <select
                        disabled={quest[idx]?.completed}
                        className="form-control form-select"
                        name="floor"
                        required
                        value={quest[idx]?.response?.floor}

                        onChange={(e) => handleInputChange(e, idx)}
                      >
                        <option value="">Select </option>
                        {siteLayout.filter(site => site.nodeType === "floor").map(site =>
                        (
                          <option value={site.id}>{site.nodeName} </option>
                        ))
                        }
                      </select>

                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <label htmlFor="room" name="room">
                        Room
                      </label>
                      <select
                        disabled={quest[idx]?.completed}
                        className="form-control form-select"
                        name="room"
                        required
                        value={quest[idx]?.response?.room}
                        onChange={(e) => handleInputChange(e, idx)}
                      >
                        <option value="">Select </option>
                        {siteLayout.filter(site => site.nodeType === "room").map(site =>
                        (
                          <option value={site.id}>{site.nodeName}</option>
                        ))
                        }
                      </select>

                    </Grid>
                    <Grid item xs={12}>
                      <label htmlFor="position" name="position">
                        Observation
                      </label>
                      <textarea
                        disabled={quest[idx]?.completed}
                        name="position"
                        className="form-control"
                        id="position"
                        rows="4"
                        required
                        placeholder="Enter notes..."
                        value={quest[idx]?.response?.position}
                        onChange={(e) => handleInputChange(e, idx)}
                        style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                        disabled={quest[idx]?.completed}
                        multiple
                        onChange={(event, item) => {
                          const uquest = [...quest]
                          uquest[idx].response = {
                            ...uquest[idx].response,
                            assets: item.map(i => i.key).join(",")
                          }
                          setquest(uquest);
                        }}
                        value={siteAssets.filter(s => quest[idx]?.response?.assets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}

                        options={siteAssets.map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}
                        getOptionLabel={(option) => option.label}

                        renderInput={(params) => (
                        
                          <TextField
                            //required
                            {...params}
                            variant="outlined"
                            label="Search Asset"
                          />
                        )}
                      />
                    </Grid>

                    <Grid item xs={12}>
                      <label htmlFor="action" name="action">
                        Suggested Action
                      </label>
                      <textarea
                        disabled={quest[idx]?.completed}
                        name="action"
                        required
                        className="form-control"
                        id="action"
                        rows="4"
                        placeholder="Enter notes..."
                        value={quest[idx]?.response?.action}
                        onChange={(e) => handleInputChange(e, idx)}
                        style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      {!quest[idx]?.completed &&
                        <Box
                          display="flex"
                          alignItems="center"
                          justifyContent="center"
                          border="1px dashed grey"
                          p={2}
                          mb={2}
                          style={{
                            backgroundColor: '#f9f9f9',
                            height: '150px',
                            borderRadius: '4px',
                            color: '#3f51b5',
                          }}
                        >
                          <IconButton component="label">
                            <input hidden type="file" onChange={(e) => handleFileChange(e, idx)} />
                            <UploadFile />
                          </IconButton>
                          <Typography>
                            Click to upload or drag and drop PNG/JPG (max, 1MB)
                          </Typography>
                        </Box>
                      }

                    </Grid>
                    {!quest[idx]?.completed && quest[idx]?.response?.file && (
                      <Grid item xs={12} container alignItems="center" >
                        <Chip
                          label={quest[idx]?.response?.file?.name}
                          onDelete={() => handleFileDelete(idx)}

                        />

                      </Grid>
                    )}

                    <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Risk Score Card (<strong>Total Risk Score = {(quest[idx]?.response?.consequence ?? 0) * (quest[idx]?.response?.likelihood ?? 0)}</strong>)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Grid item xs={12} sm={12}>
                            <label htmlFor="consequence" name="consequence">
                              Consequence
                            </label>
                            <select
                              required
                              disabled={quest[idx]?.completed}
                              className="form-control form-select"
                              name="consequence"
                              value={quest[idx]?.response?.consequence}
                              onChange={(e) => handleInputChange(e, idx)}
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
                              disabled={quest[idx]?.completed}
                              className="form-control form-select"
                              name="likelihood"
                              value={quest[idx]?.response?.likelihood}
                              onChange={(e) => handleInputChange(e, idx)}
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
                              height: '290px',
                              marginTop: '-70px'
                            }}
                          >
                            <img
                              src="/RiskScore.png"
                              alt="Risk Score Matrix"
                              style={{ width: '100%', height: '100%' }}
                            />
                          </Box>
                        </Grid>
                      </Grid>
                    </Grid>
                    {!quest[idx]?.completed &&
                      <Grid item xs={12}>

                        <button
                          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                          className="btn btn-primary text-white pr-2"
                          
                          type="submit"
                        >
                          Save & Continue
                        </button>
                        <button
                          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                          className="btn btn-primary btn-light"
                        >
                          Cancel
                        </button>


                      </Grid>}
                    {quest[idx]?.completed && quest[idx]?.response?.file && <Grid item xs={12}>
                      <a href={quest[idx]?.response?.file + "?" + sasToken} target="_blank">
                        <button
                          style={{ float: 'right' }}
                          disabled={quest[idx]?.response?.completed}
                          className="btn btn-sm btn-light text-dark"
                        >
                          <i className="fas fa-download" />&nbsp;Download Attachment
                        </button>
                      </a></Grid>}
                  </Grid>
                </form>
              </AccordionDetails>}
            </Accordion>
          )}
        </CardContent>
      </Card>
    </Box>

  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  users: state.site.users,
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, { getSiteAssets, deleteUser, getSites, getSiteLayout })(
  AssessmentFireRisk
);

