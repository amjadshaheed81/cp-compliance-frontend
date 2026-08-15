import React, { useState, useEffect, useCallback } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { get, post, put } from "../../../../api";
import {
    getSiteAssets,
    getSiteById,
    getSiteDetailsById,
    getSites,
    getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField, CircularProgress, Button } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import { saveAs } from 'file-saver';
import axios from 'axios';
import pdfTemplate from './pdf/Shower Head Cleaning.pdf';
import RiskScoreCard from "./RiskScoreCard";
import { PDFDocument } from 'pdf-lib';
import RiskScoreCard2 from "./RiskScoreCard2";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import { getUkLocalDate, isCurrentUkInspectionDate } from "./shared/siteCheckDateUtils";

const ShowerHeadCertificate = ({
                                   sasToken,
                                   checkId,
                                   subType,
                                   category,
                                   getSiteDetailsById,
                                   siteAssets,
                                   getSiteAssets,
                                   users,
                                   getUsers,
                                   siteSelectedForGlobal,
                                   loggedInUserData,
                                   siteCheck = {},
                               }) => {
    // State initialization
    const [formData, setFormData] = useState({
        address: "",
        assetId: "",
        siteContact: "",
        inspectionDate: getUkLocalDate(),
        siteContactNo: "",
        job: "",
        manufacturer: "",
        location: "",
        param1remark: "",
        param2remark: "",
        client: "",
        user: loggedInUserData || {},
        engineer: loggedInUserData?.id || "",
        selectedAsset: null,
        signedDate: getUkLocalDate(),
        clientUser: null,
        siteContactUser: null,
        actionId: null,
    });

    const [state, setState] = useState({
        isSubmitted: false,
        isLoading: false,
        isGeneratingPDF: false,
        isUploading: false,
        showPdfButton: false,
        checkStatus: 'Open',
        isFormEditable: true,
        actionRaised: false,
        validationErrors: {},
        folderIds: {
            logBooks: null,
            plantAndEquipment: null,
            miscellaneousService: null,
            storageTankService: null
        },
        currentCheckId: checkId || null,
        existingAction: null,
        generatedPdfBlob: null
    });

    const sites = useSelector((state) => state.site.sites);
    const navigate = useNavigate();
    const isInternalUserTaggedWithSite = true;
    const [inspectionDetails, setInspectionDetails] = useState(null);

    // NEW: Use the actual Site Check as the authoritative site/status source.
    const authoritativeSiteId = siteCheck?.siteId
        ? Number(siteCheck.siteId)
        : Number(siteSelectedForGlobal?.siteId) || null;
    const effectiveCheckStatus = siteCheck?.status || state.checkStatus || "Open";
    const [lastEngineerId, setLastEngineerId] = useState(null);

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

    // NEW: Open checks use today's UK date and logged-in user by default.
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

    // Memoized values
    const selectedAsset = React.useMemo(() =>
            siteAssets.find(asset => asset.assetId === formData.assetId),
        [siteAssets, formData.assetId]
    );

    const filteredAssets = React.useMemo(() => {
            // Support both legacy + new asset categorisation:
            // - Legacy: subCategory2 === "Outlet / Shower"
            // - New:    subCategory2 === "Outlet" && subCategory3 === "Shower"
            return (
                siteAssets?.filter((asset) => {
                    if (
                        asset.category !== "Mechanical" ||
                        asset.subCategory !== "Water Services"
                    ) {
                        return false;
                    }

                    const sub2 = (asset.subCategory2 || "").trim();
                    const sub3 = (asset.subCategory3 || "").trim();

                    return (
                        sub2 === "Outlet / Shower" ||
                        (sub2 === "Outlet" && sub3 === "Shower")
                    );
                }) || []
            );
        }, [siteAssets]
    );

    // Event handlers
    const handleAssetSelect = (event, newValue) => {
        setFormData(prev => ({
            ...prev,
            assetId: newValue?.assetId || "",
            selectedAsset: newValue || null,
            manufacturer: newValue?.manufacturer || "",
            location: newValue ? `${newValue.floor || ''} ${newValue.room || ''} ${newValue.position || ''}`.trim() : ""
        }));
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    // API functions
    const fetchFolderStructure = useCallback(async (siteId) => {
        try {
            const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

            const logBooksFolder = parentFoldersResponse?.parentFolders?.find(
                folder => folder.name.trim() === '6 - Log Books'
            );

            if (!logBooksFolder) return null;

            const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);
            const plantAndEquipmentFolder = logBooksResponse?.document?.childFolders?.find(
                folder => folder.name.trim() === 'Water Log Book'
            );

            if (!plantAndEquipmentFolder) return null;

            const plantAndEquipmentResponse = await get(
                `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
            );
            const waterServicesFolder = plantAndEquipmentResponse?.document?.childFolders?.find(
                folder => folder.name.trim() === 'Service & Maintenance'
            );

            if (!waterServicesFolder) return null;

            const waterResponse = await get(
                `/api/document/parent/${waterServicesFolder.id}/folders?siteId=${siteId}`
            );
            const storageTankFolder = waterResponse?.document?.childFolders?.find(
                folder => folder.name.trim() === 'Water : Periodic Shower Head Cleaning'
            );

            setState(prev => ({
                ...prev,
                folderIds: {
                    ...prev.folderIds,
                    logBooks: logBooksFolder.id,
                    plantAndEquipment: plantAndEquipmentFolder.id,
                    waterServices: waterServicesFolder.id,
                    storageTankService: storageTankFolder?.id || null
                }
            }));

            return storageTankFolder?.id || null;
        } catch (error) {
            console.error('Error fetching folder structure:', error);
            toast.error('Failed to load document folders');
            return null;
        }
    }, []);

    const fetchActionById = useCallback(async (actionId) => {
        if (!actionId) return null;
        try {
            return await get(`/api/site/actions/id/${actionId}`);
        } catch (error) {
            console.error("Error fetching action:", error);
            return null;
        }
    }, []);

    const fetchExistingActions = useCallback(async () => {
        try {
            if (formData.actionId) {
                const action = await fetchActionById(formData.actionId);
                if (action?.checkId === state.currentCheckId) {
                    setState(prev => ({
                        ...prev,
                        existingAction: action,
                        actionRaised: true
                    }));
                    return;
                }
                setFormData(prev => ({ ...prev, actionId: null }));
            }

            if (!authoritativeSiteId || !state.currentCheckId) return;

            const response = await get(`/api/site/actions/${authoritativeSiteId}`);
            const relevantActions = response?.filter(action =>
                action.checkId === state.currentCheckId
            );

            if (relevantActions?.length > 0) {
                const mostRecentAction = relevantActions.sort((a, b) =>
                    new Date(b.createdAt) - new Date(a.createdAt)
                )[0];

                setState(prev => ({
                    ...prev,
                    existingAction: mostRecentAction,
                    actionRaised: true
                }));
                setFormData(prev => ({
                    ...prev,
                    actionId: mostRecentAction.actionId
                }));
            }
        } catch (error) {
            console.error("Error fetching existing actions:", error);
        }
    }, [fetchActionById, formData.actionId, siteSelectedForGlobal, state.currentCheckId]);

    // NEW: Restore the saved engineer/date for Done checks, while Open checks
    // keep the Air Conditioning behaviour (today + logged-in engineer unless a
    // same-day temporary Risk Assessment record exists).
    const fetchInspectionData = useCallback(async () => {
        try {
            if (!state.currentCheckId) return;

            const apiData = await get(`/api/site-check/generic-inspection/${state.currentCheckId}`);
            if (!apiData || apiData.length === 0) return;

            const mostRecentItem = apiData[apiData.length - 1];
            const savedEngineerId = mostRecentItem.engineer || null;
            setLastEngineerId(savedEngineerId);

            const engineerUser = users.find(
                (user) => String(user.id) === String(savedEngineerId)
            );
            const clientUser = users.find(
                (user) => String(user.id) === String(mostRecentItem.client)
            );
            const siteContactUser = users.find(
                (user) => String(user.id) === String(mostRecentItem.siteContact)
            );
            const inspectionAsset = siteAssets.find(
                (asset) => String(asset.assetId) === String(mostRecentItem.assetId)
            );

            const isCurrentOpenInspection =
                effectiveCheckStatus === "Open" &&
                isCurrentUkInspectionDate(mostRecentItem.inspectionDate);

            setFormData((prev) => ({
                ...prev,
                assetId: mostRecentItem.assetId || prev.assetId,
                siteContact: mostRecentItem.siteContact || prev.siteContact,
                siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
                job: mostRecentItem.job || prev.job,
                manufacturer: mostRecentItem.manufacturer || prev.manufacturer,
                location: mostRecentItem.location || prev.location,
                param1remark: mostRecentItem.param1remark || prev.param1remark,
                param2remark: mostRecentItem.param2remark || prev.param2remark,
                client: mostRecentItem.client || prev.client,
                engineer: effectiveCheckStatus === "Open"
                    ? (isCurrentOpenInspection
                        ? (savedEngineerId || loggedInUserData?.id || "")
                        : (loggedInUserData?.id || ""))
                    : (savedEngineerId || prev.engineer || ""),
                user: effectiveCheckStatus === "Open"
                    ? (isCurrentOpenInspection
                        ? (engineerUser || loggedInUserData || {})
                        : (loggedInUserData || {}))
                    : (engineerUser || prev.user || {}),
                inspectionDate: effectiveCheckStatus === "Open"
                    ? getUkLocalDate()
                    : (mostRecentItem.inspectionDate || prev.inspectionDate),
                signedDate: effectiveCheckStatus === "Open"
                    ? getUkLocalDate()
                    : (mostRecentItem.signedDate || prev.signedDate),
                selectedAsset: inspectionAsset || prev.selectedAsset,
                clientUser: clientUser || prev.clientUser,
                siteContactUser: siteContactUser || prev.siteContactUser,
                actionId: mostRecentItem.actionId || prev.actionId,
            }));
        } catch (error) {
            console.error("Error fetching shower head inspection data:", error);
            toast.error("Failed to load inspection data");
        }
    }, [
        state.currentCheckId,
        users,
        siteAssets,
        effectiveCheckStatus,
        loggedInUserData,
    ]);

    const fetchSiteCheckData = useCallback(async () => {
        try {
            if (!authoritativeSiteId) return;

            const response = await get(`/api/site-check/site/${authoritativeSiteId}`);
            const showerHeadCheck = checkId
                ? response?.find(check => check.checkId === parseInt(checkId, 10))
                : null;

            if (showerHeadCheck) {
                const isDone = showerHeadCheck.status === 'Done';
                setState(prev => ({
                    ...prev,
                    currentCheckId: showerHeadCheck.checkId,
                    checkStatus: showerHeadCheck.status,
                    isFormEditable: !isDone,
                    isSubmitted: isDone,
                    showPdfButton: isDone
                }));

                // Set inspection details here
                const inspectionDetails = {
                    checkId: showerHeadCheck.checkId,
                    siteId: showerHeadCheck.siteId,
                    type: showerHeadCheck.type,
                    subType: showerHeadCheck.subType,
                    category: showerHeadCheck.category,
                    dueDate: showerHeadCheck.dueDate,
                    repeatFrequency: showerHeadCheck.repeatFrequency,
                    status: showerHeadCheck.status
                };
                console.log('Setting inspection details:', inspectionDetails);
                setInspectionDetails(inspectionDetails);
            } else {
                setState(prev => ({
                    ...prev,
                    currentCheckId: checkId ? parseInt(checkId, 10) : null,
                    isFormEditable: true,
                    isSubmitted: false,
                    showPdfButton: false
                }));
            }
        } catch (error) {
            console.error('Error fetching site check data:', error);
            toast.error('Failed to load site check status');
            setState(prev => ({ ...prev, isFormEditable: true }));
        }
    }, [checkId, siteSelectedForGlobal]);

    // PDF functions
    const fetchPdfTemplate = useCallback(async () => {
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
    }, []);

    const savePdfToLocal = useCallback(async (pdfBlob, fileName) => {
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
    }, []);

    
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

    const getHighestFileVersion = useCallback(async (folderId, fileName) => {
        try {
            const siteId = authoritativeSiteId;
            if (!siteId) return 1;

            const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
            const files = response?.document?.files || [];
            const baseName = fileName.split('.')[0];
            const matchingFiles = files.filter(file =>
                file.name?.startsWith(baseName)
            );

            return matchingFiles.length > 0
                ? Math.max(...matchingFiles.map(f => f.fileVersion || 1)) + 1
                : 1;
        } catch (error) {
            console.error('Error checking file versions:', error);
            return 1;
        }
    }, [siteSelectedForGlobal]);

    const checkFileExists = useCallback(async (folderId, fileName) => {
        try {
            const siteId = authoritativeSiteId;
            if (!siteId || !folderId) return { exists: false, file: null };

            const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
            const files = response?.document?.files || [];
            const baseName = fileName.split('.')[0];
            const existingFile = files.find(file =>
                file.name?.startsWith(baseName)
            );

            return {
                exists: !!existingFile,
                file: existingFile || null
            };
        } catch (error) {
            console.error('Error checking file existence:', error);
            return { exists: false, file: null };
        }
    }, [siteSelectedForGlobal]);

   const uploadPdfToServer = useCallback(async (pdfBlob, fileName, inspectionDateOverride = null) => {
    let exists;
    try {
        setState(prev => ({ ...prev, isUploading: true }));
        // First save the PDF locally
        const savedLocally = await savePdfToLocal(pdfBlob, fileName);
        if (!savedLocally) {
            throw new Error('Failed to save PDF locally');
        }

        const targetFolderId = state.folderIds.storageTankService || state.folderIds.logBooks;
        if (!targetFolderId) {
            throw new Error('Could not determine target folder for PDF upload');
        }

        const fileCheck = await checkFileExists(targetFolderId, fileName);
        exists = fileCheck.exists;
        const existingFile = fileCheck.file;
        const multipartData = new FormData();

        const fileVersion = exists && existingFile
            ? existingFile.fileVersion + 1
            : await getHighestFileVersion(targetFolderId, fileName);

        const issueDate = new Date(inspectionDateOverride || formData.inspectionDate || new Date());
        const documentRequest = {
            folderId: targetFolderId,
            files: [{
                ...(exists && existingFile ? { id: existingFile.id } : {}),
                name: fileName.split('.')[0],
                originalFileName: fileName,
                fileVersion,
                siteId: authoritativeSiteId || 0,
                issueDate: issueDate.toISOString().replace('T', ' ').split('.')[0],
                expiryDate: formatDateForBackend(calculateExpiryDate(issueDate, inspectionDetails?.repeatFrequency)),
                uploaderUserId: loggedInUserData?.id || 0,
                reviewerUserId: loggedInUserData?.id || 0,
                referenceNumber: `SHC-${new Date().getTime()}`
            }]
        };

        // KEY FIX: Use 'files' for POST and 'file' for PUT
        if (exists) {
            multipartData.append('file', new File([pdfBlob], fileName, { type: 'application/pdf' }));
        } else {
            multipartData.append('files', new File([pdfBlob], fileName, { type: 'application/pdf' }));
        }
        
        multipartData.append('documentRequestString', JSON.stringify(documentRequest));

        const method = exists ? 'put' : 'post';
        const url = exists
            ? '/api/document/file/newVersion/upload'
            : '/api/document/files/upload';

        const response = await axios({
            method,
            url,
            data: multipartData,
            headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (response.data) {
            toast.success(`PDF ${exists ? 'updated' : 'uploaded'} successfully as version ${fileVersion}!`);
            return true;
        }

        throw new Error('Upload failed: No response data');
    } catch (error) {
        console.error('Error uploading PDF:', error);
        console.error(`Failed to ${exists ? 'update' : 'upload'} PDF: ${error.message}`);
        return false;
    } finally {
        setState(prev => ({ ...prev, isUploading: false }));
    }
}, [
    savePdfToLocal,
    checkFileExists,
    getHighestFileVersion,
    loggedInUserData,
    siteSelectedForGlobal,
    state.folderIds
]);

    const generatePDF = useCallback(async (uploadToServer = true, inspectionDateOverride = null) => {
        try {
            setState(prev => ({ ...prev, isGeneratingPDF: true }));

            const pdfBytes = await fetchPdfTemplate();
            const pdfDoc = await PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            const setTextField = (fieldName, value, fontSize = 10) => {
                try {
                    const field = form.getTextField(fieldName);
                    if (field) {
                        field.setText(value || '');
                        try {
                            if (field.setFontSize) field.setFontSize(fontSize);
                        } catch (e) {
                            console.warn(`Could not set font size for ${fieldName}:`, e);
                        }
                    }
                } catch (error) {
                    console.warn(`Error setting field ${fieldName}:`, error.message);
                }
            };

            // Format date as dd-mm-yyyy
            const formatDateString = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
            };

            const formattedDate = formatDateString(inspectionDateOverride || formData.inspectionDate);
            const engineer = selectedEngineer || users?.find(u => String(u.id) === String(formData.engineer));

            // Set form fields
            const addressLines = (formData.address || '').split(',');
            setTextField('Address',   addressLines[0] || '', 8);
            setTextField('Address_2', addressLines[1] || '', 8);
            setTextField('Address_3', addressLines[2] || '', 8);
            setTextField('Address_4', addressLines[3] || '', 8);

            setTextField('Date', formattedDate, 10);
            setTextField('Site Contact', formData.siteContact || '', 10);
            setTextField('Site Contact No', formData.siteContactNo || '', 10);
            setTextField('Job No', formData.job || '', 10);
            setTextField('Manufacturer', selectedAsset?.manufacturer || '', 10);
            setTextField('Location', selectedAsset ?
                `${selectedAsset.floor || ''} ${selectedAsset.room || ''} ${selectedAsset.position || ''}`.trim() : '', 10);
            setTextField('Cleaning Method', formData.param1remark || '', 10);
            setTextField('Duration', formData.param2remark || '', 10);
            setTextField('Clients Name', formData.clientUser?.name || formData.client || '', 10);
            setTextField('Engineers Name', engineer?.name || formData.engineer || '', 10);
            setTextField('on', formattedDate, 10);
            setTextField('on_2', formattedDate, 10);

            try {
                form.flatten();
            } catch (error) {
                console.warn('Error flattening form:', error.message);
            }

            const pdfBytesModified = await pdfDoc.save();
            const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
            const fileName = `ShowerHeadCleaningCertificate_${selectedAsset?.assetName || formattedDate}.pdf`;

            setState(prev => ({ ...prev, generatedPdfBlob: blob }));

            let uploadedToServer = false;
            if (uploadToServer) {
                uploadedToServer = await uploadPdfToServer(blob, fileName, inspectionDateOverride || formData.inspectionDate);
            }

            if (uploadedToServer || !uploadToServer) {
                toast.success('PDF generated successfully!');
                setState(prev => ({ ...prev, showPdfButton: true }));
            }

            return { success: true, fileName };
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
            return { success: false, error: error.message };
        } finally {
            setState(prev => ({ ...prev, isGeneratingPDF: false }));
        }
    }, [
        fetchPdfTemplate,
        formData,
        selectedAsset,
        uploadPdfToServer,
        users
    ]);

    // Main form submission handler

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (state.isLoading) return;

        const validationErrors = {};
        if (!formData.engineer || !selectedEngineer) {
            validationErrors.engineer = "Please select an active engineer for this Site Check.";
        }
        if (Object.keys(validationErrors).length > 0) {
            setState((prev) => ({ ...prev, validationErrors }));
            return;
        }

        setState(prev => ({ ...prev, isLoading: true, validationErrors: {} }));

        try {
            // Open status only controls the default date shown in the form.
            // Submission uses the current formData values below.
            const statusPayload = {
                siteId: parseInt(authoritativeSiteId, 10),
                type: siteCheck?.type || 'Inspection',
                // OLD: Maintenance/Cleaning/Shower Head Cleaning changed the Site Check route.
                // NEW: preserve the original UI route.
                subType: siteCheck?.subType || 'Legionella',
                category: siteCheck?.category || 'Periodic Shower Head Cleaning',
                status: 'Done',
                startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
                leadUserID: String(loggedInUserData?.id || '0'),
                assistantUserID: String(loggedInUserData?.id || '0')
            };

            let statusResponse;
            if (state.currentCheckId) {
                statusPayload.checkId = parseInt(state.currentCheckId, 10);
                statusResponse = await put(`/api/site-check/${state.currentCheckId}`, statusPayload);
            } else {
                statusResponse = await post(`/api/site-check`, statusPayload);
                if (statusResponse?.checkId) {
                    setState(prev => ({ ...prev, currentCheckId: statusResponse.checkId }));
                }
            }

            const cleaningPayload = {
                ...formData,
                siteId: authoritativeSiteId,
                assetId: formData.selectedAsset?.assetId || formData.assetId,
                client: formData.clientUser?.id || formData.client,
                engineer: formData.engineer,
                inspectionDate: formData.inspectionDate,
                signedDate: formData.signedDate,
                siteContact: formData.siteContactUser?.id || formData.siteContact,
                type: 'Maintenance',
                subType: 'Cleaning',
                category: 'Shower Head Cleaning',
                checkId: state.currentCheckId || statusResponse?.checkId,
                actionId: formData.actionId || null,
            };

            // Determine whether to PUT or POST based on actionId presence
            if (state.currentCheckId && formData.actionId) {
                // If we have both checkId and actionId, do PUT (update existing)
                await put(
                    `/api/site-check/generic-inspection/${state.currentCheckId}`,
                    cleaningPayload
                );
            } else {
                // Otherwise do POST (create new)
                await post(
                    `/api/site-check/generic-inspection`,
                    cleaningPayload
                );
            }

            const pdfResult = await generatePDF(true);
            if (!pdfResult.success) {
                throw new Error(pdfResult.error || "Failed to generate PDF");
            }

            toast.success("Shower head cleaning certificate saved successfully!");
            setState(prev => ({
                ...prev,
                showPdfButton: true,
                isSubmitted: true
            }));

            setTimeout(() => navigate(-1), 1500);
        } catch (error) {
            console.error('Error in form submission:', error);
            toast.error(error.message || 'Failed to submit form');
        } finally {
            setState(prev => ({ ...prev, isLoading: false }));
        }
    };

    // Initial data loading
    useEffect(() => {
        const fetchData = async () => {
            setState(prev => ({ ...prev, isLoading: true }));
            try {
                if (authoritativeSiteId) {
                    await Promise.all([
                        getSiteAssets(authoritativeSiteId),
                        getSiteDetailsById(authoritativeSiteId),
                        fetchFolderStructure(authoritativeSiteId),
                        fetchSiteCheckData()
                    ]);

                    if (isInternalUserTaggedWithSite && users.length === 0) {
                        await getUsers();
                    }

                    await fetchInspectionData();

                    const currentSite = sites.find(
                        site => Number(site.siteId) === Number(authoritativeSiteId)
                    );
                    const siteData = currentSite ||
                        (Number(siteSelectedForGlobal?.siteId) === Number(authoritativeSiteId)
                            ? siteSelectedForGlobal
                            : null);

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

                    if (siteData?.siteContact) {
                        setFormData(prev => ({
                            ...prev,
                            siteContact: siteData.siteContact.name || "",
                            siteContactNo: siteData.siteContact.phone || "",
                        }));
                    }

                    if (formData.actionId) {
                        const action = await fetchActionById(formData.actionId);
                        if (action) {
                            setState(prev => ({
                                ...prev,
                                existingAction: action,
                                actionRaised: true
                            }));
                        } else {
                            await fetchExistingActions();
                        }
                    } else {
                        await fetchExistingActions();
                    }
                }
            } catch (error) {
                console.error("Error fetching site data:", error);
                toast.error("Failed to load site details");
            } finally {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchData();
    }, [
        fetchActionById,
        fetchExistingActions,
        fetchFolderStructure,
        fetchSiteCheckData,
        fetchInspectionData,
        getSiteAssets,
        getSiteDetailsById,
        getUsers,
        isInternalUserTaggedWithSite,
        siteSelectedForGlobal,
        sites,
        users.length
    ]);

    const handleRiskAssessmentComplete = async (actionResponse) => {
    try {
        if (!actionResponse?.actionId) {
            // No action was created, which is fine since it's optional
            return;
        }

        // Verify the action exists
        const verifiedAction = await fetchActionById(actionResponse.actionId);
        if (!verifiedAction) {
            throw new Error("Failed to verify created action");
        }

        // Update the action with checkId if we have one
        if (state.currentCheckId && !verifiedAction.checkId) {
            await put(`/api/site/actions/${verifiedAction.actionId}`, {
                ...verifiedAction,
                checkId: state.currentCheckId
            });
            verifiedAction.checkId = state.currentCheckId; // Update local copy
        }

        // Update all relevant states
        setState(prev => ({
            ...prev,
            existingAction: verifiedAction,
            actionRaised: true
        }));
        setFormData(prev => ({
            ...prev,
            actionId: verifiedAction.actionId
        }));

        // Save the inspection data with the actionId
        const inspectionPayload = {
            ...formData,
            siteId: authoritativeSiteId,
            engineer: formData.engineer,
            inspectionDate: formData.inspectionDate,
            signedDate: formData.signedDate,
            checkId: state.currentCheckId,
            actionId: verifiedAction.actionId,
            type: 'Maintenance',
            subType: 'Cleaning',
            category: 'Shower Head Cleaning'
        };

        if (state.currentCheckId) {
            try {
                // Try to create first
                await post(`/api/site-check/generic-inspection`, inspectionPayload);
            } catch (error) {
                if (error.response?.status === 409) { // Conflict - already exists
                    await put(`/api/site-check/generic-inspection/${state.currentCheckId}`, inspectionPayload);
                } else {
                    throw error;
                }
            }
        }

        toast.success(`Action #${verifiedAction.actionId} successfully linked to inspection`);
    } catch (error) {
        console.error("Error handling risk assessment completion:", error);
        toast.error(error.message || "Failed to process action");
    }
};


    // NEW: Shared engineer dropdown selection.
    const handleEngineerSelect = (event, newValue) => {
        setFormData((prev) => ({
            ...prev,
            engineer: newValue?.id || "",
            user: newValue || {},
        }));
        setState((prev) => ({
            ...prev,
            validationErrors: { ...prev.validationErrors, engineer: "" },
        }));
    };

    // Render functions
    const renderClientNameField = () => {
        if (isInternalUserTaggedWithSite) {
            const filteredUsers = users?.filter(user =>
                user.taggedSites?.some(
                    site => Number(site.id ?? site.siteId) === Number(authoritativeSiteId)
                )
            ) || [];

            return (
                <Autocomplete
                    options={filteredUsers}
                    getOptionLabel={(user) => user.name}
                    value={formData.clientUser || formData.siteContactUser || null}
                    onChange={(event, newValue) => {
                        setFormData(prev => ({
                            ...prev,
                            client: newValue?.id || "",
                            clientUser: newValue || null,
                            siteContact: newValue?.id || "",
                            siteContactNo: newValue?.phone || "",
                            siteContactUser: newValue || null,
                        }));
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            required
                            disabled={state.isSubmitted}
                            style={{ height: "40px" }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    height: "40px",
                                    padding: "0 5px",
                                },
                            }}
                        />
                    )}
                    disabled={state.isSubmitted}
                />
            );
        }
        return (
            <input
                type="text"
                className="form-control"
                name="clientName"
                value={formData.clientUser?.name || formData.siteContactUser?.name || ""}
                onChange={(e) => {
                    setFormData(prev => ({
                        ...prev,
                        client: e.target.value,
                        clientNameText: e.target.value,
                        siteContact: e.target.value,
                        siteContactName: e.target.value,
                    }));
                }}
                required
                disabled={state.isSubmitted}
            />
        );
    };

    const renderSiteContactField = () => {
        if (isInternalUserTaggedWithSite) {
            const filteredUsers = users?.filter(user =>
                user.taggedSites?.some(
                    site => Number(site.id ?? site.siteId) === Number(authoritativeSiteId)
                )
            ) || [];

            return (
                <Autocomplete
                    options={filteredUsers}
                    getOptionLabel={(user) => user.name}
                    value={formData.siteContactUser || formData.clientUser || null}
                    onChange={(event, newValue) => {
                        setFormData(prev => ({
                            ...prev,
                            siteContact: newValue?.id || "",
                            siteContactNo: newValue?.phone || "",
                            siteContactUser: newValue || null,
                            client: newValue?.id || "",
                            clientUser: newValue || null,
                        }));
                    }}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            variant="outlined"
                            required
                            disabled={state.isSubmitted}
                            style={{ height: "40px" }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    height: "40px",
                                    padding: "0 5px",
                                },
                            }}
                        />
                    )}
                    disabled={state.isSubmitted}
                />
            );
        }
        return (
            <input
                type="text"
                className="form-control"
                name="siteContact"
                value={formData.siteContactUser?.name || formData.clientUser?.name || ""}
                onChange={(e) => {
                    setFormData(prev => ({
                        ...prev,
                        siteContact: e.target.value,
                        siteContactName: e.target.value,
                        client: e.target.value,
                        clientNameText: e.target.value,
                    }));
                }}
                required
                disabled={state.isSubmitted}
            />
        );
    };

    return (
        <div className="container mt-4 mb-5">
            <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Shower Head Cleaning Certificate</h4>
            </div>

            {!state.isFormEditable && (
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    This form is read-only because the check has been marked as completed.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="mb-3 d-flex">
                            <label className="form-label fw-bold me-3">
                                Address
                            </label>
                            <textarea
                                className="form-control"
                                rows={3}
                                name="address"
                                value={formData.address || ""}
                                disabled
                                style={{
                                    width: "300px",
                                    height: "150px",
                                    overflowY: "auto",
                                    whiteSpace: "pre-wrap",
                                    wordWrap: "break-word",
                                    backgroundColor: "#f8f9fa",
                                    fontWeight: "normal",
                                    fontSize: "15px",
                                }}
                            />
                        </div>
                    </div>
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
                                style={{ height: "40px", padding: "0 10px", width: "100%" }}
                                disabled={state.isSubmitted}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Site Contact</label>
                            {renderSiteContactField()}
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="mb-3">
                            <label className="form-label">Site Contact No.</label>
                            <input
                                type="text"
                                className="form-control"
                                name="siteContactNo"
                                value={formData.siteContactNo}
                                onChange={handleInputChange}
                                disabled={state.isSubmitted}
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Job No.</label>
                            <input
                                type="text"
                                className="form-control"
                                name="job"
                                value={formData.job}
                                onChange={handleInputChange}
                                disabled={state.isSubmitted}
                            />
                        </div>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Shower Head Information</h5>
                    </div>
                    <div className="card-body">
                        <div className="row mb-4">
                            <div className="col-md-12">
                                <Autocomplete
                                    disabled={state.isSubmitted}
                                    options={filteredAssets}
                                    getOptionLabel={(option) =>
                                        `${option.assetId} - ${option.assetName} (${
                                            option.position || "NA"
                                        } > ${option.floor || "NA"} > ${option.room || "NA"})`
                                    }
                                    value={selectedAsset}
                                    onChange={handleAssetSelect}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select a Shower Head"
                                            variant="outlined"
                                            placeholder="Search shower heads..."
                                        />
                                    )}
                                    sx={{ width: "100%" }}
                                />
                            </div>
                        </div>

                        {formData.selectedAsset && (
                            <div className="row">
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Manufacturer</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="manufacturer"
                                            value={selectedAsset.manufacturer}
                                            onChange={handleInputChange}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-6">
                                    <div className="mb-3">
                                        <label className="form-label">Location</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="location"
                                            value={`${selectedAsset.floor || ''} ${selectedAsset.room || ''} ${selectedAsset.position || ''}`.trim()}
                                            onChange={handleInputChange}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Cleaning Details</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Cleaning Method</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.param1remark}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                param1remark: e.target.value,
                                            })
                                        }
                                        disabled={state.isSubmitted}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Duration</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.param2remark}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                param2remark: e.target.value,
                                            })
                                        }
                                        disabled={state.isSubmitted}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header d-flex justify-content-between align-items-center">
                        <div>
                            <h5 className="mb-0">Risk Assessment</h5>
                            <small className="text-muted">(Optional - only complete if issues were found)</small>
                        </div>
                        {state.existingAction && (
                            <span className="badge bg-success ms-2">
                                Action #{state.existingAction.actionId} - {state.existingAction.status}
                            </span>
                        )}
                    </div>
                    <div className="card-body">
                        {state.existingAction ? (
                            <div className="existing-action">
                                <div className="row">
                                    <div className="col-md-6">
                                        <p><strong>Observation:</strong> {state.existingAction.observation}</p>
                                        <p><strong>Required Action:</strong> {state.existingAction.requiredAction}</p>
                                        <p><strong>Risk Score:</strong> {state.existingAction.riskScore}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <p><strong>Description: </strong> {state.existingAction.desc}</p>
                                        <p><strong>Due Date:</strong> {formatDate(state.existingAction.dueDate)}</p>
                                        <p><strong>Status:</strong> {state.existingAction.status}</p>
                                    </div>
                                </div>
                                {state.existingAction.comments && (
                                    <div className="mt-3">
                                        <h6>Comments:</h6>
                                        <p>{state.existingAction.comments}</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <RiskScoreCard2
                                desc={`Maintenance - Cleaning - Shower Head Cleaning`}
                                siteId={authoritativeSiteId}
                                checkId={state.currentCheckId}
                                createdBy={loggedInUserData?.id}
                                taggedAsset={selectedAsset?.assetId}
                                onRiskAssessmentComplete={handleRiskAssessmentComplete}
                                actionRaised={state.actionRaised}
                                disabled={state.isSubmitted}
                                isOptional={true}
                            />
                        )}
                    </div>
                </div>

                <div className="row mt-4">
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Client's Name</label>
                            {renderClientNameField()}
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="signedDate"
                                value={formatDate(formData.signedDate)}
                                onChange={handleInputChange}
                                required
                                style={{ height: "40px", padding: "0 10px", width: "100%" }}
                                disabled={state.isSubmitted}
                            />
                        </div>
                    </div>
                    <div className="col-md-6">
                        {/* =========================================================
                            OLD ENGINEER FIELD - COMMENTED FOR REVIEW

                        <div className="mb-3">
                            <label className="form-label fw-bold">Engineer's Name</label>
                            <input
                                type="text"
                                className="form-control"
                                name="engineer name"
                                readOnly
                                value={formData.user.name}
                                required
                                disabled
                            />
                        </div>

                        ========================================================= */}

                        {/* NEW SHARED ENGINEER CONTROL - MATCHES AIR CONDITIONING */}
                        <SiteCheckEngineerSelector
                            options={engineerOptions}
                            value={selectedEngineer}
                            onChange={handleEngineerSelect}
                            isOpen={effectiveCheckStatus === "Open"}
                            disabled={state.isSubmitted || !state.isFormEditable}
                            loading={isLoadingEngineers}
                            error={state.validationErrors.engineer || engineerLoadError}
                        />
                        <div className="mb-3">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="signedDate"
                                value={formatDate(formData.signedDate)}
                                onChange={handleInputChange}
                                required
                                disabled={state.isSubmitted}
                                style={{ height: "40px", padding: "0 10px", width: "100%" }}
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-4 print-hide">
                    {!state.isSubmitted ? (
                        <div className="d-flex justify-content-between mt-3">
                            <Button
                                variant="contained"
                                color="secondary"
                                onClick={() => window.history.back()}
                            >
                                Back
                            </Button>
                            <div>
                                {state.isFormEditable && (
                                    <Button
                                        type="submit"
                                        variant="contained"
                                        color="primary"
                                        disabled={!state.isFormEditable || state.isLoading || state.isGeneratingPDF}
                                        startIcon={state.isLoading ? <CircularProgress size={20} /> : null}
                                    >
                                        {state.isLoading ? 'Submitting...' : 'Submit Certificate'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="alert alert-success mb-4">
                                Certificate submitted successfully on {getUkLocalDate()}
                            </div>
                        </div>
                    )}
                </div>
            </form>

            <style jsx>{`
                .is-invalid {
                    border-color: #dc3545 !important;
                }
                .invalid-feedback {
                    display: block;
                    width: 100%;
                    margin-top: .25rem;
                    font-size: .875em;
                    color: #dc3545;
                }
                @media print {
                    .print-hide {
                        display: none !important;
                    }
                    body {
                        padding: 0;
                        margin: 0;
                    }
                    .container {
                        max-width: 100%;
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
};

const mapStateToProps = (state) => ({
    sites: state.site.sites,
    users: state.site.users,
    siteAssets: state.site.siteAssets,
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
    loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
    getSiteDetailsById,
    getSiteById,
    getSiteAssets,
    getSites,
    getUsers,
})(ShowerHeadCertificate);
