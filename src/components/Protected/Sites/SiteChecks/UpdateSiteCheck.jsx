import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import InspectionElectricalFault from "./InspectionElectricalFault";
import SurveyWaterOutletTemperature from "./SurveyWaterOutletTemperature";
import InspectionElectricalCertificate from "./InspectionElectricalCertificate";
import AuditUnitPeriodic from "./AuditUnitPeriodic";
import AssessmentFireRisk from "./AssessmentFireRisk";
import Tooltip from "@mui/material/Tooltip";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import { useNavigate, useParams } from "react-router-dom";
import { get, post } from "../../../../api";
import { Button, Modal, Typography, Box, Grid, Divider, Stack, Paper, styled } from "@mui/material";
import { deleteUser, getSites, getExternalUsers } from "../../../../store/thunk/site";
import PrintIcon from '@mui/icons-material/Print';

const Item = styled(Paper)(({ theme }) => ({
  //backgroundColor: theme.palette.mode === 'dark' ? '#1A2027' : '#fff',
  //...theme.typography.body2,
  padding: theme.spacing(1),
  //textAlign: 'center',
  //color: theme.palette.text.secondary,
}));


const SiteChecks = ({ externalusers, getExternalUsers }) => {

  // Get ID from URL
  const params = useParams();
  const [showSiteCheck, setShowSiteCheck] = useState(true);
  const [step, setStep] = useState();
  const checkId = params.id;
  const site = JSON.parse(localStorage.getItem("site"));
  const [siteCheck, setSiteCheck] = useState();
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getExternalUsers();
    getSiteChecks();
  }, [checkId]);


  


  useEffect(() => {}, []);
  const [formData, setFormData] = useState({
    searchField: "",
    type: "",
    subType: "",
    status: "Open",
  });
  const [formData2, setFormData2] = useState({
    searchField: "",
    type: "",
    subType: "",
    status: "Open",
  });
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const getSiteChecks = async () => {
    const siteCheck = await get("/api/site-check/check-id/" + checkId);
    if (siteCheck.type === "Inspection" && siteCheck.subType === "Electrical") {
      setStep("inspection-electrical")
    } else if (siteCheck.type === "Assessment" && siteCheck.subType === "Fire Risk") {
      setStep("assessment-fire-risk")
    } else if (siteCheck.type === "Audit" && siteCheck.subType === "Unite Maintenance Periodic") {
      setStep("audit-unit-maintenance-periodic")
    } else if (siteCheck.type === "Survey" && siteCheck.subType === "Water" && siteCheck.category === "Outlet Temperature") {
      setStep("survey-water-outlet-temperature")
      
    }
    setSiteCheck(siteCheck);
  }


  return (
    <Fragment>
      <SidebarNew />
      
      <div className="content" style={{ backgroundColor: '#f8f9fa'}}>
        <Header />
        <div className="container-fluid">
              <BreadCrumHeader header={`Site Check - (${siteCheck?.type} - ${siteCheck?.subType} - ${siteCheck?.category})`} page={"Site Inspection"} />
          <Stack spacing={2}>
            <Item> <Grid container >


              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Type
                  </label>
                  <input
                    type="text"
                    disabled
                    value={siteCheck?.type}
                    className="form-control"
                  />
                  
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Sub Type
                  </label>
                  <input
                    type="text"
                    disabled
                    value={siteCheck?.subType}
                    className="form-control"
                  />
                  
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="category" name="category">
                    Category
                  </label>
                  <input
                    type="text"
                    disabled
                    value={siteCheck?.category}
                    className="form-control"
                  />
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Due Date
                  </label>
                  <input
                    //value={issueDate}
                    value={siteCheck?.dueDate?.substring(0, 10)}
                    disabled
                    type="date"
                    name="dueDate"
                    className="form-control"
                    onChange={handleInputChange}
                  />
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Lead
                  </label>
                  <select
                    name="leadUserID"
                    className="form-control form-select"
                    id="leadUserID"
                    disabled
                    onChange={handleInputChange}
                    value={siteCheck?.leadUserID}
                  >
                    <option value="">Select Lead</option>
                    {externalusers.map(u => {
                      return (
                        <option value={u.id}>{u.trade}({u.role}) - {u.name} ({u.email}) - {u.company} </option>
                      )
                    })}
                  </select>
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Assistant
                  </label>
                  <select
                    name="assistantUserID"
                    className="form-control form-select"
                    disabled
                    id="assistantUserID"
                    onChange={handleInputChange}
                    value={siteCheck?.assistantUserID}
                  >
                    <option value="">Select Assistant</option>
                    {externalusers.map(u => {
                      return (
                        <option value={u.id}>{u.trade}({u.role}) - {u.name} ({u.email}) - {u.company} </option>
                      )
                    })}
                  </select>
                </div>
              </Grid>

              <Grid sm={4}>
                {(siteCheck?.type === "Audit" || (siteCheck?.type === "Survey" && siteCheck?.category === "Outlet Temperature")) && <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Repeats
                  </label>
                  <input
                    type="text"
                    disabled
                    value={siteCheck?.repeatFrequency}
                    className="form-control"
                  />
                </div>}
              </Grid>
              <Grid sm={4}>

              </Grid>
              <Grid sm={4}>

              </Grid>
              <hr />
              <Grid sm={4}>

              </Grid>
              <Grid sm={4}>

              </Grid>
              <Grid sm={4}>
                <button
                  style={{ width: "200px", marginBottom: '20px', margin: '10px', float: 'right' }}
                  className="btn btn-primary btn-light"
                  onClick={() => { navigate("/site-checks") }}
                >
                  <PrintIcon /> Print PDF Report
                </button>
                <button
                  style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right' }}
                  className="btn btn-primary btn-light"
                  onClick={() => { navigate("/site-checks") }}
                >
                  Back
                </button>

              </Grid>


            </Grid></Item>
            {step === "inspection-electrical" && <Item><InspectionElectricalFault checkId={checkId} /></Item>}
            {step === "inspection-electrical" && <Item><InspectionElectricalCertificate checkId={checkId} /></Item>}
            {step === "assessment-fire-risk" && <Item><AssessmentFireRisk checkId={checkId} /></Item>}
            {step === "audit-unit-maintenance-periodic" && <Item><AuditUnitPeriodic checkId={checkId} /></Item>}
            {step === "survey-water-outlet-temperature" && <Item><SurveyWaterOutletTemperature checkId={checkId} /></Item>}
            
          </Stack>    
          
         
            
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  externalusers: state.site.externalusers,
});
export default connect(mapStateToProps, { getExternalUsers, deleteUser, getSites })(
  SiteChecks
);

