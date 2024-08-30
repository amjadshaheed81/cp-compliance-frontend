import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { get, post, put, uploadSiteCheckDoc } from "../../../../api";

import HelpIcon from '@mui/icons-material/Help';
import {
  Grid, TextField, Checkbox, Typography, Box, List, ListItem, ListItemAvatar, ListItemText, Avatar,
  Accordion, Chip, AccordionSummary, AccordionDetails, Card, CardContent, Autocomplete
} from '@mui/material';
import { UploadFile, Close, ExpandMore } from '@mui/icons-material';
import { deleteUser, getSites, getUsers, getSiteAssets, getSiteLayout } from "../../../../store/thunk/site";

const TankSurvey = ({ sasToken, checkId, siteAssets, getSiteAssets, siteSelectedForGlobal, getSiteLayout, siteLayout }) => {
  const [risks, setrisks] = useState([0, 0, 0, 0])
  const [quest, setquest] = useState([
    {question : "Lid Lining"},
    {question : "Absence of sludge"},
    {question : "Insulation"},
    {question : "Insect/ Vermin Screen"},
    {question : "Drainage"},
    {question : "Access for Cleaning"},
    {question : "Inspection & Cleaning Regime"},
  ]);
  const [tank, settank] = useState({});
  const [openIndex, setOpenIndex] = useState(0);

  useEffect(() => {
    getTank();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSiteLayout(siteSelectedForGlobal?.siteId)
    }
  }, []);

  const getTank = async () => {
    // const questionsFromDB = await get("/api/site-check/assessment/questions/assessment-fire-risk")
    // const questionsResponse = await get("/api/site-check/assessment/response/" + checkId)
    // questionsFromDB.forEach(q => {
    //   const resIdx = questionsResponse.findIndex(r => r.qid === q.qid);
    //   if (resIdx >= 0) {
    //     q.status = "Closed";
    //     q.response = questionsResponse[resIdx]
    //     q.completed = true
    //   } else {
    //     q.status = "Open";
    //     q.response = {}
    //     q.completed = false
    //   }
    // })
    // setquest(questionsFromDB);
  }




  const handleInputChange = (e) => {
    const { name, value } = e.target;
    const udata = {
      ...tank,
      [name]: value,
    }
    settank(udata);
  };

  const setResponseCheck = (e, idx) => {
    if (e.target.checked) {
      const uquest = [...quest]
      const udata = {
        ...quest[idx],
        response: "Yes"
      }
      uquest[idx] = udata
      setquest(uquest);
    }
  };

  const setResponseCheck2 = (e, idx) => {
    if (e.target.checked) {
      const uquest = [...quest]
      const udata = {
        ...quest[idx],
        response: "No"
      }
      uquest[idx] = udata
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

  const saveTank = async (event, index) => {
    event.preventDefault();
    const form = event.target;
    if (!form.checkValidity()) {
      form.reportValidity();
    }
    const dataToSave = tank;
    quest.forEach((q,index) => {
      dataToSave["q"+(index+1)] = q.response;
    })
    
    console.log('dataToSave', dataToSave, quest);
   
    // dataToSave.responseDate = new Date();
    // dataToSave.checkId = checkId;
    // dataToSave.qid = quest[index].qid;
    // dataToSave.status = "Closed";
    // dataToSave.totalRiskScore = Number(dataToSave.consequence ?? 0) * Number(dataToSave.likelihood ?? 0)
    // await post("/api/site-check/assessment/response", dataToSave);
    //await getTank();
    toast.success("Tank survey saved")
  }


  return (

    <Box p={3}>
        <form onSubmit={(e) => {
                  saveTank(e);
                }}>
      <Card>
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid item>
              <Typography variant="h6">Tank Details</Typography>
            </Grid>
            
          </Grid>

        
                  <Grid container spacing={2}>
                    
                    <Grid item xs={12} sm={6}>
                      <label htmlFor="internalExternal" name="risinternalExternalkType">
                        Internal/External
                      </label>
                      <select
                        disabled={tank?.completed}
                        className="form-control form-select"
                        name="internalExternal"
                        required

                        onChange={(e) => handleInputChange(e)}
                        value={tank?.internalExternal}
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
                        disabled={tank?.completed}
                        className="form-control form-select"
                        name="floor"
                        required
                        value={tank?.floor}

                        onChange={(e) => handleInputChange(e)}
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
                        disabled={tank?.completed}
                        className="form-control form-select"
                        name="room"
                        required
                        value={tank?.room}
                        onChange={(e) => handleInputChange(e)}
                      >
                        <option value="">Select </option>
                        {siteLayout.filter(site => site.nodeType === "room").map(site =>
                        (
                          <option value={site.id}>{site.nodeName}</option>
                        ))
                        }
                      </select>

                    </Grid>
                    <Grid item xs={6}>
                      <label htmlFor="systemFed" name="systemFed">
                      System Fed from Tank
                      </label>
                      <input
                       disabled={tank?.completed}
                        name="systemFed"
                        className="form-control"
                        id="systemFed"
                        required
                        value={tank?.systemFed}
                        onChange={(e) => handleInputChange(e)}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Autocomplete
                       disabled={tank?.completed}
                        multiple
                        // onChange={(event, item) => {
                        //   const uquest = [...quest]
                        //   uquest[idx].response = {
                        //     ...uquest[idx].response,
                        //     assets: item.map(i => i.key).join(",")
                        //   }
                        //   setquest(uquest);
                        // }}
                        //value={siteAssets.filter(s => quest[idx]?.response?.assets?.split(",")?.includes(s.assetId.toString())).map((option) => { return { key: option.assetId, label: option.assetName + " - " + option.category } })}

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

                    <Grid item xs={6}>
                      <label htmlFor="volume" name="volume">
                      Approx. Volume (Litres)
                      </label>
                      <input
                      type="number"
                       disabled={tank?.completed}
                        name="volume"
                        className="form-control"
                        id="volume"
                        required
                        value={tank?.volume}
                        onChange={(e) => handleInputChange(e)}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <label htmlFor="orientation" name="orientation">
                      Inlet, outlet & tank orientation
                      </label>
                      <select
                        disabled={tank?.completed}
                        className="form-control form-select"
                        name="orientation"
                        required

                        onChange={(e) => handleInputChange(e)}
                        value={tank?.orientation}
                      >
                        <option value="">Select </option>
                        {["Satisfactory", "Unsatisfactory"].map((num) => (
                          <option value={num}>{num} </option>
                        ))}
                      </select>

                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <label htmlFor="turnoverTime" name="turnoverTime">
                      Turnover Time
                      </label>
                      <select
                        disabled={tank?.completed}
                        className="form-control form-select"
                        name="turnoverTime"
                        required

                        onChange={(e) => handleInputChange(e)}
                        value={tank?.turnoverTime}
                      >
                        <option value="">Select </option>
                        {["<24 hrs", "24-28 hrs", ">48 hrs"].map((num) => (
                          <option value={num}>{num} </option>
                        ))}
                      </select>

                    </Grid>
                    
                  </Grid>
                
        </CardContent>
      </Card>
      <Card>
        <CardContent>
          <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid item>
              <Typography variant="h6">Is aspect Satisfactory?</Typography>
            </Grid>
            
          </Grid>

          <List >
             
          {quest.map((q, idx) =>
                <ListItem 
                sx={{ width: '100%', maxWidth: 500 }}
                secondaryAction={
                  <>
                  <Checkbox disabled={quest[idx]?.completed} checked={quest[idx]?.response === "Yes"} onChange={(e)=>setResponseCheck(e, idx)}/> Yes
                  <Checkbox disabled={quest[idx]?.completed} checked={quest[idx]?.response === "No"} onChange={(e) => setResponseCheck2(e, idx)} /> No
            
                    </>
                  }
                >
                  <ListItemAvatar>
                    <Avatar>
                      <HelpIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={q.question}
                  />
                </ListItem>)}
            </List>

            <Grid container alignItems="center" justifyContent="space-between" mb={2}>
            <Grid item xs={12}>

                        <button
                          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                          className="btn btn-primary text-white pr-2"
                          
                          type="submit"
                        >
                          Save & Continue
                        </button>
                        <button
                        type="button"
                          style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                          className="btn btn-primary btn-light"
                        >
                          Cancel
                        </button>


                      </Grid>
                      </Grid>

        </CardContent>
      </Card>
      </form>
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
  TankSurvey
);

