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
    getSiteAssets,
    getSiteLayout,
} from "../../../../store/thunk/site";

const AssessmentFireRisk = ({
                                subType,
                                sasToken,
                                checkId,
                                siteAssets,
                                getSiteAssets,
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

    // Helper: get catAsset and completion state for a question (same logic as UI)
    const getQuestionState = (q, siteAssetsList) => {
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
                siteAssets
            );
            const catLen = catAsset?.length ?? 0;
            const remaining = catLen - okAsset - faultAsset;
            const pass = catLen === 0 || isCompleted || remaining === 0;
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
    }, [quest, siteAssets, header]);

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
        if (siteSelectedForGlobal?.siteId) {
            getSiteAssets(siteSelectedForGlobal?.siteId);
            getSiteAssets(siteSelectedForGlobal?.siteId);
            getSiteLayout(siteSelectedForGlobal?.siteId);
            fetchFolderStructure(siteSelectedForGlobal.siteId);
        }
    }, []);

    const fetchFolderStructure = async (siteId) => {
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
            if (internalMonthlyAudit?.id) {
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

    const uploadPdfToServer = async (pdfBlob, fileName) => {
        if (!auditFolderId) return false;
        try {
            setIsUploading(true);
            const pdfFile = new File([pdfBlob], fileName, { type: "application/pdf" });
            const { exists, file: existingFile } = await checkFileExists(auditFolderId, fileName);
            const uploadFormData = new FormData();

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
                        issueDate: formatDateForBackend(siteCheck?.startDate),
                        expiryDate: formatDateForBackend(calculateExpiryDate(siteCheck?.startDate, siteCheck?.repeatFrequency)),
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: `Audit-${checkId}-${Date.now()}`,
                    }],
                };
                uploadFormData.append("documentRequestString", JSON.stringify(documentRequestString));
                const response = await putMultiPartFormData(
                    "/api/document/file/newVersion/upload",
                    uploadFormData
                );
                if (response?.data) {
                    toast.success(`Report uploaded to Log Books → Internal Monthly Audit as version ${(existingFile.fileVersion ?? 1) + 1}.`);
                    return true;
                }
            } else {
                uploadFormData.append("files", pdfFile);
                const fileVersion = await getHighestFileVersion(auditFolderId, fileName);
                const documentRequestString = {
                    folderId: auditFolderId,
                    files: [{
                        name: fileName.split(".")[0],
                        issueDate: formatDateForBackend(siteCheck?.startDate),
                        expiryDate: formatDateForBackend(calculateExpiryDate(siteCheck?.startDate, siteCheck?.repeatFrequency)),
                        note: "Monthly Audit Report",
                        fileVersion,
                        siteId: siteSelectedForGlobal?.siteId || 0,
                        originalFileName: fileName,
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: `Audit-${checkId}-${Date.now()}`,
                    }],
                };
                uploadFormData.append("documentRequestString", JSON.stringify(documentRequestString));
                const response = await postMultiPartFormData(
                    "/api/document/files/upload",
                    uploadFormData
                );
                if (response?.data) {
                    toast.success(`Report uploaded to Log Books → Internal Monthly Audit as version ${fileVersion}.`);
                    return true;
                }
            }
            return false;
        } catch (error) {
            console.error("Error uploading audit PDF:", error);
            toast.error("Failed to upload report to folder.");
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const getQuestions = async () => {
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
        const { name, value } = e.target;
        const uquest = [...quest];
        const udata = {
            ...quest[idx].response,
            [name]: value,
        };
        uquest[idx].response = udata;
        setquest(uquest);
    };

    const setResponseCheck = (e, idx) => {
        if (e.target.checked) {
            const uquest = [...quest];
            const udata = {
                ...quest[idx].response,
                response: "Yes",
            };
            uquest[idx].response = udata;
            setquest(uquest);
        }
    };

    const setResponseCheck2 = (e, idx) => {
        if (e.target.checked) {
            const uquest = [...quest];
            const udata = {
                ...quest[idx].response,
                response: "No",
            };
            uquest[idx].response = udata;
            setquest(uquest);
        }
    };

    const handleFileChange = (e, idx) => {
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
        setquest(uquest);
    };
    const handleFileDelete = (idx, idx2) => {
        const uquest = [...quest];
        quest[idx].response.file = [...quest[idx].response.file].filter(
            (_, index) => index !== idx2
        );
        setquest(uquest);
    };

    const deleteAssessmentResponseImage = async (image) => {
        Swal.fire({
            title: `Are you sure you'd like to permanently delete this image?`,
            showDenyButton: false,
            showCancelButton: true,
            confirmButtonText: "Delete",
        }).then(async (result) => {
            if (result.isConfirmed) {
                await del(`/api/site-check/assessment/response/image/${image.imageId}`);
                toast.success("Image deleted successfully");
                await getQuestions();
            } else if (result.isDenied) {
                // Swal.fire("Changes are not saved", "", "info");
            }
        });
    };

    const saveAssessmentResponse = async (event, index, completed) => {
        event.preventDefault();
        const form = event.target;
        if (!form.checkValidity()) {
            form.reportValidity();
        }

        const q = quest[index];
        const faultAssets = (q.response?.faultassets?.split(",") || []).filter(Boolean);
        const okAssets = (q.response?.assets?.split(",") || []).filter(Boolean);
        const isSpecialQuestion = ['3.5.1', '8.1.1'].includes(q.order);

        const { catAsset } = getQuestionState(q, siteAssets);

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
            });
            await getQuestions();
            onAuditSubmitted?.();

            try {
                const r = await handlePrint();
                if (r?.blob && r?.fileName && auditFolderId) {
                    await uploadPdfToServer(r.blob, r.fileName);
                }
            } catch (uploadErr) {
                console.error("Upload audit PDF:", uploadErr);
                toast.error("Audit submitted. Report upload to folder failed.");
            }
            toast.success("Audit submitted successfully. Site check is now done.");
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

    const handlePrint = async () => {
        if (!quest?.length || !header?.length) {
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

        const addImagesToPdf = async (images, sasToken) => {
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
                if (!dataUrl) continue;
                if (y + maxImgH > pageH - margin) {
                    doc.addPage();
                    y = margin;
                }
                const imgW = maxImgW;
                const imgH = maxImgH;
                doc.addImage(dataUrl, "JPEG", margin, y, imgW, imgH);
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
            ["Type", siteCheck?.type ?? "Audit"],
            ["Sub Type", siteCheck?.subType ?? "Monthly Audit"],
            ["Category", siteCheck?.category ?? "—"],
            ["Start Date", siteCheck?.startDate ? moment(siteCheck.startDate).format("DD-MM-YYYY") : "—"],
            ["Lead", formatUserLabel(siteCheck?.leadUserID)],
            ["Assistant", formatUserLabel(siteCheck?.assistantUserID)],
            ["Repeats", siteCheck?.repeatFrequency ?? "Monthly"],
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

        const siteName = siteSelectedForGlobal?.siteName || "Site";
        const auditType = subType || "Audit";
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(`${siteName} – ${auditType}`, margin, y);
        y += lineH + 2;
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");
        doc.text(`Printed on ${moment().format("DD/MM/YYYY HH:mm")}`, margin, y);
        y += lineH + blockGap;
        const closedCount = quest?.filter((q) => q?.completed).length || 0;
        doc.text(`Total questions: ${quest?.length || 0}, Closed: ${closedCount}, Open: ${(quest?.length || 0) - closedCount}`, margin, y);
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

            const sectionQuestions = quest.filter(
                (q) => !q?.question?.includes("DELETE") && q.order?.startsWith(h.lovDesc + ".")
            );
            for (const q of sectionQuestions) {
                const { catAsset } = getQuestionState(q, siteAssets);
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
                        await addImagesToPdf(images, sasToken);
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

        const siteNameRaw = siteSelectedForGlobal?.siteName || "Site";
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
                          }}
                          disabled={!canPrint}
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
                                                    catAsset = siteAssets?.filter(
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
                                                    catAsset = siteAssets?.filter(
                                                        (s) =>
                                                            s.category?.trim() === assetCategory[0]?.trim() &&
                                                            s.subCategory?.trim() ===
                                                            assetCategory[1]?.trim() &&
                                                            s.subCategory2?.trim() ===
                                                            assetCategory[2]?.trim()
                                                    );
                                                } else if (assetCategory.length === 2) {
                                                    catAsset = siteAssets?.filter(
                                                        (s) =>
                                                            s.category === assetCategory[0]?.trim() &&
                                                            s.subCategory?.trim() === assetCategory[1]?.trim()
                                                    );
                                                } else if (
                                                    assetCategory.length === 1 &&
                                                    assetCategory[0]?.trim() !== ""
                                                ) {
                                                    catAsset = siteAssets?.filter(
                                                        (s) =>
                                                            s.category?.trim() === assetCategory[0]?.trim()
                                                    );
                                                } else {
                                                    catAsset = siteAssets;
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
                                                                {/* <Checkbox disabled={q?.completed} checked={q?.response?.response === "Yes"} onChange={(e)=>setResponseCheck(e, idx)}/> Yes
                  <Checkbox disabled={q?.completed} checked={q?.response?.response === "No"} onChange={(e) => setResponseCheck2(e, idx)} /> No */}
                                                            </Typography>
                                                            &nbsp;&nbsp;&nbsp;&nbsp;
                                                            {catAsset?.length > 0 && (
                                                                <Chip
                                                                    style={{ margin: "5px", marginLeft: "30px" }}
                                                                    color={!q?.completed ? "success" : "primary"}
                                                                    label={!q?.completed ? "Open" : "Closed"}
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
                                                                                disabled={q?.completed}
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
                                                                                    setquest(uquest);
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
                                                                                disabled={q?.completed}
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
                                                                                    setquest(uquest);
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
                                                                        {faultAsset > 0 && (
                                                                            <Grid item xs={6}>
                                                                                <label
                                                                                    htmlFor="position"
                                                                                    name="position"
                                                                                >
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
                                                                                    disabled={q?.completed}
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
                                                                                            setquest(uquest);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <IconButton
                                                                                        component="label"
                                                                                        disabled={q?.completed}
                                                                                    >
                                                                                        <input
                                                                                            hidden
                                                                                            type="file"
                                                                                            onChange={(e) =>
                                                                                                handleFileChange(e, idx)
                                                                                            }
                                                                                            accept="image/jpeg, image/jpg, image/png"
                                                                                            multiple
                                                                                            disabled={q?.completed}
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
                                                                                                {!q?.completed && (
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
                                                                                    {!q?.completed && (
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
                                                                                                disabled={q?.completed}
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
                                                                                                disabled={q?.completed}
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
                                                                        {!q?.completed && (
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
                                                                                        okAsset === 0 && faultAsset === 0
                                                                                    }
                                                                                    type="submit"
                                                                                >
                                                                                    {isLoading ? (
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
                                        canPrint
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
                        disabled={!canPrint || isSubmitting}
                    >
                      {isSubmitting ? "Submitting…" : "Submit audit"}
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
                    {siteSelectedForGlobal?.siteName || "Site"} – {subType || "Audit"}
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
                                    siteAssets
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
    getSiteAssets,
    deleteUser,
    getSites,
    getSiteLayout,
})(AssessmentFireRisk);
