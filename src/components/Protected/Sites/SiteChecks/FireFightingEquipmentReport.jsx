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
import { PDFDocument } from 'pdf-lib';
import RiskScoreCard2 from "./RiskScoreCard2";

// NOTE: You must have a PDF template at this path for the PDF generation to work correctly.
import pdfTemplate from './pdf/FireFightingEquippement.pdf';

const FireFightingEquipmentReport = ({
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
    const license = JSON.parse(localStorage.getItem("license"));

    const getDefaultReportTemplate = () => `It is recommended that regular visual inspections of all extinguishers be carried out by the user's representative to ensure
appliances are in their current positions and have not been discharged, lost pressure or suffered obvious damage.
The frequency of inspections by the user should not be less than monthly and, when circumstances require, inspections
should be carried out more frequently.`;

    // State initialization
    const [formData, setFormData] = useState({
        address: "",
        siteContact: "",
        inspectionDate: new Date().toISOString().split("T")[0],
        siteContactNo: "",
        report: getDefaultReportTemplate(),
        code: "",
        engineer: loggedInUserData?.id || "",
        client: "",
        user: loggedInUserData || {},
        signedDate: new Date().toISOString().split("T")[0],
        clientUser: null,
        siteContactUser: null,
        actionId: null,
        specialInstructions: "",
        foam: "",
        water: "",
        co2: "",
        fb: "",
        wc: "",
        dp: "",
        hr: "",
        assets: []
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
        currentCheckId: checkId || null,
        existingAction: null,
        generatedPdfBlob: null
    });

    const [folderIds, setFolderIds] = useState({
        logBooks: null,
        plantAndEquipment: null,
        miscellaneousService: null,
        fireEquipment: null
    });

    const sites = useSelector((state) => state.site.sites);
    const navigate = useNavigate();
    const isInternalUserTaggedWithSite = true;
    const [inspectionDetails, setInspectionDetails] = useState(null);

    // Filter assets for Fire Fighting Equipment category
    const filteredAssets = React.useMemo(() =>
            siteAssets?.filter(asset =>
                asset.category === "Fire Fighting Equipment"
            ) || [],
        [siteAssets]);

    // Initialize assets data when filteredAssets changes
    useEffect(() => {
        if (filteredAssets.length > 0 && formData.assets.length === 0) {
            const assetsData = filteredAssets.map(asset => ({
                id: asset.assetId,
                location: `${asset.floor || ''} ${asset.room || ''}`.trim(),
                typeAndSize: asset.subCategory === "Fire Blanket" ? "Fire Blanket" : asset.subCategory2 || "",
                s: false,
                d: false,
                r: false,
                pf: false,
                c: false,
                r2: false,
                last: new Date().getFullYear() - 1,
                due: new Date().getFullYear(),
                comment: ""
            }));

            setFormData(prev => ({
                ...prev,
                assets: assetsData
            }));
        }
    }, [filteredAssets]);

    const categorizeFireEquipment = (assets) => {
        const categories = {
            foam: 0,
            water: 0,
            co2: 0,
            fb: 0,
            wc: 0,
            dp: 0,
            hr: 0
        };

        if (!assets || assets.length === 0) return categories;

        assets.forEach(asset => {
            const subCategory = (asset.subCategory || '');
            const subCategory2 = (asset.subCategory2 || '');

            if (subCategory === 'Fire Blanket') {
                categories.fb += 1;
            }
            else if (subCategory === 'Hose Reel') {
                categories.hr += 1;
            }
            else if (subCategory === 'Fire Extinguishers' || subCategory.includes('Fire Extinguisher')) {
                if (subCategory2.includes('Foam Extinguisher')) {
                    categories.foam += 1;
                }
                else if ((subCategory2.includes('Water Extinguisher'))) {
                    categories.water += 1;
                }
                else if (subCategory2.includes('CO2 Extinguisher')) {
                    categories.co2 += 1;
                }
                else if (subCategory2.includes('Wet Chemical Extinguisher')) {
                    categories.wc += 1;
                }
                else if (subCategory2.includes('Dry Powder Extinguisher') || subCategory.includes('Automatic Dry Powder Extinguisher')) {
                    categories.dp += 1;
                }
            }
        });

        return categories;
    };

    // Function to auto-populate the count fields
    const autoPopulateEquipmentCounts = () => {
        const counts = categorizeFireEquipment(filteredAssets);

        setFormData(prev => ({
            ...prev,
            foam: counts.foam,
            water: counts.water,
            co2: counts.co2,
            fb: counts.fb,
            wc: counts.wc,
            dp: counts.dp,
            hr: counts.hr
        }));

        return counts;
    };

    // Call this function when assets are loaded or changed
    useEffect(() => {
        if (filteredAssets.length > 0) {
            autoPopulateEquipmentCounts();
        }
    }, [filteredAssets]);

    // Event handlers
    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAssetFieldChange = (index, field, value) => {
        const updatedAssets = [...formData.assets];
        updatedAssets[index][field] = value;

        setFormData(prev => ({
            ...prev,
            assets: updatedAssets
        }));
    };

    // API functions
    const fetchFolderStructure = async (siteId) => {
        try {
            const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

            if (parentFoldersResponse?.parentFolders?.length > 0) {
                const logBooksFolder = parentFoldersResponse.parentFolders.find(
                    folder => folder.name.trim() === 'Log Books'
                );

                if (logBooksFolder) {
                    const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

                    if (logBooksResponse?.document?.childFolders) {
                        const plantAndEquipmentFolder = logBooksResponse.document.childFolders.find(
                            folder => folder.name.trim() === 'Fire Log Book'
                        );

                        if (plantAndEquipmentFolder) {
                            const plantAndEquipmentResponse = await get(
                                `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
                            );

                            if (plantAndEquipmentResponse?.document?.childFolders) {
                                const miscellaneousFolder = plantAndEquipmentResponse.document.childFolders.find(
                                    folder => folder.name.trim() === 'Fire Fighting Equipment'
                                );

                                if (miscellaneousFolder) {
                                    const miscResponse = await get(
                                        `/api/document/parent/${miscellaneousFolder.id}/folders?siteId=${siteId}`
                                    );

                                    if (miscResponse?.document?.childFolders) {
                                        const fireEquipmentFolder = miscResponse.document.childFolders.find(
                                            folder => folder.name.trim() === 'Extinguisher Inspection & Test'
                                        );

                                        setFolderIds({
                                            logBooks: logBooksFolder.id,
                                            plantAndEquipment: plantAndEquipmentFolder.id,
                                            miscellaneousService: miscellaneousFolder.id,
                                            fireEquipment: fireEquipmentFolder?.id || null
                                        });

                                        return fireEquipmentFolder?.id || null;
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
    }, [fetchActionById, siteSelectedForGlobal?.siteId, state.currentCheckId]);

    const fetchSiteCheckData = useCallback(async () => {
        try {
            if (!siteSelectedForGlobal?.siteId) return;

            const response = await get(`/api/site-check/site/${siteSelectedForGlobal.siteId}`);
            const fireEquipmentCheck = checkId
                ? response?.find(check => check.checkId === parseInt(checkId, 10))
                : null;

            if (fireEquipmentCheck) {
                const isDone = fireEquipmentCheck.status === 'Done';
                setState(prev => ({
                    ...prev,
                    currentCheckId: fireEquipmentCheck.checkId,
                    checkStatus: fireEquipmentCheck.status,
                    isFormEditable: !isDone,
                    isSubmitted: isDone,
                    showPdfButton: isDone
                }));

                const inspectionDetails = {
                    checkId: fireEquipmentCheck.checkId,
                    siteId: fireEquipmentCheck.siteId,
                    type: fireEquipmentCheck.type,
                    subType: fireEquipmentCheck.subType,
                    category: fireEquipmentCheck.category,
                    dueDate: fireEquipmentCheck.dueDate,
                    status: fireEquipmentCheck.status
                };
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
    }, [checkId, siteSelectedForGlobal?.siteId]);

    const fetchInspectionData = useCallback(async () => {
        try {
            if (!state.currentCheckId) return;

            const apiData = await get(`/api/site-check/fire-fighting-equipment/${state.currentCheckId}`);

            if (apiData && apiData.length > 0) {
                const mostRecentItem = apiData[apiData.length - 1];

                const clientUser = users.find(user => user.id === mostRecentItem.client);
                const siteContactUser = users.find(user => user.id === mostRecentItem.siteContact);

                let existingAction = null;
                if (mostRecentItem.actionId) {
                    existingAction = await fetchActionById(mostRecentItem.actionId);
                }

                setFormData(prev => ({
                    ...prev,
                    address: mostRecentItem.address || "",
                    siteContact: mostRecentItem.siteContact || "",
                    siteContactNo: mostRecentItem.siteContactNo || "",
                    inspectionDate: formatDate(mostRecentItem.inspectionDate) || new Date().toISOString().split("T")[0],
                    report: mostRecentItem.report || getDefaultReportTemplate(),
                    code: mostRecentItem.code || "",
                    engineer: mostRecentItem.engineer || loggedInUserData?.id || "",
                    client: mostRecentItem.client || "",
                    user: loggedInUserData || {},
                    signedDate: formatDate(mostRecentItem.signedDate) || new Date().toISOString().split("T")[0],
                    clientUser: clientUser || null,
                    siteContactUser: siteContactUser || null,
                    actionId: mostRecentItem.actionId || null,
                    specialInstructions: mostRecentItem.specialInstructions || "",

                    foam: mostRecentItem?.foam || "",
                    water: mostRecentItem?.water || "",
                    co2: mostRecentItem?.co2 || "",
                    fb: mostRecentItem?.fb || "",
                    wc: mostRecentItem?.wc || "",
                    dp: mostRecentItem?.dp || "",
                    hr: mostRecentItem?.hr || "",
                    assets: mostRecentItem.assets && mostRecentItem.assets.length > 0
                        ? mostRecentItem.assets.map(asset => ({
                            id: asset.id,
                            location: asset.location || "",
                            typeAndSize: asset.typeAndSize ||
                                (asset.subCategory === "Fire Blanket" ? "Fire Blanket" : asset.subCategory2) ||
                                "",
                            s: asset.s || false,
                            d: asset.d || false,
                            r: asset.r || false,
                            pf: asset.pf || false,
                            c: asset.c || false,
                            r2: asset.r2 || false,
                            last: asset.last || new Date().getFullYear() - 1,
                            due: asset.due || new Date().getFullYear()
                        }))
                        : filteredAssets.map(asset => ({
                            id: asset.assetId,
                            location: `${asset.floor || ''} ${asset.room || ''}`.trim(),
                            typeAndSize: asset.subCategory2 || "",
                            s: false,
                            d: false,
                            r: false,
                            pf: false,
                            c: false,
                            r2: false,
                            last: new Date().getFullYear() - 1,
                            due: new Date().getFullYear()
                        }))

                }));

                setState(prev => ({
                    ...prev,
                    existingAction,
                    actionRaised: !!existingAction
                }));
            }
        } catch (error) {
            console.error("Error fetching inspection data:", error);
            toast.error("Failed to load inspection data");
        }
    }, [state.currentCheckId, users, loggedInUserData, license]);

    // PDF functions
    const fetchPdfTemplate = useCallback(async () => {
        try {
            const response = await fetch(pdfTemplate);
            if (!response.ok) {
                throw new Error('Failed to load PDF template: ' + response.statusText);
            }
            const arrayBuffer = await response.arrayBuffer();
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
            const savedLocally = await savePdfToLocal(pdfBlob, fileName);
            if (!savedLocally) {
                throw new Error('Failed to save PDF locally');
            }

            const targetFolderId = folderIds.fireEquipment;
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
                    issueDate: formatDateForBackend(formData.inspectionDate),
                    expiryDate: formatDateForBackend(calculateExpiryDate(formData.inspectionDate, inspectionDetails?.repeatFrequency)),
                    uploaderUserId: loggedInUserData?.id || 0,
                    reviewerUserId: loggedInUserData?.id || 0,
                    referenceNumber: `FFR-${new Date().getTime()}`
                }]
            };

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
        folderIds,
        inspectionDetails
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

            const formatDateString = (dateString) => {
                if (!dateString) return '';
                const date = new Date(dateString);
                return `${String(date.getDate()).padStart(2, '0')}-${String(date.getMonth() + 1).padStart(2, '0')}-${date.getFullYear()}`;
            };

            const formattedDate = formatDateString(formData.inspectionDate);
            const engineer = users?.find(u => u.id === formData.engineer);

            setTextField('Customer Name', license?.companyName || '', 8);
            setTextField('Customer Address', license?.companyAddress || '', 8);

            setTextField('Site Address', formData.address || '', 8);
            setTextField('Date', formattedDate, 8);
            setTextField('Contact', formData.siteContactUser?.name || formData.siteContact || '', 8);
            setTextField('Code', formData.code || '', 8);
            setTextField('Engineer', engineer?.name || '', 8);
            setTextField('Site Telephone', formData.siteContactNo || '', 8);
            setTextField('Units', filteredAssets.length.toString(), 8);
            setTextField('Special Instructions', formData.specialInstructions || '', 8);

            setTextField('Routine inspection', formData.report || getDefaultReportTemplate(), 8);

            setTextField('Foam', formData.foam.toString() || '', 8);
            setTextField('Water', formData.water.toString() || '', 8);
            setTextField('CO2', formData.co2.toString() || '', 8);
            setTextField('FB', formData.fb.toString() || '', 8);
            setTextField('WC', formData.wc.toString() || '', 8);
            setTextField('DP', formData.dp.toString() || '', 8);
            setTextField('HR', formData.hr.toString() || '', 8);

            formData.assets.slice(0, filteredAssets.length).forEach((asset, index) => {
                const idx = index;

                setTextField(`location1_${idx}`, asset.location || '', 8);
                setTextField(`size1_${idx}`, asset.typeAndSize || '', 8);
                setTextField(`S_${idx}`, asset.s ? 'Yes' : 'No', 8);
                setTextField(`D_${idx}`, asset.d ? 'Yes' : 'No', 8);
                setTextField(`R_${idx}`, asset.r ? 'Yes' : 'No', 8);
                setTextField(`PF_${idx}`, asset.pf ? 'Yes' : 'No', 8);
                setTextField(`C_${idx}`, asset.c ? 'Yes' : 'No', 8);
                setTextField(`R1_${idx}`, asset.r2 ? 'Yes' : 'No', 8);
                setTextField(`last_${idx}`, asset.last.toString(), 8);
                setTextField(`due_${idx}`, asset.due.toString(), 8);
                setTextField(`comment_${idx}`, asset.comment || '', 8);
            });

            try {
                form.flatten();
            } catch (error) {
                console.warn('Error flattening form:', error.message);
            }

            const pdfBytesModified = await pdfDoc.save();
            const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
            const fileName = `FireFightingEquipmentReport_${formattedDate}.pdf`;

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
        uploadPdfToServer,
        users,
        filteredAssets,
        license
    ]);

    // Main form submission handler
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (state.isLoading) return;

        setState(prev => ({ ...prev, isLoading: true }));

        try {
            const statusPayload = {
                siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
                type: 'Inspection',
                subType: 'Fire Equipment',
                category: 'Fire Fighting Equipment',
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
            const finalReport = getDefaultReportTemplate();

            const inspectionPayload = {
                ...formData,
                siteId: siteSelectedForGlobal?.siteId,
                type: 'Inspection',
                subType: 'Fire Equipment',
                category: 'Fire Fighting Equipment',
                report: finalReport,
                checkId: state.currentCheckId || statusResponse?.checkId,
                actionId: formData.actionId || null,
            };

            if (state.currentCheckId && formData.actionId) {
                await put(
                    `/api/site-check/fire-fighting-equipment/${state.currentCheckId}`,
                    inspectionPayload
                );
            } else {
                await post(
                    `/api/site-check/fire-fighting-equipment`,
                    inspectionPayload
                );
            }

            const pdfResult = await generatePDF(true);
            if (!pdfResult.success) {
                throw new Error(pdfResult.error || "Failed to generate PDF");
            }

            toast.success("Fire Fighting Equipment report saved successfully!");
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
                        fetchSiteCheckData(),
                        fetchInspectionData(),
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
            } finally {
                setState(prev => ({ ...prev, isLoading: false }));
            }
        };

        fetchData();
    }, [
        siteSelectedForGlobal?.siteId,
        state.currentCheckId
    ]);

    const handleRiskAssessmentComplete = async (actionResponse) => {
        try {
            if (!actionResponse?.actionId) {
                return;
            }

            const verifiedAction = await fetchActionById(actionResponse.actionId);
            if (!verifiedAction) {
                throw new Error("Failed to verify created action");
            }

            if (state.currentCheckId && !verifiedAction.checkId) {
                await put(`/api/site/actions/${verifiedAction.actionId}`, {
                    ...verifiedAction,
                    checkId: state.currentCheckId
                });
                verifiedAction.checkId = state.currentCheckId;
            }

            setState(prev => ({
                ...prev,
                existingAction: verifiedAction,
                actionRaised: true
            }));
            setFormData(prev => ({
                ...prev,
                actionId: verifiedAction.actionId
            }));

            const inspectionPayload = {
                ...formData,
                siteId: siteSelectedForGlobal?.siteId,
                checkId: state.currentCheckId,
                actionId: verifiedAction.actionId,
                type: 'Inspection',
                subType: 'Fire Equipment',
                category: 'Fire Fighting Equipment'
            };

            if (state.currentCheckId) {
                try {
                    await post(`/api/site-check/fire-fighting-equipment`, inspectionPayload);
                } catch (error) {
                    if (error.response?.status === 409) {
                        await put(`/api/site-check/fire-fighting-equipment/${state.currentCheckId}`, inspectionPayload);
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
                <h4 className="mb-0">Fire Fighting Equipment Service Report</h4>
            </div>

            {!state.isFormEditable && (
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    This form is read-only because the check has been marked as completed.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                    <div className="row">
                        {/* Customer Name Field */}
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold d-block">
                                Customer
                            </label>
                            <input
                                type="text"
                                className="form-control"
                                name="customer"
                                value={license?.companyName}
                                disabled
                            />
                        </div>

                        {/* Address Field */}
                        <div className="col-md-6 mb-3">
                            <label className="form-label fw-bold d-block">
                                Address
                            </label>
                            <textarea
                                className="form-control"
                                rows={3}
                                name="address"
                                value={license?.companyAddress}
                                disabled
                                style={{
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
                </div>

                <div className="row mb-4">
                    <div className="col-md-6">
                        <div className="mb-3 d-flex">
                            <label className="form-label fw-bold me-3">
                                Site Address
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
                        <div className="mb-3">
                            <label className="form-label">Code</label>
                            <input
                                type="text"
                                className="form-control"
                                name="code"
                                value={formData.code}
                                onChange={handleInputChange}
                                disabled={state.isSubmitted}
                            />
                        </div>
                    </div>
                    <div className="col-md-3">
                        <div className="mb-3">
                            <label className="form-label">Engineer</label>
                            <input
                                type="text"
                                className="form-control"
                                name="engineer"
                                readOnly
                                value={formData.user.name}
                                required
                                disabled
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Site Telephone</label>
                            <input
                                type="text"
                                className="form-control"
                                name="siteContactNo"
                                value={formData.siteContactNo}
                                onChange={handleInputChange}
                                disabled
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Units</label>
                            <input
                                type="text"
                                className="form-control"
                                name="units"
                                value={filteredAssets.length}
                                disabled
                            />
                        </div>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Special Instructions</h5>
                    </div>
                    <div className="card-body">
                        <textarea
                            className="form-control"
                            rows={3}
                            name="specialInstructions"
                            value={formData.specialInstructions}
                            onChange={handleInputChange}
                            disabled={state.isSubmitted}
                        />
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Report Summary</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Foam</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.foam}
                                    disabled
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">Water</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.water}
                                    disabled
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">CO2</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.co2}
                                    disabled
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">FB</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.fb}
                                    disabled
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">WC</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.wc}
                                    disabled
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">DP</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.dp}
                                    disabled
                                />
                            </div>
                            <div className="col-md-3 mb-3">
                                <label className="form-label">HR</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={formData.hr}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Routine inspection by the user:</h5>
                    </div>
                    <div className="card-body">
                        <TextField
                            multiline
                            rows={10}
                            fullWidth
                            variant="outlined"
                            value={formData.report || getDefaultReportTemplate()}
                            onChange={(e) =>
                                setFormData({
                                    ...formData,
                                    report: e.target.value,
                                })
                            }
                            style={{ height: "400px" }}
                            disabled={state.isSubmitted}
                        />
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Fire Fighting Equipment Inspection</h5>
                    </div>
                    <div className="card-body p-0">
                        <div className="table-container" style={{
                            maxHeight: '500px',
                            overflow: 'auto',
                            position: 'relative'
                        }}>
                            <table className="table table-bordered mb-0" style={{ minWidth: '1200px' }}>
                                <thead style={{
                                    position: 'sticky',
                                    top: 0,
                                    zIndex: 10,
                                    backgroundColor: 'white'
                                }}>
                                <tr>
                                    <th style={{
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 11,
                                        backgroundColor: 'white',
                                        minWidth: '60px',
                                        width: '60px'
                                    }}>EX</th>
                                    <th style={{
                                        minWidth: '350px',
                                        position: 'sticky',
                                        left: '60px',
                                        zIndex: 11,
                                        backgroundColor: 'white',
                                        width: '350px'
                                    }}>Location</th>
                                    <th style={{ minWidth: '350px', width: '350px' }}>Type & Size</th>
                                    <th colSpan="6">Action</th>
                                    <th style={{ minWidth: '300px', width: '300px' }}>Comment</th>
                                    <th style={{ minWidth: '120px', width: '120px' }}>LAST</th>
                                    <th style={{ minWidth: '120px', width: '120px' }}>DUE</th>
                                </tr>
                                <tr>
                                    <th style={{
                                        position: 'sticky',
                                        left: 0,
                                        zIndex: 11,
                                        backgroundColor: 'white'
                                    }}></th>
                                    <th style={{
                                        position: 'sticky',
                                        left: '60px',
                                        zIndex: 11,
                                        backgroundColor: 'white'
                                    }}></th>
                                    <th></th>
                                    <th style={{ minWidth: '100px', width: '100px' }}>S</th>
                                    <th style={{ minWidth: '100px', width: '100px' }}>D</th>
                                    <th style={{ minWidth: '100px', width: '100px' }}>R</th>
                                    <th style={{ minWidth: '100px', width: '100px' }}>PF</th>
                                    <th style={{ minWidth: '100px', width: '100px' }}>C</th>
                                    <th style={{ minWidth: '100px', width: '100px' }}>R</th>
                                    <th style={{ minWidth: '300px' }}></th>
                                    <th style={{ minWidth: '120px' }}></th>
                                    <th style={{ minWidth: '120px' }}></th>
                                </tr>
                                </thead>
                                <tbody>
                                {formData.assets.slice(0, filteredAssets.length).map((asset, index) => (
                                    <tr key={index}>
                                        <td style={{
                                            position: 'sticky',
                                            left: 0,
                                            zIndex: 1,
                                            backgroundColor: 'white',
                                            width: '60px'
                                        }}>{index}</td>
                                        <td style={{
                                            position: 'sticky',
                                            left: '60px',
                                            zIndex: 1,
                                            backgroundColor: 'white',
                                            width: '250px'
                                        }}>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={asset.location}
                                                onChange={(e) => handleAssetFieldChange(index, 'location', e.target.value)}
                                                disabled
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ width: '200px' }}>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={asset.typeAndSize}
                                                onChange={(e) => handleAssetFieldChange(index, 'typeAndSize', e.target.value)}
                                                disabled
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ width: '100px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.s ? 'Yes' : 'No'}
                                                onChange={(e) => handleAssetFieldChange(index, 's', e.target.value === 'Yes')}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </td>
                                        <td style={{ width: '100px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.d ? 'Yes' : 'No'}
                                                onChange={(e) => handleAssetFieldChange(index, 'd', e.target.value === 'Yes')}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </td>
                                        <td style={{ width: '100px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.r ? 'Yes' : 'No'}
                                                onChange={(e) => handleAssetFieldChange(index, 'r', e.target.value === 'Yes')}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </td>
                                        <td style={{ width: '100px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.pf ? 'Yes' : 'No'}
                                                onChange={(e) => handleAssetFieldChange(index, 'pf', e.target.value === 'Yes')}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </td>
                                        <td style={{ width: '100px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.c ? 'Yes' : 'No'}
                                                onChange={(e) => handleAssetFieldChange(index, 'c', e.target.value === 'Yes')}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </td>
                                        <td style={{ width: '100px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.r2 ? 'Yes' : 'No'}
                                                onChange={(e) => handleAssetFieldChange(index, 'r2', e.target.value === 'Yes')}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                <option value="No">No</option>
                                                <option value="Yes">Yes</option>
                                            </select>
                                        </td>
                                        <td style={{ width: '300px' }}>
                                            <input
                                                type="text"
                                                className="form-control form-control-sm"
                                                value={asset.comment || ""}
                                                onChange={(e) => handleAssetFieldChange(index, 'comment', e.target.value)}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            />
                                        </td>
                                        <td style={{ width: '120px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.last}
                                                onChange={(e) => handleAssetFieldChange(index, 'last', parseInt(e.target.value))}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                {Array.from({ length: 50 }, (_, i) => new Date().getFullYear() - i).map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td style={{ width: '120px' }}>
                                            <select
                                                className="form-select form-select-sm"
                                                value={asset.due}
                                                onChange={(e) => handleAssetFieldChange(index, 'due', parseInt(e.target.value))}
                                                disabled={state.isSubmitted}
                                                style={{ width: '100%' }}
                                            >
                                                {Array.from({ length: 100 }, (_, i) => new Date().getFullYear() + i).map(year => (
                                                    <option key={year} value={year}>{year}</option>
                                                ))}
                                            </select>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
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
                                desc={`Inspection - Fire Equipment - Fire Fighting Equipment`}
                                siteId={siteSelectedForGlobal?.siteId}
                                checkId={state.currentCheckId}
                                createdBy={loggedInUserData?.id}
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
                                        {state.isLoading ? 'Submitting...' : 'Submit Report'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="alert alert-success mb-4">
                                Report submitted successfully on {new Date().toISOString().split("T")[0]}
                            </div>
                        </div>
                    )}
                </div>
            </form>

            <style jsx>{`
                .table-container {
                    max-height: 500px;
                    overflow: auto;
                    position: relative;
                }
                
                .table-container thead th {
                    position: sticky;
                    top: 0;
                    z-index: 10;
                    background-color: white;
                }
                
                .table-container tbody td:first-child,
                .table-container thead th:first-child {
                    position: sticky;
                    left: 0;
                    z-index: 11;
                    background-color: white;
                }
                
                .table-container tbody td:nth-child(2),
                .table-container thead th:nth-child(2) {
                    position: sticky;
                    left: 60px;
                    z-index: 11;
                    background-color: white;
                }
                
                @media (max-width: 768px) {
                    .table-container {
                        overflow-x: auto;
                    }
                    
                    .table-container thead th,
                    .table-container tbody td {
                        white-space: nowrap;
                    }
                }
                
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
})(FireFightingEquipmentReport);