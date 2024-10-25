import React, { Fragment, useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import { toast } from "react-toastify";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import InspectionElectricalFault from "./InspectionElectricalFault";
import SurveyWaterTemperatureMonitoring from "./SurveyWaterTemperatureMonitoring";
import InspectionElectricalCertificate from "./InspectionElectricalCertificate";
import AsbestosSurvey from "./AsbestosSurvey";
import AsbestonSample from "./AsbestonSample"
import AuditUnitPeriodic from "./AuditUnitPeriodic";
import AssessmentFireRisk from "./AssessmentFireRisk";
import MonthlyInspection from "./MonthlyInspection";
import TankSurvey from "./TankSurvey";
import SurveyWaterDomesticRA from "./SurveyWaterDomesticRA"
import { useNavigate, useParams } from "react-router-dom";
import { get, getSasToken, getPdf } from "../../../../api";
import { Grid, Stack, Paper, styled } from "@mui/material";
import { deleteUser, getSites, getExternalUsers } from "../../../../store/thunk/site";
import PrintIcon from '@mui/icons-material/Print';
import html2pdf from 'html2pdf.js';
import "./Print.css"
import moment from "moment";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
}));


const SiteChecks = ({ externalusers, getExternalUsers }) => {

  const printRef = useRef();

  const params = useParams();
  const [dueDate, setDueDate] = useState('');
  const [sasToken, setSasToken] = useState();
  const [step, setStep] = useState();
  const checkId = params.id;
  const [siteCheck, setSiteCheck] = useState();
  const navigate = useNavigate();
  const getRepeatFrequency = (repeatFrequency) => {
    if(repeatFrequency === "Daily") {
      return 1;
    }else if(repeatFrequency === "Weekly") {
      return 7;
    }else if(repeatFrequency === "Monthly") {
      return 30;
    }else if(repeatFrequency === "Quarterly") {
      return 30*3;
    }else if(repeatFrequency === "Yearly") {
      return 365;
    }
  }
  useEffect(() => {
    if (siteCheck?.startDate && siteCheck?.repeatFrequency && !siteCheck?.dueDate) {
      // Convert start date to Date object
      const startDate = new Date(siteCheck.startDate);
      console.log("startDate", startDate);
      // Add repeatFrequency (assumed in days) to start date
      const expiryDate =startDate;
      expiryDate.setDate(startDate.getDate() + getRepeatFrequency(siteCheck.repeatFrequency));

      // Update dueDate state with the formatted date (YYYY-MM-DD)
      setDueDate(expiryDate.toISOString().substring(0, 10));
    } else {
      setDueDate(String(siteCheck?.dueDate)?.substring(0, 10));
    }
  }, [siteCheck]);

  useEffect(() => {
    getExternalUsers();
    getSiteChecks();
    getToken();

  }, [checkId]);

  const getToken = async () => {
    const token = await getSasToken();
    setSasToken(token);
  }

  useEffect(() => { }, []);
  const [formData, setFormData] = useState({
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
    if (siteCheck.type === "Inspection") {
      setStep("inspection-electrical")
    } else if (siteCheck.type === "Assessment" && siteCheck.subType === "Fire Risk Assessment") {
      setStep("assessment-fire-risk")
    } else if (siteCheck.type === "Audit" && siteCheck.subType === "Monthly Inspection") {
      setStep("audit-monthly-inspection")
    } else if (siteCheck.type === "Audit") {
      setStep("audit-unit-maintenance-periodic")
    } else if (siteCheck.type === "Survey" && siteCheck.subType === "Water" && siteCheck.category === "Water Temperature Monitoring") {
      setStep("survey-water-outlet-temperature")
    } else if (siteCheck.type === "Survey" && siteCheck.subType === "Water" && siteCheck.category === "Water Risk Assessment") {
      setStep("survey-water-domestic-ra")
    } else if (siteCheck.type === "Survey" && siteCheck.subType === "Asbestos") {
      setStep("survey-asbestos")
  } else if (siteCheck.type === "Survey" && siteCheck.subType === "Water" && siteCheck.category === "Tank") {
    setStep("survey-water-tank")
  }
    setSiteCheck(siteCheck);
  }

  const handlePrint = async () => {
    const pdfBlob = await getPdf(checkId);
    const url = URL.createObjectURL(pdfBlob);
    window.open(url, '_blank');
    // if (siteCheck.type === "Inspection" && siteCheck.subType === "Electrical") {
    //   const pdfBlob = await getPdf(checkId);
    //   const url = URL.createObjectURL(pdfBlob);
    //   window.open(url, '_blank');
    // } else {
    //   toast.warn("Feature coming soon");
    // }
  }

  const handlePrint2 = () => {
    const accordions = document.querySelectorAll('.MuiAccordion-root');
    const originalStates = [];

    accordions.forEach((accordion, index) => {
      const summary = accordion.querySelector('.MuiAccordionSummary-root');
      const details = accordion.querySelector('.MuiCollapse-root');
      console.log('details.style.display', summary.style.display, details.style.details);

      // Store the original state
      //originalStates[index] = details.style.display !== 'none';

      // Expand the accordion if it's not already expanded
      // if (details.style.display === 'none') {
         summary.click();
      // }
    });
   
    // document.querySelectorAll('.navbar, .sidebar, button, .dont-print ').forEach(el => {
    //   el.classList.add('no-print');
    // });
    const element = printRef.current;
    const options = {
      margin: 1,
      filename: 'document.pdf',
      //html2canvas: { scale: 1 },
      jsPDF: {
        //unit: 'in',
        //format: 'letter',
        orientation: 'landscape'
      },
    };
    html2pdf().from(element).set(options).save()
      .then(() => {
        document.querySelectorAll('.navbar, .sidebar, button, .dont-print ').forEach(el => {
          el.classList.remove('no-print');
        });
         accordions.forEach((accordion, index) => {
          const summary = accordion.querySelector('.MuiAccordionSummary-root');
          const details = accordion.querySelector('.MuiAccordionDetails-root');

          //if (!originalStates[index] && details.style.display !== 'none') {
            summary.click();
          //}
        });
    });
  };



  return (
    <Fragment>
      <SidebarNew />

      <div className="content" ref={printRef} style={{ backgroundColor: '#f8f9fa' }}>
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={`Site Check ${siteCheck?.type ? "- (" : ""}${siteCheck?.type ?? ''} ${siteCheck?.type ? "-" : ""} ${siteCheck?.subType ?? ''} ${siteCheck?.type ? "-" : ""} ${siteCheck?.category ?? ''}${siteCheck?.type ? ")" : ""}`} page={"Site Inspection"}
            chipColor={siteCheck?.status === "Done" ? "success" : "warning"}
            chipLabel={siteCheck?.status}
          />
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
                  <label htmlFor="startDate" name="startDate">
                    Start Date
                  </label>
                  <input
                    id="startDate"
                    value={String(siteCheck?.startDate)?.substring(0, 10)}
                    disabled
                    type="date"
                    name="startDate"
                    className="form-control"
                    onChange={handleInputChange}
                  />
                </div>
              </Grid>
              <Grid sm={4}>
                <div style={{ margin: "10px" }}>
                  <label htmlFor="folder" name="folder">
                    Due Date
                  </label>
                  <input
                    value={dueDate}
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
                {(siteCheck?.type === "Audit" || (siteCheck?.type === "Survey" && siteCheck?.subType === "Water")) && <div style={{ margin: "10px" }}>
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
              <Grid sm={12}>
                <button
                  style={{ width: "200px", marginBottom: '20px', margin: '10px', float: 'right' }}
                  className="btn btn-primary btn-light"
                  onClick={() => { handlePrint() }}
                  id="lklkl1"
                >
                  <PrintIcon /> Print PDF Report
                </button>
              <button
                  style={{ width: "150px", marginBottom: '20px', margin: '10px', float: 'right',  }}
                  className="btn btn-primary btn-light"
                  onClick={() => { navigate("/site-checks") }}
                  id="lklkl2"
                >
                  Back
                </button>

              </Grid>

            </Grid></Item>
            {step === "inspection-electrical" && <Item><InspectionElectricalFault checkId={checkId} sasToken={sasToken} siteCheck={siteCheck}/></Item>}
            {step === "inspection-electrical" && <Item><InspectionElectricalCertificate checkId={checkId} sasToken={sasToken} siteCheck={siteCheck}/></Item>}
            {step === "assessment-fire-risk" && <Item><AssessmentFireRisk checkId={checkId} sasToken={sasToken} /></Item>}
            {step === "audit-unit-maintenance-periodic" && <Item><AuditUnitPeriodic checkId={checkId} sasToken={sasToken} /></Item>}
            {step === "audit-monthly-inspection"  && <Item><MonthlyInspection checkId={checkId} sasToken={sasToken} /></Item>}
            {step === "survey-water-outlet-temperature" && <Item><SurveyWaterTemperatureMonitoring checkId={checkId} sasToken={sasToken} repeatFrequency={siteCheck?.repeatFrequency}/></Item>}
            {step === "survey-water-domestic-ra" && <Item><SurveyWaterDomesticRA checkId={checkId} sasToken={sasToken} /></Item>}
            {step === "survey-asbestos" && <Item><AsbestosSurvey checkId={checkId} sasToken={sasToken} /></Item>}
            {step === "survey-asbestos" && <Item><AsbestonSample checkId={checkId} sasToken={sasToken} /></Item>}
            {step === "survey-water-tank" && <Item><TankSurvey checkId={checkId} sasToken={sasToken} /></Item>}
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

