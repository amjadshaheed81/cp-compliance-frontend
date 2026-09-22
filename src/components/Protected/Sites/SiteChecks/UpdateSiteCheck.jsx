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
import { get, getSasToken, getPdf, getPdfFromUrl, put, post } from "../../../../api";
import { Dialog, DialogActions, DialogContent, DialogTitle, Grid, Stack, Paper, styled, Tabs, Tab } from "@mui/material";
import {
    deleteUser,
    getSites,
    getExternalUsers,
    getSiteCheckUserOptions,
} from "../../../../store/thunk/site";
import PrintIcon from "@mui/icons-material/Print";
import html2pdf from "html2pdf.js";
import "./Print.css";
import moment from "moment";
import { addRepeatFrequency } from "../../../../utils/getSiteCheckDueDate";
import {
    calculateSiteCheckDueDate,
    formatSiteCheckDisplayDate,
} from "../../../../utils/siteCheckRecurrence";
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
import SiteCheckBackButton from "./shared/SiteCheckBackButton";
import SiteCheckHistory from "./SiteCheckHistory";
import { getUkLocalDate } from "./shared/siteCheckDateUtils";

const Item = styled(Paper)(({ theme }) => ({
    padding: theme.spacing(1),
}));

const resolveSiteCheckStep = (siteCheck) => {
    if (!siteCheck) return null;

    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Emergency Lighting to meet BS5266"
    ) {
        return "inspection-electrical-emergency";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Electrical" &&
        siteCheck.category === "External Lighting Testing"
    ) {
        return "inspection-electrical-lightning";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Electrical" &&
        siteCheck.category === "Microwave Oven Testing"
    ) {
        return "inspection-electrical-microwave-oven";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Electrical" &&
        siteCheck.category === "WC Alarm Testing"
    ) {
        return "inspection-electrical-wc-alarm";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Fire Alarm to meet BS5839" &&
        siteCheck.category === "Fire Alarm Sounder Audibilty"
    ) {
        return "inspection-sounder-audibilty";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Fire Alarm to meet BS5839" &&
        siteCheck.category === "Refuge Intercom Testing & Inspection"
    ) {
        return "inspection-refuge-intercom-testing";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Fire Alarm to meet BS5839"
    ) {
        return "inspection-fire-alarm";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Intruder Alarm" &&
        siteCheck.category === "CCTV Servicing & Inspection"
    ) {
        return "inspection-cctv-intruder-alarm";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Intruder Alarm" &&
        siteCheck.category === "Intruder Alarm Servicing & Inspection"
    ) {
        return "inspection-intruder-alarm";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Gas" &&
        siteCheck.category === "Boiler Service / Maintenance Checklist"
    ) {
        return "inspection-boiler-service";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Legionella" &&
        siteCheck.category === "Water - Visual Inspection of Storage Tank"
    ) {
        return "inspection-storage-tank";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Legionella" &&
        siteCheck.category === "Water Heater Inspection & Service"
    ) {
        return "inspection-water-heater";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Legionella" &&
        siteCheck.category === "Water - Storage System Chlorination"
    ) {
        return "inspection-water-chlorination";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Plant and Equipment Inspection" &&
        siteCheck.category === "Extract Fan Cleaning"
    ) {
        return "inspection-fan-extract";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Passive Fire" &&
        siteCheck.category === "Passive Fire - Fire Damper Inspection"
    ) {
        return "inspection-fire-damper";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Fire Fighting Equipment" &&
        siteCheck.category === "Fire Extinguisher Inspection & Service"
    ) {
        return "inspection-fire-Equipment";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Plant and Equipment Inspection" &&
        siteCheck.category === "Air Conditioning Service"
    ) {
        return "inspection-air-conditioning";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Plant and Equipment Inspection" &&
        siteCheck.category === "Air Conditioning F-Gas Report"
    ) {
        return "inspection-air-conditioning-report";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Plant and Equipment Inspection" &&
        siteCheck.category === "Ventilation System(s) Servicing"
    ) {
        return "inspection-ventilation-report";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Gas" &&
        siteCheck.category === "Gas Safety Annual Inspection"
    ) {
        return "inspection-gas";
    }
    if (
        siteCheck.type === "Inspection" &&
        siteCheck.subType === "Legionella" &&
        siteCheck.category === "Periodic Shower Head Cleaning"
    ) {
        return "shower-head";
    }
    if (siteCheck.type === "Assessment") {
        return "assessment-fire-risk";
    }
    if (
        siteCheck.type === "Audit" &&
        (siteCheck.subType === "Monthly Audit" ||
            siteCheck.subType === "Annual Winter Audit")
    ) {
        return "audit-question";
    }
    if (siteCheck.type === "Audit") {
        return "audit-unit-maintenance-periodic";
    }
    if (
        siteCheck.type === "Survey" &&
        siteCheck.subType === "Water" &&
        siteCheck.category === "Water Temperature Monitoring"
    ) {
        return "survey-water-outlet-temperature";
    }
    if (
        siteCheck.type === "Survey" &&
        siteCheck.subType === "Water" &&
        (siteCheck.category === "Water Risk Assessment" ||
            siteCheck.category === "Domestic RA")
    ) {
        return "survey-water-domestic-ra";
    }
    if (siteCheck.type === "Survey" && siteCheck.subType === "Asbestos") {
        return "survey-asbestos";
    }
    if (
        siteCheck.type === "Survey" &&
        siteCheck.subType === "Water" &&
        siteCheck.category === "Tank"
    ) {
        return "survey-water-tank";
    }

    return null;
};

const INSPECTION_STEPS_WITH_INTERNAL_BACK = new Set([
    "inspection-electrical-emergency",
    "inspection-electrical-lightning",
    "inspection-sounder-audibilty",
    "inspection-refuge-intercom-testing",
    "inspection-fire-damper",
    "inspection-electrical-microwave-oven",
    "inspection-boiler-service",
    "inspection-electrical-wc-alarm",
    "inspection-fire-Equipment",
    "inspection-cctv-intruder-alarm",
    "inspection-storage-tank",
    "inspection-water-chlorination",
    "inspection-intruder-alarm",
    "inspection-water-heater",
    "inspection-fan-extract",
    "inspection-air-conditioning",
    "inspection-air-conditioning-report",
    "inspection-ventilation-report",
    "shower-head",
    "inspection-gas",
    "inspection-fire-alarm",
]);

const SiteChecks = ({
    siteSelectedForGlobal,
    loggedInUserData,
    siteCheckUserOptions,
    getSiteCheckUserOptions,
    embedded = false,
    checkIdOverride,
    onRequestClose,
}) => {
    const printRef = useRef();

    const params = useParams();
    const [dueDate, setDueDate] = useState("");
    const [sasToken, setSasToken] = useState();
    const [step, setStep] = useState();
    const checkId = checkIdOverride ?? params.id;
    const [siteCheck, setSiteCheck] = useState();
    const [activeDetailTab, setActiveDetailTab] = useState("form");
    const [detailLoading, setDetailLoading] = useState(true);
    const [detailLoadError, setDetailLoadError] = useState("");
    const detailRequestIdRef = useRef(0);
    const navigate = useNavigate();
    const returnToSiteChecks = () => {
        if (embedded && onRequestClose) {
            onRequestClose();
            return;
        }
        navigate("/site-checks");
    };
    const authoritativeUserSiteId = siteCheck?.siteId || siteSelectedForGlobal?.siteId;
    const managerList =
        Number(siteCheckUserOptions?.siteId) === Number(authoritativeUserSiteId)
            ? siteCheckUserOptions?.siteUsers || []
            : [];

    useEffect(() => {
        if (!authoritativeUserSiteId) return undefined;

        const refreshTimer = window.setInterval(() => {
            getSiteCheckUserOptions(authoritativeUserSiteId, true);
        }, 60 * 60 * 1000);

        return () => window.clearInterval(refreshTimer);
    }, [authoritativeUserSiteId, getSiteCheckUserOptions]);

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
        setActiveDetailTab("form");
        loadSiteCheck({ resetDetail: true });
        getToken();

        return () => {
            // Invalidate any in-flight detail request when this check is replaced
            // or the detail page unmounts. This recreates the safety the legacy
            // route change got automatically by destroying the old page instance.
            detailRequestIdRef.current += 1;
        };
    }, [checkId]);

    const getToken = async () => {
        const token = await getSasToken();
        setSasToken(token);
    };

    useEffect(() => {}, []);
    const [formData, setFormData] = useState({
        searchField: "",
        type: "",
        subType: "",
        status: "Open",
    });

    const [savingAssignees, setSavingAssignees] = useState(false);
    const [showManualOpenDialog, setShowManualOpenDialog] = useState(false);
    const [plannedInspectionDate, setPlannedInspectionDate] = useState("");
    const [openingInspectionEarly, setOpeningInspectionEarly] = useState(false);

    const hasRecurringFrequency =
        Boolean(siteCheck?.repeatFrequency) &&
        siteCheck.repeatFrequency !== "None";

    const canOpenInspectionEarly =
        loggedInUserData?.role === ROLE.ADMIN &&
        siteCheck?.status === "Done" &&
        siteCheck?.type === "Inspection" &&
        hasRecurringFrequency;

    const currentDueDateValue = siteCheck?.dueDate
        ? String(siteCheck.dueDate).substring(0, 10)
        : "";
    const todayUk = getUkLocalDate();
    const hasCurrentDueDate = Boolean(currentDueDateValue);
    const plannedNextDueDate =
        plannedInspectionDate && hasRecurringFrequency
            ? calculateSiteCheckDueDate(
                  plannedInspectionDate,
                  siteCheck?.repeatFrequency
              )
            : null;

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



    const loadSiteCheck = async ({ resetDetail = false } = {}) => {
        const requestId = ++detailRequestIdRef.current;

        if (resetDetail) {
            // Legacy route navigation remounted this whole page for every check.
            // The workspace keeps its shell mounted, so explicitly reproduce that
            // clean-detail lifecycle before loading the newly selected record.
            setSiteCheck(undefined);
            setStep(undefined);
            setDueDate("");
            setDetailLoadError("");
            setDetailLoading(true);
            setShowManualOpenDialog(false);
            setPlannedInspectionDate("");
        }

        try {
            const loadedSiteCheck = await get("/api/site-check/check-id/" + checkId);

            // Ignore an older response if the user has already selected another row.
            if (requestId !== detailRequestIdRef.current) {
                return null;
            }

            const userSiteId =
                loadedSiteCheck?.siteId || siteSelectedForGlobal?.siteId;

            // Preserve the legacy loading order: the old routed page loaded the
            // Site Check users before it selected/rendered the inspection form.
            if (userSiteId) {
                await getSiteCheckUserOptions(userSiteId);
            }

            if (requestId !== detailRequestIdRef.current) {
                return null;
            }

            const nextStep = resolveSiteCheckStep(loadedSiteCheck);
            setSiteCheck(loadedSiteCheck);
            setStep(nextStep);
            setDetailLoading(false);

            if (!nextStep) {
                setDetailLoadError(
                    `No inspection component is configured for ${loadedSiteCheck?.type || "this Site Check"} / ${loadedSiteCheck?.subType || "-"} / ${loadedSiteCheck?.category || "-"}.`
                );
            } else {
                setDetailLoadError("");
            }

            return loadedSiteCheck;
        } catch (error) {
            if (requestId !== detailRequestIdRef.current) {
                return null;
            }

            console.error("Error loading Site Check detail:", error);
            setSiteCheck(undefined);
            setStep(undefined);
            setDetailLoading(false);
            setDetailLoadError("Unable to load this Site Check. Please try again.");
            return null;
        }
    };

    const getSiteChecks = async () => loadSiteCheck({ resetDetail: false });

    const handleOpenInspectionEarlyDialog = () => {
        setPlannedInspectionDate(todayUk);
        setShowManualOpenDialog(true);
    };

    const handleOpenInspectionEarly = async () => {
        if (!plannedInspectionDate) {
            toast.error("Planned Inspection Date is required.");
            return;
        }

        try {
            setOpeningInspectionEarly(true);
            const response = await post(`/api/site-check/recovery/${checkId}`, {
                action: "OPEN_INSPECTION_EARLY",
                cycleStartDate: plannedInspectionDate,
                reason: `Inspection force-opened from the inspection detail page for ${plannedInspectionDate}`,
            });

            setShowManualOpenDialog(false);
            toast.success(response?.data?.message || "Inspection opened successfully.");
            returnToSiteChecks();
        } catch (error) {
            const message =
                error?.response?.data?.message ||
                error?.response?.data ||
                "Unable to open the inspection.";
            toast.error(typeof message === "string" ? message : "Unable to open the inspection.");
        } finally {
            setOpeningInspectionEarly(false);
        }
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
            {!embedded && <SidebarNew />}

            <div
                className={embedded ? "site-check-update-embedded" : "content"}
                ref={printRef}
                style={{ backgroundColor: "#f8f9fa" }}
            >
                {!embedded && <Header />}
                <div className={embedded ? "" : "container-fluid"}>
                    {!embedded && (
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
                    )}
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
                                            siteCheck?.subType === "Water") ||
                                        siteCheck?.type === "Inspection") && (
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
                                <Grid sm={4}>
                                    {canOpenInspectionEarly && (
                                        <div style={{ margin: "10px", marginTop: "32px" }}>
                                            <button
                                                type="button"
                                                className="btn fw-bold shadow-sm"
                                                style={{
                                                    width: "100%",
                                                    backgroundColor: "#e67e22",
                                                    borderColor: "#c76410",
                                                    color: "#ffffff",
                                                }}
                                                onClick={handleOpenInspectionEarlyDialog}
                                            >
                                                Open Inspection Early
                                            </button>
                                        </div>
                                    )}
                                </Grid>
                                <Grid sm={4}></Grid>
                                <hr />
                                <Grid sm={4}></Grid>
                                <Grid sm={4}></Grid>
                            </Grid>
                        </Item>
                        {detailLoading && (
                            <Item className="print-hide">
                                <div className="d-flex align-items-center justify-content-center gap-3 py-4 text-secondary">
                                    <span
                                        className="spinner-border spinner-border-sm"
                                        role="status"
                                        aria-hidden="true"
                                    ></span>
                                    <span>Loading selected Site Check...</span>
                                </div>
                            </Item>
                        )}
                        {!detailLoading && detailLoadError && (
                            <Item className="print-hide">
                                <div className="alert alert-warning mb-0 d-flex align-items-center justify-content-between gap-3 flex-wrap">
                                    <span>{detailLoadError}</span>
                                    <button
                                        type="button"
                                        className="btn btn-sm btn-outline-secondary"
                                        onClick={() => loadSiteCheck({ resetDetail: true })}
                                    >
                                        Retry
                                    </button>
                                </div>
                            </Item>
                        )}
                        <Item className="print-hide">
                            <Tabs
                                value={activeDetailTab}
                                onChange={(_, value) => setActiveDetailTab(value)}
                                aria-label="Site Check form and history tabs"
                            >
                                <Tab value="form" label="Form" />
                                <Tab value="history" label="History" />
                            </Tabs>
                        </Item>

                        <div style={{ display: activeDetailTab === "form" ? "block" : "none" }}>
                            <Stack spacing={2}>
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
                                {/* NEW: Pass the exact Site Check so the form
                                    uses the same site/status rules as Air Conditioning. */}
                                <ExternalLightningCertificate
                                    checkId={checkId}
                                    sasToken={sasToken}
                                    subType={siteCheck?.subType}
                                    category={siteCheck?.category}
                                    leadUserID={siteCheck?.leadUserID}
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
                                />
                            </Item>
                        )}
                        {step === "inspection-electrical-wc-alarm" && (
                            <DisabledWCAlarmCertificate
                                checkId={checkId}
                                sasToken={sasToken}
                                subType={siteCheck?.subType}
                                category={siteCheck.category}
                                siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                                    siteCheck={siteCheck}
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
                            {(!INSPECTION_STEPS_WITH_INTERNAL_BACK.has(step) || siteCheck?.status !== "Open") && (
                                <div className="d-flex justify-content-end m-2 print-hide">
                                    <SiteCheckBackButton onClick={returnToSiteChecks} />
                                </div>
                            )}
                        </Grid>
                            </Stack>
                        </div>

                        {activeDetailTab === "history" && (
                            <Item>
                                <SiteCheckHistory checkId={checkId} />
                                <div className="d-flex justify-content-end mt-3 print-hide">
                                    <SiteCheckBackButton onClick={returnToSiteChecks} />
                                </div>
                            </Item>
                        )}
                    </Stack>
                </div>
            </div>

            <Dialog
                open={showManualOpenDialog}
                onClose={() => !openingInspectionEarly && setShowManualOpenDialog(false)}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Open Inspection Early</DialogTitle>
                <DialogContent>
                    <div className="mb-2">
                        <strong>Frequency:</strong>{" "}
                        {siteCheck?.repeatFrequency || "Not available"}
                    </div>
                    <div className="mb-3">
                        <strong>Current Due Date:</strong>{" "}
                        {currentDueDateValue
                            ? moment(currentDueDateValue).format("DD-MM-YYYY")
                            : "Not available"}
                    </div>

                    {!hasCurrentDueDate && (
                        <div className="alert alert-warning py-2">
                            This inspection does not have a current Due Date, so it cannot be opened early.
                        </div>
                    )}


                    <label htmlFor="plannedInspectionDate" className="form-label">
                        Planned Inspection Date
                    </label>
                    <input
                        id="plannedInspectionDate"
                        type="date"
                        className="form-control"
                        value={plannedInspectionDate}
                        onChange={(e) => setPlannedInspectionDate(e.target.value)}
                        disabled={openingInspectionEarly || !hasCurrentDueDate}
                    />
                    {plannedInspectionDate && plannedNextDueDate && (
                        <div className="alert alert-info py-2 mt-3 mb-2">
                            <strong>Estimated Next Due Date:</strong>{" "}
                            {formatSiteCheckDisplayDate(plannedNextDueDate)}
                            <div className="small mt-1">
                                Based on the selected date and {siteCheck?.repeatFrequency} frequency.
                            </div>
                        </div>
                    )}
                    <div className="form-text mt-2">
                        This opens the inspection and moves its Start Date to the selected date.
                        The existing Due Date stays unchanged. The final next Due Date is still
                        calculated from the actual Inspection Date when the engineer submits the report.
                    </div>
                </DialogContent>
                <DialogActions>
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={() => setShowManualOpenDialog(false)}
                        disabled={openingInspectionEarly}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-primary"
                        onClick={handleOpenInspectionEarly}
                        disabled={
                            openingInspectionEarly ||
                            !hasCurrentDueDate ||
                            !plannedInspectionDate
                        }
                    >
                        {openingInspectionEarly ? "Opening..." : "Open Inspection"}
                    </button>
                </DialogActions>
            </Dialog>
        </Fragment>
    );
};

const mapStateToProps = (state) => ({
    sites: state.site.sites,
    externalusers: state.site.externalusers,
    loggedInUserData: state.site.loggedInUserData,
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
    siteCheckUserOptions: state.site.siteCheckUserOptions,
});
export default connect(mapStateToProps, {
    getExternalUsers,
    deleteUser,
    getSites,
    getSiteCheckUserOptions,
})(SiteChecks);
