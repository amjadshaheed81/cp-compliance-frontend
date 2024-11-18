import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { get, post, put } from "../../../../api";
import {
  Grid, TextField, Typography, Box, Accordion, Chip, AccordionSummary, AccordionDetails, Card, CardContent, Autocomplete,
} from '@mui/material';
import { ExpandMore } from '@mui/icons-material';
import { getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";

const SurveyWaterDomesticRA = ({ checkId, siteAssets, getSiteAssets, siteSelectedForGlobal, getSiteLayout }) => {
  const navigate = useNavigate();

  const [risks, setrisks] = useState([0, 0, 0, 0])
  const [totalrisks, settotalrisks] = useState(0)
  const [scoreoptions, setscoreoptions] = useState(null);


  useEffect(() => {
    
    getRiskFactor();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId)
    }
  }, []);

  // const defaultQuestions = [
  //   {
  //     q: "Make up water source to system",
  //     s: 1
  //   },
  //   {
  //     q: "Pre-treatment (softening etc.)",
  //     s: 1
  //   },
  //   {
  //     q: "Storage tank orientation",
  //     s: 1
  //   },
  //   {
  //     q: "Tank fitting orientation",
  //     s: 0
  //   },
  //   {
  //     q: "Tank internal condition",
  //     s: 0
  //   },
  //   {
  //     q: "Tank lid and screens",
  //     s: 1
  //   },
  //   {
  //     q: "Tank insulation and temperature gain",
  //     s: 0
  //   },
  //   {
  //     q: "Access to tank(s) for disinfection and cleaning",
  //     s: 1
  //   },
  //   {
  //     q: "Disinfection and cleaning of tank",
  //     s: 1
  //   },
  //   {
  //     q: "Calorifier or water heaters",
  //     s:1
  //   },
  // ]

  // const temp = async () => {
  //   for (let d of defaultQuestions) {
  //     const data = {
  //       riskFactor: d.q,
  //       weight: d.s
  //     }
  //     await post("/api/site-check/ra-survey-risk-factors", data)
  //   }


  // }

  const getRiskFactor = async () => {
    const scoreoptionsall = await get("/api/lov/SITE_CHECK_DOMESTIC_RA_SCORES");
    setscoreoptions(scoreoptionsall);
    const riskFactorFromDB = await get("/api/site-check/ra-survey-risk-factors")
    const riskFactorResponse = await get("/api/site-check/domestic-ra-survey/" + checkId)
    riskFactorFromDB.forEach(q => {
      const resIdx = riskFactorResponse.findIndex(r => r.riskFactorId === q.riskFactorID);
      if (resIdx >= 0) {
        q.status = "Closed";
        q.response = riskFactorResponse[resIdx]
        q.completed = true
      } else {
        q.status = "Open";
        q.response = {
          riskFactorId: q.riskFactorID
        }
        q.completed = false
      }
    })
    const risksN = [0, 0, 0, 0]
    let weightedScore = 0
    riskFactorResponse.forEach(r => {
      weightedScore = weightedScore + r.weightedScore;
      if (r.weightedScore > 17) {
        risksN[0] = risksN[0] + 1;
      } else if (r.weightedScore > 10) {
        risksN[1] = risksN[1] + 1;
      } else if (r.weightedScore > 5) {
        risksN[2] = risksN[2] + 1;
      } else {
        risksN[3] = risksN[3] + 1;
      }

    })
    setrisks(risksN)
    
    settotalrisks(weightedScore)
    setRiskFactor(riskFactorFromDB);
    const body = {
      riskScoreRed: risksN[0],
      riskScoreAmber: risksN[1],
      riskScoreYellow: risksN[2],
      riskScoreGreen: risksN[3],
    }
    await put("/api/site-check/" + checkId, body);
  }

  const [riskFactor, setRiskFactor] = useState([]);
  const [openIndex, setOpenIndex] = useState(0);

  const handleInputChange = (e, idx) => {
    const { name, value } = e.target;
    const uquest = [...riskFactor]
    const udata = {
      ...riskFactor[idx].response,
      [name]: value,
    }
    uquest[idx].response = udata
    setRiskFactor(uquest);
  };

  const saveRiskFactor = async (event, index) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const dataToSave = riskFactor[index].response;
    if (dataToSave.responseDate) {
      dataToSave.responseDate = new Date(dataToSave.responseDate);
    }
    dataToSave.checkId = checkId;
    dataToSave.status = "Closed";
    dataToSave.weightedScore = Number(dataToSave.score ?? 0) * Number(riskFactor[index].weight ?? 0)
    dataToSave.totalRiskScore = Number(dataToSave.consequence ?? 0) * Number(dataToSave.likelihood ?? 0)
    await post("/api/site-check/domestic-ra-survey", dataToSave);
    await getRiskFactor();
    toast.success("Survey response saved")
  }


  const getChipColor = (score) => {
    let style = {
      marginLeft: '5px',
      border: '1px solid #0b903f',
      color: '#0b903f',
      backgroundColor: '#e2f0e6'
    }
    if (score > 17) {
      style.color = '#EF0505'
      style.backgroundColor = '#F6E4E4'
      style.border = '1px solid #EF0505 '
    } else if (score > 10) {
      style.color = '#ff6700'
      style.border = '1px solid #ff6700'
      style.backgroundColor = '#ffd7b5'
    } else if (score > 5) {
      style.color = '#B39200'
      style.border = '1px solid #B39200'
      style.backgroundColor = '#FDF8E1'
    }
    return style
  }


  return (

    <Box p={3}>
      <Card>
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid item>
              <Typography variant="h6">Risk Factor Summary 
                {/* <span style={{ backgroundColor: '#FF9800', color: 'white', padding: '7px 8px', borderRadius: '5px' }}><InfoOutlinedIcon />&nbsp; Overall Risk Score: {totalrisks}
                </span> */}
                </Typography>

            </Grid>


            <Grid item>

              <Box display="flex" alignItems="center">

                <Box ml={6} display="flex" alignItems="center">
                  {/* <Box width={32} height={32} bgcolor="#F44336" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}> */}
                    {/* <Typography variant="body2" color="white"></Typography> */}
                    <span className="badge bg-danger p-3 m-2 risk-span">
                      High <br/><br/> {">250"}
                    </span>
                  {/* </Box> */}
                  {/* <Box width={32} height={32} bgcolor="#FF9800" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}> */}
                    {/* <Typography variant="body2" color="white">{risks[1]}</Typography> */}
                    <span className="badge bg-warning p-3 m-2 risk-span">
                      Medium<br/><br/>{"150 - 250"}
                    </span>
                  {/* </Box> */}
                  
                  {/* <Box width={32} height={32} bgcolor="#4CAF50" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}> */}
                    {/* <Typography variant="body2" color="white">{risks[3]}</Typography> */}
                    <span className="badge bg-success p-3 m-2 risk-span">
                      Low<br/><br/>{"<150"}
                    </span>
                  {/* </Box> */}
                </Box>
              </Box>
            </Grid>
          </Grid>
          <hr />
          {riskFactor.map((q, idx) => {

            return (<Accordion defaultExpanded={idx === openIndex}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{q.riskFactor}</Typography> &nbsp;&nbsp;&nbsp;&nbsp;
                  <Chip
                    style={getChipColor(riskFactor[idx]?.response?.weightedScore)}
                    label={"Weighted Score : " + (riskFactor[idx]?.response?.weightedScore ?? 0)}
                  />
                  {/* <Chip
                    style={getChipColor(riskFactor[idx]?.response?.totalRiskScore)}
                    label={"Risk Score : " + (riskFactor[idx]?.response?.totalRiskScore ?? 0)}
                  /> */}
                
              </AccordionSummary>
              <form onSubmit={(e) => {
                setOpenIndex(idx + 1);
                saveRiskFactor(e, idx);
              }}>
              <AccordionDetails>
                <Grid container spacing={2}>
                  {/* <Grid item xs={6}>
                    <label htmlFor="responseDate" name="responseDate">
                      Date
                    </label>
                      <input
                        required
                      type="date"
                      name="responseDate"
                      disabled={riskFactor[idx]?.completed}
                      className="form-control"
                      onChange={(e) => handleInputChange(e, idx)}
                      value={String(riskFactor[idx]?.response?.responseDate)?.substring(0, 10)}
                    />

                  </Grid> */}
                  <Grid item xs={12} sm={6}>
                    <label htmlFor="score" name="score">
                      Score
                    </label>
                      <select
                        required
                      //disabled={riskFactor[idx]?.completed}
                      className="form-control form-select"
                      name="score"
                      onChange={(e) => handleInputChange(e, idx)}
                      value={riskFactor[idx]?.response?.score}
                    >
                      <option value="">Select </option>
                      {scoreoptions.sort((a, b) => Number(a.lovValue) - Number(b.lovValue)).filter(o => o.attribite1 === String(q?.riskFactorID)).map(o =>(
                        <option value={o.lovValue}> {o.lovValue} -  {o.lovDesc} </option>
                      ))}
                    </select>
                  </Grid>
                  <Grid item xs={6}>
                    <Autocomplete
                      //disabled={riskFactor[idx]?.completed}
                      multiple
                      onChange={(event, item) => {
                        const uquest = [...riskFactor]

                        uquest[idx].response = {
                          ...uquest[idx].response,
                          assets: item.map(i => i.key).join(",")
                        }
                        setRiskFactor(uquest);
                      }}
                      value={siteAssets.filter(s => riskFactor[idx]?.response?.assets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}

                      options={siteAssets.map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}
                      getOptionLabel={(option) => option.label}

                      
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          //required
                          variant="outlined"
                          label="Search Asset"
                        //placeholder="Assets"
                        />
                      )}
                    />
                  </Grid>


                  <Grid item xs={12}>
                    <label htmlFor="observation" name="observation">
                      Observation
                    </label>
                      <textarea
                        required
                      //disabled={riskFactor[idx]?.completed}
                      name="observation"
                      className="form-control"
                      id="observation"
                      rows="4"
                      placeholder="Enter notes..."
                      value={riskFactor[idx]?.response?.observation}
                      onChange={(e) => handleInputChange(e, idx)}
                      style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <div>
                        <label htmlFor="score1" name="score1">
                          Score
                        </label>
                        <input
                          name="score1"
                          id="score1"
                          style={{ width: '100px' }}
                          type="text"
                          className="form-control"
                          disabled
                          value={riskFactor[idx]?.response?.score ?? 0}
                        />
                      </div>
                      <h1 style={{ lineHeight: '2' }}>X</h1>
                      <div>
                        <label htmlFor="score1" name="score1">
                          Weight
                        </label>
                        <input
                          type="text"
                          style={{ width: '100px' }}
                          className="form-control"
                          disabled
                          value={riskFactor[idx]?.weight}
                        />
                      </div>
                      <h1 style={{ lineHeight: '2' }}>=</h1>
                      <div>
                        <label htmlFor="score1" name="score1">
                          Weighted Score
                        </label>
                        <input
                          style={{ width: '130px' }}
                          type="text"
                          className="form-control"
                          disabled
                          value={riskFactor[idx]?.weight * Number(riskFactor[idx]?.response?.score ?? 0)}
                        />
                      </div>
                    </div>

                  </Grid>
                  




                  {/* <Grid item xs={12}>
                    <Typography variant="h6" gutterBottom>
                      Risk Score Card (<strong>Total Risk Score = {(riskFactor[idx]?.response?.consequence ?? 0) * (riskFactor[idx]?.response?.likelihood ?? 0)}</strong>)
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} sm={4}>
                        <Grid item xs={12} sm={12}>
                          <label htmlFor="consequence" name="consequence">
                            Consequence
                          </label>
                          <select
                            disabled={riskFactor[idx]?.completed}
                            className="form-control form-select"
                            name="consequence"
                            value={riskFactor[idx]?.response?.consequence}
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
                            disabled={riskFactor[idx]?.completed}
                            className="form-control form-select"
                            name="likelihood"
                            value={riskFactor[idx]?.response?.likelihood}
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
                  </Grid>*/}
                  {/* <Grid item xs={12}>
                    <label htmlFor="action" name="action">
                      Suggested Action
                    </label>
                      <textarea
                        required
                      disabled={riskFactor[idx]?.completed}
                      name="action"
                      className="form-control"
                      id="action"
                      rows="4"
                      placeholder="Enter notes..."
                      value={riskFactor[idx]?.response?.action}
                      onChange={(e) => handleInputChange(e, idx)}
                      style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                  </Grid> */}
                  {!riskFactor[idx]?.completed &&
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
                          type="button"
                        >
                          
                        Cancel
                      </button>


                    </Grid>}
                </Grid>
                </AccordionDetails>
              </form>
            </Accordion>)
          }
          )}
        </CardContent>
      </Card>
    </Box>

  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, { getSiteAssets, getSiteLayout })(
  SurveyWaterDomesticRA
);

