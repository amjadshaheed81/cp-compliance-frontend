import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { CSVLink } from "react-csv";
import moment from "moment";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import InspectionElectricalFault from "./InspectionElectricalFault";
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
  
  
  

  const addSiteCheck = async () => {
    
    const body = formData;
    body.siteId = site.siteId
    body.dueDate = new Date(body.dueDate);
    const response = await post("/api/site-check/", body);
    //setCheckId(response);
    //await getSiteChecks();
    setShowSiteCheck(false);
   
  }

  const getSiteChecks = async () => {
    const siteCheck = await get("/api/site-check/check-id/" + checkId);
    if (siteCheck.type === "Inspection" && siteCheck.subType === "Electrical") {
      setStep("inspection-electrical")
    } else if (siteCheck.type === "Assessment" && siteCheck.subType === "Fire Risk") {
      setStep("assessment-fire-risk")
    } else if (siteCheck.type === "Audit" && siteCheck.subType.trim() === "Unit Maintenance Periodic") {
      setStep("audit-unit-maintenance-periodic")
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
                  <select
                    disabled
                    value={siteCheck?.type}
                    name="type"
                    className="form-control form-select"
                    id="type"
                    onChange={handleInputChange}
                  >
                    <option value="">Select Type</option>
                    <option value="Assessment">Assessment</option>
                    <option value="Audit">Audit</option>
                    <option value="Survey">Survey</option>
                    <option value="Inspection">Inspection</option>
                  </select>
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Sub Type
                  </label>
                  <select
                    name="subType"
                    className="form-control form-select"
                    id="subType"
                    onChange={handleInputChange}
                    disabled
                    value={siteCheck?.subType}
                  >
                    <option value="">Select Sub Type</option>
                    <option value="Electrical">Electrical</option>
                    <option value="Fire Risk">Fire Risk</option>
                    <option value="Daily Fire Inspection">Daily Fire Inspection</option>
                    <option value="Water Survey">Water Survey</option>
                    <option value="Asbestos Survey">Asbestos Survey</option>
                    <option value="Unit Maintenance Periodic">Unit Maintenance Periodic</option>
                  </select>
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="category" name="category">
                    Category
                  </label>
                  <select
                    name="category"
                    className="form-control form-select"
                    id="category"
                    onChange={handleInputChange}
                    disabled
                    value={siteCheck?.category}
                  >
                    <option value="">Select Category</option>
                    <option value="WC Alarm Testing">WC Alarm Testing</option>
                    <option value="Fire Risk Assessment">Fire Risk Assessment</option>
                    <option value="Daily Fire Inspection">Daily Fire Inspection</option>
                    <option value="Domestic RA Water Survey">Domestic RA Water Survey</option>
                    <option value="Localised Type 3 Asbestos Survey">Localised Type 3 Asbestos Survey</option>
                    <option value="6 monthly">6 monthly</option>
                  </select>
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Due Date
                  </label>
                  <input
                    //value={issueDate}
                    value={siteCheck?.issueDate}
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
                  <select
                    name="repeatFrequency"
                    className="form-control form-select"
                    disabled
                    id="repeatFrequency"
                    onChange={handleInputChange}
                  >
                    <option value="">None</option>

                  </select>
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
            {step === "inspection-electrical" && <Item><InspectionElectricalFault /></Item>}
            {step === "inspection-electrical" && <Item><InspectionElectricalCertificate /></Item>}
            {step === "assessment-fire-risk" && <Item><AssessmentFireRisk /></Item>}
            {step === "audit-unit-maintenance-periodic" && <Item><AuditUnitPeriodic /></Item>}
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

