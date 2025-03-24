import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import moment from 'moment';
import { get, post, put, uploadSiteCheckDoc } from "../../../../api";

import CircularProgress from '@mui/material/CircularProgress';
import {
  Grid, TextField, Checkbox, Typography, Box, IconButton, FormGroup, Select, InputLabel, FormControl, FormControlLabel,
  Accordion, Chip, AccordionSummary, AccordionDetails, Card, CardContent, Autocomplete
} from '@mui/material';
import { UploadFile, Close, ExpandMore } from '@mui/icons-material';
import { deleteUser, getSites, getUsers, getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";

const AssessmentFireRisk = ({ subType, sasToken, checkId, siteAssets, getSiteAssets, siteSelectedForGlobal, getSiteLayout, siteLayout, loggedInUserData}) => {
  

  const [risks, setrisks] = useState([0, 0, 0, 0])
  const [quest, setquest] = useState([]);
  const [header, setheaders] = useState([]);
  const [openIndex, setOpenIndex] = useState(3);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    getQuestions();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId)
    }
  }, []);


  const getQuestions = async () => {
    setIsLoading(true);
    let questionCat = subType === 'Annual Winter Audit' ? "annual-winter-audit" : "monthly-inspection";
    const lovs = await get("/api/lov/SITE_CHECK_AUDIT_HEADER");
    const questionsFromDB = await get("/api/site-check/assessment/questions/"+questionCat)
    const headers = lovs.filter(a=>a.attribite1 === questionCat).sort((a, b) => parseFloat(a.lovDesc) - parseFloat(b.lovDesc));
    setheaders(headers);
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
    const filtered = questionsFromDB.filter(q=>q?.order?.length > 4);
    filtered.sort((a, b) => {
      // Split the order strings into arrays of numbers
      const orderA = a.order.split('.').map(Number);
      const orderB = b.order.split('.').map(Number);
    
      // Compare the first part
      if (orderA[0] !== orderB[0]) {
        return orderA[0] - orderB[0];
      }
    
      // Compare the second part
      if (orderA[1] !== orderB[1]) {
        return orderA[1] - orderB[1];
      }
    
      // Compare the third part
      return orderA[2] - orderB[2];
    });
    console.log(filtered)
    setquest(filtered);
    setIsLoading(false);
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
    //dataToSave.status = "Closed";
    dataToSave.totalRiskScore = Number(dataToSave.consequence ?? 0) * Number(dataToSave.likelihood ?? 0)
    const actionData = {
      type: "Audit",
      status: "Reported",
      observation: quest[index]?.response?.position,
      requiredAction: quest[index]?.response?.action,
      desc: `Audit - ${subType} - ${moment(new Date()).format("DD/MM/YYYY")}`,
      riskScore:dataToSave.totalRiskScore,
      dueDate: new Date(),
      createdAt: new Date(),
      siteId: siteSelectedForGlobal?.siteId,
      userId: loggedInUserData?.id
    }
    await put("/api/site/actions", actionData);
    await post("/api/site-check/assessment/response", dataToSave);
    await getQuestions();
    toast.success("Assessment response saved")
  }


  return (

    <Box p={3}>
      <Card>
      {isLoading && <CircularProgress />}
          {!isLoading &&
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid item>
              <Typography variant="h6">Questions</Typography>
            </Grid>
            <Grid item>
              <Box display="flex" alignItems="center">
                {/* <Typography variant="body1" style={{ backgroundColor: '#E0E7FF', padding: '4px 8px', borderRadius: '4px' }}>
                  Total: {quest.length}, Open: {quest.filter(q => q.status === "Open").length}, Closed: {quest.filter(q => q.status === "Closed").length}
                </Typography> */}
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

          {quest?.length > 0 && header?.map(h => { return (<div>
            <h5>{h.lovDesc} {h.lovValue}</h5>
          

          {quest
          //?.filter(q=> !q?.question?.includes("DELETE") && q.order.startsWith(h.lovDesc+".") )
          ?.map((q, idx) =>
          {
            
            if(q?.question?.includes("DELETE") || !q.order.startsWith(h.lovDesc+".")) {
              return null;
            }
            let catAsset = [];
            let assetCategory = q?.assetCategory?.split(",")??[];
            assetCategory = assetCategory.map(item => item.trim());
            
            if(assetCategory.length === 4) {
              catAsset= siteAssets?.filter(s=> 
                s.category === assetCategory[0]?.trim() 
                && s.subCategory === assetCategory[1]?.trim() && s.subCategory2 === assetCategory[2]?.trim()
                && s.subCategory3 === assetCategory[3]?.trim());
            } else if(assetCategory.length === 3) {
              catAsset= siteAssets?.filter(s=> 
                s.category === assetCategory[0]?.trim() 
                && s.subCategory === assetCategory[1]?.trim() && s.subCategory2 === assetCategory[2]?.trim());
            } else if(assetCategory.length === 2) {
              catAsset= siteAssets?.filter(s=> s.category === assetCategory[0]?.trim() 
                && s.subCategory === assetCategory[1]?.trim());
            } else if(assetCategory.length === 1 && assetCategory[0]?.trim() !== '') {
              catAsset= siteAssets?.filter(s=> s.category === assetCategory[0]?.trim());
            } else {
              catAsset = siteAssets;
            }
            
        

            const faultAsset = (q.response?.faultassets?.split(",")??[])?.filter(s=>s.length > 0 ).length;
            const okAsset = (q.response?.assets?.split(",")??[])?.filter(s=>s.length > 0 ).length;
            
            
            return (
            <Accordion defaultExpanded={idx === openIndex} >
              <AccordionSummary expandIcon={<ExpandMore />} >
                <Typography>{q.order} {q.question}
                  {/* <Checkbox disabled={q?.completed} checked={q?.response?.response === "Yes"} onChange={(e)=>setResponseCheck(e, idx)}/> Yes
                  <Checkbox disabled={q?.completed} checked={q?.response?.response === "No"} onChange={(e) => setResponseCheck2(e, idx)} /> No */}
                </Typography> 
                &nbsp;&nbsp;&nbsp;&nbsp;<Chip style={{ margin: '5px', marginLeft: '30px'}} color={q.status === "Closed" ? "success" : "primary"} label={q.status} />
              </AccordionSummary>
              { <AccordionDetails>
                <form onSubmit={(e) => {
                  setOpenIndex(idx + 1);
                  saveAssessmentResponse(e, idx);
                }}>
                  <Grid container spacing={2}>
                   
                  <Grid item xs={12} sm={6}>
                      <label htmlFor="totalAsset" name="totalAsset">
                        Total Asset
                      </label>
                      <input
                        disabled
                        name="totalAsset"
                        className="form-control"
                        id="totalAsset"
                        value={catAsset?.length}
                        style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                      />

                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <label htmlFor="totalAsset" name="totalAsset">
                        Remaining Asset
                      </label>
                      <input
                        disabled
                        name="totalAsset"
                        className="form-control"
                        id="totalAsset"
                        value={catAsset?.length - okAsset- faultAsset}
                        style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                      />

                    </Grid>

                    <Grid item xs={12} sm={12}>
                    <Autocomplete
                    //limitTags={3}
                     disabled={q?.completed}
                        multiple
                        value={catAsset.filter(s => q?.response?.assets?.split(",")?.includes(s.assetId.toString())).map((option) => option.assetId)}
                        // onChange={(event, newValue) => {
                        //   if (
                        //     newValue.length === sites.length ||
                        //     (newValue.length === 1 &&
                        //       newValue[0] === "Select All")
                        //   ) {
                        //     // Select All logic
                        //     setTagSite(sites?.map((site) => site.siteId));
                        //   } else if (
                        //     newValue.length === 0 ||
                        //     (newValue.includes("Select All") &&
                        //       newValue.length < sites.length)
                        //   ) {
                        //     // Deselect All logic
                        //     setTagSite([]);
                        //   } else {
                        //     // Normal selection logic
                        //     setTagSite(
                        //       newValue.filter((value) => value !== "Select All")
                        //     );
                        //   }
                        // }}
                        onChange={(event, newValue) => {
                          const assetsList = catAsset//
                          //.filter(s => !q?.response?.faultassets?.split(",")?.includes(s.assetId.toString())).filter(s => !q?.response?.assets?.split(",")?.includes(s.assetId.toString()))
                          const uquest = [...quest]
                          if (
                            newValue.length === assetsList.length ||
                            (newValue.length === 1 &&
                              newValue[0] === "Select All")
                          ) {
                            // Select All logic
                            
                          uquest[idx].response = {
                            ...uquest[idx].response,
                            assets: assetsList.map(i => i.assetId).join(",")
                          }

                          
                          
                          } else if (
                            newValue.length === 0 ||
                            (newValue.includes("Select All"))
                          ) {
                            uquest[idx].response = {
                              ...uquest[idx].response,
                              assets: ""}
                          } else {
                           
                            uquest[idx].response = {
                              ...uquest[idx].response,
                              assets: newValue.filter((value) => value !== "Select All").join(",")
                            }
                          }
                          setquest(uquest);
                        }}
                        options={[ "Select All", ...catAsset
                          .filter(s => !q?.response?.faultassets?.split(",")?.includes(s.assetId.toString()))
                          .map((option) => option.assetId)]}
                       
                        getOptionLabel={(option) =>
                          option === "Select All"
                            ? "Select All"
                            : catAsset.filter((a) => a.assetId === option)
                            .map(option =>  option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" )[0]
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                           label="Asset OK"
                           size="small"
                          />
                        )}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}>
                            <Checkbox checked={selected} />
                            {option === "Select All"
                            ? "Select All"
                            : catAsset.filter((a) => a.assetId === option).map(option =>  option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" )[0]}
                          </li>
                        )}
                      />
                    


                      {/* <Autocomplete
                        disabled={q?.completed}
                        multiple
                        onChange={(event, item) => {
                          const uquest = [...quest]
                          uquest[idx].response = {
                            ...uquest[idx].response,
                            assets: item.map(i => i.key).join(",")
                          }
                          setquest(uquest);
                        }}
                        value={catAsset.filter(s => q?.response?.assets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}

                        options={catAsset.filter(s => !q?.response?.faultassets?.split(",")?.includes(s.assetId.toString())).filter(s => !q?.response?.assets?.split(",")?.includes(s.assetId.toString()))
                          .map((option) => { return { key: option.assetId, label: option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" } })}
                        getOptionLabel={(option) => option.label}

                        renderInput={(params) => (
                        
                          <TextField
                            //required
                            {...params}
                            variant="outlined"
                            label="Asset OK"
                          />
                        )}
                      /> */}
                    </Grid>
                    <Grid item xs={12} sm={12}>
                    <Autocomplete
                     disabled={q?.completed}
                        multiple
                        value={catAsset.filter(s => q?.response?.faultassets?.split(",")?.includes(s.assetId.toString())).map((option) => option.assetId)}
                        
                        onChange={(event, newValue) => {
                          const assetsList = catAsset//
                          //.filter(s => !q?.response?.faultassets?.split(",")?.includes(s.assetId.toString())).filter(s => !q?.response?.assets?.split(",")?.includes(s.assetId.toString()))
                          const uquest = [...quest]
                          if (
                            newValue.length === assetsList.length ||
                            (newValue.length === 1 &&
                              newValue[0] === "Select All")
                          ) {
                            // Select All logic
                            
                          uquest[idx].response = {
                            ...uquest[idx].response,
                            faultassets: assetsList.map(i => i.assetId).join(",")
                          }

                          
                          
                          } else if (
                            newValue.length === 0 ||
                            (newValue.includes("Select All"))
                          ) {
                            uquest[idx].response = {
                              ...uquest[idx].response,
                              faultassets: ""}
                          } else {
                           
                            uquest[idx].response = {
                              ...uquest[idx].response,
                              faultassets: newValue.filter((value) => value !== "Select All").join(",")
                            }
                          }
                          setquest(uquest);
                        }}
                        options={[ "Select All", ...catAsset
                          .filter(s => !q?.response?.assets?.split(",")?.includes(s.assetId.toString()))
                          .map((option) => option.assetId)]}
                       
                        getOptionLabel={(option) =>
                          option === "Select All"
                            ? "Select All"
                            : catAsset.filter((a) => a.assetId === option)
                            .map(option =>  option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" )[0]
                        }
                        renderInput={(params) => (
                          <TextField
                            {...params}
                           label="Defective OK"
                           size="small"
                          />
                        )}
                        renderOption={(props, option, { selected }) => (
                          <li {...props}>
                            <Checkbox checked={selected} />
                            {option === "Select All"
                            ? "Select All"
                            : catAsset.filter((a) => a.assetId === option).map(option =>  option.assetId + " - " + option.assetName + " (" + `${option?.position || "NA"} > ${option?.floor || "NA"} > ${option?.room || "NA"}` + ")" )[0]}
                          </li>
                        )}
                      />
                        {/* <Autocomplete
                          disabled={q?.completed}
                          multiple
                          onChange={(event, item) => {
                            const uquest = [...quest]
                            uquest[idx].response = {
                              ...uquest[idx].response,
                              faultassets: item?.map(i => i.key).join(",")
                            }
                            setquest(uquest);
                          }}
                          value={catAsset.filter(s => q?.response?.faultassets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}

                          options={catAsset.filter(s => !q?.response?.faultassets?.split(",")?.includes(s.assetId.toString())).filter(s => !q?.response?.assets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}
                          getOptionLabel={(option) => option.label}

                          renderInput={(params) => (
                          
                            <TextField
                              //required
                              {...params}
                              variant="outlined"
                              label="Defective Asset"
                            />
                          )}
                        /> */}
                    </Grid>
                    {faultAsset > 0 &&
                    <Grid item xs={6}>
                      <label htmlFor="position" name="position">
                        Observation
                      </label>
                      <textarea
                        disabled={q?.completed}
                        name="position"
                        className="form-control"
                        id="position"
                        rows="4"
                        required={faultAsset > 0}
                        placeholder="Enter notes..."
                        value={q?.response?.position}
                        onChange={(e) => handleInputChange(e, idx)}
                        style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </Grid>}
                    
                    {faultAsset > 0 &&
                    <Grid item xs={6}>
                      <label htmlFor="action" name="action">
                        Suggested Action
                      </label>
                      <textarea
                        disabled={q?.completed}
                        name="action"
                        required={faultAsset > 0}
                        className="form-control"
                        id="action"
                        rows="4"
                        placeholder="Enter notes..."
                        value={q?.response?.action}
                        onChange={(e) => handleInputChange(e, idx)}
                        style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                      />
                    </Grid>}
                    {faultAsset > 0 &&<Grid item xs={12}>
                      {!q?.completed &&
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

                    </Grid>}
                    {!q?.completed && q?.response?.file && (
                      <Grid item xs={12} container alignItems="center" >
                        <Chip
                          label={q?.response?.file?.name}
                          onDelete={() => handleFileDelete(idx)}

                        />

                      </Grid>
                    )}

                  {faultAsset > 0 && <Grid item xs={12}>
                      <Typography variant="h6" gutterBottom>
                        Risk Score Card (<strong>Total Risk Score = {(q?.response?.consequence ?? 0) * (q?.response?.likelihood ?? 0)}</strong>)
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={4}>
                          <Grid item xs={12} sm={12}>
                            <label htmlFor="consequence" name="consequence">
                              Consequence
                            </label>
                            <select
                              required={faultAsset > 0}
                              disabled={q?.completed}
                              className="form-control form-select"
                              name="consequence"
                              value={q?.response?.consequence}
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
                              required={faultAsset > 0}
                              disabled={q?.completed}
                              className="form-control form-select"
                              name="likelihood"
                              value={q?.response?.likelihood}
                              onChange={(e) => handleInputChange(e, idx)}
                            >
                              <option value="">Select </option>
                              {[1, 2, 3, 4, 5].map((num) => (
                                <option value={num}>{num} </option>
                              ))}
                            </select>
                          </Grid>
                        </Grid>
                        {/* <Grid item xs={12} sm={8}>
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
                        </Grid> */}
                      </Grid>
                    </Grid>}
                    {!q?.completed &&
                      <Grid item xs={12}>

                        <button
                          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                          className="btn btn-primary text-white pr-2"
                          disabled={okAsset === 0 && faultAsset === 0}
                          type="submit"
                        >
                          Save & Continue
                        </button>


                      </Grid>}
                    {q?.completed && q?.response?.file && <Grid item xs={12}>
                      <a href={q?.response?.file + "?" + sasToken} target="_blank">
                        <button
                          style={{ float: 'right' }}
                          disabled={q?.response?.completed}
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
          )}
          </div>)})}
          
        </CardContent>
        }
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
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getSiteAssets, deleteUser, getSites, getSiteLayout })(
  AssessmentFireRisk
);

