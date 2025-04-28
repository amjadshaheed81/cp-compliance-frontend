import React, { Fragment, useEffect, useState, useRef } from "react";
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import { toast } from "react-toastify";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import EmergencyLightingInspectionForm from "./EmergencyLightingInspectionForm";
import InspectionElectricalFault from "./InspectionElectricalFault";
import SurveyWaterTemperatureMonitoring from "./SurveyWaterTemperatureMonitoring";
import InspectionElectricalCertificate from "./InspectionElectricalCertificate";
import InspectionFireCertificate from "./InspectionFireCertificate";
import InspectionFireFault from "./InspectionFireFault";
import AsbestosSurvey from "./AsbestosSurvey";
import AsbestonSample from "./AsbestonSample";
import AuditUnitPeriodic from "./AuditUnitPeriodic";
import AssessmentFireRisk from "./AssessmentFireRisk";
import Audit from "./Audit";
import TankSurvey from "./TankSurvey";
import SurveyWaterDomesticRA from "./SurveyWaterDomesticRA";
import { useNavigate, useParams } from "react-router-dom";
import { get, getSasToken, getPdf, getPdfFromUrl } from "../../../../api";
import { Grid, Stack, Paper, styled } from "@mui/material";
import {
  deleteUser,
  getSites,
  getExternalUsers,
} from "../../../../store/thunk/site";
import PrintIcon from "@mui/icons-material/Print";
import html2pdf from "html2pdf.js";
import "./Print.css";
import moment from "moment";
import { addRepeatFrequency } from "../../../../utils/getSiteCheckDueDate";
import SounderAudibilty from "./SounderAudibility";
import RefugeIntercomTesting from "./RefugeIntercomTesting";
import ExternalLightningCertificate from "./ExternalLightningCertificate";
import MicroWaveOvenCertificate from "./MicroWaveOvenCertificate";
import DisabledWCAlarmCertificate from "./DisabledWCAlarmCertificate";
import CctvAlarmCertificate from "./CctvAlarmCertificate";
import IntruderAlarmCertificate from "./IntruderAlarmCertificate";
import StorageTankService from "./StorageTankService";
import WaterHeaterCertificate from "./WaterHeaterCertificate";
import FanExtract from "./FanExtract";
import AirConditioning from "./AirConditioning";
import VentilationReport from "./VentilationReport";

const Item = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(1),
}));

const SiteChecks = ({ siteSelectedForGlobal }) => {
  const printRef = useRef();

  const params = useParams();
  const [dueDate, setDueDate] = useState("");
  const [sasToken, setSasToken] = useState();
  const [step, setStep] = useState();
  const checkId = params.id;
  const [siteCheck, setSiteCheck] = useState();
  const [managerList, setManagerList] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (
      siteCheck?.startDate &&
      siteCheck?.repeatFrequency &&
      !siteCheck?.dueDate
    ) {
      // Convert start date to Date object
      let nextDueDate = new Date(siteCheck.startDate);
      const currentDate = new Date();

      // Keep advancing the nextDueDate by the repeat frequency until it is in the future
      while (nextDueDate <= currentDate) {
        nextDueDate = addRepeatFrequency(
          nextDueDate,
          siteCheck.repeatFrequency
        );
      }

      // Update dueDate state with the formatted date (YYYY-MM-DD)
      setDueDate(moment(nextDueDate).format("DD-MM-YYYY"));
    } else {
      setDueDate(
        siteCheck?.dueDate ? moment(siteCheck.dueDate).format("DD-MM-YYYY") : ""
      );
    }
  }, [siteCheck]);

  useEffect(() => {
    getManagerList();
    getSiteChecks();
    getToken();
  }, [checkId]);

  const getToken = async () => {
    const token = await getSasToken();
    setSasToken(token);
  };

  const getManagerList = async () => {
    const data = await get(
      `/api/user/all?siteId=${siteSelectedForGlobal?.siteId}`
    );
    setManagerList(
      data?.users?.sort((a, b) => {
        if (a.name < b.name) {
          return -1; // a comes before b
        }
        if (a.name > b.name) {
          return 1; // b comes before a
        }
        return 0; // names are equal
      }) || []
    );
  };

  useEffect(() => {}, []);
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

    if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Emergency Lighting to meet BS5266"
    ) {
      setStep("inspection-electrical-emergency");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Electrical" &&
      siteCheck.category === "External Lighting Testing"
    ) {
      setStep("inspection-electrical-lightning");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Electrical" &&
      siteCheck.category === "Microwave Oven Testing"
    ) {
      setStep("inspection-electrical-microwave-oven");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Electrical" &&
      siteCheck.category === "WC Alarm Testing"
    ) {
      setStep("inspection-electrical-wc-alarm");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Fire Alarm to meet BS5839" &&
      siteCheck.category === "Fire Alarm Sounder Audibilty"
    ) {
      setStep("inspection-sounder-audibilty");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Fire Alarm to meet BS5839" &&
      siteCheck.category === "Refuge Intercom Testing & Inspection"
    ) {
      setStep("inspection-refuge-intercom-testing");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Fire Alarm to meet BS5839"
    ) {
      setStep("inspection-fire-alarm");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Intruder Alarm" &&
      siteCheck.category === "CCTV Servicing & Inspection"
    ) {
      setStep("inspection-cctv-intruder-alarm");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Intruder Alarm" &&
      siteCheck.category === "Intruder Alarm Servicing & Inspection"
    ) {
      setStep("inspection-intruder-alarm");

      siteCheck.subType === "Legionella" &&
      siteCheck.category === "Water - Visual Inspection of Storage Tank"
    ) {
      setStep("inspection-storage-tank");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Legionella" &&
      siteCheck.category === "Water Heater Inspection & Service"
    ) {
      setStep("inspection-water-heater");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Plant and Equipment Inspection" &&
      siteCheck.category === "Extract Fan Cleaning"
    ) {
      setStep("inspection-fan-extract");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Plant and Equipment Inspection" &&
      siteCheck.category === "Air Conditioning Service"
    ) {
      setStep("inspection-air-conditioning");
    } else if (
      siteCheck.type === "Inspection" &&
      siteCheck.subType === "Plant and Equipment Inspection" &&
      siteCheck.category === "Ventilation System(s) Servicing"
    ) {
      setStep("inspection-ventilation-report");

    } else if (siteCheck.type === "Assessment") {
      setStep("assessment-fire-risk");
    } else if (
      siteCheck.type === "Audit" &&
      siteCheck?.subType === "Monthly Audit"
    ) {
      setStep("audit-question");
    } else if (
      siteCheck.type === "Audit" &&
      siteCheck?.subType === "Annual Winter Audit"
    ) {
      setStep("audit-question");
    } else if (siteCheck.type === "Audit") {
      setStep("audit-unit-maintenance-periodic");
    } else if (
      siteCheck.type === "Survey" &&
      siteCheck?.subType === "Water" &&
      siteCheck.category === "Water Temperature Monitoring"
    ) {
      setStep("survey-water-outlet-temperature");
    } else if (
      siteCheck.type === "Survey" &&
      siteCheck?.subType === "Water" &&
      siteCheck.category === "Water Risk Assessment"
    ) {
      setStep("survey-water-domestic-ra");
    } else if (
      siteCheck.type === "Survey" &&
      siteCheck?.subType === "Asbestos"
    ) {
      setStep("survey-asbestos");
    } else if (
      siteCheck.type === "Survey" &&
      siteCheck?.subType === "Water" &&
      siteCheck.category === "Tank"
    ) {
      setStep("survey-water-tank");
    }
    setSiteCheck(siteCheck);
  };

  const handlePrint = async () => {
    if (step === "inspection-electrical-emergency") {
      const pdfBlob = await getPdfFromUrl(
        `/api/site-check/emergency-lighting/pdf-report/${checkId}`
      );
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    } else {
      const pdfBlob = await getPdf(checkId);
      const url = URL.createObjectURL(pdfBlob);
      window.open(url, "_blank");
    }
    // if (siteCheck.type === "Inspection" && siteCheck?.subType === "Electrical") {
    //   const pdfBlob = await getPdf(checkId);
    //   const url = URL.createObjectURL(pdfBlob);
    //   window.open(url, '_blank');
    // } else {
    //   toast.warn("Feature coming soon");
    // }
  };

  const handlePrint2 = () => {
    const accordions = document.querySelectorAll(".MuiAccordion-root");
    const originalStates = [];

    accordions.forEach((accordion, index) => {
      const summary = accordion.querySelector(".MuiAccordionSummary-root");
      const details = accordion.querySelector(".MuiCollapse-root");

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
      filename: "document.pdf",
      //html2canvas: { scale: 1 },
      jsPDF: {
        //unit: 'in',
        //format: 'letter',
        orientation: "landscape",
      },
    };
    html2pdf()
      .from(element)
      .set(options)
      .save()
      .then(() => {
        document
          .querySelectorAll(".navbar, .sidebar, button, .dont-print ")
          .forEach((el) => {
            el.classList.remove("no-print");
          });
        accordions.forEach((accordion, index) => {
          const summary = accordion.querySelector(".MuiAccordionSummary-root");
          const details = accordion.querySelector(".MuiAccordionDetails-root");

          //if (!originalStates[index] && details.style.display !== 'none') {
          summary.click();
          //}
        });
      });
  };

  return (
    <Fragment>
      <SidebarNew />

      <div
        className="content"
        ref={printRef}
        style={{ backgroundColor: "#f8f9fa" }}
      >
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader
            header={`Site Check ${siteCheck?.type ? "- (" : ""}${
              siteCheck?.type ?? ""
            } ${siteCheck?.type ? "-" : ""} ${siteCheck?.subType ?? ""} ${
              siteCheck?.type ? "-" : ""
            } ${siteCheck?.category ?? ""}${siteCheck?.type ? ")" : ""}`}
            page={"Site Inspection"}
            chipColor={siteCheck?.status === "Done" ? "success" : "warning"}
            chipLabel={siteCheck?.status}
          />
          <Stack spacing={2}>
            <Item>
              {" "}
              <Grid container>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="folder" name="folder">
                      Type
                    </label>
                    <input
                      type="text"
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
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
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
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
                      autoComplete="off"
                      readOnly
                      onFocus={(e) => e.target.removeAttribute("readonly")}
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
                {/* <Grid sm={4}>
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
                </Grid> */}
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
                      {managerList?.map((u) => {
                        return (
                          <option value={u.id}>
                            {u.trade}({u.role}) - {u.name} ({u.email}) -{" "}
                            {u.company}{" "}
                          </option>
                        );
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
                      {managerList?.map((u) => {
                        return (
                          <option value={u.id}>
                            {u.trade}({u.role}) - {u.name} ({u.email}) -{" "}
                            {u.company}{" "}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </Grid>

                <Grid sm={4}>
                  {(siteCheck?.type === "Audit" ||
                    (siteCheck?.type === "Survey" &&
                      siteCheck?.subType === "Water")) && (
                    <div style={{ margin: "10px" }}>
                      <label htmlFor="folder" name="folder">
                        Repeats
                      </label>
                      <input
                        type="text"
                        autoComplete="off"
                        readOnly
                        onFocus={(e) => e.target.removeAttribute("readonly")}
                        disabled
                        value={siteCheck?.repeatFrequency}
                        className="form-control"
                      />
                    </div>
                  )}
                </Grid>
                <Grid sm={4}></Grid>
                <Grid sm={4}></Grid>
                <hr />
                <Grid sm={4}></Grid>
                <Grid sm={4}></Grid>
              </Grid>
            </Item>
            {step === "inspection-electrical-emergency" && (
              <Item>
                <EmergencyLightingInspectionForm
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}
            {step === "inspection-electrical-lightning" && (
              <Item>
                <ExternalLightningCertificate
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck?.category}
                />
              </Item>
            )}
            {step === "inspection-sounder-audibilty" && (
              <Item>
                <SounderAudibilty
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck?.category}
                />
              </Item>
            )}
            {step === "inspection-refuge-intercom-testing" && (
              <Item>
                <RefugeIntercomTesting
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck?.category}
                />
              </Item>
            )}
            {step === "inspection-electrical-microwave-oven" && (
              <Item>
                <MicroWaveOvenCertificate
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck?.category}
                />
              </Item>
            )}
            {step === "inspection-electrical-wc-alarm" && (
              <DisabledWCAlarmCertificate
                checkId={checkId}
                sasToken={sasToken}
                subType={siteCheck?.subType}
                category={siteCheck.category}
              />
            )}
            {step === "assessment-fire-risk" && (
              <Item>
                <AssessmentFireRisk
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "inspection-cctv-intruder-alarm" && (
              <Item>
                <CctvAlarmCertificate
                checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "inspection-storage-tank" && (
              <Item>
                <StorageTankService
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "inspection-intruder-alarm" && (
              <Item>
                <IntruderAlarmCertificate
                checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "inspection-water-heater" && (
              <Item>
                <WaterHeaterCertificate
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "inspection-fan-extract" && (
              <Item>
                <FanExtract
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "inspection-air-conditioning" && (
              <Item>
                <AirConditioning
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "inspection-ventilation-report" && (
              <Item>
                <VentilationReport
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                  category={siteCheck.category}
                />
              </Item>
            )}
            {step === "audit-unit-maintenance-periodic" && (
              <Item>
                <AuditUnitPeriodic checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "audit-question" && (
              <Item>
                <Audit
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                />
              </Item>
            )}
            {step === "survey-water-outlet-temperature" && (
              <Item>
                <SurveyWaterTemperatureMonitoring
                  checkId={checkId}
                  sasToken={sasToken}
                  repeatFrequency={siteCheck?.repeatFrequency}
                />
              </Item>
            )}
            {step === "survey-water-domestic-ra" && (
              <Item>
                <SurveyWaterDomesticRA checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-asbestos" && (
              <Item>
                <AsbestosSurvey checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-asbestos" && (
              <Item>
                <AsbestonSample checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-water-tank" && (
              <Item>
                <TankSurvey checkId={checkId} sasToken={sasToken} />
              </Item>
            )}

            {step === "inspection-electrical" && (
              <Item>
                <InspectionElectricalFault
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}
            {step === "inspection-electrical" && (
              <Item>
                <InspectionElectricalCertificate
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}
            {step === "inspection-fire-alarm" && (
              <Item>
                <InspectionFireFault
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}
            {step === "inspection-fire-alarm" && (
              <Item>
                <InspectionFireCertificate
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}

            {step === "assessment-fire-risk" && (
              <Item>
                <AssessmentFireRisk
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                />
              </Item>
            )}
            {step === "audit-unit-maintenance-periodic" && (
              <Item>
                <AuditUnitPeriodic checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "audit-question" && (
              <Item>
                <Audit
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                />
              </Item>
            )}
            {step === "survey-water-outlet-temperature" && (
              <Item>
                <SurveyWaterTemperatureMonitoring
                  checkId={checkId}
                  sasToken={sasToken}
                  repeatFrequency={siteCheck?.repeatFrequency}
                />
              </Item>
            )}
            {step === "survey-water-domestic-ra" && (
              <Item>
                <SurveyWaterDomesticRA checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-asbestos" && (
              <Item>
                <AsbestosSurvey checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-asbestos" && (
              <Item>
                <AsbestonSample checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-water-tank" && (
              <Item>
                <TankSurvey checkId={checkId} sasToken={sasToken} />
              </Item>
            )}

            {step === "inspection-electrical" && (
              <Item>
                <InspectionElectricalFault
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}
            {step === "inspection-electrical" && (
              <Item>
                <InspectionElectricalCertificate
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}

            {step === "inspection-fire-alarm" && (
              <Item>
                <InspectionFireCertificate
                  checkId={checkId}
                  sasToken={sasToken}
                  siteCheck={siteCheck}
                />
              </Item>
            )}

            {step === "assessment-fire-risk" && (
              <Item>
                <AssessmentFireRisk
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                />
              </Item>
            )}
            {step === "audit-unit-maintenance-periodic" && (
              <Item>
                <AuditUnitPeriodic checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "audit-question" && (
              <Item>
                <Audit
                  checkId={checkId}
                  sasToken={sasToken}
                  subType={siteCheck?.subType}
                />
              </Item>
            )}
            {step === "survey-water-outlet-temperature" && (
              <Item>
                <SurveyWaterTemperatureMonitoring
                  checkId={checkId}
                  sasToken={sasToken}
                  repeatFrequency={siteCheck?.repeatFrequency}
                />
              </Item>
            )}
            {step === "survey-water-domestic-ra" && (
              <Item>
                <SurveyWaterDomesticRA checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-asbestos" && (
              <Item>
                <AsbestosSurvey checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-asbestos" && (
              <Item>
                <AsbestonSample checkId={checkId} sasToken={sasToken} />
              </Item>
            )}
            {step === "survey-water-tank" && (
              <Item>
                <TankSurvey checkId={checkId} sasToken={sasToken} />
              </Item>
            )}

            <Grid sm={12}>
              <button
                style={{
                  width: "200px",
                  marginBottom: "20px",
                  margin: "10px",
                  float: "right",
                }}
                className="btn btn-primary btn-light"
                onClick={() => {
                  handlePrint();
                }}
                id="lklkl1"
              >
                <PrintIcon /> Print PDF Report
              </button>
              <button
                style={{
                  width: "150px",
                  marginBottom: "20px",
                  margin: "10px",
                  float: "right",
                }}
                className="btn btn-primary btn-light"
                onClick={() => {
                  navigate("/site-checks");
                }}
                id="lklkl2"
              >
                Back
              </button>
            </Grid>
          </Stack>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  externalusers: state.site.externalusers,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getExternalUsers,
  deleteUser,
  getSites,
})(SiteChecks);
