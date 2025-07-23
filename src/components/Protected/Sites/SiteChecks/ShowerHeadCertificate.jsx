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
                               }) => {
    // State initialization
    const [formData, setFormData] = useState({
        address: "",
        assetId: "",
        siteContact: "",
        inspectionDate: new Date().toISOString().split("T")[0],
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
        signedDate: new Date().toISOString().split("T")[0],
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


    // Memoized values
    const selectedAsset = React.useMemo(() =>
            siteAssets.find(asset => asset.assetId === formData.assetId),
        [siteAssets, formData.assetId]
    );

    const filteredAssets = React.useMemo(() =>
            siteAssets?.filter(asset =>
                asset.category === "Mechanical" &&
                asset.subCategory === "Water Services" &&
                asset.subCategory2 === "Outlet / Shower"
            ) || [],
        [siteAssets]
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
                folder => folder.name.trim() === 'Log Books'
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
                folder => folder.name.trim() === 'Shower Head Cleaning'
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

            if (!siteSelectedForGlobal?.siteId || !state.currentCheckId) return;

            const response = await get(`/api/site/actions/${siteSelectedForGlobal.siteId}`);
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

    const fetchSiteCheckData = useCallback(async () => {
        try {
            if (!siteSelectedForGlobal?.siteId) return;

            const response = await get(`/api/site-check/site/${siteSelectedForGlobal.siteId}`);
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
        if (!dateString) return null; // Handle missing date

        // Convert to Date object (works for ISO strings like "2025-08-23T00:00:00")
        const date = new Date(dateString);

        // Format as "YYYY-MM-DD HH:MM:SS" (same as issueDate)
        return date.toISOString().replace('T', ' ').split('.')[0];
    };

    const getHighestFileVersion = useCallback(async (folderId, fileName) => {
        try {
            const siteId = siteSelectedForGlobal?.siteId;
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
            const siteId = siteSelectedForGlobal?.siteId;
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

   const uploadPdfToServer = useCallback(async (pdfBlob, fileName) => {
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
        const formData = new FormData();

        const fileVersion = exists && existingFile
            ? existingFile.fileVersion + 1
            : await getHighestFileVersion(targetFolderId, fileName);

        const documentRequest = {
            folderId: targetFolderId,
            files: [{
                ...(exists && existingFile ? { id: existingFile.id } : {}),
                name: fileName.split('.')[0],
                originalFileName: fileName,
                fileVersion,
                siteId: siteSelectedForGlobal?.siteId || 0,
                issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
                expiryDate: formatDateForBackend(inspectionDetails.dueDate),
                uploaderUserId: loggedInUserData?.id || 0,
                reviewerUserId: loggedInUserData?.id || 0,
                referenceNumber: `SHC-${new Date().getTime()}`
            }]
        };

        // KEY FIX: Use 'files' for POST and 'file' for PUT
        if (exists) {
            formData.append('file', new File([pdfBlob], fileName, { type: 'application/pdf' }));
        } else {
            formData.append('files', new File([pdfBlob], fileName, { type: 'application/pdf' }));
        }
        
        formData.append('documentRequestString', JSON.stringify(documentRequest));

        const method = exists ? 'put' : 'post';
        const url = exists
            ? '/api/document/file/newVersion/upload'
            : '/api/document/files/upload';

        const response = await axios({
            method,
            url,
            data: formData,
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

    const generatePDF = useCallback(async (uploadToServer = true) => {
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

            const formattedDate = formatDateString(formData.inspectionDate);
            const engineer = users?.find(u => u.id === formData.engineer);

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
                uploadedToServer = await uploadPdfToServer(blob, fileName);
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

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const statusPayload = {
                siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
                type: 'Maintenance',
                subType: 'Cleaning',
                category: 'Shower Head Cleaning',
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
                siteId: siteSelectedForGlobal?.siteId,
                assetId: formData.selectedAsset?.assetId || formData.assetId,
                client: formData.clientUser?.id || formData.client,
                engineer: formData.engineer,
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
                if (siteSelectedForGlobal?.siteId) {
                    await Promise.all([
                        getSiteAssets(siteSelectedForGlobal.siteId),
                        getSiteDetailsById(siteSelectedForGlobal.siteId),
                        fetchFolderStructure(siteSelectedForGlobal.siteId),
                        fetchSiteCheckData()
                    ]);

                    if (isInternalUserTaggedWithSite && users.length === 0) {
                        await getUsers();
                    }

                    const currentSite = sites.find(
                        site => site.siteId === siteSelectedForGlobal.siteId
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
                        setFormData(prev => ({
                            ...prev,
                            siteContact: siteSelectedForGlobal.siteContact.name || "",
                            siteContactNo: siteSelectedForGlobal.siteContact.phone || "",
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
            siteId: siteSelectedForGlobal?.siteId,
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


    // Render functions
    const renderClientNameField = () => {
        if (isInternalUserTaggedWithSite) {
            const filteredUsers = users?.filter(user =>
                user.taggedSites?.some(
                    site => site.id === siteSelectedForGlobal?.siteId
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
                    site => site.id === siteSelectedForGlobal?.siteId
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
                                siteId={siteSelectedForGlobal?.siteId}
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
                                Certificate submitted successfully on {new Date().toISOString().split("T")[0]}
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