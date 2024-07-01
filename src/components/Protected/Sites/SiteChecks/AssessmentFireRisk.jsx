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
import { get, post } from "../../../../api";
import {
  Grid, TextField, Button, Typography, Box, IconButton, MenuItem, Select, InputLabel, FormControl, Checkbox, FormControlLabel,
  Accordion, Chip, AccordionSummary, AccordionDetails, Card, CardContent, Autocomplete
} from '@mui/material';
import { UploadFile, Close, ExpandMore } from '@mui/icons-material';
import { deleteUser, getSites, getUsers } from "../../../../store/thunk/site";

const AssessmentFireRisk = ({ users, getUsers }) => {
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
  }, []);

  const defaultQuestions = [
    {
      q: "Q1. Are all means of escape free from combustible and other storage?",
      s: "Open"
    },
    {
      q: "Q2. Are sufficiently robust and applicable systems in place for the safe storage and use of flammable substances?",
      s: "Closed"
    },
    {
      q: "Q3. Are all means of escape free from combustible and other storage?",
      s: "Open"
    },
    {
      q: "Q4. All means provided to ensure adequate Means Of Escape (other than floors walls and ceilings, see above) must be properly maintained",
      s: "Open"
    },
    {
      q: "Q5. Is the building provided with signs and notices in accordance with the Signs and Signals Regulations 1996?",
      s: "Open"
    },
    {
      q: "Q6. Were there is a need for a degree of fire resistance, are doors provided constructed in accordance with relevant part of B.S. 476?",
      s: "Open"
    },
    {
      q: "Q7. Is emergency lighting provided and maintained in accordance with B.S.5266: 2003?",
      s: "Open"
    },
    {
      q: "Q8. Is the building provided with fire fighting equipment in compliance with B.S 5306, Part 3?",
      s: "Open"
    },
    {
      q: "Q9. Are all means of escape free from combustible and other storage?",
      s: "Open"
    },
  ]
  
  const [quest, setquest] = useState(defaultQuestions);
  const [openIndex, setOpenIndex] = useState(0);
  const [formData, setFormData] = useState({
    response: '',
    internalExternal: 'Internal',
    floor: '',
    room: '',
    observation: '',
    assets: [],
    consequence: '',
    likelihood: '',
    suggestedAction: '',
    file: null
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      file: e.target.files[0]
    });
  };

  const handleFileDelete = () => {
    setFormData({
      ...formData,
      file: null
    });
  };

  const handleAssetChange = (asset) => {
    setFormData((prevData) => ({
      ...prevData,
      assets: prevData.assets.includes(asset)
        ? prevData.assets.filter((item) => item !== asset)
        : [...prevData.assets, asset]
    }));
  };



  const addSiteCheck = async () => {

    const body = formData;

    //await post("/api/site-check/", body);
    //await getSiteChecks();
  }

  const getSiteChecks = async () => {
    // const siteChecks = await get("/api/site-check/site/" + site.siteId);
    // console.log("siteCheckssiteChecks", siteChecks)
    // setFilteredSiteChecks(siteChecks)
    // setSiteChecks(siteChecks);
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
                  Total: {quest.length}, Open: {quest.filter(q => q.s === "Open").length}, Closed: {quest.filter(q => q.s === "Closed").length}
                </Typography>
                <Box ml={2} display="flex" alignItems="center">
                  <Box width={24} height={24} bgcolor="#F44336" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">0</Typography>
                  </Box>
                  <Box width={24} height={24} bgcolor="#FF9800" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">0</Typography>
                  </Box>
                  <Box width={24} height={24} bgcolor="#FFEB3B" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">0</Typography>
                  </Box>
                  <Box width={24} height={24} bgcolor="#4CAF50" display="flex" alignItems="center" justifyContent="center" borderRadius="4px" mx={0.5}>
                    <Typography variant="body2" color="white">0</Typography>
                  </Box>
                </Box>
              </Box>
            </Grid>
          </Grid>
          {quest.map((q,idx) =>
            <Accordion defaultExpanded={idx === openIndex}>
            <AccordionSummary expandIcon={<ExpandMore />}>
                <Typography>{q.q}</Typography> <Chip color={q.s === "Closed" ? "success" : "primary"} label={ q.s} />
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <label htmlFor="response" name="response">
                    Response
                  </label>
                  <select
                    className="form-control form-select"
                    name="response"
                    value={formData.response}
                    onChange={handleInputChange}
                  >
                    <option value="">Select </option>
                    {["Yes", "No"].map((num) => (
                      <option value={num}>{num} </option>
                    ))}
                  </select>
                  
                </Grid>
                <Grid item xs={12} sm={6}>
                  <label htmlFor="internalExternal" name="internalExternal">
                    Internal/External
                  </label>
                  <select
                    className="form-control form-select"
                    name="internalExternal"
                    value={formData.internalExternal}
                    onChange={handleInputChange}
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
                    className="form-control form-select"
                    name="floor"
                    value={formData.floor}
                    onChange={handleInputChange}
                  >
                    <option value="">Select </option>
                    {["1st Floor", "2nd Floor"].map((num) => (
                      <option value={num}>{num} </option>
                    ))}
                  </select>
                  
                </Grid>
                <Grid item xs={12} sm={6}>
                  <label htmlFor="room" name="room">
                    Room
                  </label>
                  <select
                    className="form-control form-select"
                    name="room"
                    value={formData.room}
                    onChange={handleInputChange}
                  >
                    <option value="">Select </option>
                    {["1001", "1002", "2001", "2002"].map((num) => (
                      <option value={num}>{num} </option>
                    ))}
                  </select>
                 
                </Grid>
                <Grid item xs={12}>
                  <label htmlFor="observation" name="observation">
                    Observation
                  </label>
                  <textarea
                    name="observation"
                    className="form-control"
                    id="observation"
                    rows="4"
                    placeholder="Enter notes..."
                    value={formData.observation}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Autocomplete
                    multiple
                    options={['Asset 1', 'Asset 2', 'Asset 3']}
                    value={formData.assets}
                    onChange={handleAssetChange}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant="outlined"
                        label="Search Asset"
                        placeholder="Assets"
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <label htmlFor="suggestedAction" name="suggestedAction">
                    Suggested Action
                  </label>
                  <textarea
                    name="suggestedAction"
                    className="form-control"
                    id="suggestedAction"
                    rows="4"
                    placeholder="Enter notes..."
                    value={formData.suggestedAction}
                    onChange={handleInputChange}
                    style={{ width: '100%', padding: '10px', margin: '8px 0', borderRadius: '4px', border: '1px solid #ccc' }}
                  />
                </Grid>
                <Grid item xs={12}>
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
                      <input hidden type="file" onChange={handleFileChange} />
                      <UploadFile />
                    </IconButton>
                    <Typography>
                      Click to upload or drag and drop PNG/JPG (max, 1MB)
                    </Typography>
                  </Box>
                </Grid>
                {formData.file && (
                  <Grid item xs={12} container alignItems="center" >
                    <Chip
                      label={formData.file.name}
                      onDelete={handleFileDelete}
                    />

                  </Grid>
                )}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom>
                    Risk Score Card (<strong>Total Risk Score = {formData.consequence * formData.likelihood}</strong>)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                    <Grid item xs={12} sm={12}>
                      <label htmlFor="consequence" name="consequence">
                        Consequence
                      </label>
                      <select
                        className="form-control form-select"
                        name="consequence"
                        value={formData.consequence}
                        onChange={handleInputChange}
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
                          className="form-control form-select"
                          name="likelihood"
                          value={formData.likelihood}
                          onChange={handleInputChange}
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
                      <button
                        style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                        className="btn btn-primary text-white pr-2"
                      onClick={() => { 
                        setOpenIndex(idx + 1);
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

                    </Grid>
               </Grid>
            </AccordionDetails>
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
});
export default connect(mapStateToProps, { getUsers, deleteUser, getSites })(
  AssessmentFireRisk
);

