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
import { get, getSasToken, getPdf, getPdfFromUrl, put } from "../../../../api";
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
import { ROLE } from "../../../../Constant/Role";
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
import WaterChlorination from "./WaterChlorination";
import GasInspection from "./GasInspection";
import FireDamper from "./FireDamper";
import ShowerHeadCertificate from "./ShowerHeadCertificate";
import GasBoilerService from "./GasBoilerService";
import FireFightingEquipmentReport from "./FireFightingEquipmentReport";
import AirConditioningRecurrenceCheck from "./AirConditioningRecurrenceCheck";

const Item = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
}));

const SiteChecks = ({ siteSelectedForGlobal,loggedInUserData }) => {
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

    const [savingAssignees, setSavingAssignees] = useState(false);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData({
            ...formData,
            [name]: value,
        });
    };

    const handleAssigneeChange = (e) => {
        const { name, value } = e.target;
        setSiteCheck((prev) => ({
            ...prev,
            [name]: value,
        }));
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
        } else if (
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Gas" &&
            siteCheck.category === "Boiler Service / Maintenance Checklist"
        ) {
            setStep("inspection-boiler-service");
        } else if (
            siteCheck.type === "Inspection" &&
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
            siteCheck.subType === "Legionella" &&
            siteCheck.category === "Water - Storage System Chlorination"
        ) {
            setStep("inspection-water-chlorination");
        } else if (
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Plant and Equipment Inspection" &&
            siteCheck.category === "Extract Fan Cleaning"
        ) {
            setStep("inspection-fan-extract");
        }else if(
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Passive Fire" &&
            siteCheck.category === "Passive Fire - Fire Damper Inspection"
        ){
            setStep("inspection-fire-damper")
        } else if (
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Fire Fighting Equipment" &&
            siteCheck.category === "Fire Extinguisher Inspection & Service"
        ) {
            setStep("inspection-fire-Equipment")
        } else if (
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Plant and Equipment Inspection" &&
            siteCheck.category === "Air Conditioning Service"
        ) {
            setStep("inspection-air-conditioning");
        }
        else if (
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Plant and Equipment Inspection" &&
            siteCheck.category === "Air Conditioning F-Gas Report"
        ) {
            setStep("inspection-air-conditioning-report");
        } else if (
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Plant and Equipment Inspection" &&
            siteCheck.category === "Ventilation System(s) Servicing"
        ) {
            setStep("inspection-ventilation-report");
        } else if (
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Gas" &&
            siteCheck.category === "Gas Safety Annual Inspection"
        ) {
            setStep("inspection-gas");
        }else if(
            siteCheck.type === "Inspection" &&
            siteCheck.subType === "Legionella" &&
            siteCheck.category === "Periodic Shower Head Cleaning"){
            setStep("shower-head")
        }
        else if (siteCheck.type === "Assessment") {
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

    const handleSaveAssignees = async () => {
        if (!siteCheck) return;
        try {
            setSavingAssignees(true);
            const res = await put(`/api/site-check/${checkId}/assignees`, {
                leadUserID: siteCheck.leadUserID,
                assistantUserID: siteCheck.assistantUserID,
            });
            if (res?.status === 200) {
                toast.success("Site check assignees updated successfully.");
            } else {
                toast.error("Failed to update site check assignees.");
            }
        } catch (error) {
            toast.error("Error while updating site check assignees.");
        } finally {
            setSavingAssignees(false);
        }
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
                                {siteCheck?.category !== "Air Conditioning F-Gas Report" && (
                                    <>
                                        <Grid sm={4}>
                                            <div style={{ margin: "10px" }}>
                                                <label htmlFor="folder" name="folder">
                                                    Lead
                                                </label>
                                                <select
                                                    name="leadUserID"
                                                    className="form-control form-select"
                                                    id="leadUserID"
                                                    disabled={
                                                        loggedInUserData?.role !== ROLE.ADMIN ||
                                                        siteCheck?.status !== "Open"
                                                    }
                                                    onChange={handleAssigneeChange}
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
                                                    disabled={
                                                        loggedInUserData?.role !== ROLE.ADMIN ||
                                                        siteCheck?.status !== "Open"
                                                    }
                                                    id="assistantUserID"
                                                    onChange={handleAssigneeChange}
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
                                            {loggedInUserData?.role === ROLE.ADMIN &&
                                                siteCheck?.status === "Open" && (
                                                    <div style={{ margin: "10px", marginTop: "32px" }}>
                                                        <button
                                                            style={{ width: "100%" }}
                                                            className="btn btn-primary"
                                                            onClick={handleSaveAssignees}
                                                            disabled={savingAssignees}
                                                        >
                                                            {savingAssignees ? "Saving..." : "Click to update Assigned Users"}
                                                        </button>
                                                    </div>
                                                )}
                                        </Grid>
                                    </>
                                )}
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
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
                                />
                            </Item>
                        )}
                        {step === "inspection-fire-damper" && (
                            <Item>
                                <FireDamper
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck?.category}
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
                                />
                            </Item>
                        )}
                        {step === "inspection-boiler-service" && (
                            <Item>
                                <GasBoilerService
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck?.category}
                                    leadUserID={siteCheck?.leadUserID}
                                />
                            </Item>
                        )}
                        {step === "inspection-electrical-wc-alarm" && (
                            <DisabledWCAlarmCertificate
                                checkId={checkId}
                                sasToken={sasToken}
                                subType={siteCheck?.subType}
                                category={siteCheck.category}
                                leadUserID={siteCheck?.leadUserID}
                            />
                        )}
                        {step === "assessment-fire-risk" && (
                            <Item>
                                <AssessmentFireRisk
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck.category}
                                    leadUserID={siteCheck?.leadUserID}

                                />
                            </Item>
                        )}

                        {step === "inspection-fire-Equipment" && (
                            <Item>
                                <FireFightingEquipmentReport
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck.category}
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
                                />
                            </Item>
                        )}
                        {step === "inspection-water-chlorination" && (
                            <Item>
                                <WaterChlorination
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck.category}
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
                                    siteCheck={siteCheck}
                                />
                            </Item>
                        )}
                        {step === "inspection-air-conditioning-report" && (
                            <Item>
                                <AirConditioningRecurrenceCheck
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck.category}
                                    leadUserID={siteCheck?.leadUserID}
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
                                    leadUserID={siteCheck?.leadUserID}
                                />
                            </Item>
                        )}
                        {step === "shower-head" && (
                            <Item>
                                <ShowerHeadCertificate
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck.category}
                                    leadUserID={siteCheck?.leadUserID}
                                />
                            </Item>
                        )}
                        {step === "audit-unit-maintenance-periodic" && (
                            <Item>
                                <AuditUnitPeriodic checkId={checkId}
                                                   leadUserID={siteCheck?.leadUserID}
                                                   sasToken={sasToken} />
                            </Item>
                        )}
                        {step === "audit-question" && (
                            <Item>
                                <Audit
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    leadUserID={siteCheck?.leadUserID}
                                    siteCheck={siteCheck}
                                    managerList={managerList}
                                    onAuditSubmitted={getSiteChecks}
                                />
                            </Item>
                        )}
                        {step === "survey-water-outlet-temperature" && (
                            <Item>
                                <SurveyWaterTemperatureMonitoring
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    leadUserID={siteCheck?.leadUserID}
                                    repeatFrequency={siteCheck?.repeatFrequency}
                                />
                            </Item>
                        )}
                        {step === "survey-water-domestic-ra" && (
                            <Item>
                                <SurveyWaterDomesticRA
                                    leadUserID={siteCheck?.leadUserID}
                                    checkId={checkId} sasToken={sasToken} />
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
                                <InspectionElectricalCertificate
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    siteCheck={siteCheck}
                                    leadUserID={siteCheck?.leadUserID}
                                />
                            </Item>
                        )}

                        {step === "inspection-gas" && (
                            <Item>
                                <GasInspection
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
                                    leadUserID={siteCheck?.leadUserID}
                                    siteCheck={siteCheck}
                                />
                            </Item>
                        )}

                        <Grid sm={12}>
                            {/*<button*/}
                            {/*  style={{*/}
                            {/*    width: "200px",*/}
                            {/*    marginBottom: "20px",*/}
                            {/*    margin: "10px",*/}
                            {/*    float: "right",*/}
                            {/*  }}*/}
                            {/*  className="btn btn-primary btn-light"*/}
                            {/*  onClick={() => {*/}
                            {/*    handlePrint();*/}
                            {/*  }}*/}
                            {/*  id="lklkl1"*/}
                            {/*>*/}
                            {/*  <PrintIcon /> Print PDF Report*/}
                            {/*</button>*/}
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
    loggedInUserData: state.site.loggedInUserData,
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
    getExternalUsers,
    deleteUser,
    getSites,
})(SiteChecks);
