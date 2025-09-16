import { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { get, post, put } from "../../../../api"; // Using the provided API functions
import { getSiteAssets, getSiteDetailsById, getUsers } from "../../../../store/thunk/site";
import { Autocomplete, TextField, Card, CardContent, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, MenuItem } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import moment from "moment";
import pdfTemplate from './pdf/airConditionRecurrencCheck.pdf';

let PDFLib;

if (typeof window !== 'undefined') {
    import('pdf-lib').then((pdfLib) => {
        PDFLib = pdfLib;
    });
}

// Helper function to fetch PDF as ArrayBuffer
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

const AirConditioningRecurrenceCheck = ({
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
    const [selectedAsset, setSelectedAsset] = useState(null);
    const [relatedAssets, setRelatedAssets] = useState([]);
    const [formData, setFormData] = useState({
        systemOwner: "",
        refrigerantType: "",
        gwpLevel: "",
        chargeWeight: "",
        co2eq: "0",
        inspectionDate: new Date().toISOString().split("T")[0],
        siteContact: "",
        siteContactNo: "",
        job: "",
        report: "",
        signedDate: new Date().toISOString().split("T")[0],
        client: "",
        clientUser: null,
        siteContactUser: null,
        actionId: null,
    });
    const [siteChecks, setSiteChecks] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [submissionSuccess, setSubmissionSuccess] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showPdfButton, setShowPdfButton] = useState(false);
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [validationErrors, setValidationErrors] = useState({});
    const [folderIds, setFolderIds] = useState({
        logBooks: null,
        EnvironmentalLogBook: null,
        airConditioning: null
    });
    const [checkStatus, setCheckStatus] = useState('Open');
    const [isFormEditable, setIsFormEditable] = useState(true);
    const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
    const [showRiskAssessment, setShowRiskAssessment] = useState(false);
    const [actionRaised, setActionRaised] = useState(false);
    const [existingAction, setExistingAction] = useState(null);

    const sites = useSelector((state) => state.site.sites);
    const navigate = useNavigate();
    const isInternalUserTaggedWithSite = true;
    const license = JSON.parse(localStorage.getItem("license"));


    // Refrigerant data from the provided table
    const refrigerantOptions = [
        { name: "R410A", gwp: 2088, notes: "Commonly used refrigerant with high GWP" },
        { name: "R134a", gwp: 1430, notes: "" },
        { name: "R32", gwp: 633, notes: "Mildly flammable" },
        { name: "R290 (propane)", gwp: 3, notes: "Highly flammable and heavier than air" },
        { name: "R600 (butane)", gwp: 4, notes: "Highly flammable and heavier than air" },
        { name: "R1234ze", gwp: 1, notes: "Mildly flammable" },
        { name: "R744 (CO2)", gwp: 1, notes: "High pressure systems" },
        { name: "R717 (NH4, ammonia)", gwp: 0, notes: "Mildly flammable and has medium toxicity concerns" },
        { name: "Other", gwp: "", notes: "Custom refrigerant" },
    ];

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                if (siteSelectedForGlobal?.siteId) {
                    await getSiteAssets(siteSelectedForGlobal?.siteId);
                    await getSiteDetailsById(siteSelectedForGlobal?.siteId);

                    if (isInternalUserTaggedWithSite && users.length === 0) {
                        await getUsers();
                    }

                    const currentSite = sites.find(
                        (site) => site.siteId === siteSelectedForGlobal.siteId
                    );
                    const siteData = currentSite || siteSelectedForGlobal;

                    // If we have a checkId, fetch the related data
                    if (checkId) {
                        // Fetch site checks for this asset
                        await fetchSiteChecks();
                        await fetchSiteCheckData();
                    }

                    // Set site contact information
                    if (siteSelectedForGlobal.siteContact) {
                        setFormData(prev => ({
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
    }, [siteSelectedForGlobal, getSiteAssets, users.length, isInternalUserTaggedWithSite, getUsers, checkId]);

    useEffect(() => {
        // Calculate CO2eq when GWP level or charge weight changes
        if (formData.gwpLevel && formData.chargeWeight) {
            const gwp = parseFloat(formData.gwpLevel);
            const weight = parseFloat(formData.chargeWeight);
            if (!isNaN(gwp) && !isNaN(weight)) {
                const co2eq = (gwp * weight / 1000).toFixed(2);
                setFormData(prev => ({ ...prev, co2eq }));
            }
        } else {
            setFormData(prev => ({ ...prev, co2eq: "0" }));
        }
    }, [formData.gwpLevel, formData.chargeWeight]);

    useEffect(() => {
        // When an asset is selected, find related assets
        if (selectedAsset && siteAssets.length > 0) {
            const related = siteAssets.filter(asset =>
                asset.assetId !== selectedAsset.assetId &&
                asset.assetName === selectedAsset.assetName
            );
            setRelatedAssets(related);
        } else {
            setRelatedAssets([]);
        }
    }, [selectedAsset, siteAssets]);

    const fetchSiteChecks = async () => {
        try {
            if (!selectedAsset?.assetId) return;

            // Use the provided get function instead of axios directly
            const response = await get(`/api/site-check/asset/${selectedAsset.assetId}`);
            if (response) {
                setSiteChecks(response);
            }
        } catch (error) {
            console.error("Error fetching site checks:", error);
        }
    };

    const fetchSiteCheckData = async () => {
        try {
            if (!siteSelectedForGlobal?.siteId) return;

            // Use the provided get function
            const response = await get(`/api/site-check/site/${siteSelectedForGlobal.siteId}`);
            if (response && response.length > 0) {
                // First try to find the exact checkId from URL
                let airConditioningCheck = checkId
                    ? response.find(check => check.checkId === parseInt(checkId, 10))
                    : null;

                if (airConditioningCheck) {
                    setCurrentCheckId(airConditioningCheck.checkId);
                    setCheckStatus(airConditioningCheck.status);

                    // Set form editability based on status
                    const isDone = airConditioningCheck.status === 'Done';
                    setIsFormEditable(!isDone);
                    setIsSubmitted(isDone);
                    setShowPdfButton(isDone);
                } else {
                    // If no matching check found, default to editable
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

    const fetchFolderStructure = async (siteId) => {
        try {
            // Use the provided get function
            const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

            if (parentFoldersResponse?.parentFolders?.length > 0) {
                const logBooksFolder = parentFoldersResponse.parentFolders.find(
                    folder => folder.name.trim() === 'Log Books'
                );

                if (logBooksFolder) {
                    // Use the provided get function
                    const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

                    if (logBooksResponse?.document?.childFolders) {
                        const EnvironmentalLogBookFolder = logBooksResponse.document.childFolders.find(
                            folder => folder.name.trim() === 'Environmental Log Book'
                        );

                        if (EnvironmentalLogBookFolder) {
                            // Use the provided get function
                            const environmentalResponse = await get(
                                `/api/document/parent/${EnvironmentalLogBookFolder.id}/folders?siteId=${siteId}`
                            );

                            if (environmentalResponse?.document?.childFolders) {
                                const airConditioningFolder = environmentalResponse.document.childFolders.find(
                                    folder => folder.name === 'Air Conditioning Service & Maintenance Records'
                                );

                                setFolderIds({
                                    logBooks: logBooksFolder.id,
                                    EnvironmentalLogBook: EnvironmentalLogBookFolder.id,
                                    airConditioning: airConditioningFolder?.id || null
                                });

                                return airConditioningFolder?.id || null;
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

    const fetchActionById = async (id) => {
        try {
            if (!id) return null;
            // Use the provided get function
            const response = await get(`/api/site/actions/id/${id}`);
            return response;
        } catch (error) {
            console.error('Error fetching action:', error);
            return null;
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleRefrigerantChange = (e) => {
        const selectedRefrigerant = refrigerantOptions.find(
            (option) => option.name === e.target.value
        );

        setFormData(prev => ({
            ...prev,
            refrigerantType: e.target.value,
            gwpLevel: selectedRefrigerant ? selectedRefrigerant.gwp.toString() : ""
        }));
    };

    const handleAssetSelect = (event, newValue) => {
        setSelectedAsset(newValue);
        // Reset form when asset changes
        setFormData(prev => ({
            ...prev,
            refrigerantType: "",
            gwpLevel: "",
            chargeWeight: "",
            co2eq: "0",
        }));

        if (newValue) {
            // Fetch site checks for the selected asset
            fetchSiteChecks();
        } else {
            setSiteChecks([]);
        }
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

    const getHighestFileVersion = async (folderId, fileName) => {
        try {
            const siteId = siteSelectedForGlobal?.siteId;
            if (!siteId) {
                console.warn('No site ID available for file version check');
                return 1;
            }

            // Use the provided get function
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
            const siteId = siteSelectedForGlobal?.siteId;
            if (!siteId || !folderId) return { exists: false, file: null };

            // Use the provided get function
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

    const dateFormat = (date) => {
        return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
    }

    const formatDateForBackend = (dateString) => {
        if (!dateString) return null;
        const date = new Date(dateString);
        return date.toISOString().replace('T', ' ').split('.')[0];
    };

    const uploadPdfToServer = async (pdfBlob, fileName) => {
        try {
            setIsUploading(true);
            const savedLocally = await savePdfToLocal(pdfBlob, fileName);
            if (!savedLocally) {
                throw new Error('Failed to save PDF locally');
            }

            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            const targetFolderId = folderIds.airConditioning || folderIds.logBooks;

            if (!targetFolderId) {
                throw new Error('Could not determine target folder for PDF upload');
            }

            const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);
            const formData = new FormData();

            if (exists && existingFile) {
                formData.append('file', pdfFile);
                const documentRequestString = {
                    folderId: targetFolderId,
                    files: [{
                        id: existingFile.id,
                        name: fileName,
                        originalFileName: fileName,
                        fileVersion: existingFile.fileVersion + 1,
                        siteId: siteSelectedForGlobal?.siteId || 0,
                        issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
                        expiryDate: formatDateForBackend(new Date()),
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: `AC-${new Date().getTime()}`
                    }]
                };

                formData.append('documentRequestString', JSON.stringify(documentRequestString));

                // Use the standard put function with FormData
                const response = await put(
                    '/api/document/file/newVersion/upload',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        }
                    }
                );

                if (response.data) {
                    toast.success(`PDF uploaded successfully as version ${documentRequestString.fileVersion}!`);
                    return true;
                }
            } else {
                formData.append('files', pdfFile);
                const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

                const documentRequestString = {
                    folderId: targetFolderId,
                    files: [{
                        name: fileName.split('.')[0],
                        issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
                        expiryDate: formatDateForBackend(new Date()),
                        note: 'Air Conditioning Recurrence Check',
                        fileVersion: fileVersion,
                        siteId: siteSelectedForGlobal?.siteId || 0,
                        originalFileName: fileName,
                        uploaderUserId: loggedInUserData?.id || 0,
                        reviewerUserId: loggedInUserData?.id || 0,
                        referenceNumber: `AC-${new Date().getTime()}`
                    }]
                };

                formData.append('documentRequestString', JSON.stringify(documentRequestString));

                // Use the standard post function with FormData
                const response = await post(
                    '/api/document/files/upload',
                    formData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        }
                    }
                );

                if (response.data) {
                    toast.success(`PDF uploaded successfully as version ${fileVersion}!`);
                    return true;
                }
            }

            throw new Error('Upload failed: No response data');
        } catch (error) {
            console.error('Error uploading PDF:', error);
            return false;
        } finally {
            setIsUploading(false);
        }
    };

    const generatePDF = async (uploadToServer = true) => {
        try {
            setIsGeneratingPDF(true);

            if (!PDFLib) {
                PDFLib = await import('pdf-lib');
            }

            const pdfBytes = await fetchPdfTemplate();
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            const setTextField = (fieldName, value, fontSize = 10) => {
                try {
                    const field = form.getTextField(fieldName);
                    if (field) {
                        field.setText(value || '');
                        try {
                            if (field.setFontSize) {
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

            // Address and contact information
            const addressLines = (siteSelectedForGlobal?.address1 ?
                `${siteSelectedForGlobal.address1}, ${siteSelectedForGlobal.address2 || ''}, ${siteSelectedForGlobal.city}, ${siteSelectedForGlobal.postCode}`
                : '').split(',');

            setTextField('Address', addressLines[0] || '', mediumFont);
            setTextField('Address_2', addressLines[1] || '', mediumFont);
            setTextField('Address_3', addressLines[2] || '', mediumFont);
            setTextField('Address_4', addressLines[3] || '', mediumFont);

            setTextField('Date', dateFormat(formData.inspectionDate), mediumFont);
            setTextField('Site Contact', formData.siteContactUser?.name || formData.siteContact || '', mediumFont);
            setTextField('Site Contact No', formData.siteContactNo || '', mediumFont);
            setTextField('Job No', formData.job || '', mediumFont);

            // Equipment information
            setTextField('Manufacturer', selectedAsset?.manufacturer || '', mediumFont);
            setTextField('Model Number', selectedAsset?.model || '', mediumFont);
            setTextField('Serial Number', selectedAsset?.serialNumber || '', mediumFont);

            const equipmentDetailsLocation = [
                selectedAsset?.floor,
                selectedAsset?.room,
                selectedAsset?.position,
                selectedAsset?.assetName
            ].filter(Boolean).join(' - ');

            setTextField('Equipment Details  Location', equipmentDetailsLocation || '', mediumFont);

            // Refrigerant information
            setTextField('Refrigerant Type', formData.refrigerantType || '', mediumFont);
            setTextField('GWP Level', formData.gwpLevel || '', mediumFont);
            setTextField('Charge Weight', formData.chargeWeight || '', mediumFont);
            setTextField('CO2eq', formData.co2eq || '', mediumFont);

            // Report
            setTextField('Engineers Report', formData.report || '', mediumFont);

            // Signatures
            const clientName = formData.clientUser?.name || formData.client || '';
            const engineerName = loggedInUserData?.name || '';

            setTextField('Clients Name', clientName, mediumFont);
            setTextField('Engineers Name', engineerName, mediumFont);
            setTextField('on', dateFormat(formData.signedDate), smallFont);
            setTextField('on_2', dateFormat(formData.signedDate), smallFont);

            // Flatten and save
            form.flatten();
            const pdfBytesModified = await pdfDoc.save();
            const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
            const fileName = `AirConditioningRecurrenceCheck_${selectedAsset?.assetName || 'Report'}.pdf`;

            setGeneratedPdfBlob(blob);
            setShowPdfButton(true);

            if (uploadToServer) {
                await uploadPdfToServer(blob, fileName);
            }

            toast.success('PDF generated successfully!');
            return { success: true, fileName };

        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Failed to generate PDF');
            return { success: false, error: error.message };
        } finally {
            setIsGeneratingPDF(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted');

        if (isLoading) {
            console.log('Submit prevented: Already loading');
            return;
        }

        if (!isFormEditable) {
            console.log('Submit prevented: Form is not editable');
            return;
        }

        // Form validation
        const errors = {};
        if (!formData.refrigerantType) errors.refrigerantType = "Please select refrigerant type";
        if (!formData.gwpLevel) errors.gwpLevel = "Please enter GWP level";
        if (!formData.chargeWeight) errors.chargeWeight = "Please enter charge weight";

        if (Object.keys(errors).length > 0) {
            setValidationErrors(errors);
            return;
        }

        setValidationErrors({});
        setIsLoading(true);

        try {
            // First update or create the site check status
            const statusPayload = {
                siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
                type: 'Inspection',
                subType: 'Recurrence Check',
                category: 'Air Conditioning',
                status: 'Done',
                startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
                leadUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0',
                assistantUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0'
            };

            let statusResponse;
            if (currentCheckId) {
                // Update existing check using the provided put function
                statusPayload.checkId = parseInt(currentCheckId, 10);
                statusResponse = await put(
                    `/api/site-check/${currentCheckId}`,
                    statusPayload
                );
            } else {
                // Create new check using the provided post function
                statusResponse = await post(
                    `/api/site-check`,
                    statusPayload
                );
                if (statusResponse?.data?.checkId) {
                    setCurrentCheckId(statusResponse.data.checkId);
                }
            }

            if (![200, 201, 204].includes(statusResponse?.status)) {
                throw new Error('Failed to update site check status');
            }

            console.log('Site check status updated successfully:', statusResponse.data);
            setCheckStatus('Done');
            setIsFormEditable(false);

            // Then create the recurrence check record using the provided post function
            const recurrencePayload = {
                ...formData,
                siteId: siteSelectedForGlobal?.siteId,
                assetId: selectedAsset?.assetId,
                client: formData.clientUser?.id || formData.client,
                engineer: loggedInUserData?.id,
                siteContact: formData.siteContactUser?.id || formData.siteContact,
                type: 'Inspection',
                subType: 'Recurrence Check',
                category: 'Air Conditioning',
                checkId: currentCheckId || statusResponse?.data?.checkId,
                actionId: formData.actionId,
            };

            // Create a new record using the provided post function
            const saveResponse = await post(
                `/api/site-check/air-conditioning-recurrence`,
                recurrencePayload
            );

            if (![200, 201, 204].includes(saveResponse?.status)) {
                throw new Error('Failed to save recurrence check data');
            }

            console.log('Recurrence check data saved successfully:', saveResponse.data);

            // Generate PDF
            const pdfResult = await generatePDF(true);
            if (!pdfResult.success) {
                throw new Error(pdfResult.error || "Failed to generate PDF");
            }

            toast.success("Air Conditioning recurrence check saved successfully!");
            setShowPdfButton(true);
            setIsSubmitted(true);
            setSubmissionSuccess(true);

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

    const renderClientNameField = () => {
        if (isInternalUserTaggedWithSite) {
            const filteredUsers =
                users?.filter((user) =>
                    user.taggedSites?.some(
                        (site) => site.id === siteSelectedForGlobal?.siteId
                    )
                ) || [];

            return (
                <Autocomplete
                    options={filteredUsers}
                    getOptionLabel={(user) => user.name}
                    value={formData.clientUser || formData.siteContactUser || null}
                    onChange={(event, newValue) => {
                        setFormData((prev) => ({
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
                            disabled={isSubmitted}
                            style={{
                                height: "40px",
                                "& .MuiOutlinedInput-root": {
                                    height: "40px",
                                },
                                "& .MuiAutocomplete-input": {
                                    padding: "8.5px 4px !important",
                                },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    height: "40px",
                                    padding: "0 5px",
                                },
                            }}
                        />
                    )}
                    disabled={isSubmitted}
                />
            );
        }
        return (
            <input
                type="text"
                className="form-control"
                name="clientName"
                value={
                    formData.clientUser?.name || formData.siteContactUser?.name || ""
                }
                onChange={(e) => {
                    setFormData((prev) => ({
                        ...prev,
                        client: e.target.value,
                        clientNameText: e.target.value,
                        siteContact: e.target.value,
                        siteContactName: e.target.value,
                    }));
                }}
                required
                disabled={isSubmitted}
            />
        );
    };

    const renderSiteContactField = () => {
        if (isInternalUserTaggedWithSite) {
            const filteredUsers =
                users?.filter((user) =>
                    user.taggedSites?.some(
                        (site) => site.id === siteSelectedForGlobal?.siteId
                    )
                ) || [];

            return (
                <Autocomplete
                    options={filteredUsers}
                    getOptionLabel={(user) => user.name}
                    value={formData.siteContactUser || formData.clientUser || null}
                    onChange={(event, newValue) => {
                        setFormData((prev) => ({
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
                            disabled={isSubmitted}
                            style={{
                                height: "40px",
                                "& .MuiOutlinedInput-root": {
                                    height: "40px",
                                },
                                "& .MuiAutocomplete-input": {
                                    padding: "8.5px 4px !important",
                                },
                            }}
                            sx={{
                                "& .MuiOutlinedInput-root": {
                                    height: "40px",
                                    padding: "0 5px",
                                },
                            }}
                        />
                    )}
                    disabled={isSubmitted}
                />
            );
        }
        return (
            <input
                type="text"
                className="form-control"
                name="siteContact"
                value={
                    formData.siteContactUser?.name || formData.clientUser?.name || ""
                }
                onChange={(e) => {
                    setFormData((prev) => ({
                        ...prev,
                        siteContact: e.target.value,
                        siteContactName: e.target.value,
                        client: e.target.value,
                        clientNameText: e.target.value,
                    }));
                }}
                required
                disabled={isSubmitted}
            />
        );
    };

    const filteredAssets =
        siteAssets?.filter(
            (asset) =>
                asset.category === "Mechanical" &&
                asset.subCategory === "Air Conditioning" &&
                asset.subCategory2 === "Air Conditioning Unit (Outdoor)"
        ) || [];

    return (
        <div className="container mt-4 mb-5">
            <div className="header text-center bg-light p-4 mb-4 rounded">
                <h4 className="mb-0">Air Conditioning Recurrence Check</h4>
            </div>

            {!isFormEditable && (
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    This form is read-only because the check has been marked as completed.
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="row mb-4">
                    <div className="col-md-12">
                        <div className="mb-3">
                            <label className="form-label">System Owner</label>
                            <input
                                type="text"
                                className="form-control"
                                name="systemOwner"
                                value={license?.companyName || ''}
                                disabled
                            />
                        </div>
                    </div>
                    <div className="col-md-12">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Site Address</label>
                            <textarea
                                className="form-control"
                                rows={4}
                                value={license?.companyAddress || ''}
                                disabled
                                style={{
                                    backgroundColor: "#f8f9fa",
                                    fontWeight: "normal",
                                }}
                            />
                        </div>
                    </div>
                </div>

                <div className="row mb-4">
                    <div className="col-md-4">
                        <div className="mb-3">
                            <label className="form-label">Date</label>
                            <input
                                type="date"
                                className="form-control"
                                name="inspectionDate"
                                value={formData.inspectionDate}
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

                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Equipment Description and Location</h5>
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
                                    value={selectedAsset}
                                    onChange={handleAssetSelect}
                                    renderInput={(params) => (
                                        <TextField
                                            {...params}
                                            label="Select an Air Conditioning Unit"
                                            variant="outlined"
                                            placeholder="Search devices..."
                                        />
                                    )}
                                    sx={{ width: "100%" }}
                                />
                            </div>
                        </div>

                        {selectedAsset && (
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="mb-3">
                                        <label className="form-label">Equipment Details</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={`Manufacturer: ${selectedAsset.manufacturer || "N/A"}  |  Model: ${selectedAsset.model || "N/A"}  |  Serial Number: ${selectedAsset.serialNumber || "N/A"}  |  Position: ${selectedAsset.position || "N/A"}  |  Floor: ${selectedAsset.floor || "N/A"}  |  Room: ${selectedAsset.room || "N/A"}`}
                                            disabled
                                            style={{
                                                backgroundColor: "#f8f9fa",
                                                fontWeight: "normal",
                                                padding: "10px 12px",
                                                minHeight: "45px"
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {relatedAssets.length > 0 && (
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Related Assets</h5>
                        </div>
                        <div className="card-body">
                            <div className="row">
                                {relatedAssets.map(asset => (
                                    <div key={asset.assetId} className="col-md-6 mb-3">
                                        <Card variant="outlined">
                                            <CardContent>
                                                <Typography variant="h6" component="div">
                                                    {asset.assetName}
                                                </Typography>
                                                <Typography color="textSecondary">
                                                    Asset ID: {asset.assetId}
                                                </Typography>
                                                <Typography color="textSecondary">
                                                    Position: {asset.position || "N/A"}
                                                </Typography>
                                                <Typography color="textSecondary">
                                                    Floor: {asset.floor || "N/A"} | Room: {asset.room || "N/A"}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Refrigerant Information</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-3">
                                <div className="mb-3">
                                    <label className="form-label">Refrigerant Type</label>
                                    <TextField
                                        select
                                        fullWidth
                                        name="refrigerantType"
                                        value={formData.refrigerantType}
                                        onChange={handleRefrigerantChange}
                                        error={!!validationErrors.refrigerantType}
                                        helperText={validationErrors.refrigerantType}
                                        disabled={isSubmitted}
                                    >
                                        <MenuItem value="">
                                            <em>Select Refrigerant</em>
                                        </MenuItem>
                                        {refrigerantOptions.map((option) => (
                                            <MenuItem key={option.name} value={option.name}>
                                                {option.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="mb-3">
                                    <label className="form-label">GWP Level</label>
                                    <input
                                        type="number"
                                        className={`form-control ${validationErrors.gwpLevel ? "is-invalid" : ""}`}
                                        name="gwpLevel"
                                        value={formData.gwpLevel}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        disabled={isSubmitted}
                                    />
                                    {validationErrors.gwpLevel && (
                                        <div className="invalid-feedback">
                                            {validationErrors.gwpLevel}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="mb-3">
                                    <label className="form-label">Charge Weight (KGS)</label>
                                    <input
                                        type="number"
                                        className={`form-control ${validationErrors.chargeWeight ? "is-invalid" : ""}`}
                                        name="chargeWeight"
                                        value={formData.chargeWeight}
                                        onChange={handleInputChange}
                                        step="0.01"
                                        min="0"
                                        disabled={isSubmitted}
                                    />
                                    {validationErrors.chargeWeight && (
                                        <div className="invalid-feedback">
                                            {validationErrors.chargeWeight}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="col-md-3">
                                <div className="mb-3">
                                    <label className="form-label">CO2eq (Tonnes)</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.co2eq}
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>
                        {formData.refrigerantType && (
                            <div className="row mt-2">
                                <div className="col-md-12">
                                    <div className="alert alert-info">
                                        <strong>Notes:</strong> {
                                            refrigerantOptions.find(
                                                (option) => option.name === formData.refrigerantType
                                            )?.notes || "No additional information available."
                                        }
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Engineers Report</h5>
                    </div>
                    <div className="card-body">
                        <div className="mb-3">
                            <TextField
                                multiline
                                rows={16}
                                fullWidth
                                variant="outlined"
                                value={formData.report || ""}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        report: e.target.value,
                                    })
                                }
                                style={{ height: "400px" }}
                                disabled={isSubmitted}
                            />
                        </div>
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
                                value={formData.signedDate}
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
                    <div className="col-md-6">
                        <div className="mb-3">
                            <label className="form-label fw-bold">Engineer's Name</label>
                            <input
                                type="text"
                                className="form-control"
                                name="engineer name"
                                readOnly
                                value={loggedInUserData?.name || ""}
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
                                value={formData.signedDate}
                                onChange={handleInputChange}
                                required
                                disabled={isSubmitted}
                                style={{
                                    height: "40px",
                                    padding: "0 10px",
                                    width: "100%",
                                }}
                            />
                        </div>
                    </div>
                </div>

                {siteChecks.length > 0 && (
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Maintenance History</h5>
                        </div>
                        <div className="card-body">
                            <TableContainer component={Paper}>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Date</TableCell>
                                            <TableCell>Complaint</TableCell>
                                            <TableCell>Entered By</TableCell>
                                            <TableCell>Action</TableCell>
                                            <TableCell>Contractor</TableCell>
                                            <TableCell>Engineer</TableCell>
                                            <TableCell>Gas Added</TableCell>
                                            <TableCell>Comments</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {siteChecks.map((check, index) => (
                                            <TableRow key={index}>
                                                <TableCell>{formatDate(check.date)}</TableCell>
                                                <TableCell>{check.complaint || "N/A"}</TableCell>
                                                <TableCell>{check.enteredBy || "N/A"}</TableCell>
                                                <TableCell>{check.action || "N/A"}</TableCell>
                                                <TableCell>{check.contractor || "N/A"}</TableCell>
                                                <TableCell>{check.engineer || "N/A"}</TableCell>
                                                <TableCell>{check.gasAdded || "N/A"}</TableCell>
                                                <TableCell>{check.comments || "N/A"}</TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    </div>
                )}

                <div className="mt-4 print-hide">
                    {!isSubmitted ? (
                        <div className="d-flex justify-content-between mt-3">
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
                                        disabled={isLoading || isGeneratingPDF}
                                    >
                                        {isLoading ? 'Submitting...' : 'Submit Report'}
                                    </button>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center">
                            <div className="alert alert-success mb-4">
                                Report submitted successfully on {formatDate(formData.signedDate)}
                            </div>
                            {showPdfButton && generatedPdfBlob && (
                                <button
                                    className="btn btn-success"
                                    onClick={() => savePdfToLocal(generatedPdfBlob, `AirConditioningRecurrenceCheck_${selectedAsset?.assetName || 'Report'}.pdf`)}
                                    disabled={isGeneratingPDF}
                                >
                                    {isGeneratingPDF ? 'Generating PDF...' : 'Download PDF'}
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </form>

            <style>{`
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
    getSiteAssets,
    getUsers,
})(AirConditioningRecurrenceCheck);