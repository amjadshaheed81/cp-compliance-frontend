import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { get, post, put, uploadSiteCheckDoc, getSasToken } from "../../../../api";
import {
    getSiteAssets,
    getSiteById,
    getSiteDetailsById,
    getSites,
    getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import axios from 'axios';
import pdfTemplate from './pdf/FireDamper.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import { getUkLocalDate, isCurrentUkInspectionDate } from "./shared/siteCheckDateUtils";

let PDFLib;

if (typeof window !== 'undefined') {
    import('pdf-lib').then((pdfLib) => {
        PDFLib = pdfLib;
    });
}

const fetchPdfTemplate = async () => {
    try {
        const response = await fetch(pdfTemplate);
        if (!response.ok) {
            throw new Error('Failed to load PDF template: ' + response.statusText);
        }
        const arrayBuffer = await response.arrayBuffer();
        const header = new Uint8Array(arrayBuffer, 0, 5);
        const headerStr = String.fromCharCode.apply(null, header);
        if (headerStr !== '%PDF-') {
            throw new Error('Invalid PDF file: Missing PDF header');
        }
        return arrayBuffer;
    } catch (error) {
        console.error('Error loading PDF template:', error);
        throw new Error('Failed to load PDF template: ' + error.message);
    }
};

const FireDamper = ({
                        checkId,
                        subType,
                        category,
                        getSiteDetailsById,
                        siteDetailsById,
                        siteAssets,
                        getSiteAssets,
                        users,
                        getUsers,
                        siteSelectedForGlobal,
                        loggedInUserData,
                        siteCheck = {},
                    }) => {
    const [formData, setFormData] = useState({
        address: "",
        assetId: "",
        siteContact: "",
        inspectionDate: getUkLocalDate(),
        siteContactNo: "",
        job: "",
        manufacturer: "",
        modelNumber: "",
        position: "",
        floor: "",
        room: "",
        serialNo: "",
        report: "",
        param1: "", // Operational
        param2: "", // Conditional
        param3: "", // Damper with in fier barrier
        param4: "", // Fire Barrier Correction Required
        param5: "", // Damper Size
        param2Remark: "", // Pre-inspection photo 1
        param3Remark: "", // Pre-inspection photo 2
        param4Remark: "", // Post-inspection photo 1
        param5Remark: "", // Post-inspection photo 2
        client: "",
        user: loggedInUserData || {},
        engineer: loggedInUserData?.id || "",
        selectedAsset: null,
        signedDate: getUkLocalDate(),
        clientUser: null,
        siteContactUser: null,
        actionId: null,
    });

    const [uploadedPrePhotos, setUploadedPrePhotos] = useState([]);
    const [uploadedPostPhotos, setUploadedPostPhotos] = useState([]);
    const [uploadingPrePhotos, setUploadingPrePhotos] = useState(false);
    const [uploadingPostPhotos, setUploadingPostPhotos] = useState(false);

    const sites = useSelector((state) => state.site.sites);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showPdfButton, setShowPdfButton] = useState(false);
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [inspectionDetails, setInspectionDetails] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});
    const [folderIds, setFolderIds] = useState({
        logBooks: null,
        plantAndEquipment: null,
        miscellaneousService: null,
        sounderAudibility: null
    });
    const [checkStatus, setCheckStatus] = useState('Open');
    const [isFormEditable, setIsFormEditable] = useState(true);
    const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
    const [showRiskAssessment, setShowRiskAssessment] = useState(false);
    const [actionRaised, setActionRaised] = useState(false);
    const [existingAction, setExistingAction] = useState(null);
    const [sasToken, setSasToken] = useState('');

    const navigate = useNavigate();

    // NEW: use the Site Check's own site/status for the shared Engineer behaviour.
    const authoritativeSiteId = siteCheck?.siteId
        ? Number(siteCheck.siteId)
        : Number(siteSelectedForGlobal?.siteId) || null;
    const [lastEngineerId, setLastEngineerId] = useState(null);
    const effectiveCheckStatus = siteCheck?.status || checkStatus || "Open";

    const {
        engineerOptions,
        selectedEngineer,
        isLoadingEngineers,
        engineerLoadError,
    } = useSiteCheckEngineers({
        users,
        getUsers,
        siteId: authoritativeSiteId,
        loggedInUserData,
        status: effectiveCheckStatus,
        selectedEngineerId: formData.engineer,
        selectedEngineerUser: formData.user,
        lastEngineerId,
    });

    useEffect(() => {
        if (effectiveCheckStatus !== "Open") return;

        setFormData((prev) => ({
            ...prev,
            inspectionDate: getUkLocalDate(),
            signedDate: getUkLocalDate(),
            engineer: prev.engineer || loggedInUserData?.id || "",
            user: prev.user?.id ? prev.user : (loggedInUserData || {}),
        }));
    }, [effectiveCheckStatus, loggedInUserData?.id]);

    const isInternalUserTaggedWithSite = true;

    useEffect(() => {
        const fetchSasToken = async () => {
            try {
                const token = await getSasToken();
                setSasToken(token);

                // Update photo URLs with SAS token
                setUploadedPrePhotos(prev => prev.map(photo => ({
                    ...photo,
                    url: `${photo.url.split('?')[0]}?${token}`
                })));
                setUploadedPostPhotos(prev => prev.map(photo => ({
                    ...photo,
                    url: `${photo.url.split('?')[0]}?${token}`
                })));
            } catch (error) {
                console.error('Failed to fetch SAS token:', error);
            }
        };

        fetchSasToken();
    }, []);

    const selectedAsset = siteAssets.find(
        (asset) => asset.assetId === formData.assetId
    );

    const getHighestFileVersion = async (folderId, fileName) => {
        try {
            const siteId = authoritativeSiteId;
            if (!siteId || !folderId) return 1;

            const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
            const files = response?.document?.files || [];

            if (files.length > 0) {
                const baseName = fileName.split('.')[0];
                const matchingFiles = files.filter(file =>
                    file.name && file.name.startsWith(baseName)
                );

                if (matchingFiles.length > 0) {
                    const versions = matchingFiles.map(f => f.fileVersion || 1);
                    const maxVersion = Math.max(...versions);
                    return maxVersion + 1;
                }
            }
            return 1;
        } catch (error) {
            console.error('Error checking file versions:', error);
            return 1;
        }
    };

    const checkFileExists = async (folderId, fileName) => {
        try {
            const siteId = authoritativeSiteId;
            if (!siteId || !folderId) return { exists: false, file: null };

            const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
            const files = response?.document?.files || [];
            const baseName = fileName.split('.')[0];
            const existingFile = files.find(file =>
                file.name && file.name.startsWith(baseName)
            );

            return {
                exists: !!existingFile,
                file: existingFile || null
            };
        } catch (error) {
            console.error('Error checking file existence:', error);
            return { exists: false, file: null };
        }
    };

    const fetchInspectionData = async () => {
        try {
            if (!checkId) return;

            if (isInternalUserTaggedWithSite && users.length === 0) {
                await getUsers();
            }

            const apiData = await get(`/api/site-check/generic-inspection/${checkId}`);
            if (apiData && apiData.length > 0) {
                const mostRecentItem = apiData[apiData.length - 1];
                const selectedAsset = siteAssets.find(
                    (asset) => asset.assetId === mostRecentItem.assetId
                );

                const clientUser = users.find(
                    (user) => user.id === mostRecentItem.client
                );
                const engineerUser = users.find(
                    (user) => String(user.id) === String(mostRecentItem.engineer)
                );
                const siteContactUser = users.find(
                    (user) => user.id === mostRecentItem.siteContact
                );

                const savedEngineerId = mostRecentItem.engineer || null;
                setLastEngineerId(savedEngineerId);
                const isCurrentOpenInspection =
                    effectiveCheckStatus === "Open" &&
                    isCurrentUkInspectionDate(mostRecentItem.inspectionDate);

                // Load pre-inspection photos without overwriting existing ones
                const newPrePhotos = [];
                if (mostRecentItem.param2Remark) {
                    newPrePhotos.push({
                        url: `${mostRecentItem.param2Remark}${mostRecentItem.param2Remark.includes('?') ? '&' : '?'}${sasToken}`,
                        paramKey: 'param2Remark'
                    });
                }
                if (mostRecentItem.param3Remark) {
                    newPrePhotos.push({
                        url: `${mostRecentItem.param3Remark}${mostRecentItem.param3Remark.includes('?') ? '&' : '?'}${sasToken}`,
                        paramKey: 'param3Remark'
                    });
                }

                // Load post-inspection photos without overwriting existing ones
                const newPostPhotos = [];
                if (mostRecentItem.param4Remark) {
                    newPostPhotos.push({
                        url: `${mostRecentItem.param4Remark}${mostRecentItem.param4Remark.includes('?') ? '&' : '?'}${sasToken}`,
                        paramKey: 'param4Remark'
                    });
                }
                if (mostRecentItem.param5Remark) {
                    newPostPhotos.push({
                        url: `${mostRecentItem.param5Remark}${mostRecentItem.param5Remark.includes('?') ? '&' : '?'}${sasToken}`,
                        paramKey: 'param5Remark'
                    });
                }

                // Only update photos if we have new ones
                if (newPrePhotos.length > 0) {
                    setUploadedPrePhotos(prev => [
                        ...prev.filter(p => !newPrePhotos.some(np => np.paramKey === p.paramKey)),
                        ...newPrePhotos
                    ]);
                }

                if (newPostPhotos.length > 0) {
                    setUploadedPostPhotos(prev => [
                        ...prev.filter(p => !newPostPhotos.some(np => np.paramKey === p.paramKey)),
                        ...newPostPhotos
                    ]);
                }

                // Fetch action data if actionId exists
                let existingAction = null;
                if (mostRecentItem.actionId) {
                    existingAction = await fetchActionById(mostRecentItem.actionId);
                    if (existingAction) {
                        setExistingAction(existingAction);
                        setActionRaised(true);
                    }
                }

                setFormData((prev) => ({
                    ...prev,
                    address: prev.address,
                    assetId: mostRecentItem.assetId || prev.assetId,
                    siteContact: mostRecentItem.siteContact || prev.siteContact,
                    inspectionDate: effectiveCheckStatus === "Open" ? getUkLocalDate() : (mostRecentItem.inspectionDate || prev.inspectionDate),
                    siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
                    job: mostRecentItem.job || prev.job,
                    manufacturer: mostRecentItem.manufacturer || prev.manufacturer,
                    modelNumber: mostRecentItem.modelNumber || prev.modelNumber,
                    position: mostRecentItem.position || prev.position,
                    floor: mostRecentItem.floor || prev.floor,
                    room: mostRecentItem.room || prev.room,
                    serialNo: mostRecentItem.serialNo || prev.serialNo,
                    report: mostRecentItem.report || prev.report,
                    param1: mostRecentItem.param1 || prev.param1,
                    param2: mostRecentItem.param2 || prev.param2,
                    param3: mostRecentItem.param3 || prev.param3,
                    param4: mostRecentItem.param4 || prev.param4,
                    param5: mostRecentItem.param5 || prev.param5,
                    param2Remark: mostRecentItem.param2Remark || prev.param2Remark,
                    param3Remark: mostRecentItem.param3Remark || prev.param3Remark,
                    param4Remark: mostRecentItem.param4Remark || prev.param4Remark,
                    param5Remark: mostRecentItem.param5Remark || prev.param5Remark,
                    client: mostRecentItem.client || "",
                    // OLD: always used saved/logged-in Engineer with no Open/Done distinction.
                    // NEW: same Open/Done rules as Air Conditioning.
                    engineer: effectiveCheckStatus === "Open"
                        ? (isCurrentOpenInspection ? (savedEngineerId || loggedInUserData?.id || "") : (loggedInUserData?.id || ""))
                        : (savedEngineerId || prev.engineer || ""),
                    user: effectiveCheckStatus === "Open"
                        ? (isCurrentOpenInspection ? (engineerUser || loggedInUserData || {}) : (loggedInUserData || {}))
                        : (engineerUser || prev.user || {}),
                    selectedAsset: selectedAsset || prev.selectedAsset,
                    signedDate: effectiveCheckStatus === "Open" ? getUkLocalDate() : (mostRecentItem.signedDate || prev.signedDate),
                    clientUser: clientUser || null,
                    siteContactUser: siteContactUser || null,
                    actionId: mostRecentItem.actionId || null,
                }));
            }
        } catch (error) {
            console.error("Error fetching inspection data:", error);
            toast.error("Failed to load inspection data");
        }
    };

    const fetchActionById = async (id) => {
        try {
            if (!id) return null;
            const response = await get(`/api/site/actions/id/${id}`);
            return response;
        } catch (error) {
            console.error("Error fetching action:", error);
            return null;
        }
    };

    const fetchExistingActions = async () => {
        try {
            if (formData.actionId) {
                const action = await fetchActionById(formData.actionId);
                if (action && action.checkId === currentCheckId) {
                    setExistingAction(action);
                    setActionRaised(true);
                    return;
                }
                setFormData(prev => ({ ...prev, actionId: null }));
            }

            if (!authoritativeSiteId || !currentCheckId) return;

            const response = await get(`/api/site/actions/${authoritativeSiteId}`);
            if (response && response.length > 0) {
                const relevantActions = response.filter(action =>
                    action.checkId === currentCheckId
                );

                if (relevantActions.length > 0) {
                    const mostRecentAction = relevantActions.sort((a, b) =>
                        new Date(b.createdAt) - new Date(a.createdAt)
                    )[0];

                    setExistingAction(mostRecentAction);
                    setActionRaised(true);
                    setFormData(prev => ({
                        ...prev,
                        actionId: mostRecentAction.actionId
                    }));
                }
            }
        } catch (error) {
            console.error("Error fetching existing actions:", error);
        }
    };

    const fetchFolderStructure = async (siteId) => {
        try {
            const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

            if (parentFoldersResponse?.parentFolders?.length > 0) {
                const logBooksFolder = parentFoldersResponse.parentFolders.find(
                    folder => folder.name === '6 - Log Books'
                );

                if (logBooksFolder) {
                    const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

                    if (logBooksResponse?.document?.childFolders) {
                        const plantAndEquipmentFolder = logBooksResponse.document.childFolders.find(
                            folder => folder.name === 'Fire Log Book'
                        );

                        if (plantAndEquipmentFolder) {
                            const plantAndEquipmentResponse = await get(
                                `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
                            );

                            if (plantAndEquipmentResponse?.document?.childFolders) {
                                const miscellaneousFolder = plantAndEquipmentResponse.document.childFolders.find(
                                    folder => folder.name === 'Fire Equipment (Other)'
                                );

                                if (miscellaneousFolder) {
                                    const miscResponse = await get(
                                        `/api/document/parent/${miscellaneousFolder.id}/folders?siteId=${siteId}`
                                    );

                                    if (miscResponse?.document?.childFolders) {
                                        const sounderAudibilityFolder = miscResponse.document.childFolders.find(
                                            folder => folder.name === 'Fire Damper Test'
                                        );

                                        setFolderIds({
                                            logBooks: logBooksFolder.id,
                                            plantAndEquipment: plantAndEquipmentFolder.id,
                                            miscellaneousService: miscellaneousFolder.id,
                                            sounderAudibility: sounderAudibilityFolder?.id || null
                                        });

                                        return sounderAudibilityFolder?.id || null;
                                    }
                                }
                            }
                        }
                    }
                }
            }
            return null;
        } catch (error) {
            console.error('Error fetching folder structure:', error);
            toast.error('Failed to load document folders');
            return null;
        }
    };

    useEffect(() => {
        const fetchSiteCheckData = async () => {
            try {
                if (!authoritativeSiteId) return;

                const response = await get(`/api/site-check/site/${authoritativeSiteId}`);
                if (response && response.length > 0) {
                    let ventilationCheck = checkId
                        ? response.find(check => check.checkId === parseInt(checkId, 10))
                        : null;

                    if (ventilationCheck) {
                        setCurrentCheckId(ventilationCheck.checkId);
                        setCheckStatus(ventilationCheck.status);

                        const isDone = ventilationCheck.status === 'Done';
                        setIsFormEditable(!isDone);
                        setIsSubmitted(isDone);
                        setShowPdfButton(isDone);

                        const inspectionDetails = {
                            checkId: ventilationCheck.checkId,
                            siteId: ventilationCheck.siteId,
                            type: ventilationCheck.type,
                            subType: ventilationCheck.subType,
                            category: ventilationCheck.category,
                            dueDate: ventilationCheck.dueDate,
                            status: ventilationCheck.status
                        };
                        setInspectionDetails(inspectionDetails);
                    } else {
                        setCurrentCheckId(checkId ? parseInt(checkId, 10) : null);
                        setIsFormEditable(true);
                        setIsSubmitted(false);
                        setShowPdfButton(false);
                    }
                }
            } catch (error) {
                console.error('Error fetching site check data:', error);
                toast.error('Failed to load site check status');
                setIsFormEditable(true);
            }
        };

        if (isInternalUserTaggedWithSite && users.length === 0) {
            getUsers();
        }

        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (authoritativeSiteId) {
                    await getSiteAssets(authoritativeSiteId);
                    await getSiteDetailsById(authoritativeSiteId);
                    await fetchFolderStructure(authoritativeSiteId);
                    await fetchSiteCheckData();
                    await fetchInspectionData();

                    if (formData.actionId) {
                        const action = await fetchActionById(formData.actionId);
                        if (action) {
                            setExistingAction(action);
                            setActionRaised(true);
                        } else {
                            await fetchExistingActions();
                        }
                    } else {
                        await fetchExistingActions();
                    }

                    const currentSite = sites.find(
                        (site) => site.siteId === authoritativeSiteId
                    );
                    const siteData = currentSite || siteSelectedForGlobal;

                    if (siteData) {
                        const addressParts = [
                            siteData.address1,
                            siteData.address2,
                            siteData.city,
                            siteData.area,
                            siteData.postCode,
                            siteData.country,
                        ].filter((part) => part && part.trim() !== "");

                        const fullAddress = addressParts.join(", ");
                        setFormData((prev) => ({ ...prev, address: fullAddress }));
                    }

                    if (siteSelectedForGlobal.siteContact) {
                        setFormData((prev) => ({
                            ...prev,
                            siteContact: siteSelectedForGlobal.siteContact.name || "",
                            siteContactNo: siteSelectedForGlobal.siteContact.phone || "",
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching site data:", error);
                toast.error("Failed to load site details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [
        siteSelectedForGlobal,
        getSiteAssets,
        users.length,
        isInternalUserTaggedWithSite,
        getUsers,
        checkId,
    ]);

    useEffect(() => {
        const showRisk = (formData.param1 === "Fail" && formData.param2 === "Fail" && formData.param3 === "Fail" && formData.param4 === "Pass");
        setShowRiskAssessment(showRisk);

        const isActionValid = existingAction && existingAction.checkId === currentCheckId;
        setActionRaised(isActionValid);
    }, [formData.param2, currentCheckId, existingAction, formData.param1, formData.param3, formData.param4]);

    const dateFormat = (date) => {
        return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
    }

    const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().replace('T', ' ').split('.')[0];
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

    const savePdfToLocal = async (pdfBlob, fileName) => {
        try {
            const url = URL.createObjectURL(pdfBlob);
            const a = document.createElement('a');
            a.href = url;
            a.download = fileName;
            document.body.appendChild(a);
            a.click();
            setTimeout(() => {
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }, 100);
            return true;
        } catch (error) {
            console.error('Error saving PDF locally:', error);
            return false;
        }
    };

    const handleRiskAssessmentComplete = async (actionResponse) => {
        try {
            if (!actionResponse?.actionId) {
                throw new Error("Invalid action response received");
            }

            const verifiedAction = await fetchActionById(actionResponse.actionId);
            if (!verifiedAction || verifiedAction.checkId !== currentCheckId) {
                throw new Error("Action was not properly linked to this inspection");
            }

            setExistingAction(verifiedAction);
            setActionRaised(true);

            setFormData(prev => ({
                ...prev,
                actionId: verifiedAction.actionId
            }));

            if (currentCheckId) {
                const inspectionPayload = {
                    ...formData,
                    assetId: formData.selectedAsset?.assetId || formData.assetId,
                    siteContact: formData.siteContactUser?.id || formData.siteContact,
                    client: formData.clientUser?.id || formData.client,
                    engineer: formData.engineer,
                    user: formData.user,
                    actionId: verifiedAction.actionId,
                    checkId: currentCheckId,
                    siteId: authoritativeSiteId,
                    type: 'Inspection',
                    subType: 'Ventilation',
                    category: 'Ventilation',
                };

                const existingInspections = await get(`/api/site-check/generic-inspection/${currentCheckId}`);
                if (existingInspections?.length > 0) {
                    await put(`/api/site-check/generic-inspection/${currentCheckId}`, inspectionPayload);
                } else {
                    await post(`/api/site-check/generic-inspection`, inspectionPayload);
                }

                toast.success(`Action #${verifiedAction.actionId} successfully linked to inspection`);
            }
        } catch (error) {
            console.error("Error handling risk assessment completion:", error);
            toast.error(error.message || "Failed to process action completion");
            setActionRaised(false);
            setExistingAction(null);
            setFormData(prev => ({ ...prev, actionId: null }));
        }
    };

    const handlePrePhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingPrePhotos(true);

        try {
            // Determine available parameters
            const availableParams = [];
            if (!formData.param2Remark) availableParams.push('param2Remark');
            if (!formData.param3Remark) availableParams.push('param3Remark');

            const filesToUpload = files.slice(0, availableParams.length);
            const token = sasToken || await getSasToken();

            const uploadResults = await Promise.all(
                filesToUpload.map(async (file, index) => {
                    const response = await uploadSiteCheckDoc({
                        siteId: authoritativeSiteId || 0,
                        file: file
                    });

                    const baseUrl = response?.url ||
                        `https://stccpman.blob.core.windows.net/site-images/${encodeURIComponent(file.name)}`;

                    const imageUrl = `${baseUrl}?${token}`;

                    return {
                        url: imageUrl,
                        baseUrl: baseUrl,
                        paramKey: availableParams[index],
                        fileName: file.name,
                        documentId: response?.documentId || uuidv4()
                    };
                })
            );

            // Update form data with new pre-inspection photo URLs
            const newFormData = {
                ...formData,
                param2Remark: uploadResults[0]?.url || formData.param2Remark,
                param3Remark: uploadResults[1]?.url || formData.param3Remark
            };

            setFormData(newFormData);

            // Update pre-inspection photos state while preserving existing ones
            setUploadedPrePhotos(prev => [
                ...prev.filter(photo => !uploadResults.some(newPhoto => newPhoto.paramKey === photo.paramKey)),
                ...uploadResults
            ].slice(0, 2));

            // Save to API - only update the pre-inspection fields
            if (currentCheckId) {
                const payload = {
                    checkId: currentCheckId,
                    siteId: authoritativeSiteId,
                    type: 'Inspection',
                    subType: 'Fire Damper',
                    category: 'Fire Damper Inspection',
                    param2Remark: newFormData.param2Remark,
                    param3Remark: newFormData.param3Remark
                };

                const existingInspections = await get(`/api/site-check/generic-inspection/${currentCheckId}`);
                if (existingInspections?.length > 0) {
                    await put(`/api/site-check/generic-inspection/${currentCheckId}`, payload);
                } else {
                    await post(`/api/site-check/generic-inspection`, payload);
                }
            }

            toast.success("Pre-inspection photos uploaded successfully!");

        } catch (error) {
            console.error("Pre-photo upload error:", error);
            toast.error(error.message || 'Upload failed');
        } finally {
            setUploadingPrePhotos(false);
        }
    };

    const uploadPdfToServer = async (pdfBlob, fileName, inspectionDateOverride) => {
        try {
            setIsUploading(true);
            await savePdfToLocal(pdfBlob, fileName);

            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            const targetFolderId = folderIds.sounderAudibility || null;

            if (!targetFolderId) {
                throw new Error('Could not determine target folder for PDF upload');
            }

            const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);
            const uploadFormData = new FormData();

            if (exists && existingFile) {
                uploadFormData.append('file', pdfFile);
                const documentRequestString = {
                    folderId: targetFolderId,
                    files: [{
                        id: existingFile.id,
                        name: fileName,
                        originalFileName: fileName,
                        fileVersion: existingFile.fileVersion + 1,
                        siteId: authoritativeSiteId || 0,
                        issueDate: formatDateForBackend(inspectionDateOverride || formData.inspectionDate),
                        expiryDate: formatDateForBackend(calculateExpiryDate(inspectionDateOverride || formData.inspectionDate, inspectionDetails?.repeatFrequency)),
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: `FD-${new Date().getTime()}`
                    }]
                };

                uploadFormData.append('documentRequestString', JSON.stringify(documentRequestString));
                const response = await axios({
                    method: 'put',
                    url: '/api/document/file/newVersion/upload',
                    data: uploadFormData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`,
                        'Accept': 'application/json'
                    }
                });

                if (response.data) {
                    toast.success(`PDF uploaded successfully as version ${documentRequestString.fileVersion}!`);
                    return true;
                }
            } else {
                uploadFormData.append('files', pdfFile);
                const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

                const documentRequestString = {
                    folderId: targetFolderId,
                    files: [{
                        name: fileName.split('.')[0],
                        issueDate: formatDateForBackend(inspectionDateOverride || formData.inspectionDate),
                        expiryDate: formatDateForBackend(calculateExpiryDate(inspectionDateOverride || formData.inspectionDate, inspectionDetails?.repeatFrequency)),
                        note: 'Fire Damper Inspection Report',
                        fileVersion: fileVersion,
                        siteId: authoritativeSiteId || 0,
                        originalFileName: fileName,
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: `FD-${new Date().getTime()}`
                    }]
                };

                uploadFormData.append('documentRequestString', JSON.stringify(documentRequestString));
                const response = await axios({
                    method: 'post',
                    url: '/api/document/files/upload',
                    data: uploadFormData,
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });

                if (response.data) {
                    toast.success(`PDF uploaded successfully as version ${fileVersion}!`);
                    return true;
                }
            }

            throw new Error('Upload failed: No response data');
        } catch (error) {
            console.error('Error uploading PDF:', error);
            toast.error(`PDF upload failed: ${error.response?.data?.message || error.message}`);
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const generatePDF = async (uploadToServer = true, inspectionDateOverride) => {
        try {
            setIsGeneratingPDF(true);

            if (!PDFLib) {
                PDFLib = await import('pdf-lib');
            }

            const pdfBytes = await fetchPdfTemplate();
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
            const form = pdfDoc.getForm();

            const setTextField = (fieldName, value, fontSize = 10) => {
                try {
                    const field = form.getTextField(fieldName);
                    if (field) {
                        field.setText(value || '');
                        try {
                            if (field.setFontSize) {
                                field.updateAppearances(helveticaFont);
                                field.setFontSize(fontSize);
                            }
                        } catch (e) {
                            console.warn(`Could not set font size for ${fieldName}:`, e);
                        }
                    }
                } catch (error) {
                    console.warn(`Error setting text field ${fieldName}:`, error);
                }
            };

            const embedUniversalImage = async (imageBytes) => {
                try {
                    return await pdfDoc.embedPng(imageBytes);
                } catch (pngError) {
                    console.log('Not a PNG, trying JPEG...');
                    try {
                        return await pdfDoc.embedJpg(imageBytes);
                    } catch (jpgError) {
                        console.log('Not a JPEG, trying fallback methods...');
                        try {
                            const imageBlob = new Blob([imageBytes]);
                            const img = await createImageBitmap(imageBlob);
                            const canvas = document.createElement('canvas');
                            canvas.width = img.width;
                            canvas.height = img.height;
                            const ctx = canvas.getContext('2d');
                            ctx.drawImage(img, 0, 0);
                            const pngDataUrl = canvas.toDataURL('image/png');
                            const pngResponse = await fetch(pngDataUrl);
                            const pngBytes = await pngResponse.arrayBuffer();
                            return await pdfDoc.embedPng(pngBytes);
                        } catch (finalError) {
                            console.error('All image embedding attempts failed:', finalError);
                            throw new Error('Could not embed image in any supported format');
                        }
                    }
                }
            };

            const setCheckbox = (fieldName, isChecked) => {
                try {
                    const field = form.getCheckBox(fieldName);
                    if (field) {
                        field.check(isChecked);
                    }
                } catch (error) {
                    console.warn(`Error setting checkbox ${fieldName}:`, error);
                }
            };

            const smallFont = 8;
            const mediumFont = 10;

            setTextField('Date', dateFormat(inspectionDateOverride || formData.inspectionDate), smallFont);

            const equipmentDetails = formData.selectedAsset ? [
                selectedAsset.position,
                selectedAsset.manufacturer,
                selectedAsset.assetName,
                selectedAsset.floor,
                selectedAsset.room,
                `Asset No-${formData.assetId}`,
            ].filter(Boolean).join(' - ') : 'Not specified';

            setTextField('DamperNo', selectedAsset.deviceId || '', smallFont);
            setTextField('Damper Location', equipmentDetails || '', smallFont);
            setTextField('Floor', selectedAsset.floor || '', smallFont);
            setTextField('Damper Type', selectedAsset.subCategory3 || '', smallFont);
            setTextField('Damper Size', selectedAsset?.damperSize.toString() || '', smallFont);

            setTextField('Operational', formData.param1 === 'Pass' ? 'Pass' : 'Fail', mediumFont);
            setTextField('Condition', formData.param2 === 'Pass' ? 'Pass' : 'Fail', mediumFont);
            setTextField('DamperBarrier', formData.param3 === 'Pass' ? 'Yes' : 'No', mediumFont);
            setTextField('FireRequired', formData.param4 === 'Pass' ? 'Yes' : 'No', mediumFont);
            setTextField('DuctworkContamination', formData.param5 === 'Pass' ? 'Yes' : 'No', mediumFont);

            setTextField('report', formData.report || '', mediumFont);

            const imageFields = [
                { pdfField: 'param2Remark_af_image', formField: 'param2Remark' },
                { pdfField: 'param3Remark_af_image', formField: 'param3Remark' },
                { pdfField: 'param4Remark_af_image', formField: 'param4Remark' },
                { pdfField: 'param5Remark_af_image', formField: 'param5Remark' }
            ];

            for (const { pdfField, formField } of imageFields) {
                const imageUrl = formData[formField];
                if (!imageUrl) {
                    console.log(`No image URL found for ${formField}`);
                    continue;
                }

                try {
                    const cleanUrl = imageUrl.split('?')[0];
                    const imageUrlWithToken = `${cleanUrl}?${sasToken}`;
                    console.log(`Processing image from: ${imageUrlWithToken}`);

                    const controller = new AbortController();
                    const timeout = setTimeout(() => controller.abort(), 10000);

                    const imageResponse = await fetch(imageUrlWithToken, {
                        signal: controller.signal
                    });
                    clearTimeout(timeout);

                    if (!imageResponse.ok) {
                        console.error(`HTTP error for ${formField}: ${imageResponse.status}`);
                        continue;
                    }

                    const imageBytes = await imageResponse.arrayBuffer();

                    if (imageBytes.byteLength < 100) {
                        console.error(`Image too small or corrupted for ${formField}`);
                        continue;
                    }

                    const image = await embedUniversalImage(imageBytes);
                    console.log(`Successfully embedded image for ${formField}`);

                    const imageField = form.getButton(pdfField);
                    if (!imageField) {
                        console.error(`PDF field ${pdfField} not found`);
                        continue;
                    }

                    imageField.setImage(image);
                    console.log(`Image set in field ${pdfField}`);

                } catch (error) {
                    console.error(`Error processing ${formField} image:`, error);
                }
            }

            form.flatten();
            const pdfBytesModified = await pdfDoc.save();
            const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
            const fileName = `FireDamper_${selectedAsset?.assetName || 'report'}.pdf`;

            setGeneratedPdfBlob(blob);
            setShowPdfButton(true);

            if (uploadToServer) {
                await uploadPdfToServer(blob, fileName, inspectionDateOverride);
            }

            toast.success('PDF generated successfully!');
            return { success: true, fileName };

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF: ' + error.message);
            return { success: false, error: error.message };
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handlePostPhotoUpload = async (e) => {
        const files = Array.from(e.target.files);
        if (files.length === 0) return;

        setUploadingPostPhotos(true);

        try {
            // Determine available parameters
            const availableParams = [];
            if (!formData.param4Remark) availableParams.push('param4Remark');
            if (!formData.param5Remark) availableParams.push('param5Remark');

            const filesToUpload = files.slice(0, availableParams.length);
            const token = sasToken || await getSasToken();

            const uploadResults = await Promise.all(
                filesToUpload.map(async (file, index) => {
                    const response = await uploadSiteCheckDoc({
                        siteId: authoritativeSiteId || 0,
                        file: file
                    });

                    const baseUrl = response?.url ||
                        `https://stccpman.blob.core.windows.net/site-images/${encodeURIComponent(file.name)}`;

                    const imageUrl = `${baseUrl}?${token}`;

                    return {
                        url: imageUrl,
                        baseUrl: baseUrl,
                        paramKey: availableParams[index],
                        fileName: file.name,
                        documentId: response?.documentId || uuidv4()
                    };
                })
            );

            // Update form data with new post-inspection photo URLs
            const newFormData = {
                ...formData,
                param4Remark: uploadResults[0]?.url || formData.param4Remark,
                param5Remark: uploadResults[1]?.url || formData.param5Remark
            };

            setFormData(newFormData);

            // Update post-inspection photos state while preserving existing ones
            setUploadedPostPhotos(prev => [
                ...prev.filter(photo => !uploadResults.some(newPhoto => newPhoto.paramKey === photo.paramKey)),
                ...uploadResults
            ].slice(0, 2));

            // Save to API - only update the post-inspection fields
            if (currentCheckId) {
                const payload = {
                    checkId: currentCheckId,
                    siteId: authoritativeSiteId,
                    type: 'Inspection',
                    subType: 'Fire Damper',
                    category: 'Fire Damper Inspection',
                    param4Remark: newFormData.param4Remark,
                    param5Remark: newFormData.param5Remark
                };

                const existingInspections = await get(`/api/site-check/generic-inspection/${currentCheckId}`);
                if (existingInspections?.length > 0) {
                    await put(`/api/site-check/generic-inspection/${currentCheckId}`, payload);
                } else {
                    await post(`/api/site-check/generic-inspection`, payload);
                }
            }

            toast.success("Post-inspection photos uploaded successfully!");

        } catch (error) {
            console.error("Post-photo upload error:", error);
            toast.error(error.message || 'Upload failed');
        } finally {
            setUploadingPostPhotos(false);
        }
    };

    const handleRemovePrePhoto = (index) => {
        const photoToRemove = uploadedPrePhotos[index];

        setUploadedPrePhotos(prev => prev.filter((_, i) => i !== index));

        if (photoToRemove.paramKey) {
            setFormData(prev => ({
                ...prev,
                [photoToRemove.paramKey]: ""
            }));
        }

        if (currentCheckId && photoToRemove.paramKey) {
            const payload = {
                checkId: currentCheckId,
                siteId: authoritativeSiteId,
                type: 'Inspection',
                subType: 'Fire Damper',
                category: 'Fire Damper Inspection',
                [photoToRemove.paramKey]: ""
            };

            put(`/api/site-check/generic-inspection/${currentCheckId}`, payload)
                .catch(error => {
                    console.error("Error removing pre-photo from API:", error);
                    toast.error("Failed to update photo in database");
                });
        }
    };

    const handleRemovePostPhoto = (index) => {
        const photoToRemove = uploadedPostPhotos[index];

        setUploadedPostPhotos(prev => prev.filter((_, i) => i !== index));

        if (photoToRemove.paramKey) {
            setFormData(prev => ({
                ...prev,
                [photoToRemove.paramKey]: ""
            }));
        }

        if (currentCheckId && photoToRemove.paramKey) {
            const payload = {
                checkId: currentCheckId,
                siteId: authoritativeSiteId,
                type: 'Inspection',
                subType: 'Fire Damper',
                category: 'Fire Damper Inspection',
                [photoToRemove.paramKey]: ""
            };

            put(`/api/site-check/generic-inspection/${currentCheckId}`, payload)
                .catch(error => {
                    console.error("Error removing post-photo from API:", error);
                    toast.error("Failed to update photo in database");
                });
        }
    };

    const handleAssetSelect = (event, newValue) => {
        setFormData((prev) => ({
            ...prev,
            selectedAsset: newValue || null,
            manufacturer: newValue?.manufacturer || "",
            modelNumber: newValue?.model || "",
            position: newValue?.position || "",
            floor: newValue?.floor || "",
            room: newValue?.room || "",
            serialNo: newValue?.serialNumber || "",
            assetId: newValue?.assetId || "",
            damperSize: newValue?.damperSize || "" // Add this line
        }));
    };

    const handleEngineerSelect = (event, newValue) => {
        setFormData((prev) => ({
            ...prev,
            engineer: newValue?.id || "",
            user: newValue || {},
        }));
        setValidationErrors((prev) => ({ ...prev, engineer: "" }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        if (isLoading) {
            console.log('Submit prevented: Already loading');
            return;
        }

        const hasFailures = (
            formData.param1 === "Fail" &&
            formData.param2 === "Fail" &&
            formData.param3 === "Fail" &&
            formData.param4 === "Pass"
        );

        if (hasFailures && !actionRaised) {
            toast.error("Please complete the risk assessment before submitting");
            return;
        }

        if (!isFormEditable) {
            console.log('Submit prevented: Form is not editable');
            return;
        }

        const errors = {};
        if (!formData.engineer || !selectedEngineer) {
            errors.engineer = "Please select an active engineer for this Site Check.";
        }

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setValidationErrors({});
        setIsLoading(true);

        try {

            let existingInspection = null;
            if (currentCheckId) {
                try {
                    const inspections = await get(`/api/site-check/generic-inspection/${currentCheckId}`);
                    existingInspection = inspections?.length > 0 ? inspections[0] : null;
                } catch (error) {
                    console.error('Error checking for existing inspection:', error);
                }
            }

            const statusPayload = {
                siteId: authoritativeSiteId,
                type: siteCheck?.type || 'Inspection',
                // OLD: Plant and Equipment Inspection / Ventilation changed the original route.
                // NEW: preserve Passive Fire / Passive Fire - Fire Damper Inspection.
                subType: siteCheck?.subType || subType || 'Passive Fire',
                category: siteCheck?.category || category || 'Passive Fire - Fire Damper Inspection',
                status: 'Done',
                startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
                dueDate: formatDateForBackend(calculateExpiryDate(formData.inspectionDate, inspectionDetails?.repeatFrequency)),
                leadUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0',
                assistantUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0'
            };

            let statusResponse;
            if (currentCheckId) {
                statusPayload.checkId = parseInt(currentCheckId, 10);
                statusResponse = await put(
                    `/api/site-check/${currentCheckId}`,
                    statusPayload
                );
            } else {
                statusResponse = await post(
                    `/api/site-check`,
                    statusPayload
                );
                if (statusResponse?.checkId) {
                    setCurrentCheckId(statusResponse.checkId);
                }
            }

            if (![200, 201, 204].includes(statusResponse?.status)) {
                throw new Error('Failed to update site check status');
            }

            console.log('Site check status updated successfully:', statusResponse.data);
            setCheckStatus('Done');
            setIsFormEditable(false);

            const inspectionPayload = {
                ...formData,
                siteId: authoritativeSiteId,
                inspectionDate: formData.inspectionDate,
                signedDate: formData.signedDate,
                assetId: formData.selectedAsset?.assetId || formData.assetId || null,
                client: formData.clientUser?.id || formData.client,
                engineer: formData.engineer,
                siteContact: formData.siteContactUser?.id || formData.siteContact,
                type: 'Inspection',
                subType: 'Ventilation',
                category: 'Ventilation',
                checkId: currentCheckId || statusResponse?.checkId,
                actionId: formData.actionId,
            };

            let saveResponse;
            if (existingInspection) {
                saveResponse = await put(
                    `/api/site-check/generic-inspection/${currentCheckId}`,
                    inspectionPayload
                );
            } else {
                saveResponse = await post(
                    `/api/site-check/generic-inspection`,
                    inspectionPayload
                );
            }

            if (![200, 201, 204].includes(saveResponse?.status)) {
                throw new Error('Failed to save inspection data');
            }

            console.log('Inspection data saved successfully:', saveResponse.data);

            const pdfResult = await generatePDF(true);
            if (!pdfResult.success) {
                throw new Error(pdfResult.error || "Failed to generate PDF");
            }

            toast.success("Fire Damper report saved and PDF generated successfully!");
            setShowPdfButton(true);
            setIsSubmitted(true);

            setTimeout(() => {
                navigate(-1);
            }, 1500);

        } catch (error) {
            console.error('Error in form submission:', error);
            console.error('Error details:', error.response?.data || error.message);
            toast.error(error.message || 'Failed to submit form');
        } finally {
            setIsLoading(false);
        }
    };

    const filteredAssets =
        siteAssets?.filter(
            (asset) =>
                asset.category === "Mechanical" &&
                asset.subCategory === "Ventilation" &&
                asset.subCategory2 === "Damper"
        ) || [];

    return (
        <div className="container mt-4 mb-5">
            <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
                <h4 className="mb-0">FIRE DAMPER INSPECTION CERTIFICATE</h4>
            </div>
            {!isFormEditable && (
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    This form is read-only because the check has been marked as completed.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                    <div className="col-md-3">
                        <div className="mb-3">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="inspectionDate"
                                value={formatDate(formData.inspectionDate)}
                                onChange={handleInputChange}
                                required
                                style={{
                                    height: "40px",
                                    padding: "0 10px",
                                    width: "100%",
                                }}
                                disabled={isSubmitted}
                            />
                        </div>
                    </div>
                    <div className="col-md-5">
                        {/* OLD: Fire Damper stored engineer in the payload but had no Engineer UI field. */}
                        {/* NEW: shared Engineer selector using the approved Air Conditioning rules. */}
                        <SiteCheckEngineerSelector
                            options={engineerOptions}
                            value={selectedEngineer}
                            onChange={handleEngineerSelect}
                            isOpen={effectiveCheckStatus === "Open"}
                            disabled={isSubmitted || !isFormEditable}
                            loading={isLoadingEngineers}
                            error={validationErrors.engineer || engineerLoadError}
                        />
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Device Information</h5>
                    </div>
                    <div className="card-body">
                        <div className="row mb-4">
                            <div className="col-md-12">
                                <Autocomplete
                                    disabled={isSubmitted}
                                    options={filteredAssets}
                                    getOptionLabel={(option) =>
                                        `${option.assetId} - ${option.assetName} (${option.position || "NA"
                                        } > ${option.floor || "NA"} > ${option.room || "NA"})`
                                    }
                                    value={formData.selectedAsset}
                                    onChange={handleAssetSelect}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select a Fire Damper"
                                            variant="outlined"
                                            placeholder="Search devices..."
                                        />
                                    )}
                                    sx={{ width: "100%" }}
                                />
                            </div>
                        </div>

                        {formData.selectedAsset && (
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Damper reference number</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="deviceId"
                                            value={selectedAsset.deviceId}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Damper Location</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={`${selectedAsset.assetName || 'N/A'} - ${selectedAsset.position || 'N/A'} - ${selectedAsset.floor || 'N/A'} - ${selectedAsset.room || 'N/A'}`}
                                            readOnly
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Floor</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="floor"
                                            value={selectedAsset.floor}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Damper Size</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="damperSize"
                                            value={selectedAsset.damperSize}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Damper Type</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="assetId"
                                            value={selectedAsset.subCategory3 || 'N/A'}
                                            onChange={handleInputChange}
                                            required
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Ductwork Contamination</label>
                                        <select
                                            className={`form-select ${validationErrors.param5 ? "is-invalid" : ""
                                            }`}
                                            value={formData.param5}
                                            onChange={(e) => {
                                                setFormData({
                                                    ...formData,
                                                    param5: e.target.value,
                                                });
                                                if (validationErrors.param5) {
                                                    setValidationErrors((prev) => {
                                                        const newErrors = { ...prev };
                                                        delete newErrors.param5;
                                                        return newErrors;
                                                    });
                                                }
                                            }}
                                            disabled={isSubmitted}
                                        >
                                            <option value="">Select</option>
                                            <option value="Pass">Yes</option>
                                            <option value="Fail">No</option>
                                        </select>
                                        {validationErrors.param5 && (
                                            <div className="invalid-feedback">
                                                {validationErrors.param5}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Pre-Inspection Photos</h5>
                        <div>
                            <input
                                type="file"
                                id="pre-photo-upload"
                                multiple
                                accept="image/*"
                                onChange={handlePrePhotoUpload}
                                style={{ display: "none" }}
                                disabled={isSubmitted || uploadingPrePhotos || uploadedPrePhotos.length >= 2 || !isFormEditable}
                            />
                            <label
                                htmlFor="pre-photo-upload"
                                className={`btn btn-sm btn-primary ${(isSubmitted || !isFormEditable || uploadedPrePhotos.length >= 2) ? 'disabled' : ''}`}
                                style={{
                                    cursor: (isSubmitted || !isFormEditable || uploadedPrePhotos.length >= 2) ? 'not-allowed' : 'pointer',
                                    opacity: (isSubmitted || !isFormEditable || uploadedPrePhotos.length >= 2) ? 0.6 : 1
                                }}
                            >
                                {uploadingPrePhotos ? (
                                    <span>Uploading...</span>
                                ) : (
                                    <>
                                        <InsertPhotoIcon fontSize="small" />
                                        Add Pre-Photos ({uploadedPrePhotos.length}/2)
                                    </>
                                )}
                            </label>
                            {uploadedPrePhotos.length >= 2 && (
                                <span className="ms-2 text-danger">Maximum pre-photos reached</span>
                            )}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="photo-preview-container">
                            {uploadedPrePhotos.map((photo, index) => {
                                const imageUrl = photo.url.includes('?')
                                    ? photo.url
                                    : `${photo.url}?${sasToken}`;

                                return (
                                    <div
                                        key={index}
                                        className="position-relative"
                                        style={{
                                            width: "150px",
                                            height: "150px",
                                            display: 'inline-block',
                                            marginRight: '10px',
                                            position: 'relative'
                                        }}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`Pre-inspection ${index + 1}`}
                                            className="img-thumbnail"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/placeholder-image.png';
                                            }}
                                            loading="lazy"
                                        />

                                        {isFormEditable && !isSubmitted && (
                                            <button
                                                type="button"
                                                className="position-absolute top-0 end-0 btn btn-sm btn-danger"
                                                onClick={() => handleRemovePrePhoto(index)}
                                                style={{
                                                    padding: '0.15rem 0.3rem',
                                                    fontSize: '0.7rem',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transform: 'translate(50%, -50%)'
                                                }}
                                                aria-label={`Remove pre-photo ${index + 1}`}
                                            >
                                                ×
                                            </button>
                                        )}

                                        {photo.fileName && (
                                            <div
                                                className="position-absolute bottom-0 start-0 w-100 text-truncate px-1 bg-dark text-white"
                                                style={{
                                                    fontSize: '10px',
                                                    opacity: '0.8',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden'
                                                }}
                                                title={photo.fileName}
                                            >
                                                {photo.fileName}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <h5 className="mb-0">Post-Inspection Photos</h5>
                        <div>
                            <input
                                type="file"
                                id="post-photo-upload"
                                multiple
                                accept="image/*"
                                onChange={handlePostPhotoUpload}
                                style={{ display: "none" }}
                                disabled={isSubmitted || uploadingPostPhotos || uploadedPostPhotos.length >= 2 || !isFormEditable}
                            />
                            <label
                                htmlFor="post-photo-upload"
                                className={`btn btn-sm btn-primary ${(isSubmitted || !isFormEditable || uploadedPostPhotos.length >= 2) ? 'disabled' : ''}`}
                                style={{
                                    cursor: (isSubmitted || !isFormEditable || uploadedPostPhotos.length >= 2) ? 'not-allowed' : 'pointer',
                                    opacity: (isSubmitted || !isFormEditable || uploadedPostPhotos.length >= 2) ? 0.6 : 1
                                }}
                            >
                                {uploadingPostPhotos ? (
                                    <span>Uploading...</span>
                                ) : (
                                    <>
                                        <InsertPhotoIcon fontSize="small" />
                                        Add Post-Photos ({uploadedPostPhotos.length}/2)
                                    </>
                                )}
                            </label>
                            {uploadedPostPhotos.length >= 2 && (
                                <span className="ms-2 text-danger">Maximum post-photos reached</span>
                            )}
                        </div>
                    </div>
                    <div className="card-body">
                        <div className="photo-preview-container">
                            {uploadedPostPhotos.map((photo, index) => {
                                const imageUrl = photo.url.includes('?')
                                    ? photo.url
                                    : `${photo.url}?${sasToken}`;

                                return (
                                    <div
                                        key={index}
                                        className="position-relative"
                                        style={{
                                            width: "150px",
                                            height: "150px",
                                            display: 'inline-block',
                                            marginRight: '10px',
                                            position: 'relative'
                                        }}
                                    >
                                        <img
                                            src={imageUrl}
                                            alt={`Post-inspection ${index + 1}`}
                                            className="img-thumbnail"
                                            style={{
                                                width: "100%",
                                                height: "100%",
                                                objectFit: "cover",
                                                border: '1px solid #ddd',
                                                borderRadius: '4px'
                                            }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = '/placeholder-image.png';
                                            }}
                                            loading="lazy"
                                        />

                                        {isFormEditable && !isSubmitted && (
                                            <button
                                                type="button"
                                                className="position-absolute top-0 end-0 btn btn-sm btn-danger"
                                                onClick={() => handleRemovePostPhoto(index)}
                                                style={{
                                                    padding: '0.15rem 0.3rem',
                                                    fontSize: '0.7rem',
                                                    borderRadius: '50%',
                                                    width: '20px',
                                                    height: '20px',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    transform: 'translate(50%, -50%)'
                                                }}
                                                aria-label={`Remove post-photo ${index + 1}`}
                                            >
                                                ×
                                            </button>
                                        )}

                                        {photo.fileName && (
                                            <div
                                                className="position-absolute bottom-0 start-0 w-100 text-truncate px-1 bg-dark text-white"
                                                style={{
                                                    fontSize: '10px',
                                                    opacity: '0.8',
                                                    textOverflow: 'ellipsis',
                                                    overflow: 'hidden'
                                                }}
                                                title={photo.fileName}
                                            >
                                                {photo.fileName}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Inspection Results</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Operational</label>
                                    <select
                                        className={`form-select ${validationErrors.param1 ? "is-invalid" : ""}`}
                                        value={formData.param1}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                param1: e.target.value,
                                            });
                                            if (validationErrors.param1) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.param1;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        disabled={isSubmitted}
                                    >
                                        <option value="">Select</option>
                                        <option value="Pass">Pass</option>
                                        <option value="Fail">Fail</option>
                                    </select>
                                    {validationErrors.param1 && (
                                        <div className="invalid-feedback">
                                            {validationErrors.param1}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Condition</label>
                                    <select
                                        className={`form-select ${validationErrors.param2 ? "is-invalid" : ""}`}
                                        value={formData.param2}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                param2: e.target.value,
                                            });
                                            if (validationErrors.param2) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.param2;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        disabled={isSubmitted}
                                    >
                                        <option value="">Select</option>
                                        <option value="Pass">Pass</option>
                                        <option value="Fail">Fail</option>
                                    </select>
                                    {validationErrors.param2 && (
                                        <div className="invalid-feedback">
                                            {validationErrors.param2}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Damper Within Fire Barrier</label>
                                    <select
                                        className={`form-select ${validationErrors.param3 ? "is-invalid" : ""}`}
                                        value={formData.param3}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                param3: e.target.value,
                                            });
                                            if (validationErrors.param3) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.param3;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        disabled={isSubmitted}
                                    >
                                        <option value="">Select</option>
                                        <option value="Pass">Yes</option>
                                        <option value="Fail">No</option>
                                    </select>
                                    {validationErrors.param3 && (
                                        <div className="invalid-feedback">
                                            {validationErrors.param3}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Fire Barrier Correction Required</label>
                                    <select
                                        className={`form-select ${validationErrors.param4 ? "is-invalid" : ""}`}
                                        value={formData.param4}
                                        onChange={(e) => {
                                            setFormData({
                                                ...formData,
                                                param4: e.target.value,
                                            });
                                            if (validationErrors.param4) {
                                                setValidationErrors((prev) => {
                                                    const newErrors = { ...prev };
                                                    delete newErrors.param4;
                                                    return newErrors;
                                                });
                                            }
                                        }}
                                        disabled={isSubmitted}
                                    >
                                        <option value="">Select</option>
                                        <option value="Pass">Yes</option>
                                        <option value="Fail">No</option>
                                    </select>
                                    {validationErrors.param4 && (
                                        <div className="invalid-feedback">
                                            {validationErrors.param4}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Inspection Report</h5>
                    </div>
                    <div className="card-body">
                        <div className="mb-3">
                            <label className="form-label">Findings and Recommendations</label>
                            <textarea
                                className="form-control"
                                rows="6"
                                placeholder="Enter detailed inspection findings and recommendations..."
                                value={formData.report || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        report: e.target.value,
                                    })
                                }
                                disabled={isSubmitted}
                            />
                        </div>
                    </div>
                </div>

                {showRiskAssessment && (
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Risk Assessment</h5>
                            {existingAction?.checkId === currentCheckId && (
                                <span className="badge bg-success ms-2">
                                    Action #{existingAction.actionId} - {existingAction.status}
                                </span>
                            )}
                        </div>
                        <div className="card-body">
                            {existingAction?.checkId === currentCheckId ? (
                                <div className="existing-action">
                                    <div className="row">
                                        <div className="col-md-6">
                                            <p><strong>Observation:</strong> {existingAction.observation}</p>
                                            <p><strong>Required Action:</strong> {existingAction.requiredAction}</p>
                                            <p><strong>Risk Score:</strong> {existingAction.riskScore}</p>
                                        </div>
                                        <div className="col-md-6">
                                            <p><strong>Description: </strong> {existingAction.desc}</p>
                                            <p><strong>Due Date:</strong> {formatDate(existingAction.dueDate)}</p>
                                            <p><strong>Status:</strong> {existingAction.status}</p>
                                        </div>
                                    </div>
                                    {existingAction.comments && (
                                        <div className="mt-3">
                                            <h6>Comments:</h6>
                                            <p>{existingAction.comments}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <RiskScoreCard
                                    desc={`Inspection - Passive Fire - Fire Damper Inspection`}
                                    siteId={authoritativeSiteId}
                                    checkId={currentCheckId}
                                    createdBy={loggedInUserData?.id}
                                    taggedAsset={formData.selectedAsset?.assetId}
                                    onRiskAssessmentComplete={handleRiskAssessmentComplete}
                                    actionRaised={actionRaised}
                                    disabled={isSubmitted}
                                    images={[...uploadedPrePhotos, ...uploadedPostPhotos]}
                                />
                            )}
                        </div>
                    </div>
                )}

                {!isSubmitted ? (
                    <div className="d-flex justify-content-between mt-3 print-hide">
                        <button
                            type="button"
                            className="btn btn-secondary"
                            onClick={() => window.history.back()}
                        >
                            Back
                        </button>
                        <div>
                            {isFormEditable && (
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={
                                        isLoading ||
                                        isGeneratingPDF ||
                                        (showRiskAssessment && !actionRaised)
                                    }
                                >
                                    {isLoading ? 'Submitting...' : 'Submit Report'}
                                </button>
                            )}
                        </div>
                    </div>
                ) : (
                    <div className="text-center print-hide">
                        <div className="alert alert-success mb-4">
                            Report submitted successfully on {getUkLocalDate()}
                        </div>
                        {showPdfButton && generatedPdfBlob && (
                            <button
                                className="btn btn-success"
                                onClick={() => savePdfToLocal(generatedPdfBlob, `FireDamperReport_${formData.selectedAsset?.assetName || 'report'}.pdf`)}
                            >
                                Download PDF
                            </button>
                        )}
                    </div>
                )}
            </form>
        </div>
    );
};

const mapStateToProps = (state) => ({
    sites: state.site.sites,
    users: state.site.users,
    siteAssets: state.site.siteAssets,
    siteDetailsById: state.site.siteDetailsById,
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
    loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
    getSiteDetailsById,
    getSiteById,
    getSiteAssets,
    getSites,
    getUsers,
})(FireDamper);