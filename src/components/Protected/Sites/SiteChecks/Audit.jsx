import React, { useEffect, useState, useRef, useMemo } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import moment from "moment";
import {
    del,
    get,
    post,
    put,
    postMultiPartFormData,
    putMultiPartFormData,
    uploadSiteCheckDoc,
} from "../../../../api";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { jsPDF } from "jspdf";
import { formatLocalDateTime } from "../../../../utils/dateFormat";
import { recordMonthlyAuditHistory } from "./shared/monthlyAuditHistory";
import MonthlyAuditActionChoices from "./shared/MonthlyAuditActionChoices";
import {
    completeMonthlyAuditSubmission, deleteMonthlyAuditImage, fillMonthlyQuestionForTest,
    getMonthlyAuditActions, getMonthlyAuditContext, getMonthlyAuditResponses,
    hydrateMonthlyQuestion, isMonthlyQuestionVisible, mayFillMonthlyAuditForTest,
    monthlyAuditError, monthlyQuestionAssets, monthlyQuestionComplete,
    monthlyResponseIssues, monthlyResponseRequest, newMonthlyAuditRequestId,
    openMonthlyAuditEarly, prepareMonthlyAuditSubmission, saveMonthlyAuditResponse, splitMonthlyAssetIds, uploadMonthlyAuditPdf,
} from "./shared/monthlyAuditWorkflow";
import { getUkLocalDate } from "./shared/siteCheckDateUtils";
import { calculateSiteCheckDueDate, formatSiteCheckDisplayDate } from "../../../../utils/siteCheckRecurrence";

import Swal from "sweetalert2";

import CircularProgress from "@mui/material/CircularProgress";
import {
    Grid,
    TextField,
    Checkbox,
    Typography,
    Box,
    IconButton,
    FormGroup,
    Select,
    InputLabel,
    FormControl,
    FormControlLabel,
    Accordion,
    Chip,
    AccordionSummary,
    AccordionDetails,
    Alert,
    Card,
    CardContent,
    Autocomplete,
    Tooltip,
    Button,
} from "@mui/material";
import { UploadFile, Close, ExpandMore, Print, CheckCircle } from "@mui/icons-material";
import {
    deleteUser,
    getSites,
    getUsers,
    getSiteCheckAssets,
    getSiteLayout,
} from "../../../../store/thunk/site";

const AssessmentFireRisk = ({
                                subType,
                                sasToken,
                                checkId,
                                siteAssets,
                                getSiteCheckAssets,
                                siteSelectedForGlobal,
                                getSiteLayout,
                                siteLayout,
                                loggedInUserData,
                                leadUserID,
                                siteCheck,
                                managerList,
                                onAuditSubmitted,
                            }) => {
    const carouselSettings = {
        dots: true,
        infinite: true,
        speed: 500,
        slidesToShow: 1,
        slidesToScroll: 1,
        //arrows: true,
        //autoplay: true,
        autoplaySpeed: 3000,
    };

    const [risks, setrisks] = useState([0, 0, 0, 0]);
    const [quest, setquest] = useState([]);
    const [header, setheaders] = useState([]);
    const [openIndex, setOpenIndex] = useState(3);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [auditFolderId, setAuditFolderId] = useState(null);
    const printRef = useRef(null);
    const isMonthlyAudit = subType === "Monthly Audit";
    const [monthlySiteAssets, setMonthlySiteAssets] = useState([]);
    const auditAssets = isMonthlyAudit ? monthlySiteAssets : siteAssets;
    const [monthlyContext, setMonthlyContext] = useState(null);
    const [monthlyActions, setMonthlyActions] = useState([]);
    const [monthlyError, setMonthlyError] = useState("");
    const [inspectionDate, setInspectionDate] = useState("");
    const [monthlyBusy, setMonthlyBusy] = useState(false);
    const [savingQuestionId, setSavingQuestionId] = useState(null);
    const monthlyContextRef = useRef(null);
    const monthlyBusyRef = useRef(false);
    const monthlyLoadSequence = useRef(0);
    const questionSaveRequests = useRef(new Map());
    const uploadedImageUrls = useRef(new WeakMap());
    const submissionRequest = useRef(null);
    const uploadedPdfReference = useRef(null);
    const monthlyReadOnly = isMonthlyAudit &&
        (monthlyContext?.canEdit !== true || monthlyBusy || isSubmitting || isLoading);
    const questionReadOnly = (question) => isMonthlyAudit ? monthlyReadOnly : question?.completed;
    const monthlySubmitted = monthlyContext?.status === "SUBMITTED";
    const monthlyRecovery = ["SUBMITTING", "ARCHIVE_REQUIRED"].includes(monthlyContext?.status);
    const canTestFill = isMonthlyAudit && mayFillMonthlyAuditForTest(loggedInUserData, monthlyContext);
    const monthlyFrequency = monthlyContext?.checkHeader?.repeatFrequency;
    const calculatedMonthlyDue = inspectionDate && monthlyFrequency
        ? calculateSiteCheckDueDate(inspectionDate, monthlyFrequency)
        : null;

    const applyMonthlyContext = (context) => {
        const changedPeriod = monthlyContextRef.current?.periodToken !== context.periodToken;
        monthlyContextRef.current = context;
        setMonthlyContext(context);
        if (changedPeriod) {
            questionSaveRequests.current.clear();
            submissionRequest.current = null;
            uploadedPdfReference.current = null;
        }
        setInspectionDate((current) => context.status === "OPEN"
            ? (changedPeriod ? getUkLocalDate() : current || getUkLocalDate())
            : String(context.inspectionDate || "").slice(0, 10));
    };

    const beginMonthlyWork = () => {
        if (monthlyBusyRef.current) return false;
        monthlyBusyRef.current = true;
        setMonthlyBusy(true);
        setMonthlyError("");
        return true;
    };

    const endMonthlyWork = () => {
        monthlyBusyRef.current = false;
        setMonthlyBusy(false);
        setSavingQuestionId(null);
    };

    const markQuestionChanged = (questions, index) => {
        if (isMonthlyAudit) questions[index] = { ...questions[index], dirty: true };
        setquest(questions);
    };

    // Helper: get catAsset and completion state for a question (same logic as UI)
    const getQuestionState = (q, siteAssetsList) => {
        if (isMonthlyAudit) {
            const catAsset = monthlyQuestionAssets(q, siteAssetsList);
            const okAsset = (q.response?.assets?.split(",") || []).filter(Boolean).length;
            const faultAsset = (q.response?.faultassets?.split(",") || []).filter(Boolean).length;
            return { catAsset, okAsset, faultAsset,
                isSpecialQuestion: ["3.5.1", "8.1.1"].includes(q.order),
                isCompleted: monthlyQuestionComplete(q, siteAssetsList) };
        }
        let catAsset = [];
        const assetCategory = q?.assetCategory?.split(",") ?? [];
        const trimmed = assetCategory.map((item) => item.trim());
        if (trimmed.length === 4) {
            catAsset = (siteAssetsList || []).filter(
                (s) =>
                    s.category?.trim() === trimmed[0]?.trim() &&
                    s.subCategory?.trim() === trimmed[1]?.trim() &&
                    (s.subCategory2?.trim() === trimmed[2]?.trim() ||
                        s.subCategory2?.trim() === trimmed[3]?.trim())
            );
        } else if (trimmed.length === 3) {
            catAsset = (siteAssetsList || []).filter(
                (s) =>
                    s.category?.trim() === trimmed[0]?.trim() &&
                    s.subCategory?.trim() === trimmed[1]?.trim() &&
                    s.subCategory2?.trim() === trimmed[2]?.trim()
            );
        } else if (trimmed.length === 2) {
            catAsset = (siteAssetsList || []).filter(
                (s) =>
                    s.category === trimmed[0]?.trim() &&
                    s.subCategory?.trim() === trimmed[1]?.trim()
            );
        } else if (trimmed.length === 1 && trimmed[0]?.trim() !== "") {
            catAsset = (siteAssetsList || []).filter(
                (s) => s.category?.trim() === trimmed[0]?.trim()
            );
        } else {
            catAsset = siteAssetsList || [];
        }
        const faultAsset = (q.response?.faultassets?.split(",") ?? []).filter(
            (s) => s.length > 0
        ).length;
        const okAsset = (q.response?.assets?.split(",") ?? []).filter(
            (s) => s.length > 0
        ).length;
        const isSpecialQuestion = ["3.5.1", "8.1.1"].includes(q.order);
        const isCompleted = isSpecialQuestion
            ? okAsset > 0 || faultAsset > 0
            : (catAsset?.length || 0) - okAsset - faultAsset === 0;
        return { catAsset, okAsset, faultAsset, isSpecialQuestion, isCompleted };
    };

    const printState = useMemo(() => {
        if (!quest?.length) {
            return { canPrint: false, blockingOrders: [] };
        }
        const failing = [];
        const result = quest.every((q) => {
            if (q?.question?.includes("DELETE")) return true;
            const isVisible = header?.some((h) => q.order?.startsWith(h.lovDesc + "."));
            if (!isVisible) {
                return true;
            }
            const { catAsset, okAsset, faultAsset, isCompleted } = getQuestionState(
                q,
                auditAssets
            );
            const catLen = catAsset?.length ?? 0;
            const remaining = catLen - okAsset - faultAsset;
            const pass = isMonthlyAudit ? isCompleted : catLen === 0 || isCompleted || remaining === 0;
            if (!pass) {
                failing.push({
                    order: q.order,
                    qid: q.qid,
                    catAssetLength: catLen,
                    okAsset,
                    faultAsset,
                    remaining,
                    isCompleted,
                    status: q.status,
                    responseAssetsLen: (q.response?.assets?.split(",") ?? []).filter(Boolean).length,
                    responseFaultLen: (q.response?.faultassets?.split(",") ?? []).filter(Boolean).length,
                });
            }
            return pass;
        });
        const blockingOrders = failing.map((f) => f.order).filter(Boolean);
        return { canPrint: result, blockingOrders };
    }, [quest, auditAssets, header, isMonthlyAudit]);

    const canPrint = printState?.canPrint ?? false;
    const blockingQuestionOrders = printState?.blockingOrders ?? [];

    const visibleBlockingOrders = useMemo(
        () =>
            blockingQuestionOrders.filter((order) =>
                header?.some((h) => order.startsWith(h.lovDesc + "."))
            ),
        [blockingQuestionOrders, header]
    );
    const hiddenBlockingCount =
        blockingQuestionOrders.length - visibleBlockingOrders.length;

    useEffect(() => {
        getQuestions();
        if (!isMonthlyAudit && siteSelectedForGlobal?.siteId) {
            getSiteCheckAssets(siteSelectedForGlobal?.siteId);
            getSiteLayout(siteSelectedForGlobal?.siteId);
            fetchFolderStructure(siteSelectedForGlobal.siteId);
        }
        return () => { monthlyLoadSequence.current += 1; };
    }, [checkId, subType]);

    const fetchFolderStructure = async (siteId, loadSequence = null) => {
        try {
            const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);
            if (!parentFoldersResponse?.parentFolders?.length) return;
            const logBooksFolder = parentFoldersResponse.parentFolders.find(
                (folder) => folder.name?.trim() === "6 - Log Books"
            );
            if (!logBooksFolder) return;
            const logBooksResponse = await get(
                `/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`
            );
            const childFolders = logBooksResponse?.document?.childFolders || [];
            const internalMonthlyAudit = childFolders.find(
                (folder) => folder.name?.trim() === "Internal Monthly Audit"
            );
            if (internalMonthlyAudit?.id && (loadSequence === null || loadSequence === monthlyLoadSequence.current)) {
                setAuditFolderId(internalMonthlyAudit.id);
            }
        } catch (error) {
            console.error("Error fetching folder structure:", error);
        }
    };

    const formatDateForBackend = (dateVal) => {
        if (!dateVal) return null;
        const d = dateVal instanceof Date ? dateVal : new Date(dateVal);
        return d.toISOString().replace("T", " ").split(".")[0];
    };

    const calculateExpiryDate = (visitDate, repeatFrequency) => {
        const date = new Date(visitDate);
        switch (repeatFrequency) {
            case 'Monthly':   date.setMonth(date.getMonth() + 1);        break;
            case 'Quarterly': date.setMonth(date.getMonth() + 3);        break;
            case '6-Monthly': date.setMonth(date.getMonth() + 6);        break;
            case 'Yearly':    date.setFullYear(date.getFullYear() + 1);  break;
            default:          date.setFullYear(date.getFullYear() + 1);  break;
        }
        return date;
    };

    const getHighestFileVersion = async (folderId, fileName) => {
        try {
            const siteId = siteSelectedForGlobal?.siteId;
            if (!siteId) return 1;
            const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
            const files = response?.document?.files || [];
            const baseName = fileName.split(".")[0];
            const matching = files.filter((f) => f.name && f.name.startsWith(baseName));
            if (matching.length === 0) return 1;
            const versions = matching.map((f) => f.fileVersion ?? 1);
            return Math.max(...versions) + 1;
        } catch {
            return 1;
        }
    };

    const checkFileExists = async (folderId, fileName) => {
        try {
            const siteId = siteSelectedForGlobal?.siteId;
            if (!siteId || !folderId) return { exists: false, file: null };
            const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
            const files = response?.document?.files || [];
            const baseName = fileName.split(".")[0];
            const existing = files.find((f) => f.name && f.name.startsWith(baseName));
            return { exists: !!existing, file: existing || null };
        } catch {
            return { exists: false, file: null };
        }
    };

    const uploadPdfToServer = async (pdfBlob, fileName, submission = null) => {
        if (!auditFolderId) return { stored: false, sourceReference: null };
        if (isMonthlyAudit) {
            setIsUploading(true);
            try {
                const context = await uploadMonthlyAuditPdf(checkId, submission.periodToken, auditFolderId, pdfBlob, fileName);
                applyMonthlyContext(context);
                return { stored: true, sourceReference: context.sourceReference, context };
            } finally {
                setIsUploading(false);
            }
        }
        try {
            setIsUploading(true);
            const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
            const { exists, file: existingFile } = await checkFileExists(auditFolderId, fileName);
            const uploadFormData = new FormData();
            const sourceReference = `Audit-${checkId}-${Date.now()}`;
            const issueDate = formatDateForBackend(siteCheck?.startDate);
            const expiryDate = formatDateForBackend(calculateExpiryDate(siteCheck?.startDate, siteCheck?.repeatFrequency));

            if (exists && existingFile) {
                uploadFormData.append("file", pdfFile);
                const documentRequestString = {
                    folderId: auditFolderId,
                    files: [{
                        id: existingFile.id,
                        name: fileName,
                        originalFileName: fileName,
                        fileVersion: (existingFile.fileVersion ?? 1) + 1,
                        siteId: siteSelectedForGlobal?.siteId || 0,
                        issueDate,
                        expiryDate,
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: sourceReference,
                    }],
                };
                uploadFormData.append("documentRequestString", JSON.stringify(documentRequestString));
                await putMultiPartFormData(
                    "/api/document/file/newVersion/upload",
                    uploadFormData
                );
                toast.success(`Report uploaded to Log Books → Internal Monthly Audit as version ${(existingFile.fileVersion ?? 1) + 1}.`);
                return { stored: true, sourceReference };
            } else {
                uploadFormData.append("files", pdfFile);
                const fileVersion = await getHighestFileVersion(auditFolderId, fileName);
                const documentRequestString = {
                    folderId: auditFolderId,
                    files: [{
                        name: fileName.split(".")[0],
                        issueDate,
                        expiryDate,
                        note: "Monthly Audit Report",
                        fileVersion,
                        siteId: siteSelectedForGlobal?.siteId || 0,
                        originalFileName: fileName,
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: sourceReference,
                    }],
                };
                uploadFormData.append("documentRequestString", JSON.stringify(documentRequestString));
                await postMultiPartFormData(
                    "/api/document/files/upload",
                    uploadFormData
                );
                toast.success(`Report uploaded to Log Books → Internal Monthly Audit as version ${fileVersion}.`);
                return { stored: true, sourceReference };
            }
        } catch (error) {
            console.error("Error uploading audit PDF:", error);
            toast.error("Failed to upload report to folder.");
            return { stored: false, sourceReference: null };
        } finally {
            setIsUploading(false);
        }
    };

    const getQuestions = async () => {
        if (isMonthlyAudit) {
            const sequence = ++monthlyLoadSequence.current;
            setIsLoading(true);
            try {
                const context = await getMonthlyAuditContext(checkId);
                if (!context.siteId) throw new Error("The audit site could not be verified. Reload the form.");
                setAuditFolderId(null);
                const [lovs, definitions, saved, actions, scopedAssets] = await Promise.all([
                    get("/api/lov/SITE_CHECK_AUDIT_HEADER"),
                    get("/api/site-check/assessment/questions/monthly-inspection"),
                    getMonthlyAuditResponses(checkId, context.periodToken),
                    getMonthlyAuditActions(checkId, context.periodToken),
                    get(`/api/site/${context.siteId}/assets?siteCheckSummary=true`),
                    fetchFolderStructure(context.siteId, sequence),
                ]);
                if (sequence !== monthlyLoadSequence.current) return null;
                if (!Array.isArray(scopedAssets?.assets)) throw new Error("The site assets could not be loaded. Reload before filling or submitting the audit.");
                setMonthlySiteAssets(scopedAssets.assets);
                const headers = (lovs || []).filter((item) => item.attribite1 === "monthly-inspection")
                    .sort((a, b) => parseFloat(a.lovDesc) - parseFloat(b.lovDesc));
                const questions = (definitions || []).filter((q) => q?.order?.length > 4)
                    .map((q) => hydrateMonthlyQuestion(q, saved.find((state) => Number(state.response?.qid) === Number(q.qid))))
                    .sort((a, b) => a.order.localeCompare(b.order, undefined, { numeric: true }));
                setheaders(headers);
                setquest(questions);
                setMonthlyActions(actions);
                applyMonthlyContext(context);
                setMonthlyError("");
                const counts = [0, 0, 0, 0];
                saved.forEach(({ response }) => {
                    const score = Number(response?.totalRiskScore || 0);
                    counts[score > 17 ? 0 : score > 10 ? 1 : score > 5 ? 2 : 3] += 1;
                });
                setrisks(counts);
                return { context, questions, headers, actions };
            } catch (error) {
                if (sequence === monthlyLoadSequence.current) {
                    setMonthlyError(monthlyAuditError(error, "The Monthly Audit could not be loaded."));
                    setMonthlyContext(null);
                    monthlyContextRef.current = null;
                }
                return null;
            } finally {
                if (sequence === monthlyLoadSequence.current) setIsLoading(false);
            }
        }
        setIsLoading(true);
        let questionCat =
            subType === "Annual Winter Audit"
                ? "annual-winter-audit"
                : "monthly-inspection";
        const lovs = await get("/api/lov/SITE_CHECK_AUDIT_HEADER");
        const questionsFromDB = await get(
            "/api/site-check/assessment/questions/" + questionCat
        );
        const headers = lovs
            .filter((a) => a.attribite1 === questionCat)
            .sort((a, b) => parseFloat(a.lovDesc) - parseFloat(b.lovDesc));
        setheaders(headers);
        const questionsResponse = await get(
            "/api/site-check/assessment/response/" + checkId
        );
        questionsFromDB.forEach((q) => {
            const resIdx = questionsResponse.findIndex((r) => r.qid === q.qid);
            if (resIdx >= 0) {
                q.status = "Closed";
                q.response = questionsResponse[resIdx];

                q.completed = questionsResponse[resIdx]?.status === "Closed";
            } else {
                q.status = "Open";
                q.response = {};
                q.completed = false;
            }
            q.response.file = null;
        });

        const risksN = [0, 0, 0, 0];
        questionsResponse.forEach((r) => {
            if (r.totalRiskScore > 17) {
                risksN[0] = risksN[0] + 1;
            } else if (r.totalRiskScore > 10) {
                risksN[1] = risksN[1] + 1;
            } else if (r.totalRiskScore > 5) {
                risksN[2] = risksN[2] + 1;
            } else {
                risksN[3] = risksN[3] + 1;
            }
        });
        setrisks(risksN);
        const body = {
            riskScoreRed: risksN[0],
            riskScoreAmber: risksN[1],
            riskScoreYellow: risksN[2],
            riskScoreGreen: risksN[3],
        };
        const currentCheck = await get("/api/site-check/check-id/" + checkId);
        if (currentCheck?.status != null && currentCheck.status !== "") {
            body.status = currentCheck.status;
        }

        await put("/api/site-check/" + checkId, body);
        const filtered = questionsFromDB.filter((q) => q?.order?.length > 4);
        filtered.sort((a, b) => {
            // Split the order strings into arrays of numbers
            const orderA = a.order.split(".").map(Number);
            const orderB = b.order.split(".").map(Number);

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
        setquest(filtered);
        setIsLoading(false);
    };

    const handleInputChange = (e, idx) => {
        if (isMonthlyAudit && monthlyReadOnly) return;
        const { name, value } = e.target;
        const uquest = [...quest];
        const udata = {
            ...quest[idx].response,
            [name]: value,
        };
        uquest[idx].response = udata;
        markQuestionChanged(uquest, idx);
    };

    const setResponseCheck = (e, idx) => {
        if (isMonthlyAudit && monthlyReadOnly) return;
        if (e.target.checked) {
            const uquest = [...quest];
            const udata = {
                ...quest[idx].response,
                response: "Yes",
            };
            uquest[idx].response = udata;
            markQuestionChanged(uquest, idx);
        }
    };

    const setResponseCheck2 = (e, idx) => {
        if (isMonthlyAudit && monthlyReadOnly) return;
        if (e.target.checked) {
            const uquest = [...quest];
            const udata = {
                ...quest[idx].response,
                response: "No",
            };
            uquest[idx].response = udata;
            markQuestionChanged(uquest, idx);
        }
    };

    const handleFileChange = (e, idx) => {
        if (isMonthlyAudit && monthlyReadOnly) return;
        const files = Array.from(e.target.files || []);
        const validImageFiles = files.filter((file) =>
            ["image/jpeg", "image/jpg", "image/png"].includes(file.type)
        );

        if (files.length > 0 && validImageFiles.length === 0) {
            toast.error("Please select only image files (JPEG, JPG, PNG)");
            return;
        }

        const uquest = [...quest];
        uquest[idx].response.file = [
            ...(uquest[idx].response.file || []),
            ...validImageFiles,
        ];
        markQuestionChanged(uquest, idx);
    };
    const handleFileDelete = (idx, idx2) => {
        if (isMonthlyAudit && monthlyReadOnly) return;
        const uquest = [...quest];
        uquest[idx].response.file = [...quest[idx].response.file].filter(
            (_, index) => index !== idx2
        );
        markQuestionChanged(uquest, idx);
    };

    const deleteAssessmentResponseImage = async (image) => {
        if (isMonthlyAudit && monthlyReadOnly) return;
        Swal.fire({
            title: `Are you sure you'd like to permanently delete this image?`,
            showDenyButton: false,
            showCancelButton: true,
            confirmButtonText: "Delete",
        }).then(async (result) => {
            if (result.isConfirmed) {
                if (isMonthlyAudit) {
                    if (!beginMonthlyWork()) return;
                    try {
                        const context = monthlyContextRef.current;
                        const question = quest.find((q) => q.response?.images?.some((item) => item.imageId === image.imageId));
                        await deleteMonthlyAuditImage(checkId, image.imageId, context.periodToken, question?.responseRevision || 0);
                        const states = await getMonthlyAuditResponses(checkId, context.periodToken);
                        const state = states.find((item) => Number(item.response?.qid) === Number(question?.qid));
                        if (!state) throw new Error("The saved image change could not be confirmed. Reload the audit.");
                        setquest((current) => current.map((q) => Number(q.qid) === Number(question.qid)
                            ? { ...q, responseRevision: state.revision,
                                response: { ...q.response, images: state.response.images || [] } }
                            : q));
                        toast.success("Image removed from this audit. Saved History is preserved.");
                    } catch (error) {
                        setMonthlyError(monthlyAuditError(error));
                        toast.error(monthlyAuditError(error));
                    } finally {
                        endMonthlyWork();
                    }
                    return;
                }
                await del(`/api/site-check/assessment/response/image/${image.imageId}`);
                toast.success("Image deleted successfully");
                await getQuestions();
            } else if (result.isDenied) {
                // Swal.fire("Changes are not saved", "", "info");
            }
        });
    };

    const persistMonthlyQuestion = async (question, periodToken) => {
        if (monthlyContextRef.current?.periodToken !== periodToken || monthlyContextRef.current?.canEdit !== true) {
            throw new Error("This audit is no longer editable. Reload it before continuing.");
        }
        let candidates = monthlyActions;
        if (question.response?.faultassets) {
            candidates = await getMonthlyAuditActions(checkId, periodToken);
            setMonthlyActions(candidates);
        }
        const issues = monthlyResponseIssues(question, candidates, monthlyContextRef.current?.siteId);
        if (issues.length) throw new Error(`Question ${question.order}: ${issues[0]}`);
        setSavingQuestionId(question.qid);
        const files = [];
        for (const file of question.response?.file || []) {
            let url = uploadedImageUrls.current.get(file);
            if (!url) {
                const result = await uploadSiteCheckDoc({ file, siteId: monthlyContextRef.current?.siteId });
                url = typeof result === "string" ? result : result?.url || result?.data;
                if (typeof url !== "string" || !url.trim()) {
                    throw new Error(`An image for question ${question.order} could not be uploaded. Retry saving this question.`);
                }
                uploadedImageUrls.current.set(file, url);
            }
            files.push(url);
        }
        const nextRequest = monthlyResponseRequest(question, { checkId, periodToken, files });
        const fingerprint = JSON.stringify({ ...nextRequest, requestId: null });
        const cacheKey = `${periodToken}:${question.qid}`;
        let pending = questionSaveRequests.current.get(cacheKey);
        if (!pending || pending.fingerprint !== fingerprint) {
            pending = { fingerprint, request: nextRequest };
            questionSaveRequests.current.set(cacheKey, pending);
        }
        const state = await saveMonthlyAuditResponse(checkId, pending.request);
        questionSaveRequests.current.delete(cacheKey);
        const savedQuestion = hydrateMonthlyQuestion(question, state);
        setquest((current) => current.map((q) => q.qid === question.qid ? savedQuestion : q));
        return savedQuestion;
    };

    const saveMonthlyQuestion = async (event, index) => {
        event.preventDefault();
        if (!event.currentTarget.checkValidity()) {
            event.currentTarget.reportValidity();
            return;
        }
        if (monthlyReadOnly || !beginMonthlyWork()) return;
        try {
            await persistMonthlyQuestion(quest[index], monthlyContextRef.current.periodToken);
            toast.success("Assessment response and Action selections saved.");
        } catch (error) {
            setMonthlyError(monthlyAuditError(error));
            toast.error(monthlyAuditError(error));
        } finally {
            endMonthlyWork();
        }
    };

    const handleMonthlyTestFill = async () => {
        if (!canTestFill || !beginMonthlyWork()) return;
        try {
            const periodToken = monthlyContextRef.current.periodToken;
            const filled = quest.map((question) => isMonthlyQuestionVisible(question, header) &&
                monthlyQuestionAssets(question, auditAssets).length
                ? fillMonthlyQuestionForTest(question, auditAssets) : question);
            setquest(filled);
            let savedCount = 0;
            const savedQuestions = [];
            const needsReview = [];
            for (const question of filled) {
                if (!isMonthlyQuestionVisible(question, header) || !monthlyQuestionAssets(question, auditAssets).length) continue;
                if (splitMonthlyAssetIds(question.response?.faultassets).length) {
                    needsReview.push(question.order);
                    continue;
                }
                savedQuestions.push(await persistMonthlyQuestion(question, periodToken));
                savedCount += 1;
            }
            // Confirm persistence without replacing any unfinished fault details
            // the tester already entered on screen.
            const stored = await getMonthlyAuditResponses(checkId, periodToken);
            if (savedQuestions.some((question) => {
                const persisted = stored.find((item) => Number(item.response?.qid) === Number(question.qid));
                return !persisted || ["assets", "faultassets"].some((field) =>
                    splitMonthlyAssetIds(persisted.response?.[field]).sort().join(",") !==
                    splitMonthlyAssetIds(question.response?.[field]).sort().join(","));
            })) {
                throw new Error("Some test answers could not be confirmed. Reload and check the audit.");
            }
            if (needsReview.length) {
                const message = `Test answers saved for ${savedCount} questions. Existing failures were left unchanged: question(s) ${needsReview.join(", ")}. Review and save those questions before submitting.`;
                setMonthlyError(message);
                toast.info(message);
            } else {
                toast.success("Test answers saved. You can change answers, review the audit and click Submit audit.");
            }
        } catch (error) {
            setMonthlyError(monthlyAuditError(error));
            toast.error(monthlyAuditError(error));
        } finally {
            endMonthlyWork();
        }
    };

    const handleMonthlyOpenEarly = async () => {
        if (!monthlyContext?.canOpenEarly || !beginMonthlyWork()) return;
        try {
            const previousPeriod = monthlyContextRef.current.periodToken;
            const context = await openMonthlyAuditEarly(checkId, { periodToken: previousPeriod });
            if (context.status !== "OPEN") throw new Error("The next audit has not opened. Reload to check its status.");
            applyMonthlyContext(context);
            const loaded = await getQuestions();
            if (!loaded) throw new Error("The audit opened, but its answers could not be loaded. Reload the form.");
            onAuditSubmitted?.();
            toast.success(context.openedNewPeriod === false
                ? "This audit is already Open. Its current answers have been kept."
                : context.carryForwardEnabled
                ? "Next audit opened. Previous answers are ready for review; previous photos remain in History."
                : "Next audit opened with blank answers. Previous submissions remain in History.");
        } catch (error) {
            setMonthlyError(monthlyAuditError(error));
            toast.error(monthlyAuditError(error));
        } finally {
            endMonthlyWork();
        }
    };

    const handleMonthlySubmit = async () => {
        if (!monthlyContext || monthlySubmitted || !monthlyContext.canSubmit || !beginMonthlyWork()) return;
        const attemptedPeriod = monthlyContextRef.current.periodToken;
        setIsSubmitting(true);
        try {
            let context = await getMonthlyAuditContext(checkId);
            if (context.periodToken !== monthlyContextRef.current.periodToken) {
                throw new Error("A new audit period has already opened. Reload the form before submitting.");
            }
            applyMonthlyContext(context);
            if (context.status === "SUBMITTED") {
                toast.info("This audit is already submitted and saved in History.");
                return;
            }
            if (!context.pdfStored && !auditFolderId) {
                throw new Error("The Internal Monthly Audit document folder could not be found. Restore the folder and reload this audit before submitting.");
            }
            if (context.status === "OPEN") {
                if (!inspectionDate) throw new Error("Enter the actual Inspection Date before submitting.");
                if (!calculatedMonthlyDue) throw new Error("The audit's repeat frequency could not be verified. Reload before submitting.");
                if (!canPrint) throw new Error(`Complete question(s): ${visibleBlockingOrders.join(", ") || "all applicable questions"}.`);
                for (const question of quest) {
                    if (isMonthlyQuestionVisible(question, header) && monthlyQuestionAssets(question, auditAssets).length &&
                        (question.dirty || !question.response?.responseId ||
                            (question.response?.faultassets && !question.actionLinks?.length))) {
                        await persistMonthlyQuestion(question, context.periodToken);
                    }
                }
            }
            if (context.status !== "SUBMITTING") {
                if (!submissionRequest.current || submissionRequest.current.periodToken !== context.periodToken) {
                    submissionRequest.current = {
                        periodToken: context.periodToken,
                        inspectionDate: context.status === "ARCHIVE_REQUIRED"
                            ? String(context.inspectionDate || "").slice(0, 10) : inspectionDate,
                        requestId: newMonthlyAuditRequestId(),
                    };
                }
                context = await prepareMonthlyAuditSubmission(checkId, submissionRequest.current);
                applyMonthlyContext(context);
            }
            if (context.status === "SUBMITTED") return;
            if (context.status !== "SUBMITTING" || !context.sourceReference) {
                throw new Error("The audit could not be prepared for submission. Reload its status.");
            }
            // Load the persisted, now-frozen responses. A report must not use an
            // earlier React state snapshot or unsaved screen selections.
            const frozen = await getMonthlyAuditResponses(checkId, context.periodToken);
            const reportQuestions = quest.map((question) => hydrateMonthlyQuestion(question,
                frozen.find((item) => Number(item.response?.qid) === Number(question.qid))));
            setquest(reportQuestions);
            if (!context.pdfStored && uploadedPdfReference.current !== context.sourceReference) {
                if (!auditFolderId) throw new Error("The Internal Monthly Audit document folder could not be found. Restore the folder, then retry saving the report and History.");
                const report = await handlePrint({ questions: reportQuestions, context });
                if (!report?.blob) throw new Error("The report could not be generated. Retry saving the report and History.");
                const uploaded = await uploadPdfToServer(report.blob, report.fileName, context);
                if (!uploaded?.stored) throw new Error("The report upload could not be confirmed. Retry saving the report and History.");
                uploadedPdfReference.current = context.sourceReference;
                context = uploaded.context || context;
            }
            const completed = await completeMonthlyAuditSubmission(checkId, {
                periodToken: context.periodToken, sourceReference: context.sourceReference,
            });
            if (completed.status !== "SUBMITTED" || !completed.historyId || completed.pdfStored !== true) {
                throw new Error("The report and History have not both been confirmed. Retry saving the report and History.");
            }
            applyMonthlyContext(completed);
            onAuditSubmitted?.();
            toast.success("Audit submitted. Report and saved audit data are confirmed in History.");
        } catch (error) {
            const message = monthlyAuditError(error, "The audit could not be submitted.");
            try {
                // A lost success response may still have completed. Reconcile
                // server state before enabling a recovery action or another save.
                const recovered = await getMonthlyAuditContext(checkId);
                if (recovered.periodToken !== attemptedPeriod) {
                    // Never attach a new period token to stale on-screen answers.
                    setquest([]);
                    const loaded = await getQuestions();
                    if (!loaded) throw new Error("The new audit could not be loaded.");
                } else {
                    applyMonthlyContext(recovered);
                    if (recovered.status === "SUBMITTED" && recovered.historyId && recovered.pdfStored) {
                        setMonthlyError("");
                        onAuditSubmitted?.();
                        toast.success("Audit submitted. Report and saved audit data are confirmed in History.");
                        return;
                    }
                }
            } catch {
                setMonthlyContext(null);
                monthlyContextRef.current = null;
            }
            setMonthlyError(message);
            toast.error(message);
        } finally {
            setIsSubmitting(false);
            endMonthlyWork();
        }
    };

    const saveAssessmentResponse = async (event, index, completed) => {
        if (isMonthlyAudit) return saveMonthlyQuestion(event, index);
        event.preventDefault();
        const form = event.target;
        if (!form.checkValidity()) {
            form.reportValidity();
        }

        const q = quest[index];
        const faultAssets = (q.response?.faultassets?.split(",") || []).filter(Boolean);
        const okAssets = (q.response?.assets?.split(",") || []).filter(Boolean);
        const isSpecialQuestion = ['3.5.1', '8.1.1'].includes(q.order);

        const { catAsset } = getQuestionState(q, auditAssets);

        if (faultAssets.length > 0) {
            if (!q.response.position || !q.response.action) {
                toast.error("Please provide observation and action for faulty assets");
                return;
            }
            if (!q.response.consequence || !q.response.likelihood) {
                toast.error("Please assess risk score for faulty assets");
                return;
            }
        }

        const canClose = isSpecialQuestion
            ? (okAssets.length > 0 || faultAssets.length > 0) // At least one asset marked
            : (catAsset.length - okAssets.length - faultAssets.length) === 0; // All assets marked


        const dataToSave = { ...q.response };
        if (dataToSave?.file?.length > 0) {
            dataToSave.siteId = siteSelectedForGlobal?.siteId;
            const files = [];
            for (const f of dataToSave?.file) {
                const temp = { ...dataToSave };
                temp.file = f;
                const urlResult = await uploadSiteCheckDoc(temp);
                const url = typeof urlResult === "string" ? urlResult : (urlResult?.url ?? urlResult?.data ?? "");
                if (url) files.push(url);
            }
            if (files.length > 0) dataToSave.files = files;
        }
        dataToSave.file = null;
        dataToSave.responseDate = new Date();
        dataToSave.checkId = checkId;
        dataToSave.qid = quest[index].qid;
        dataToSave.status = canClose ? "Closed" : "Open";
        dataToSave.totalRiskScore =
            Number(dataToSave.consequence ?? 0) * Number(dataToSave.likelihood ?? 0);
        const saveResponse = await post(
            "/api/site-check/assessment/response",
            dataToSave
        );
        const images = saveResponse?.data?.images ?? [];
        images.forEach((i) => {
            if (i) i.imageId = undefined;
        });
        const actionData = {
            type: "Audit",
            status: "Reported",
            observation: quest[index]?.response?.position,
            requiredAction: quest[index]?.response?.action,
            desc: `Audit - ${subType} - ${moment(new Date()).format("DD/MM/YYYY")}`,
            riskScore: dataToSave.totalRiskScore,
            dueDate: new Date(),
            createdAt: new Date(),
            siteId: siteSelectedForGlobal?.siteId,
            userId: loggedInUserData?.id,
            assignedTo: leadUserID,
            taggedAsset: quest[index]?.response?.faultassets,
            images: images,
        };
        if (completed) {
            await put("/api/site/actions", actionData);
        }

        await getQuestions();
        toast.success("Assessment response saved");
    };

    const handleSubmitAudit = async () => {
        if (isMonthlyAudit) return handleMonthlySubmit();
        if (!canPrint) {
            toast.error(
                visibleBlockingOrders?.length > 0
                    ? `Complete question(s): ${visibleBlockingOrders.join(", ")}`
                    : "Complete all the questions before submitting."
            );
            return;
        }
        setIsSubmitting(true);
        try {
            const siteCheckData = await get("/api/site-check/check-id/" + checkId);
            await put("/api/site-check/" + checkId, {
                ...siteCheckData,
                status: "Done",
                dueDate: formatLocalDateTime(calculateExpiryDate(siteCheckData.startDate, siteCheckData.repeatFrequency)),
            });
            await getQuestions();
            onAuditSubmitted?.();

            let monthlyHistorySaved = false;
            let monthlyHistoryError = "Audit is marked Done, but its report and saved audit data were not confirmed in History. Please check History before submitting again.";
            try {
                const r = await handlePrint();
                if (r?.blob && r?.fileName && auditFolderId) {
                    const uploadResult = await uploadPdfToServer(r.blob, r.fileName);

                    // Save and verify the full saved-data snapshot only for Monthly Audit.
                    // Annual Winter Audit keeps its current workflow unchanged for now.
                    if (
                        subType === "Monthly Audit" &&
                        uploadResult?.stored &&
                        uploadResult?.sourceReference
                    ) {
                        try {
                            await recordMonthlyAuditHistory({
                                checkId,
                                sourceReference: uploadResult.sourceReference,
                            });
                            monthlyHistorySaved = true;
                        } catch (historyErr) {
                            console.error("Record Monthly Audit history:", historyErr);
                            monthlyHistoryError = "Audit submitted and report uploaded, but the saved audit data was not confirmed in History. Please check History before submitting again.";
                        }
                    }
                }
            } catch (uploadErr) {
                console.error("Upload audit PDF:", uploadErr);
                if (subType !== "Monthly Audit") {
                    toast.error("Audit submitted. Report upload to folder failed.");
                }
            }
            if (subType === "Monthly Audit") {
                if (monthlyHistorySaved) {
                    toast.success("Audit submitted. Report and saved audit data are confirmed in History.");
                } else {
                    toast.error(monthlyHistoryError);
                }
            } else {
                toast.success("Audit submitted successfully. Site check is now done.");
            }
        } catch (err) {
            toast.error(err?.message || "Failed to submit audit.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const loadImageAsDataUrl = async (url) => {
        if (!url) return null;
        try {
            const res = await fetch(url, { mode: "cors", credentials: "omit" });
            if (res.ok) {
                const blob = await res.blob();
                const dataUrl = await new Promise((resolve) => {
                    const reader = new FileReader();
                    reader.onloadend = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(blob);
                });
                if (dataUrl) return dataUrl;
            }
        } catch {
        }
        try {
            const dataUrl = await get(
                `/api/site-check/file/image-proxy?url=${encodeURIComponent(url)}`
            );
            return typeof dataUrl === "string" && dataUrl.startsWith("data:") ? dataUrl : null;
        } catch {
            return null;
        }
    };

    const handlePrint = async (options = {}) => {
        const reportQuestions = options.questions || quest;
        const reportContext = options.context || monthlyContext;
        const reportCheck = isMonthlyAudit ? reportContext?.checkHeader : siteCheck;
        if (isMonthlyAudit && (!reportContext?.siteId || !reportCheck)) {
            throw new Error("The audit header could not be verified. Reload before producing its report.");
        }
        const reportSiteName = isMonthlyAudit
            ? (reportContext.siteName || `Site ${reportContext.siteId}`)
            : siteSelectedForGlobal?.siteName || "Site";
        const reportInspectionDate = isMonthlyAudit
            ? (reportContext?.status !== "OPEN" ? reportContext?.inspectionDate : inspectionDate)
            : siteCheck?.startDate;
        if (!reportQuestions?.length || !header?.length) {
            toast.warn("No audit data to print.");
            return;
        }
        const doc = new jsPDF("p", "mm", "a4");
        const margin = 15;
        const pageW = 210;
        const pageH = 297;
        const maxW = pageW - margin * 2;
        let y = margin;
        const lineH = 5;
        const blockGap = 4;
        const maxImgW = maxW;
        const maxImgH = 45;

        const addText = (text, options = {}) => {
            const { bold = false, fontSize = 10 } = options;
            doc.setFontSize(fontSize);
            doc.setFont("helvetica", bold ? "bold" : "normal");
            const lines = doc.splitTextToSize(text || "—", maxW);
            lines.forEach((line) => {
                if (y > pageH - margin - lineH) {
                    doc.addPage();
                    y = margin;
                }
                doc.text(line, margin, y);
                y += lineH;
            });
        };

        const addLabelBoldUnderline = (label) => {
            if (y > pageH - margin - lineH) {
                doc.addPage();
                y = margin;
            }
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text(label, margin, y);
            const w = doc.getTextWidth(label);
            doc.setDrawColor(0, 0, 0);
            doc.line(margin, y + 1.5, margin + w, y + 1.5);
            y += lineH;
            doc.setFont("helvetica", "normal");
        };

        const addAssetList = (assetLabels, fillColor) => {
            if (!assetLabels?.length) {
                addText("—");
                return;
            }
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");
            assetLabels.forEach((label) => {
                if (y > pageH - margin - lineH) {
                    doc.addPage();
                    y = margin;
                }
                const lines = doc.splitTextToSize(label, maxW - 4);
                const blockHeight = lines.length * lineH + 1;
                doc.setFillColor(...(fillColor || [240, 248, 255]));
                doc.rect(margin, y - 3.5, maxW, blockHeight, "F");
                lines.forEach((line) => {
                    doc.text(line, margin + 2, y);
                    y += lineH;
                });
                y += 2;
            });
        };

        const addImagesToPdf = async (images, sasToken, questionOrder) => {
            if (!images?.length) return;
            doc.setFontSize(10);
            doc.setFont("helvetica", "bold");
            doc.text("Images:", margin, y);
            y += lineH + 2;
            for (const img of images) {
                const baseUrl = img?.imageUrl || "";
                const hasQuery = baseUrl.includes("?");
                const src = baseUrl + (!hasQuery && sasToken ? "?" + sasToken : "");
                const dataUrl = await loadImageAsDataUrl(src);
                if (!dataUrl) {
                    if (isMonthlyAudit) throw new Error(`Photo ${img.imageId || ""} for question ${questionOrder} could not be loaded into the report. Check the photo is available, then retry saving the report and History.`);
                    continue;
                }
                if (y + maxImgH > pageH - margin) {
                    doc.addPage();
                    y = margin;
                }
                const imgW = maxImgW;
                const imgH = maxImgH;
                try {
                    doc.addImage(dataUrl, "JPEG", margin, y, imgW, imgH);
                } catch (error) {
                    if (isMonthlyAudit) throw new Error(`Photo ${img.imageId || ""} for question ${questionOrder} could not be added to the report. Check the saved photo, then retry saving the report and History.`);
                    throw error;
                }
                y += imgH + 2;
            }
            doc.setFont("helvetica", "normal");
        };

        const formatUserLabel = (userId) => {
            if (!userId || !managerList?.length) return "—";
            const u = managerList.find((m) => String(m.id) === String(userId));
            if (!u) return "—";
            return `${u.trade || ""}(${u.role || ""}) - ${u.name || ""} (${u.email || ""}) - ${u.company || ""}`.trim();
        };
        const infoRows = [
            ["Type", reportCheck?.type ?? "Audit"],
            ["Sub Type", reportCheck?.subType ?? "Monthly Audit"],
            ["Category", reportCheck?.category ?? "—"],
            [isMonthlyAudit ? "Inspection Date" : "Start Date", reportInspectionDate ? moment(reportInspectionDate).format("DD-MM-YYYY") : "—"],
            ...(isMonthlyAudit ? [["Next Due Date", formatSiteCheckDisplayDate(reportContext?.status !== "OPEN"
                ? reportContext?.nextDueDate : calculatedMonthlyDue) || "—"]] : []),
            ["Lead", formatUserLabel(reportCheck?.leadUserID)],
            ["Assistant", formatUserLabel(reportCheck?.assistantUserID)],
            ["Repeats", reportCheck?.repeatFrequency ?? "Monthly"],
        ];
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        infoRows.forEach(([label, value]) => {
            if (y > pageH - margin - lineH * 2) {
                doc.addPage();
                y = margin;
            }
            doc.setFont("helvetica", "bold");
            doc.text(`${label}`, margin, y);
            doc.setFont("helvetica", "normal");
            const lines = doc.splitTextToSize(value || "—", maxW - 35);
            lines.forEach((line) => {
                doc.text(line, margin + 35, y);
                y += lineH;
            });
            y += 1;
        });
        y += blockGap;

        const siteName = reportSiteName;
        const auditType = subType || "Audit";
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`${siteName} – ${auditType}`, margin, y);
        y += lineH + 2;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Printed on ${moment().format("DD/MM/YYYY HH:mm")}`, margin, y);
        y += lineH + blockGap;
        const closedCount = reportQuestions?.filter((q) => q?.completed).length || 0;
        doc.text(`Total questions: ${reportQuestions?.length || 0}, Closed: ${closedCount}, Open: ${(reportQuestions?.length || 0) - closedCount}`, margin, y);
        y += lineH + blockGap * 2;

        for (const h of header || []) {
            if (y > pageH - margin - 15) {
                doc.addPage();
                y = margin;
            }
            doc.setFontSize(12);
            doc.setFont("helvetica", "bold");
            doc.text(`${h.lovDesc} ${h.lovValue || ""}`, margin, y);
            y += lineH + blockGap;
            doc.setFontSize(10);
            doc.setFont("helvetica", "normal");

            const sectionQuestions = reportQuestions.filter(
                (q) => !q?.question?.includes("DELETE") && q.order?.startsWith(h.lovDesc + ".")
            );
            for (const q of sectionQuestions) {
                const { catAsset } = getQuestionState(q, auditAssets);
                const okIds = (q.response?.assets?.split(",") ?? []).filter(Boolean).map((id) => id.trim());
                const faultIds = (q.response?.faultassets?.split(",") ?? []).filter(Boolean).map((id) => id.trim());
                const faultCount = faultIds.length;
                const okLabelList = okIds.length ? okIds.map((id) => getAssetLabel(id, catAsset)) : [];
                const faultLabelList = faultIds.length ? faultIds.map((id) => getAssetLabel(id, catAsset)) : [];

                addText(`${q.order} ${q.question}`, { bold: true });
                addLabelBoldUnderline("Asset OK:");
                addAssetList(okLabelList, [240, 248, 255]);
                addLabelBoldUnderline("Asset Defective:");
                addAssetList(faultLabelList, [255, 240, 240]);
                if (faultCount > 0) {
                    addLabelBoldUnderline("Observation:");
                    addText(q.response?.position || "—");
                    addLabelBoldUnderline("Suggested Action:");
                    addText(q.response?.action || "—");
                    const images = q.response?.images || [];
                    if (images.length > 0) {
                        await addImagesToPdf(images, sasToken, q.order);
                    }
                    const cons = q.response?.consequence ?? "—";
                    const like = q.response?.likelihood ?? "—";
                    const total = ((Number(q.response?.consequence) || 0) * (Number(q.response?.likelihood) || 0)) || (q.response?.totalRiskScore ?? "—");
                    addLabelBoldUnderline("Risk Score:");
                    addText(`Consequence ${cons}, Likelihood ${like}, Total ${total}`);
                }
                y += blockGap;
            }
        }

        const siteNameRaw = reportSiteName;
        const siteNameSanitized = siteNameRaw.replace(/[^a-zA-Z0-9-_\s]/g, "").replace(/\s+/g, "_") || "Site";
        const fileName = `Audit_Monthly_${siteNameSanitized}.pdf`;
        const blob = doc.output("blob");
        return { blob, fileName };
    };

    const getAssetLabel = (assetId, catAsset) => {
        const a = (catAsset || []).find((x) => String(x.assetId) === String(assetId));
        if (!a) return String(assetId);
        const loc = [a.position, a.floor, a.room].filter(Boolean).join(" > ") || "NA";
        return `${a.assetId} - ${a.assetName || ""} (${loc})`;
    };

    return (
        <Box p={3}>
            <Card>
                {true && (
                    <CardContent>
                        {isMonthlyAudit && (
                            <Box className="dont-print" sx={{ mb: 2 }}>
                                <Grid container spacing={2} alignItems="center">
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            id={`monthly-inspection-date-${checkId}`}
                                            type="date"
                                            label="Inspection Date"
                                            value={inspectionDate}
                                            onChange={(event) => { setInspectionDate(event.target.value); submissionRequest.current = null; }}
                                            disabled={monthlyReadOnly}
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
                                            fullWidth
                                            required
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <TextField
                                            label="Next Due Date"
                                            value={formatSiteCheckDisplayDate(monthlyContext?.status === "OPEN"
                                                ? calculatedMonthlyDue : monthlyContext?.nextDueDate) || ""}
                                            InputProps={{ readOnly: true }}
                                            InputLabelProps={{ shrink: true }}
                                            size="small"
                                            fullWidth
                                            helperText={`Repeat frequency: ${monthlyFrequency || "Not set"}`}
                                        />
                                    </Grid>
                                    <Grid item xs={12} sm={4}>
                                        <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
                                            {canTestFill && (
                                                <Button variant="outlined" size="small" onClick={handleMonthlyTestFill}
                                                    disabled={monthlyBusy || isSubmitting || isLoading || !quest.length}>
                                                    Fill test answers
                                                </Button>
                                            )}
                                            {monthlyContext?.canOpenEarly && (
                                                <Button variant="outlined" size="small" onClick={handleMonthlyOpenEarly}
                                                    disabled={monthlyBusy || isSubmitting || isLoading}>
                                                    Open next audit early
                                                </Button>
                                            )}
                                        </Box>
                                    </Grid>
                                </Grid>
                                {isLoading && <Typography sx={{ mt: 1 }} variant="body2">Loading the current audit…</Typography>}
                                {monthlyBusy && !isSubmitting && <Typography sx={{ mt: 1 }} variant="body2">
                                    {savingQuestionId ? "Saving answers and Action selections…" : "Updating the audit…"}
                                </Typography>}
                                {monthlySubmitted && <Alert severity="success" sx={{ mt: 1 }}>
                                    Submitted. The report and saved audit data are confirmed in History.
                                </Alert>}
                                {monthlyRecovery && <Alert severity="warning" sx={{ mt: 1 }}>
                                    {monthlyContext.status === "ARCHIVE_REQUIRED"
                                        ? "This completed audit needs its report and saved data confirmed in History before the next audit can open."
                                        : "Submission is in progress. Answers are saved and locked. Use Save report and History to complete it."}
                                </Alert>}
                                {monthlyError && <Alert severity="error" sx={{ mt: 1 }}
                                    action={<Button color="inherit" size="small" disabled={monthlyBusy || isSubmitting}
                                        onClick={getQuestions}>Reload</Button>}>
                                    {monthlyError}
                                </Alert>}
                            </Box>
                        )}
                        {/* Sticky header so Print button stays visible when scrolling the long question list */}
                        <Box
                            sx={{
                                position: "sticky",
                                top: 0,
                                zIndex: 10,
                                backgroundColor: "background.paper",
                                py: 1,
                                mb: 2,
                                borderBottom: 1,
                                borderColor: "divider",
                            }}
                        >
                            <Grid
                                container
                                alignItems="center"
                                justifyContent="space-between"
                                wrap="nowrap"
                            >
                                <Grid item>
                                    <Typography variant="h6">Questions</Typography>
                                </Grid>
                                <Grid item sx={{ flexShrink: 0 }}>
                                    <Box display="flex" alignItems="center">
                                        {/* <Typography variant="body1" style={{ backgroundColor: '#E0E7FF', padding: '4px 8px', borderRadius: '4px' }}>
                  Total: {quest.length}, Open: {quest.filter(q => q.status === "Open").length}, Closed: {quest.filter(q => q.status === "Closed").length}
                </Typography> */}
                                        <Box ml={2} display="flex" alignItems="center">
                                            <Box
                                                width={24}
                                                height={24}
                                                bgcolor="#F44336"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                borderRadius="4px"
                                                mx={0.5}
                                            >
                                                {/* <Typography variant="body2" color="white">{risks[0]}</Typography> */}
                                                <span className="badge bg-danger p-2 m-1 risk-span">
                        {risks[0]}
                      </span>
                                            </Box>
                                            <Box
                                                width={24}
                                                height={24}
                                                bgcolor="#FF9800"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                borderRadius="4px"
                                                mx={0.5}
                                            >
                                                {/* <Typography variant="body2" color="white">{risks[1]}</Typography> */}
                                                <span className="badge bg-warning p-2 m-1 risk-span">
                        {risks[1]}
                      </span>
                                            </Box>
                                            <Box
                                                width={24}
                                                height={24}
                                                bgcolor="#FFEB3B"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                borderRadius="4px"
                                                mx={0.5}
                                            >
                                                {/* <Typography variant="body2" color="white">{risks[2]}</Typography> */}
                                                <span className="badge bg-info p-2 m-1 risk-span">
                        {risks[2]}
                      </span>
                                            </Box>
                                            <Box
                                                width={24}
                                                height={24}
                                                bgcolor="#4CAF50"
                                                display="flex"
                                                alignItems="center"
                                                justifyContent="center"
                                                borderRadius="4px"
                                                mx={0.5}
                                            >
                                                {/* <Typography variant="body2" color="white">{risks[3]}</Typography> */}
                                                <span className="badge bg-success p-2 m-1 risk-span">
                        {risks[3]}
                      </span>
                                            </Box>
                                        </Box>
                                        <Tooltip
                                            title={
                                                canPrint
                                                    ? "Print audit report"
                                                    : visibleBlockingOrders.length > 0
                                                        ? `Complete question(s): ${visibleBlockingOrders.join(", ")}${hiddenBlockingCount > 0 ? ` (+ ${hiddenBlockingCount} in other sections)` : ""}`
                                                        : hiddenBlockingCount > 0
                                                            ? `Complete question(s) in other sections (${hiddenBlockingCount})`
                                                            : "Complete all the questions"
                                            }
                                        >
                    <span style={{ marginLeft: 16 }}>
                      <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Print />}
                          onClick={async () => {
                              try {
                                  const r = await handlePrint();
                                  if (r?.blob && r?.fileName) {
                                      const url = URL.createObjectURL(r.blob);
                                      const a = document.createElement("a");
                                      a.href = url;
                                      a.download = r.fileName;
                                      a.click();
                                      URL.revokeObjectURL(url);
                                      toast.success("PDF downloaded.");
                                  }
                              } catch (error) {
                                  toast.error(monthlyAuditError(error, "The report could not be downloaded."));
                              }
                          }}
                          disabled={!canPrint || (isMonthlyAudit && (!monthlyContext || isLoading || monthlyBusy || isSubmitting))}
                          className="dont-print"
                      >
                        Download PDF
                      </Button>
                    </span>
                                        </Tooltip>
                                    </Box>
                                </Grid>
                            </Grid>
                        </Box>

                        {quest?.length > 0 &&
                            header?.map((h) => {
                                return (
                                    <div>
                                        <h5>
                                            {h.lovDesc} {h.lovValue}
                                        </h5>

                                        {quest
                                            //?.filter(q=> !q?.question?.includes("DELETE") && q.order.startsWith(h.lovDesc+".") )
                                            ?.map((q, idx) => {
                                                if (
                                                    q?.question?.includes("DELETE") ||
                                                    !q.order.startsWith(h.lovDesc + ".")
                                                ) {
                                                    return null;
                                                }

                                                let catAsset = [];
                                                let assetCategory = q?.assetCategory?.split(",") ?? [];
                                                assetCategory = assetCategory.map((item) =>
                                                    item.trim()
                                                );

                                                if (assetCategory.length === 4) {
                                                    catAsset = auditAssets?.filter(
                                                        (s) =>
                                                            s.category?.trim() === assetCategory[0]?.trim() &&
                                                            s.subCategory?.trim() ===
                                                            assetCategory[1]?.trim() &&
                                                            (s.subCategory2?.trim() ===
                                                                assetCategory[2]?.trim() ||
                                                                s.subCategory2?.trim() ===
                                                                assetCategory[3]?.trim())
                                                    );
                                                } else if (assetCategory.length === 3) {
                                                    catAsset = auditAssets?.filter(
                                                        (s) =>
                                                            s.category?.trim() === assetCategory[0]?.trim() &&
                                                            s.subCategory?.trim() ===
                                                            assetCategory[1]?.trim() &&
                                                            s.subCategory2?.trim() ===
                                                            assetCategory[2]?.trim()
                                                    );
                                                } else if (assetCategory.length === 2) {
                                                    catAsset = auditAssets?.filter(
                                                        (s) =>
                                                            s.category === assetCategory[0]?.trim() &&
                                                            s.subCategory?.trim() === assetCategory[1]?.trim()
                                                    );
                                                } else if (
                                                    assetCategory.length === 1 &&
                                                    assetCategory[0]?.trim() !== ""
                                                ) {
                                                    catAsset = auditAssets?.filter(
                                                        (s) =>
                                                            s.category?.trim() === assetCategory[0]?.trim()
                                                    );
                                                } else {
                                                    catAsset = auditAssets;
                                                }

                                                const faultAsset = (
                                                    q.response?.faultassets?.split(",") ?? []
                                                ).filter((s) => s.length > 0).length;
                                                const okAsset = (
                                                    q.response?.assets?.split(",") ?? []
                                                ).filter((s) => s.length > 0).length;

                                                const isSpecialQuestion = ['3.5.1', '8.1.1'].includes(q.order);
                                                const isCompleted = isSpecialQuestion
                                                    ? (okAsset > 0 || faultAsset > 0)  // At least one asset marked
                                                    : (catAsset?.length - okAsset - faultAsset) === 0; // Original strict logic

                                                return (
                                                    <Accordion
                                                        defaultExpanded={idx === openIndex}
                                                        disabled={catAsset?.length === 0}
                                                    >
                                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                                            <Typography>
                                                                {q.order} {q.question}
                                                                {/* <Checkbox disabled={questionReadOnly(q)} checked={q?.response?.response === "Yes"} onChange={(e)=>setResponseCheck(e, idx)}/> Yes
                  <Checkbox disabled={questionReadOnly(q)} checked={q?.response?.response === "No"} onChange={(e) => setResponseCheck2(e, idx)} /> No */}
                                                            </Typography>
                                                            &nbsp;&nbsp;&nbsp;&nbsp;
                                                            {catAsset?.length > 0 && (
                                                                <Chip
                                                                    style={{ margin: "5px", marginLeft: "30px" }}
                                                                    color={!q?.completed ? "success" : "primary"}
                                                                    label={isMonthlyAudit ? (q.dirty ? "Unsaved" : q.response?.responseId ? "Saved" : "Open") : !q?.completed ? "Open" : "Closed"}
                                                                />
                                                            )}
                                                        </AccordionSummary>
                                                        {catAsset?.length > 0 && (
                                                            <AccordionDetails>
                                                                <form
                                                                    onSubmit={(e) => {
                                                                        //setOpenIndex(idx + 1);
                                                                        saveAssessmentResponse(e, idx, isCompleted);
                                                                    }}
                                                                >
                                                                    <Grid container spacing={2}>
                                                                        <Grid item xs={12} sm={6}>
                                                                            <label
                                                                                htmlFor="totalAsset"
                                                                                name="totalAsset"
                                                                            >
                                                                                Total Asset
                                                                            </label>
                                                                            <input
                                                                                disabled
                                                                                name="totalAsset"
                                                                                className="form-control"
                                                                                id="totalAsset"
                                                                                value={catAsset?.length}
                                                                                style={{
                                                                                    width: "100%",
                                                                                    padding: "10px",
                                                                                    margin: "8px 0",
                                                                                    borderRadius: "4px",
                                                                                    border: "1px solid #ccc",
                                                                                }}
                                                                            />
                                                                        </Grid>

                                                                        <Grid item xs={12} sm={6}>
                                                                            <label
                                                                                htmlFor="totalAsset"
                                                                                name="totalAsset"
                                                                            >
                                                                                Remaining Asset
                                                                            </label>
                                                                            <input
                                                                                disabled
                                                                                name="totalAsset"
                                                                                className="form-control"
                                                                                id="totalAsset"
                                                                                value={
                                                                                    catAsset?.length -
                                                                                    okAsset -
                                                                                    faultAsset
                                                                                }
                                                                                style={{
                                                                                    width: "100%",
                                                                                    padding: "10px",
                                                                                    margin: "8px 0",
                                                                                    borderRadius: "4px",
                                                                                    border: "1px solid #ccc",
                                                                                }}
                                                                            />
                                                                        </Grid>

                                                                        <Grid item xs={12} sm={12}>
                                                                            <Autocomplete
                                                                                //limitTags={3}
                                                                                disabled={questionReadOnly(q)}
                                                                                multiple
                                                                                disableCloseOnSelect={true}
                                                                                onClose={(event, reason) => {
                                                                                    if (reason === "toggleInput") {
                                                                                        event.preventDefault();
                                                                                    }
                                                                                }}
                                                                                value={catAsset
                                                                                    .filter((s) =>
                                                                                        q?.response?.assets
                                                                                            ?.split(",")
                                                                                            ?.includes(s.assetId.toString())
                                                                                    )
                                                                                    .map((option) => option.assetId)}
                                                                                onChange={(event, newValue) => {
                                                                                    if (isMonthlyAudit && monthlyReadOnly) return;
                                                                                    const assetsList = catAsset.filter(
                                                                                        (s) =>
                                                                                            !q?.response?.faultassets
                                                                                                ?.split(",")
                                                                                                ?.includes(s.assetId.toString())
                                                                                    );
                                                                                    const uquest = [...quest];
                                                                                    if (
                                                                                        newValue.find(
                                                                                            (option) =>
                                                                                                option === "Select All"
                                                                                        )
                                                                                    ) {
                                                                                        // If Select All is in newValue, select all options
                                                                                        uquest[idx].response = {
                                                                                            ...uquest[idx].response,
                                                                                            assets: assetsList
                                                                                                .map((i) => i.assetId)
                                                                                                .join(","),
                                                                                        };
                                                                                    } else if (newValue.length === 0) {
                                                                                        // If nothing selected, clear selection
                                                                                        uquest[idx].response = {
                                                                                            ...uquest[idx].response,
                                                                                            assets: "",
                                                                                        };
                                                                                    } else {
                                                                                        // Regular selection
                                                                                        uquest[idx].response = {
                                                                                            ...uquest[idx].response,
                                                                                            assets: newValue.join(","),
                                                                                        };
                                                                                    }
                                                                                    markQuestionChanged(uquest, idx);
                                                                                }}
                                                                                options={[
                                                                                    "Select All",
                                                                                    ...catAsset
                                                                                        .filter(
                                                                                            (s) =>
                                                                                                !q?.response?.faultassets
                                                                                                    ?.split(",")
                                                                                                    ?.includes(
                                                                                                        s.assetId.toString()
                                                                                                    )
                                                                                        )
                                                                                        .map((option) => option.assetId),
                                                                                ]}
                                                                                getOptionLabel={(option) =>
                                                                                    option === "Select All"
                                                                                        ? "Select All"
                                                                                        : catAsset
                                                                                            .filter(
                                                                                                (a) => a.assetId === option
                                                                                            )
                                                                                            .map(
                                                                                                (option) =>
                                                                                                    option.assetId +
                                                                                                    " - " +
                                                                                                    option.assetName +
                                                                                                    " (" +
                                                                                                    `${
                                                                                                        option?.position || "NA"
                                                                                                    } > ${
                                                                                                        option?.floor || "NA"
                                                                                                    } > ${
                                                                                                        option?.room || "NA"
                                                                                                    }` +
                                                                                                    ")"
                                                                                            )[0]
                                                                                }
                                                                                renderInput={(params) => (
                                                                                    <TextField
                                                                                        {...params}
                                                                                        label="Asset OK"
                                                                                        size="small"
                                                                                    />
                                                                                )}
                                                                                renderOption={(
                                                                                    props,
                                                                                    option,
                                                                                    { selected }
                                                                                ) => (
                                                                                    <li {...props}>
                                                                                        <Checkbox checked={selected} />
                                                                                        {option === "Select All"
                                                                                            ? "Select All"
                                                                                            : catAsset
                                                                                                .filter(
                                                                                                    (a) => a.assetId === option
                                                                                                )
                                                                                                .map(
                                                                                                    (option) =>
                                                                                                        option.assetId +
                                                                                                        " - " +
                                                                                                        option.assetName +
                                                                                                        " (" +
                                                                                                        `${
                                                                                                            option?.position || "NA"
                                                                                                        } > ${
                                                                                                            option?.floor || "NA"
                                                                                                        } > ${
                                                                                                            option?.room || "NA"
                                                                                                        }` +
                                                                                                        ")"
                                                                                                )[0]}
                                                                                    </li>
                                                                                )}
                                                                                renderTags={(value, getTagProps) => (
                                                                                    <Box
                                                                                        sx={{
                                                                                            display: "flex",
                                                                                            flexWrap: "wrap",
                                                                                            gap: 0.5,
                                                                                            maxHeight: 120,
                                                                                            overflowY: "auto",
                                                                                            alignItems: "flex-start",
                                                                                            alignContent: "flex-start",
                                                                                            padding: "4px 0",
                                                                                        }}
                                                                                    >
                                                                                        {value.map((option, index) => (
                                                                                            <Chip
                                                                                                key={index}
                                                                                                label={
                                                                                                    catAsset
                                                                                                        .filter(
                                                                                                            (a) =>
                                                                                                                a.assetId === option
                                                                                                        )
                                                                                                        .map(
                                                                                                            (option) =>
                                                                                                                option.assetId +
                                                                                                                " - " +
                                                                                                                option.assetName +
                                                                                                                " (" +
                                                                                                                `${
                                                                                                                    option?.position ||
                                                                                                                    "NA"
                                                                                                                } > ${
                                                                                                                    option?.floor || "NA"
                                                                                                                } > ${
                                                                                                                    option?.room || "NA"
                                                                                                                }` +
                                                                                                                ")"
                                                                                                        )[0]
                                                                                                }
                                                                                                {...getTagProps({ index })}
                                                                                            />
                                                                                        ))}
                                                                                    </Box>
                                                                                )}
                                                                            />
                                                                        </Grid>
                                                                        <Grid item xs={12} sm={12}>
                                                                            <Autocomplete
                                                                                disabled={questionReadOnly(q)}
                                                                                multiple
                                                                                disableCloseOnSelect={true}
                                                                                onClose={(event, reason) => {
                                                                                    if (reason === "toggleInput") {
                                                                                        event.preventDefault();
                                                                                    }
                                                                                }}
                                                                                value={catAsset
                                                                                    .filter((s) =>
                                                                                        q?.response?.faultassets
                                                                                            ?.split(",")
                                                                                            ?.includes(s.assetId.toString())
                                                                                    )
                                                                                    .map((option) => option.assetId)}
                                                                                onChange={(event, newValue) => {
                                                                                    if (isMonthlyAudit && monthlyReadOnly) return;
                                                                                    const assetsList = catAsset.filter(
                                                                                        (s) =>
                                                                                            !q?.response?.assets
                                                                                                ?.split(",")
                                                                                                ?.includes(s.assetId.toString())
                                                                                    );

                                                                                    const uquest = [...quest];

                                                                                    if (
                                                                                        newValue.find(
                                                                                            (option) =>
                                                                                                option === "Select All"
                                                                                        )
                                                                                    ) {
                                                                                        uquest[idx].response = {
                                                                                            ...uquest[idx].response,
                                                                                            faultassets: assetsList
                                                                                                .map((i) => i.assetId)
                                                                                                .join(","),
                                                                                        };
                                                                                    } else if (newValue.length === 0) {
                                                                                        uquest[idx].response = {
                                                                                            ...uquest[idx].response,
                                                                                            faultassets: "",
                                                                                        };
                                                                                    } else {
                                                                                        uquest[idx].response = {
                                                                                            ...uquest[idx].response,
                                                                                            faultassets: newValue.join(","),
                                                                                        };
                                                                                    }
                                                                                    markQuestionChanged(uquest, idx);
                                                                                }}
                                                                                options={[
                                                                                    "Select All",
                                                                                    ...catAsset
                                                                                        .filter(
                                                                                            (s) =>
                                                                                                !q?.response?.assets
                                                                                                    ?.split(",")
                                                                                                    ?.includes(
                                                                                                        s.assetId.toString()
                                                                                                    )
                                                                                        )
                                                                                        .map((option) => option.assetId),
                                                                                ]}
                                                                                getOptionLabel={(option) =>
                                                                                    option === "Select All"
                                                                                        ? "Select All"
                                                                                        : catAsset
                                                                                            .filter(
                                                                                                (a) => a.assetId === option
                                                                                            )
                                                                                            .map(
                                                                                                (option) =>
                                                                                                    option.assetId +
                                                                                                    " - " +
                                                                                                    option.assetName +
                                                                                                    " (" +
                                                                                                    `${
                                                                                                        option?.position || "NA"
                                                                                                    } > ${
                                                                                                        option?.floor || "NA"
                                                                                                    } > ${
                                                                                                        option?.room || "NA"
                                                                                                    }` +
                                                                                                    ")"
                                                                                            )[0]
                                                                                }
                                                                                renderInput={(params) => (
                                                                                    <TextField
                                                                                        {...params}
                                                                                        label="Defective OK"
                                                                                        size="small"
                                                                                    />
                                                                                )}
                                                                                renderOption={(
                                                                                    props,
                                                                                    option,
                                                                                    { selected }
                                                                                ) => (
                                                                                    <li {...props}>
                                                                                        <Checkbox checked={selected} />
                                                                                        {option === "Select All"
                                                                                            ? "Select All"
                                                                                            : catAsset
                                                                                                .filter(
                                                                                                    (a) => a.assetId === option
                                                                                                )
                                                                                                .map(
                                                                                                    (option) =>
                                                                                                        option.assetId +
                                                                                                        " - " +
                                                                                                        option.assetName +
                                                                                                        " (" +
                                                                                                        `${
                                                                                                            option?.position || "NA"
                                                                                                        } > ${
                                                                                                            option?.floor || "NA"
                                                                                                        } > ${
                                                                                                            option?.room || "NA"
                                                                                                        }` +
                                                                                                        ")"
                                                                                                )[0]}
                                                                                    </li>
                                                                                )}
                                                                                renderTags={(value, getTagProps) => (
                                                                                    <Box
                                                                                        sx={{
                                                                                            display: "flex",
                                                                                            flexWrap: "wrap",
                                                                                            gap: 0.5,
                                                                                            maxHeight: 120,
                                                                                            overflowY: "auto",
                                                                                            alignItems: "flex-start",
                                                                                            alignContent: "flex-start",
                                                                                            padding: "4px 0",
                                                                                        }}
                                                                                    >
                                                                                        {value.map((option, index) => (
                                                                                            <Chip
                                                                                                key={index}
                                                                                                label={
                                                                                                    catAsset
                                                                                                        .filter(
                                                                                                            (a) =>
                                                                                                                a.assetId === option
                                                                                                        )
                                                                                                        .map(
                                                                                                            (option) =>
                                                                                                                option.assetId +
                                                                                                                " - " +
                                                                                                                option.assetName +
                                                                                                                " (" +
                                                                                                                `${
                                                                                                                    option?.position ||
                                                                                                                    "NA"
                                                                                                                } > ${
                                                                                                                    option?.floor || "NA"
                                                                                                                } > ${
                                                                                                                    option?.room || "NA"
                                                                                                                }` +
                                                                                                                ")"
                                                                                                        )[0]
                                                                                                }
                                                                                                {...getTagProps({ index })}
                                                                                            />
                                                                                        ))}
                                                                                    </Box>
                                                                                )}
                                                                            />
                                                                        </Grid>
                                                                        {isMonthlyAudit && faultAsset > 0 && (
                                                                            <Grid item xs={12}>
                                                                                <MonthlyAuditActionChoices
                                                                                    question={q}
                                                                                    candidates={monthlyActions}
                                                                                    siteId={monthlyContext?.siteId}
                                                                                    assets={catAsset}
                                                                                    disabled={monthlyReadOnly}
                                                                                    onChange={(assetId, choice) => {
                                                                                        if (monthlyReadOnly) return;
                                                                                        const questions = [...quest];
                                                                                        questions[idx] = { ...q,
                                                                                            actionChoices: { ...q.actionChoices, [assetId]: choice } };
                                                                                        markQuestionChanged(questions, idx);
                                                                                    }}
                                                                                />
                                                                            </Grid>
                                                                        )}
                                                                        {faultAsset > 0 && (
                                                                            <Grid item xs={6}>
                                                                                <label
                                                                                    htmlFor="position"
                                                                                    name="position"
                                                                                >
                                                                                    Observation
                                                                                </label>
                                                                                <textarea
                                                                                    disabled={questionReadOnly(q)}
                                                                                    name="position"
                                                                                    className="form-control"
                                                                                    id="position"
                                                                                    rows="4"
                                                                                    required={faultAsset > 0}
                                                                                    placeholder="Enter notes..."
                                                                                    value={q?.response?.position}
                                                                                    onChange={(e) =>
                                                                                        handleInputChange(e, idx)
                                                                                    }
                                                                                    style={{
                                                                                        width: "100%",
                                                                                        padding: "10px",
                                                                                        margin: "8px 0",
                                                                                        borderRadius: "4px",
                                                                                        border: "1px solid #ccc",
                                                                                    }}
                                                                                />
                                                                            </Grid>
                                                                        )}

                                                                        {faultAsset > 0 && (
                                                                            <Grid item xs={6}>
                                                                                <label htmlFor="action" name="action">
                                                                                    Suggested Action
                                                                                </label>
                                                                                <textarea
                                                                                    disabled={questionReadOnly(q)}
                                                                                    name="action"
                                                                                    required={faultAsset > 0}
                                                                                    className="form-control"
                                                                                    id="action"
                                                                                    rows="4"
                                                                                    placeholder="Enter notes..."
                                                                                    value={q?.response?.action}
                                                                                    onChange={(e) =>
                                                                                        handleInputChange(e, idx)
                                                                                    }
                                                                                    style={{
                                                                                        width: "100%",
                                                                                        padding: "10px",
                                                                                        margin: "8px 0",
                                                                                        borderRadius: "4px",
                                                                                        border: "1px solid #ccc",
                                                                                    }}
                                                                                />
                                                                            </Grid>
                                                                        )}
                                                                        {faultAsset > 0 && (
                                                                            <Grid
                                                                                item
                                                                                xs={
                                                                                    !q?.response?.images ||
                                                                                    q?.response?.images?.length === 0
                                                                                        ? 12
                                                                                        : 8
                                                                                }
                                                                            >
                                                                                <Box
                                                                                    display="flex"
                                                                                    alignItems="center"
                                                                                    justifyContent="center"
                                                                                    border="1px dashed grey"
                                                                                    p={2}
                                                                                    mb={2}
                                                                                    style={{
                                                                                        backgroundColor: "#f9f9f9",
                                                                                        height: "150px",
                                                                                        borderRadius: "4px",
                                                                                        color: "#3f51b5",
                                                                                    }}
                                                                                    onDragOver={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        e.dataTransfer.dropEffect = "copy";
                                                                                    }}
                                                                                    onDragEnter={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                    }}
                                                                                    onDragLeave={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                    }}
                                                                                    onDrop={(e) => {
                                                                                        e.preventDefault();
                                                                                        e.stopPropagation();
                                                                                        if (isMonthlyAudit && monthlyReadOnly) return;
                                                                                        const files = Array.from(
                                                                                            e.dataTransfer.files || []
                                                                                        );
                                                                                        const validImageFiles =
                                                                                            files.filter((file) =>
                                                                                                [
                                                                                                    "image/jpeg",
                                                                                                    "image/jpg",
                                                                                                    "image/png",
                                                                                                ].includes(file.type)
                                                                                            );

                                                                                        if (
                                                                                            files.length > 0 &&
                                                                                            validImageFiles.length === 0
                                                                                        ) {
                                                                                            toast.error(
                                                                                                "Please drop only image files (JPEG, JPG, PNG)"
                                                                                            );
                                                                                            return;
                                                                                        }

                                                                                        if (validImageFiles.length > 0) {
                                                                                            const uquest = [...quest];
                                                                                            uquest[idx].response.file = [
                                                                                                ...(uquest[idx].response.file ||
                                                                                                    []),
                                                                                                ...validImageFiles,
                                                                                            ];
                                                                                            markQuestionChanged(uquest, idx);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <IconButton
                                                                                        component="label"
                                                                                        disabled={questionReadOnly(q)}
                                                                                    >
                                                                                        <input
                                                                                            hidden
                                                                                            type="file"
                                                                                            onChange={(e) =>
                                                                                                handleFileChange(e, idx)
                                                                                            }
                                                                                            accept="image/jpeg, image/jpg, image/png"
                                                                                            multiple
                                                                                            disabled={questionReadOnly(q)}
                                                                                        />
                                                                                        <UploadFile
                                                                                            color={
                                                                                                q?.completed
                                                                                                    ? "disabled"
                                                                                                    : "primary"
                                                                                            }
                                                                                        />
                                                                                    </IconButton>
                                                                                    <Typography
                                                                                        color={
                                                                                            q?.completed
                                                                                                ? "text.disabled"
                                                                                                : "text.primary"
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            "Click to upload or drag and drop PNG/JPG (max, 1MB)"
                                                                                        }
                                                                                    </Typography>
                                                                                </Box>
                                                                                {q?.response?.file &&
                                                                                    q?.response?.file?.length > 0 &&
                                                                                    [...q?.response?.file]?.map(
                                                                                        (f, idx2) => (
                                                                                            <Chip
                                                                                                label={
                                                                                                    f?.name ?? "Attached Image"
                                                                                                }
                                                                                                onDelete={() =>
                                                                                                    handleFileDelete(idx, idx2)
                                                                                                }
                                                                                            />
                                                                                        )
                                                                                    )}
                                                                            </Grid>
                                                                        )}

                                                                        {q?.response?.images?.length > 1 && (
                                                                            // <Grid item xs={6} container alignItems="center" >
                                                                            <div className="col-md-4 text-center mt-2">
                                                                                <div className="form-group">
                                                                                    <Slider {...carouselSettings}>
                                                                                        {q?.response?.images?.map((i) => (
                                                                                            <div>
                                                                                                <img
                                                                                                    onClick={() => {
                                                                                                        window.open(
                                                                                                            i?.imageUrl +
                                                                                                            "?" +
                                                                                                            sasToken,
                                                                                                            "_blank"
                                                                                                        );
                                                                                                    }}
                                                                                                    style={{ cursor: "pointer" }}
                                                                                                    src={
                                                                                                        i?.imageUrl + "?" + sasToken
                                                                                                    }
                                                                                                    className="img img-responsive border p-2 m-2 w-100"
                                                                                                    height={200}
                                                                                                    width={200}
                                                                                                    alt="ActionResponse"
                                                                                                />
                                                                                                {!questionReadOnly(q) && (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className="btn btn-sm btn-danger mb-2"
                                                                                                        onClick={() => {
                                                                                                            deleteAssessmentResponseImage(
                                                                                                                i
                                                                                                            );
                                                                                                        }}
                                                                                                    >
                                                                                                        Delete
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        ))}
                                                                                    </Slider>
                                                                                </div>
                                                                            </div>
                                                                            // </Grid>
                                                                        )}
                                                                        {q?.response?.images?.length === 1 && (
                                                                            <div
                                                                                className="col-md-4 text-center mt-2"
                                                                                style={{ marginBottom: "10px" }}
                                                                            >
                                                                                <div className="form-group">
                                                                                    <img
                                                                                        onClick={() => {
                                                                                            window.open(
                                                                                                q?.response?.images[0]
                                                                                                    ?.imageUrl +
                                                                                                "?" +
                                                                                                sasToken,
                                                                                                "_blank"
                                                                                            );
                                                                                        }}
                                                                                        style={{ cursor: "pointer" }}
                                                                                        src={
                                                                                            q?.response?.images[0].imageUrl +
                                                                                            "?" +
                                                                                            sasToken
                                                                                        }
                                                                                        className="img img-responsive border p-2 m-2 w-100"
                                                                                        height={200}
                                                                                        width={200}
                                                                                    />
                                                                                    {!questionReadOnly(q) && (
                                                                                        <button
                                                                                            type="button"
                                                                                            className="btn btn-sm btn-danger mb-2"
                                                                                            onClick={() => {
                                                                                                deleteAssessmentResponseImage(
                                                                                                    q?.response?.images[0]
                                                                                                );
                                                                                            }}
                                                                                            style={{ margin: "10px" }}
                                                                                        >
                                                                                            Delete
                                                                                        </button>
                                                                                    )}
                                                                                </div>
                                                                            </div>
                                                                        )}
                                                                        {/* {q?.response?.file && q?.response?.file?.name === undefined &&
                      <Grid item xs={12} style={{background: 'grey'}}>
                      <img src={q?.response?.file+"?"+sasToken} />
                      </Grid>
                      } */}
                                                                        {/* {q?.response?.file && q?.response?.file?.name === undefined && <Grid item xs={12}>
                    &nbsp;<button
                        type={"button"}
                          style={{ float: 'right', margin:"20px" }}
                          className="btn btn-sm btn-danger text-light"
                          onClick={() => handleFileDelete(idx)}
                        >
                          <i className="fas fa-trash" />&nbsp;Delete Attachment
                        </button> &nbsp;
                      <a href={q?.response?.file + "?" + sasToken} target="_blank">
                        <button
                        type={"button"}
                          style={{ float: 'right', margin:"20px" }}
                          className="btn btn-sm btn-light text-dark"
                        >
                          <i className="fas fa-download" />&nbsp;Download Attachment
                        </button>&nbsp;
                      </a></Grid>} */}

                                                                        {faultAsset > 0 && (
                                                                            <Grid item xs={12}>
                                                                                <Typography variant="h6" gutterBottom>
                                                                                    Risk Score Card (
                                                                                    <strong>
                                                                                        Total Risk Score ={" "}
                                                                                        {(q?.response?.consequence ?? 0) *
                                                                                            (q?.response?.likelihood ?? 0)}
                                                                                    </strong>
                                                                                    )
                                                                                </Typography>
                                                                                <Grid container spacing={2}>
                                                                                    <Grid item xs={12} sm={4}>
                                                                                        <Grid item xs={12} sm={12}>
                                                                                            <label
                                                                                                htmlFor="consequence"
                                                                                                name="consequence"
                                                                                            >
                                                                                                Consequence
                                                                                            </label>
                                                                                            <select
                                                                                                required={faultAsset > 0}
                                                                                                disabled={questionReadOnly(q)}
                                                                                                className="form-control form-select"
                                                                                                name="consequence"
                                                                                                value={q?.response?.consequence}
                                                                                                onChange={(e) =>
                                                                                                    handleInputChange(e, idx)
                                                                                                }
                                                                                            >
                                                                                                <option value="">
                                                                                                    Select{" "}
                                                                                                </option>
                                                                                                {[1, 2, 3, 4, 5].map((num) => (
                                                                                                    <option value={num}>
                                                                                                        {num}{" "}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </Grid>
                                                                                        <Grid item xs={12} sm={12}>
                                                                                            <label
                                                                                                htmlFor="likelihood"
                                                                                                name="likelihood"
                                                                                            >
                                                                                                Likelihood
                                                                                            </label>
                                                                                            <select
                                                                                                required={faultAsset > 0}
                                                                                                disabled={questionReadOnly(q)}
                                                                                                className="form-control form-select"
                                                                                                name="likelihood"
                                                                                                value={q?.response?.likelihood}
                                                                                                onChange={(e) =>
                                                                                                    handleInputChange(e, idx)
                                                                                                }
                                                                                            >
                                                                                                <option value="">
                                                                                                    Select{" "}
                                                                                                </option>
                                                                                                {[1, 2, 3, 4, 5].map((num) => (
                                                                                                    <option value={num}>
                                                                                                        {num}{" "}
                                                                                                    </option>
                                                                                                ))}
                                                                                            </select>
                                                                                        </Grid>
                                                                                    </Grid>
                                                                                    <Grid item xs={12} sm={8}>
                                                                                        <Box
                                                                                            display="flex"
                                                                                            alignItems="center"
                                                                                            justifyContent="center"
                                                                                            p={2}
                                                                                            mb={2}
                                                                                            style={{
                                                                                                height: "290px",
                                                                                                marginTop: "-70px",
                                                                                            }}
                                                                                        >
                                                                                            <img
                                                                                                src="/RiskScore.png"
                                                                                                alt="Risk Score Matrix"
                                                                                                style={{
                                                                                                    width: "100%",
                                                                                                    height: "100%",
                                                                                                }}
                                                                                            />
                                                                                        </Box>
                                                                                    </Grid>
                                                                                </Grid>
                                                                            </Grid>
                                                                        )}
                                                                        {(isMonthlyAudit ? monthlyContext?.canEdit : !q?.completed) && (
                                                                            <Grid item xs={12}>
                                                                                <button
                                                                                    style={{
                                                                                        width: "150px",
                                                                                        marginBottom: "20px",
                                                                                        margin: "10px",
                                                                                        float: "right",
                                                                                    }}
                                                                                    className="btn btn-primary text-white pr-2"
                                                                                    disabled={
                                                                                        (okAsset === 0 && faultAsset === 0) || (isMonthlyAudit && monthlyReadOnly)
                                                                                    }
                                                                                    type="submit"
                                                                                >
                                                                                    {isLoading || (isMonthlyAudit && savingQuestionId === q.qid) ? (
                                                                                        <CircularProgress
                                                                                            sx={{ color: "white" }}
                                                                                        />
                                                                                    ) : (
                                                                                        "Save & Continue"
                                                                                    )}
                                                                                </button>
                                                                            </Grid>
                                                                        )}
                                                                        {/* {q?.completed && q?.response?.file && <Grid item xs={12}>
                      <a href={q?.response?.file + "?" + sasToken} target="_blank">
                        <button
                          style={{ float: 'right' }}
                          disabled={q?.response?.completed}
                          className="btn btn-sm btn-light text-dark"
                        >
                          <i className="fas fa-download" />&nbsp;Download Attachment
                        </button>
                      </a></Grid>} */}
                                                                    </Grid>
                                                                </form>
                                                            </AccordionDetails>
                                                        )}
                                                    </Accordion>
                                                );
                                            })}
                                    </div>
                                );
                            })}


                        {(subType === "Monthly Audit" || subType === "Annual Winter Audit") && (
                            <Box
                                className="dont-print"
                                sx={{
                                    mt: 3,
                                    pt: 2,
                                    borderTop: 1,
                                    borderColor: "divider",
                                    display: "flex",
                                    justifyContent: "flex-end",
                                }}
                            >
                                <Tooltip
                                    title={
                                        isMonthlyAudit && monthlySubmitted
                                            ? "This audit is already saved in History"
                                            : isMonthlyAudit && monthlyRecovery
                                                ? "Complete the saved submission without creating another audit"
                                                : canPrint
                                            ? "Submit audit and close this site check"
                                            : visibleBlockingOrders.length > 0
                                                ? `Complete question(s): ${visibleBlockingOrders.join(", ")}${hiddenBlockingCount > 0 ? ` (+ ${hiddenBlockingCount} in other sections)` : ""}`
                                                : hiddenBlockingCount > 0
                                                    ? `Complete question(s) in other sections (${hiddenBlockingCount})`
                                                    : "Complete all the questions before submitting"
                                    }
                                >
                  <span>
                    <Button
                        variant="contained"
                        color="primary"
                        size="medium"
                        startIcon={<CheckCircle />}
                        onClick={handleSubmitAudit}
                        disabled={isMonthlyAudit
                            ? !monthlyContext?.canSubmit || monthlySubmitted || monthlyBusy || isSubmitting || isLoading ||
                                (!monthlyRecovery && !canPrint)
                            : !canPrint || isSubmitting}
                    >
                      {isSubmitting ? "Submitting…" : isMonthlyAudit && monthlySubmitted ? "Submitted"
                          : isMonthlyAudit && monthlyRecovery ? "Save report and History" : "Submit audit"}
                    </Button>
                  </span>
                                </Tooltip>
                            </Box>
                        )}
                    </CardContent>
                )}
            </Card>


            <div
                ref={printRef}
                style={{
                    position: "absolute",
                    left: "-9999px",
                    top: 0,
                    width: "210mm",
                    padding: 16,
                    backgroundColor: "#fff",
                    fontSize: 12,
                }}
            >
                <h2 style={{ marginBottom: 8 }}>
                    {isMonthlyAudit ? monthlyContext?.siteName || `Site ${monthlyContext?.siteId || ""}` : siteSelectedForGlobal?.siteName || "Site"} – {subType || "Audit"}
                </h2>
                <p style={{ marginBottom: 16 }}>
                    Printed on {moment().format("DD/MM/YYYY HH:mm")}
                </p>
                <p style={{ marginBottom: 16 }}>
                    Total: {quest?.length || 0}, Closed:{" "}
                    {quest?.filter((q) => q?.completed).length || 0}, Open:{" "}
                    {(quest?.length || 0) - (quest?.filter((q) => q?.completed).length || 0)}
                </p>

                {header?.map((h) => (
                    <div key={h.lovDesc}>
                        <h3 style={{ marginTop: 16, marginBottom: 8 }}>
                            {h.lovDesc} {h.lovValue}
                        </h3>
                        {quest
                            ?.filter(
                                (q) =>
                                    !q?.question?.includes("DELETE") &&
                                    q.order?.startsWith(h.lovDesc + ".")
                            )
                            .map((q) => {
                                const { catAsset, okAsset, faultAsset } = getQuestionState(
                                    q,
                                    auditAssets
                                );
                                const okIds = (q.response?.assets?.split(",") ?? []).filter(
                                    Boolean
                                );
                                const faultIds = (
                                    q.response?.faultassets?.split(",") ?? []
                                ).filter(Boolean);
                                return (
                                    <div
                                        key={q.qid}
                                        style={{
                                            marginBottom: 20,
                                            paddingBottom: 12,
                                            borderBottom: "1px solid #eee",
                                        }}
                                    >
                                        <p style={{ fontWeight: 600, marginBottom: 4 }}>
                                            {q.order} {q.question}
                                        </p>
                                        <p style={{ margin: "4px 0" }}>
                                            <strong>Asset OK:</strong>{" "}
                                            {okIds.length
                                                ? okIds
                                                    .map((id) => getAssetLabel(id.trim(), catAsset))
                                                    .join("; ")
                                                : "—"}
                                        </p>
                                        <p style={{ margin: "4px 0" }}>
                                            <strong>Asset Defective:</strong>{" "}
                                            {faultIds.length
                                                ? faultIds
                                                    .map((id) => getAssetLabel(id.trim(), catAsset))
                                                    .join("; ")
                                                : "—"}
                                        </p>
                                        {faultAsset > 0 && (
                                            <>
                                                <p style={{ margin: "4px 0" }}>
                                                    <strong>Observation:</strong>{" "}
                                                    {q.response?.position || "—"}
                                                </p>
                                                <p style={{ margin: "4px 0" }}>
                                                    <strong>Suggested Action:</strong>{" "}
                                                    {q.response?.action || "—"}
                                                </p>
                                                {q.response?.images?.length > 0 && (
                                                    <div style={{ margin: "8px 0" }}>
                                                        <strong>Images:</strong>
                                                        <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 4 }}>
                                                            {q.response.images.map((img, i) => (
                                                                <img
                                                                    key={i}
                                                                    src={(img?.imageUrl || "") + "?" + (sasToken || "")}
                                                                    alt=""
                                                                    style={{
                                                                        maxWidth: 120,
                                                                        maxHeight: 90,
                                                                        objectFit: "contain",
                                                                        border: "1px solid #ccc",
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                                <p style={{ margin: "4px 0" }}>
                                                    <strong>Risk Score:</strong> Consequence{" "}
                                                    {q.response?.consequence ?? "—"}, Likelihood{" "}
                                                    {q.response?.likelihood ?? "—"}, Total{" "}
                                                    {(Number(q.response?.consequence) || 0) *
                                                        (Number(q.response?.likelihood) || 0) ||
                                                        q.response?.totalRiskScore ||
                                                        "—"}
                                                </p>
                                            </>
                                        )}
                                    </div>
                                );
                            })}
                    </div>
                ))}
            </div>
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
export default connect(mapStateToProps, {
    getSiteCheckAssets,
    deleteUser,
    getSites,
    getSiteLayout,
})(AssessmentFireRisk);
