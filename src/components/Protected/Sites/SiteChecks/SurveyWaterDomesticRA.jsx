import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { get, post, uploadSiteCheckDoc } from "../../../../api";
import {
  Grid, TextField, Button, Typography, Box, IconButton, MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel,
  Accordion, Chip, AccordionSummary, AccordionDetails, Card, CardContent, Autocomplete, Divider
} from '@mui/material';
import { UploadFile, Close, ExpandMore } from '@mui/icons-material';
import { deleteUser, getSites, getUsers, getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";

const SurveyWaterDomesticRA = ({ checkId, siteAssets, getSiteAssets, siteSelectedForGlobal, getSiteLayout, siteLayout }) => {
  const navigate = useNavigate();

  const [risks, setrisks] = useState([0, 0, 0, 0])
  const [totalrisks, settotalrisks] = useState(0)

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
    let totalriskFactor = 0
    riskFactorResponse.forEach(r => {
      totalriskFactor = totalriskFactor + r.totalRiskScore;
      if (r.totalRiskScore > 17) {
        risksN[0] = risksN[0] + 1;
      } else if (r.totalRiskScore > 10) {
        risksN[1] = risksN[1] + 1;
      } else if (r.totalRiskScore > 5) {
        risksN[2] = risksN[2] + 1;
      } else if (r.totalRiskScore > 1) {
        risksN[3] = risksN[3] + 1;
      }
      
    })
    console.log('riskFactorFromDBriskFactorFromDB', riskFactorFromDB)
    setrisks(risksN)
    settotalrisks(totalriskFactor)
    setRiskFactor(riskFactorFromDB);
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

  useEffect(() => {
    console.log('riskFactor', riskFactor[0])
  }, [riskFactor])

  const handleFileChange = (e, idx) => {
    const uquest = [...riskFactor]
    uquest[idx].response.file =e.target.files[0]
    setRiskFactor(uquest);
  };

  const handleFileDelete = ( idx) => {
    const uquest = [...riskFactor]
    uquest[idx].response.file = null
    setRiskFactor(uquest);
  };

  const saveRiskFactor = async (index) => {
    const dataToSave = riskFactor[index].response;
    if (dataToSave.responseDate) {
      dataToSave.responseDate = new Date(dataToSave.responseDate);
    }
    dataToSave.checkId = checkId;
    dataToSave.status = "Closed";
    dataToSave.weightedScore = Number(dataToSave.score ?? 0) * Number(riskFactor[index].weight ?? 0)
    dataToSave.totalRiskScore = Number(dataToSave.consequence ?? 0) * Number(dataToSave.likelihood ?? 0)
    console.log(riskFactor[index],dataToSave);
    await post("/api/site-check/domestic-ra-survey", dataToSave);
    await getRiskFactor();
    toast.success("Survey response saved")
  }

  const getChipColor = (score) => {
    let color = 'success';
    if (score > 17) {
      color = 'error'
    } else if (score > 10) {
      color = 'warning'
    } else if (score > 5) {
      color = 'info'
    } else {
      color = 'success'
    }
    return color
  }


  return (

    <Box p={3}>
      <Card>
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid item>
              <Typography variant="h6">Risk Factors <span style={{ backgroundColor: '#FF9800', color: 'white', padding: '7px 8px', borderRadius: '5px' }}><InfoOutlinedIcon />&nbsp; Overall Risk Score: {totalrisks}</span></Typography>
             
            </Grid>
           
            
            <Grid item>
              
              <Box display="flex" alignItems="center">
                
                <Box ml={2} display="flex" alignItems="center">
                  <Box width={32} height={32} bgcolor="#F44336" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">{risks[0]}</Typography>
                  </Box>
                  <Box width={32} height={32} bgcolor="#FF9800" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">{risks[1]}</Typography>
                  </Box>
                  <Box width={32} height={32} bgcolor="#FFEB3B" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">{risks[2]}</Typography>
                  </Box>
                  <Box width={32} height={32} bgcolor="#4CAF50" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">{risks[3]}</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
          <hr />
          {riskFactor.map((q, idx) => {

            return (<Accordion defaultExpanded={idx === openIndex}>
              <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{q.riskFactor}</Typography> &nbsp;&nbsp;&nbsp;&nbsp;
                {(riskFactor[idx]?.response?.weightedScore ?? 0) > 0 &&
                <Chip
                  style={{ marginLeft: '5px' }}
                  color={getChipColor(riskFactor[idx]?.response?.weightedScore)}
                  //color={riskFactor[idx]?.response?.weightedScore > 17 ? 'danger' : 'success'}
                  label={"Weighted Score : " + (riskFactor[idx]?.response?.weightedScore ?? 0)}
                />
                }
                {(riskFactor[idx]?.response?.totalRiskScore ?? 0) > 0 &&
                  <Chip
                    style={{ marginLeft: '5px' }}
                    color={getChipColor(riskFactor[idx]?.response?.totalRiskScore)}
                    //color={riskFactor[idx]?.response?.totalRiskScore > 17 ? 'danger' : 'success'}
                    label={"Risk Score : " + (riskFactor[idx]?.response?.totalRiskScore ?? 0)}
                  />
                }
              </AccordionSummary>
              <AccordionDetails>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <label htmlFor="responseDate" name="responseDate">
                      Date
                    </label>
                    <input
                      type="date"
                      name="responseDate"
                      disabled={riskFactor[idx]?.completed}
                      className="form-control"
                      onChange={(e) => handleInputChange(e, idx)}
                    //value={riskFactor[idx]?.response?.responseDate?.substring(0, 10)}
                    />
                  
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <label htmlFor="score" name="score">
                      Score
                    </label>
                    <select
                      disabled={riskFactor[idx]?.completed}
                      className="form-control form-select"
                      name="score"
                      onChange={(e) => handleInputChange(e, idx)}
                      value={riskFactor[idx]?.response?.score}
                    >
                      <option value="">Select </option>
                      <option value={10}> 10 - Fed from poorly treated non mains water source </option>
                    </select>
                  </Grid>
                  
                
                  <Grid item xs={12}>
                    <label htmlFor="observation" name="observation">
                      Observation
                    </label>
                    <textarea
                      disabled={riskFactor[idx]?.completed}
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
                          value={riskFactor[idx]?.weight * (riskFactor[idx]?.response?.score ?? 0)}
                        />
                      </div>
                    </div>

                  </Grid>
                  <Grid item xs={6}>
                    <Autocomplete
                      disabled={riskFactor[idx]?.completed}
                      multiple
                      onChange={(event, item) => {
                        console.log(item);
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
                          variant="outlined"
                          label="Search Asset"
                        //placeholder="Assets"
                        />
                      )}
                    />
                  </Grid>
                
                
                  
                  
                  <Grid item xs={12}>
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
                          //border="1px dashed grey"
                          p={2}
                          mb={2}
                          style={{
                            //backgroundColor: '#f9f9f9',
                            height: '290px',
                            //borderRadius: '4px',
                            //color: '#3f51b5',
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
                  <Grid item xs={12}>
                    <label htmlFor="action" name="action">
                      Suggested Action
                    </label>
                    <textarea
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
                  </Grid>
                  {!riskFactor[idx]?.completed &&
                    <Grid item xs={12}>
                    
                      <button
                        style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                        className="btn btn-primary text-white pr-2"
                        onClick={() => {
                          setOpenIndex(idx + 1);
                          saveRiskFactor(idx);
                          //temp()
                        }}
                      >
                        Save & Continue
                      </button>
                      <button
                        style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                        className="btn btn-primary btn-light"
                      // onClick={() => { setCreate(false) }}
                      >
                        Cancel
                      </button>
                    

                    </Grid>}
                  {/* {riskFactor[idx]?.completed && <Grid item xs={12}>
                    
                    <button
                      style={{float: 'right'}}
                    disabled={riskFactor[idx]?.response?.completed}
                    className="btn btn-sm btn-light text-dark"
                    onClick={() => {

                    }}
                  >
                      <i className="fas fa-download" />&nbsp;Download Attachment
                  </button></Grid>} */}
                </Grid>
              </AccordionDetails>
            </Accordion>)
          }
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
  SurveyWaterDomesticRA
);

