import React, { useState, useEffect, useCallback } from "react";
import { connect, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { post, put, get, uploadSiteCheckDoc, getSasToken } from "../../../../api";
import {
    getSiteAssets,
    getSiteById,
    getSiteDetailsById,
    getSites,
    getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, FormControlLabel, MenuItem, Radio, Select, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import { v4 as uuidv4 } from 'uuid';
import pdfTemplate from './pdf/GasBoilerService.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import { getUkLocalDate, getUkLocalDateTimeInput, isCurrentUkInspectionDate } from "./shared/siteCheckDateUtils";

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
        return arrayBuffer;
    } catch (error) {
        console.error('Error loading PDF template:', error);
        throw new Error('Failed to load PDF template: ' + error.message);
    }
};

const ApplianceCheckRow = React.memo(({ check, disabled, onChange }) => {
    return (
        <tr>
            <td>{check.question}</td>
            <td>
                <input
                    type="radio"
                    name={`appliance-${check.id}-satisfactory`}
                    checked={check.satisfactory === true}
                    onChange={() => onChange(check.id, 'satisfactory', true)}
                    disabled={disabled}
                />
            </td>
            <td>
                <input
                    type="radio"
                    name={`appliance-${check.id}-satisfactory`}
                    checked={check.satisfactory === false}
                    onChange={() => onChange(check.id, 'satisfactory', false)}
                    disabled={disabled}
                />
            </td>
            <td>
                <input
                    type="radio"
                    name={`appliance-${check.id}-satisfactory`}
                    checked={check.satisfactory === null}
                    onChange={() => onChange(check.id, 'satisfactory', null)}
                    disabled={disabled}
                />
            </td>
            <td>
                <input
                    type="text"
                    className="form-control"
                    value={check.remarks || ""}
                    onChange={(e) => onChange(check.id, 'remarks', e.target.value)}
                    disabled={disabled}
                />
            </td>
        </tr>
    );
});

const SafetyCheckRow = React.memo(({ check, disabled, onChange }) => {
    const handleChange = (field, value) => {
        onChange(check.id, field, value);
    };

    return (
        <tr>
            <td>{check.question}</td>
            <td>
                <input
                    type="radio"
                    name={`safety-${check.id}-satisfactory`}
                    checked={check.satisfactory === true}
                    onChange={() => handleChange('satisfactory', true)}
                    disabled={disabled}
                />
            </td>
            <td>
                <input
                    type="radio"
                    name={`safety-${check.id}-satisfactory`}
                    checked={check.satisfactory === false}
                    onChange={() => handleChange('satisfactory', false)}
                    disabled={disabled}
                />
            </td>
            <td>
                <input
                    type="radio"
                    name={`safety-${check.id}-satisfactory`}
                    checked={check.satisfactory === null}
                    onChange={() => handleChange('satisfactory', null)}
                    disabled={disabled}
                />
            </td>
            <td>
                {check.id === 8 ? (
                    <select
                        className="form-control"
                        value={check.result || ""}
                        onChange={(e) => handleChange('result', e.target.value)}
                        disabled={disabled}
                    >
                        <option value="">Select Result</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                    </select>
                ) : (
                    <input
                        type="text"
                        className="form-control"
                        value={check.remarks || ""}
                        onChange={(e) => handleChange('remarks', e.target.value)}
                        disabled={disabled}
                    />
                )}
            </td>
        </tr>
    );
});

const GasBoilerService = ({
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
    const license = JSON.parse(localStorage.getItem("license"));
    const [sasToken, setSasToken] = useState('');
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        registeredBusinessRegNo: "",
        rentedAccommodation: "",
        workDescription: "",
        engineer: loggedInUserData?.id || "",
        user: loggedInUserData || {},
        assetId: "",
        selectedAsset: null,
        comments: "",

        applianceChecks: [
            { id: 1, question: "Heat Exchanger", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 2, question: "Burner / Injectors", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 3, question: "Flame Picture", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 4, question: "Ignition", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 5, question: "Electrics", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 6, question: "Controls", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 7, question: "Leaks gas / water", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 8, question: "Gas connections", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 9, question: "Seals", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 10, question: "Pipework", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 11, question: "Fans", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 12, question: "Fireplace", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 13, question: "Closure plate & PBS10 tape", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 14, question: "Allowable location", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 15, question: "Stability", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 16, question: "Return air / Plenum", satisfactory: null, remarks: "", checkId: checkId || null },
        ],

        safetyChecks: [
            { id: 1, question: "Ventilation", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 2, question: "Flue Termination", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 3, question: "Smoke pellet flue flow test", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 4, question: "Smoke match flue flow test", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 5, question: "Working pressure", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 6, question: "Safety device", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 7, question: "Other (regulations etc)", satisfactory: null, remarks: "", checkId: checkId || null },
            { id: 8, question: "Gas tightness test performed", satisfactory: null, remarks: "", result: "", checkId: checkId || null },
        ],
        actionId: null,

        isInstallationSafe: "",
        warningNoticeRaised: "",
        installedToStandard: "",
        necessaryRemedialWork: "",
        siteContactUser: null,
        siteContact: "",
        engineerName: loggedInUserData?.name || "",
        dateTimeOfIssue: getUkLocalDateTimeInput(),
        customerSignatureDate: getUkLocalDate(),
        engineerSignatureDate: getUkLocalDate()
    });

    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
    const [showPdfButton, setShowPdfButton] = useState(false);
    const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
    const [isUploading, setIsUploading] = useState(false);
    const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
    const [isFormEditable, setIsFormEditable] = useState(true);
    const [showRiskAssessment, setShowRiskAssessment] = useState(false);
    const [actionRaised, setActionRaised] = useState(false);
    const [existingAction, setExistingAction] = useState(null);
    const [inspectionDetails, setInspectionDetails] = useState(null);
    const [folderIds, setFolderIds] = useState({
        logBooks: null,
        gasSafety: null,
        gasRecords: null
    });
    const [installationAddress, setInstallationAddress] = useState(null);
    const [postCode, setPostCode] = useState(null);

    // NEW: Site Check is authoritative for site/status and routing.
    const authoritativeSiteId = siteCheck?.siteId
        ? Number(siteCheck.siteId)
        : Number(siteSelectedForGlobal?.siteId) || null;
    const checkStatus = siteCheck?.status || inspectionDetails?.status || "Open";
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
        status: checkStatus,
        selectedEngineerId: formData.engineer,
        selectedEngineerUser: formData.user,
        lastEngineerId,
    });

    const getPostCodeFromAddress = (address) =>
        address?.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s\d[A-Z]{2}/)?.[0] || "";

    // NEW: Open = current UK date/time and logged-in engineer by default.
    useEffect(() => {
        if (checkStatus !== "Open") return;
        setFormData((prev) => ({
            ...prev,
            engineer: prev.engineer || loggedInUserData?.id || "",
            engineerName: prev.user?.name || loggedInUserData?.name || "",
            user: prev.user?.id ? prev.user : (loggedInUserData || {}),
            dateTimeOfIssue: getUkLocalDateTimeInput(),
            customerSignatureDate: getUkLocalDate(),
            engineerSignatureDate: getUkLocalDate(),
        }));
    }, [checkStatus, loggedInUserData?.id]);

    const isInternalUserTaggedWithSite = loggedInUserData?.taggedSites?.some(
        (site) => Number(site.id) === Number(authoritativeSiteId)
    );

    const isgasEngineer = (loggedInUserData?.userType === "External" && loggedInUserData.trade === "Gas Engineer");

    const selectedAsset = siteAssets.find(
        (asset) => asset.assetId === formData.assetId
    );

    useEffect(() => {
        const fetchToken = async () => {
            try {
                const token = await getSasToken();
                setSasToken(token);
            } catch (error) {
                console.error('Failed to fetch SAS token:', error);
            }
        };

        fetchToken();
    }, []);

    useEffect(() => {
        const fetchInspectionData = async () => {
            try {
                if (!checkId) return;

                setIsLoading(true);

                // First ensure we have all necessary data loaded
                if (isInternalUserTaggedWithSite && users.length === 0) {
                    await getUsers();
                }

                // Load site assets if not already loaded
                if (siteAssets.length === 0 && authoritativeSiteId) {
                    await getSiteAssets(authoritativeSiteId);
                }

                let inspectionData;
                try {
                    inspectionData = await get(`/api/site-check/gas-boiler-inspection/${checkId}`);
                } catch (error) {
                    if (error.response?.status !== 404) throw error;
                }

                // Check inspection status
                const statusResponse = await get(`/api/site-check/check-id/${checkId}`);

                const inspectionDetails = {
                    checkId: statusResponse.checkId,
                    siteId: statusResponse.siteId,
                    type: statusResponse.type,
                    subType: statusResponse.subType,
                    category: statusResponse.category,
                    dueDate: statusResponse.dueDate,
                    repeatFrequency: statusResponse.repeatFrequency,
                    status: statusResponse.status
                };
                setInspectionDetails(inspectionDetails);
                const isSubmitted = statusResponse?.status === 'Done';
                setIsSubmitted(isSubmitted);
                setIsFormEditable(!isSubmitted);

                if (inspectionData) {
                    // Find the matching asset
                    const selectedAsset = siteAssets.find(
                        asset => asset.assetId === inspectionData.assetId
                    );

                    // Find site contact user - first check if it's already an object
                    let siteContactUser;
                    if (inspectionData.siteContact && typeof inspectionData.siteContact === 'object') {
                        siteContactUser = inspectionData.siteContact;
                    } else if (inspectionData.siteContact) {
                        // If it's just an ID, find in users array
                        siteContactUser = users.find(
                            user => user.id === inspectionData.siteContact
                        );
                    }

                    //console.log('Found site contact user:', siteContactUser); // Debug log

                    // Transform safety checks to include gas tightness test result
                    const transformedSafetyChecks = inspectionData.safetyChecks?.length
                        ? inspectionData.safetyChecks.map(check => ({
                            ...check,
                            ...(check.id === 8 && {
                                result: inspectionData.gasTightnessTestResult
                            })
                        }))
                        : formData.safetyChecks.map(check => ({
                            ...check,
                            checkId: checkId
                        }));

                    const savedEngineerId = inspectionData.engineer || inspectionData.inspectionByUser?.id || null;
                    setLastEngineerId(savedEngineerId);
                    const savedEngineerUser = inspectionData.inspectionByUser ||
                        users.find((user) => String(user.id) === String(savedEngineerId)) ||
                        (savedEngineerId ? {
                            id: savedEngineerId,
                            name: inspectionData.engineerName || `Engineer ${savedEngineerId}`,
                            gasSafetyRegNo: inspectionData.gasSafetyRegNo || "",
                        } : null);
                    const isCurrentOpenInspection =
                        statusResponse?.status === "Open" &&
                        isCurrentUkInspectionDate(inspectionData.dateTimeOfIssue);

                    // Transform the data to match our form structure
                    const transformedData = {
                        ...inspectionData,
                        id: inspectionData.id || null,
                        siteContactUser: siteContactUser || null,
                        siteContact: siteContactUser?.id || inspectionData.siteContact || "",
                        dateTimeOfIssue: statusResponse?.status === "Open"
                            ? getUkLocalDateTimeInput()
                            : (inspectionData.dateTimeOfIssue || formData.dateTimeOfIssue),
                        customerSignatureDate: statusResponse?.status === "Open"
                            ? getUkLocalDate()
                            : (inspectionData.customerSignatureDate || formData.customerSignatureDate),
                        engineerSignatureDate: statusResponse?.status === "Open"
                            ? getUkLocalDate()
                            : (inspectionData.engineerSignatureDate || formData.engineerSignatureDate),
                        selectedAsset: selectedAsset || null,
                        assetId: inspectionData.assetId || (selectedAsset?.assetId || ""),
                        // Engineer mapping is completed just below after resolving the saved user.
                        engineer: statusResponse?.status === "Open"
                            ? (isCurrentOpenInspection
                                ? (savedEngineerId || loggedInUserData?.id || "")
                                : (loggedInUserData?.id || ""))
                            : (savedEngineerId || ""),
                        engineerName: statusResponse?.status === "Open"
                            ? (isCurrentOpenInspection
                                ? (savedEngineerUser?.name || loggedInUserData?.name || "")
                                : (loggedInUserData?.name || ""))
                            : (inspectionData.engineerName || savedEngineerUser?.name || ""),
                        user: statusResponse?.status === "Open"
                            ? (isCurrentOpenInspection
                                ? (savedEngineerUser || loggedInUserData || {})
                                : (loggedInUserData || {}))
                            : (savedEngineerUser || {}),
                        applianceChecks: inspectionData.applianceChecks?.length
                            ? inspectionData.applianceChecks.map(check => ({
                                ...check,
                                checkId: checkId
                            }))
                            : formData.applianceChecks.map(check => ({
                                ...check,
                                checkId: checkId
                            })),
                        safetyChecks: transformedSafetyChecks
                    };

                    setFormData(transformedData);
                    setCurrentCheckId(checkId);

                    // Check for existing action
                    if (inspectionData.actionId) {
                        const action = await fetchActionById(inspectionData.actionId);
                        setExistingAction(action);
                        setActionRaised(true);
                    }
                } else {
                    // Initialize with checkId if no existing data
                    setFormData(prev => ({
                        ...prev,
                        checkId: checkId,
                        applianceChecks: prev.applianceChecks.map(check => ({
                            ...check,
                            checkId: checkId
                        })),
                        safetyChecks: prev.safetyChecks.map(check => ({
                            ...check,
                            checkId: checkId
                        }))
                    }));
                    setCurrentCheckId(checkId);
                }
            } catch (error) {
                console.error("Error fetching inspection data:", error);
                toast.error("Failed to load inspection data");
            } finally {
                setIsLoading(false);
            }
        };
        fetchInspectionData();
    }, [checkId, siteAssets, users, sasToken, isInternalUserTaggedWithSite, authoritativeSiteId]);



    useEffect(() => {
        const fetchData = async () => {
            try {
                if (license?.companyName) {
                    setFormData(prev => ({
                        ...prev,
                        installationName: license.companyName,
                    }));
                }

                if (!siteSelectedForGlobal?.siteId) {
                    return;
                }

                setIsLoading(true); // Set loading state when starting data fetch

                const fullSiteData = await get(`/api/site/site/${siteSelectedForGlobal.siteId}`);
                const fullAddress = [
                    fullSiteData.address1,
                    fullSiteData.address2,
                    fullSiteData.city,
                    fullSiteData.area,
                    fullSiteData.postCode,
                    fullSiteData.country
                ].filter(Boolean).join(", ");

                setInstallationAddress(fullAddress);
                setPostCode(fullSiteData.postCode || "");

                if (siteSelectedForGlobal.siteContact) {
                    setFormData((prev) => ({
                        ...prev,
                        siteContact: siteSelectedForGlobal.siteContact.name || "",
                        siteContactNo: siteSelectedForGlobal.siteContact.phone || "",
                    }));
                }

                await fetchFolderStructure(siteSelectedForGlobal.siteId);
            } catch (error) {
                console.error('Error fetching site details:', error);
                toast.error('Failed to load site address details');
            } finally {
                setIsLoading(false); // Clear loading state when done
            }
        };

        fetchData();
    }, [license?.companyName, siteSelectedForGlobal?.siteId, siteSelectedForGlobal?.siteContact]);




    useEffect(() => {
        const needsRiskAssessment =
            formData.isInstallationSafe === "No";

        const isActionValid = existingAction &&
            (Number(existingAction.checkId) === Number(currentCheckId));

        setShowRiskAssessment(needsRiskAssessment);
        setActionRaised(isActionValid);
    }, [formData.isInstallationSafe, currentCheckId, existingAction]);

    useEffect(() => {
        const fetchActions = async () => {
            if (!currentCheckId) return;

            try {
                const response = await get(`/api/site/actions/${authoritativeSiteId}`);
                if (response && response.length > 0) {
                    const relevantActions = response.filter(
                        action => action.checkId === currentCheckId
                    );

                    if (relevantActions.length > 0) {
                        const mostRecent = relevantActions.sort((a, b) =>
                            new Date(b.createdAt) - new Date(a.createdAt)
                        )[0];

                        setExistingAction(mostRecent);
                        setActionRaised(true);
                        setFormData(prev => ({
                            ...prev,
                            actionId: mostRecent.actionId
                        }));
                    }
                }
            } catch (error) {
                console.error("Error fetching actions:", error);
            }
        };

        fetchActions();
    }, [currentCheckId, authoritativeSiteId]);

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

    const fetchFolderStructure = async (siteId) => {
        try {
            const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);
            if (!parentFoldersResponse?.parentFolders) {
                throw new Error('No parent folders found');
            }

            const logBooksFolder = parentFoldersResponse.parentFolders.find(
                f => f.name.trim() === '6 - Log Books'
            );
            if (!logBooksFolder) throw new Error('Log Books folder not found');

            const logBooksChildren = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);
            const gasSafetyFolder = logBooksChildren?.document?.childFolders?.find(
                f => f.name.trim() === 'Plant and Equipment'
            );
            if (!gasSafetyFolder) throw new Error('Gas Safety folder not found');

            const gasSafetyChildren = await get(`/api/document/parent/${gasSafetyFolder.id}/folders?siteId=${siteId}`);
            const gasRecordsFolder = gasSafetyChildren?.document?.childFolders?.find(
                f => f.name.trim() === 'Miscellaneous Service Documents'
            );

            const newFolderIds = {
                logBooks: logBooksFolder.id,
                gasSafety: gasSafetyFolder.id,
                gasRecords: gasRecordsFolder?.id || null
            };

            setFolderIds(newFolderIds);
            return newFolderIds.gasRecords;

        } catch (error) {
            console.error('Folder structure error:', error);
            toast.error('Failed to load document folders');
            return null;
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

    const getHighestFileVersion = async (folderId, fileName) => {
        try {
            const siteId = authoritativeSiteId;
            if (!siteId || !folderId) return 1;

            const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
            const files = response?.document?.files || [];
            const baseName = fileName.split('.')[0];
            const matchingFiles = files.filter(file =>
                file.name && file.name.startsWith(baseName)
            );

            if (matchingFiles.length > 0) {
                const versions = matchingFiles.map(f => f.fileVersion || 1);
                return Math.max(...versions) + 1;
            }
            return 1;
        } catch (error) {
            console.error('Error checking file versions:', error);
            return 1;
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

    const uploadPdfToServer = async (pdfBlob, fileName, dateTimeOverride = null) => {
        try {
            setIsUploading(true);
            await savePdfToLocal(pdfBlob, fileName);

            const targetFolderId = folderIds.boilerService || await fetchFolderStructure(authoritativeSiteId);
            if (!targetFolderId) {
                throw new Error('Could not determine target folder for PDF upload');
            }

            const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
            const uploadFormData = new FormData();

            const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

            if (exists && existingFile) {
                uploadFormData.append('file', pdfFile);
                const documentRequest = {
                    folderId: targetFolderId,
                    files: [{
                        id: existingFile.id,
                        name: fileName,
                        originalFileName: fileName,
                        fileVersion: existingFile.fileVersion + 1,
                        siteId: authoritativeSiteId,
                        issueDate: formatDateForBackend(dateTimeOverride || formData.dateTimeOfIssue),
                        expiryDate: formatDateForBackend(calculateExpiryDate(dateTimeOverride || formData.dateTimeOfIssue, inspectionDetails?.repeatFrequency)),
                        uploaderUserId: loggedInUserData?.id,
                        reviewerUserId: loggedInUserData?.id,
                        referenceNumber: `GBS-${new Date().getTime()}`
                    }]
                };

                uploadFormData.append('documentRequestString', JSON.stringify(documentRequest));
                const response = await axios.put(
                    '/api/document/file/newVersion/upload',
                    uploadFormData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (response.data) {
                    toast.success(`PDF updated successfully as version ${documentRequest.files[0].fileVersion}`);
                    return true;
                }
            } else {
                uploadFormData.append('files', pdfFile);
                const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

                const documentRequest = {
                    folderId: targetFolderId,
                    files: [{
                        name: fileName.split('.')[0],
                        originalFileName: fileName,
                        fileVersion: fileVersion,
                        siteId: authoritativeSiteId,
                        issueDate: formatDateForBackend(dateTimeOverride || formData.dateTimeOfIssue),
                        expiryDate: formatDateForBackend(calculateExpiryDate(dateTimeOverride || formData.dateTimeOfIssue, inspectionDetails?.repeatFrequency)),
                        uploaderUserId: loggedInUserData?.id,
                        reviewerUserId: loggedInUserData?.id,
                        referenceNumber: `GBS-${new Date().getTime()}`
                    }]
                };

                uploadFormData.append('documentRequestString', JSON.stringify(documentRequest));
                const response = await axios.post(
                    '/api/document/files/upload',
                    uploadFormData,
                    {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                            'Authorization': `Bearer ${localStorage.getItem('token')}`
                        }
                    }
                );

                if (response.data) {
                    toast.success(`PDF uploaded successfully as version ${fileVersion}`);
                    return true;
                }
            }
            throw new Error('Upload failed: No response data');
        } catch (error) {
            console.error('Error uploading PDF:', error);
            //toast.error('Failed to upload PDF: ' + error.message);
            return false;
        } finally {
            setIsUploading(false);
        }
    };




    const generatePDF = async (uploadToServer = true, dateTimeOverride = null) => {
        try {
            setIsGeneratingPDF(true);
            if (!PDFLib) {
                PDFLib = await import('pdf-lib');
            }

            const pdfBytes = await fetchPdfTemplate();
            const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
            const form = pdfDoc.getForm();

            const setTextField = (fieldName, value, fontSize = 8) => {
                try {
                    const field = form.getTextField(fieldName);
                    if (field) {
                        field.setText(value || '');
                        if (field.setFontSize) {
                            field.setFontSize(fontSize);
                        }
                    }
                } catch (error) {
                    console.warn(`Error setting field ${fieldName}:`, error.message);
                }
            };

            const setCheckbox = (fieldName, isChecked) => {
                try {
                    const field = form.getCheckBox(fieldName);
                    if (field) {
                        if (isChecked) {
                            field.check();
                        } else {
                            field.uncheck();
                        }
                    } else {
                        console.warn(`Checkbox not found: ${fieldName}`);
                    }
                } catch (error) {
                    console.warn(`Error setting checkbox ${fieldName}:`, error.message);
                }
            };
            // Use the selected/saved engineer and the date/time currently held by the form controls.
            const effectiveEngineer = selectedEngineer || (formData.user?.id ? formData.user : null) || loggedInUserData || {};
            const effectiveDateTimeOfIssue = dateTimeOverride || formData.dateTimeOfIssue;
            const effectiveEngineerPostCode = getPostCodeFromAddress(effectiveEngineer?.companyAddress);

            // Set form data in PDF

            const addressLines = (installationAddress || '').split(',');
            console.log('Address lines:', addressLines);
            setTextField('Address_1', (addressLines[0] + ',' + addressLines[1]).trim() || ''); // Street and house number
            setTextField('Address_2', (addressLines[2] + ',' + addressLines[3]).trim() || ''); // City and region
            setTextField('Address_3', (addressLines[4] + ',' + addressLines[5]).trim() || ''); // Postal code and country

            setTextField('Name', license?.companyName || '');
            setTextField('Reg No', formData.registeredBusinessRegNo || '');
            // OLD: Gas engineer details always came from loggedInUserData.
            // NEW: Use the selected engineer.
            setTextField('Gas Engineer', effectiveEngineer?.name || '');
            setTextField('gasSafeNo', effectiveEngineer?.gasSafetyRegNo || '');
            setTextField('Company', effectiveEngineer?.companyName || '');
            setTextField('Address', effectiveEngineer?.companyAddress || '');
            setTextField('Post Code', postCode || '');
            setTextField('PostCode', effectiveEngineerPostCode || '');
            setTextField('Rented', formData.rentedAccommodation);
            setTextField('Date  Time of Issue', formatDate(effectiveDateTimeOfIssue));
            setTextField('Work Description', formData.workDescription);

            // Appliance Details
            setTextField('Make', selectedAsset?.manufacturer || '');
            setTextField('Type', selectedAsset?.subCategory2 || '');
            setTextField('Model', selectedAsset?.model || '');
            setTextField('Location', [
                selectedAsset?.position,
                selectedAsset?.floor,
                selectedAsset?.room
            ].filter(Boolean).join(' - ') || '');

            const comment = (formData.comments || '').split(',');
            setTextField('CommentsMake', comment[0] || '');
            setTextField('CommentsType', comment[1] || '');
            setTextField('CommentsModel', comment[2] || '');
            setTextField('CommentsLocation', comment[3] || '');
            // Appliance Checks - Updated to use checkbox fields with new naming pattern
            formData.applianceChecks.forEach((check) => {
                const baseName = `Appliance_${check.id}`;

                // Set checkboxes for Yes/No/NA
                setCheckbox(`${baseName}_Yes`, check.satisfactory === true);
                setCheckbox(`${baseName}_Noo`, check.satisfactory === false);  // Note the double 'o' in Noo
                setCheckbox(`${baseName}_N/A`, check.satisfactory === null);   // Note the slash in N/A

                // Set remarks text field
                setTextField(`${baseName}_Remarks`, check.remarks || '');
            });

            // Safety Checks - Updated to use checkbox fields with new naming pattern
            formData.safetyChecks.forEach((check) => {
                const baseName = `Safety_${check.id}`;

                // Set checkboxes for Yes/No/NA
                setCheckbox(`${baseName}_Yes`, check.satisfactory === true);
                setCheckbox(`${baseName}_No`, check.satisfactory === false);  // Note the double 'o' in Noo
                setCheckbox(`${baseName}_NA`, check.satisfactory === null);   // Note the slash in N/A

                // Special handling for gas tightness test (id 8)
                if (check.id === 8) {
                    setTextField(`${baseName}_Result`, check.result || '');
                } else {
                    setTextField(`${baseName}_Remarks`, check.remarks || '');
                }
            });



            // Findings
            setCheckbox('Check Box1', formData.isInstallationSafe === 'Yes');
            setCheckbox('Check Box2', formData.isInstallationSafe === 'No');
            setCheckbox('Check Box3', formData.warningNoticeRaised === 'Yes');
            setCheckbox('Check Box4', formData.warningNoticeRaised === 'No');
            setCheckbox('Check Box5', formData.installedToStandard === 'Yes');
            setCheckbox('Check Box6', formData.installedToStandard === 'No');

            // Remedial Work
            const remedialWork = (formData.necessaryRemedialWork || '').split(',');
            setTextField('remedialWork', remedialWork[0] || '');
            setTextField('remedialWork2', remedialWork[1] || '');
            setTextField('remedialWork3', remedialWork[2] || '');
            setTextField('remedialWork4', remedialWork[3] || '');
            setTextField('remedialWork5', remedialWork[4] || '');
            setTextField('remedialWork6', remedialWork[5] || '');

            // Signatures
            setTextField('Print Name', formData.siteContactUser?.name);
            setTextField('Date', formatDate(formData.customerSignatureDate));
            setTextField('Print Name_2', effectiveEngineer?.name || formData.engineerName || '');
            setTextField('Date_2', formatDate(dateTimeOverride ? getUkLocalDate() : formData.engineerSignatureDate));

            if (effectiveEngineer?.signature) {
                try {
                    const signatureUrl = `${effectiveEngineer.signature}?${sasToken}`;
                    const signatureResponse = await fetch(signatureUrl);
                    const signatureImageBytes = await signatureResponse.arrayBuffer();

                    let signatureImage;
                    try {
                        signatureImage = await pdfDoc.embedPng(signatureImageBytes);
                    } catch (pngError) {
                        try {
                            signatureImage = await pdfDoc.embedJpg(signatureImageBytes);
                        } catch (jpgError) {
                            console.warn('Signature image is neither PNG nor JPG:', jpgError);
                            return;
                        }
                    }

                    const signatureField = form.getButton('signature_af_image');
                    if (signatureField) {
                        signatureField.setImage(signatureImage);
                    }
                } catch (error) {
                    console.warn('Error setting signature image:', error);
                }
            }

            form.flatten();
            const pdfBytesModified = await pdfDoc.save();
            const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
            const fileName = `GasBoilerService_${selectedAsset.assetName || 'report'}.pdf`;

            setGeneratedPdfBlob(blob);
            setShowPdfButton(true);

            if (uploadToServer) {
                await uploadPdfToServer(blob, fileName, effectiveDateTimeOfIssue);
            }

            return { success: true, fileName };
        } catch (error) {
            console.error('Error generating PDF:', error);
            return { success: false, error: error.message };
        } finally {
            setIsGeneratingPDF(false);
        }
    };
    const handleRiskAssessmentComplete = async (actionResponse) => {
        try {
            if (!actionResponse?.actionId) {
                throw new Error("Invalid action response received");
            }

            // First verify the action exists
            const verifiedAction = await fetchActionById(actionResponse.actionId);
            if (!verifiedAction) {
                throw new Error("Failed to verify created action");
            }

            // Update action with checkId if we have one
            if (currentCheckId && !verifiedAction.checkId) {
                await put(`/api/site/actions/${verifiedAction.actionId}`, {
                    ...verifiedAction,
                    checkId: currentCheckId
                });
                verifiedAction.checkId = currentCheckId;
            }

            // Update all states
            setExistingAction(verifiedAction);
            setActionRaised(true);
            setFormData(prev => ({
                ...prev,
                actionId: verifiedAction.actionId
            }));

            // Save the inspection data with actionId
            const inspectionPayload = {
                ...formData,
                siteId: authoritativeSiteId,
                checkId: currentCheckId,
                actionId: verifiedAction.actionId,
                engineer: formData.engineer,
                engineerName: formData.user?.name || formData.engineerName,
                inspectionByUser: formData.user || selectedEngineer || loggedInUserData,
                dateTimeOfIssue: formData.dateTimeOfIssue,
                engineerSignatureDate: formData.engineerSignatureDate,
                customerSignatureDate: formData.customerSignatureDate,
                type: 'Inspection',
                subType: 'Gas Boiler',
                category: 'Gas Boiler Service'
            };

            if (formData.id) {
                await put(`/api/site-check/gas-boiler-inspection/${formData.id}`, inspectionPayload);
            } else if (currentCheckId) {
                await post("/api/site-check/gas-boiler-inspection", inspectionPayload);
            }

            toast.success(`Action #${verifiedAction.actionId} successfully created and linked`);
        } catch (error) {
            console.error("Error handling risk assessment completion:", error);
            toast.error(error.message || "Failed to process action completion");
            setActionRaised(false);
            setExistingAction(null);
            setFormData(prev => ({ ...prev, actionId: null }));
        }
    };

    const handleInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value,
        }));
    };

    const handleAssetSelect = (event, newValue) => {
        setFormData(prev => ({
            ...prev,
            selectedAsset: newValue || null,
            assetId: newValue?.assetId || ""
        }));
    };



    // NEW: Shared Gas Engineer selection. Related Gas Safe/business/signature
    // details follow the selected engineer rather than the logged-in user.
    const handleEngineerSelect = (event, newValue) => {
        setFormData((prev) => ({
            ...prev,
            engineer: newValue?.id || "",
            engineerName: newValue?.name || "",
            user: newValue || {},
            registeredBusinessRegNo: newValue?.gasSafetyRegNo || prev.registeredBusinessRegNo,
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isLoading) {
            toast.error('Form is currently processing, please wait');
            return;
        }

        if (!isFormEditable) {
            toast.error('This form is not editable');
            return;
        }

        if (!installationAddress) {
            toast.error('Installation address is required');
            return;
        }

        if (!formData.engineer || !selectedEngineer) {
            toast.error('Please select an active engineer for this Site Check.');
            return;
        }

        // Add validation for required fields
        if (!formData.selectedAsset) {
            toast.error('Please select a boiler asset');
            return;
        }

        setIsLoading(true);

        try {
            // Open status only controls the default date/time shown in the form; Submit uses the three controls.
            let existingInspection = null;
            if (currentCheckId) {
                try {
                    const inspections = await get(`/api/site-check/gas-safety-inspection/${currentCheckId}`);
                    existingInspection = inspections?.length > 0 ? inspections[0] : null;
                } catch (error) {
                    console.error('Error checking for existing inspection:', error);
                }
            }
            // First create/update the site check record
            const statusPayload = {
                siteId: authoritativeSiteId,
                type: siteCheck?.type || 'Inspection',
                // OLD: subType/category used internal inspection values.
                // NEW: preserve the UI route.
                subType: siteCheck?.subType || 'Gas',
                category: siteCheck?.category || 'Boiler Service / Maintenance Checklist',
                status: 'Done',
                startDate: new Date().toISOString(),
                dueDate: formatDateForBackend(calculateExpiryDate(formData.dateTimeOfIssue, inspectionDetails?.repeatFrequency)),
                leadUserID: loggedInUserData?.id,
                assistantUserID: loggedInUserData?.id
            };

            let checkIdToUse = currentCheckId;
            const statusResponse = checkIdToUse
                ? await put(`/api/site-check/${checkIdToUse}`, statusPayload)
                : await post('/api/site-check', statusPayload);

            if (!checkIdToUse && statusResponse?.checkId) {
                checkIdToUse = statusResponse.checkId;
                setCurrentCheckId(checkIdToUse);
            }

            // Prepare inspection payload
            const inspectionPayload = {
                ...formData,
                installationAddress,
                siteId: authoritativeSiteId,
                checkId: checkIdToUse,
                siteContact: formData.siteContactUser?.id || formData.siteContact,
                actionId: existingAction?.actionId || null,
                registeredBusinessRegNo: formData.registeredBusinessRegNo,
                rentedAccommodation: formData.rentedAccommodation,
                engineer: formData.engineer,
                engineerName: selectedEngineer?.name || formData.engineerName,
                dateTimeOfIssue: formData.dateTimeOfIssue,
                customerSignatureDate: formData.customerSignatureDate,
                engineerSignatureDate: formData.engineerSignatureDate,
                // Include all check data
                applianceChecks: formData.applianceChecks.map(check => ({
                    id: check.id,
                    checkId: check.checkId || checkIdToUse || 0,
                    question: check.question,
                    satisfactory: check.satisfactory,
                    remarks: check.remarks
                })),
                safetyChecks: formData.safetyChecks.map(check => ({
                    id: check.id,
                    checkId: check.checkId || checkIdToUse || 0,
                    question: check.question,
                    satisfactory: check.satisfactory,
                    remarks: check.remarks,
                    result: check.id === 8 ? check.result : undefined
                })),
                // OLD: inspectionByUser was always loggedInUserData.
                // NEW: save the selected engineer.
                inspectionByUser: selectedEngineer || formData.user || loggedInUserData || {},
                gasTightnessTestResult: formData.safetyChecks.find(c => c.id === 8)?.result || null
            };


            let saveResponse;
            if (existingInspection) {
                saveResponse = await put(
                    `/api/site-check/gas-boiler-inspection/${currentCheckId}`,
                    inspectionPayload
                );
            } else {
                saveResponse = await post(
                    `/api/site-check/gas-boiler-inspection`,
                    inspectionPayload
                );
            }

            if (![200, 201, 204].includes(saveResponse?.status)) {
                throw new Error('Failed to save inspection data');
            }

            // Generate and upload PDF
            const pdfResult = await generatePDF(true);
            if (!pdfResult.success) {
                console.error("PDF generation/upload failed");
            }

            toast.success("Inspection submitted successfully");
            setIsSubmitted(true);
            setIsFormEditable(false);

        } catch (error) {
            console.error("Submission error:", error);
            toast.error(error.message || "Failed to submit inspection");
        } finally {
            setIsLoading(false);
        }
    };

    // Update the CheckRow component like this:


    const handleApplianceCheckChange = useCallback((id, field, value) => {
        setFormData(prevState => ({
            ...prevState,
            applianceChecks: prevState.applianceChecks.map(check =>
                check.id === id
                    ? { ...check, [field]: value }
                    : check
            )
        }));
    }, []);

    const handleSafetyCheckChange = useCallback((id, field, value) => {
        setFormData(prevState => ({
            ...prevState,
            safetyChecks: prevState.safetyChecks.map(check =>
                check.id === id
                    ? { ...check, [field]: value }
                    : check
            )
        }));
    }, []);



    const renderSiteContactField = () => {
        // Get contact name from either siteContactUser object or siteSelectedForGlobal
        const getContactName = () => {
            if (formData.siteContactUser?.name) return formData.siteContactUser.name;
            if (typeof formData.siteContact === 'object') return formData.siteContact.name;
            if (siteSelectedForGlobal?.siteContact?.name) return siteSelectedForGlobal.siteContact.name;
            return '';
        };

        if (isInternalUserTaggedWithSite) {
            const filteredUsers =
                users?.filter((user) =>
                    user.taggedSites?.some(
                        (site) => Number(site.id) === Number(authoritativeSiteId)
                    )
                ) || [];

            // Get current value for Autocomplete
            const getCurrentValue = () => {
                if (formData.siteContactUser) return formData.siteContactUser;
                if (typeof formData.siteContact === 'object') return formData.siteContact;
                if (formData.siteContact) {
                    return filteredUsers.find(user => user.id === formData.siteContact) || null;
                }
                return null;
            };

            return (
                <Autocomplete
                    options={filteredUsers}
                    getOptionLabel={(user) => user.name}
                    value={getCurrentValue()}
                    onChange={(event, newValue) => {
                        setFormData(prev => ({
                            ...prev,
                            siteContact: newValue?.id || "",
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
                    disabled={!isFormEditable || isSubmitted}
                />
            );
        }

        return (
            <input
                type="text"
                className="form-control"
                name="siteContact"
                value={getContactName()}
                onChange={(e) => {
                    setFormData((prev) => ({
                        ...prev,
                        siteContact: e.target.value,
                        siteContactName: e.target.value,
                    }));
                }}
                required
                disabled={!isFormEditable || isSubmitted}
            />
        );
    };

    const filteredAssets =
        siteAssets?.filter(
            (asset) =>
                asset.category === "Mechanical" &&
                asset.subCategory === "Central Heating" &&
                asset.subCategory2 === "Boiler"
        ) || [];

    return (
        <div className="container mt-4 mb-5">
            <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
                <h4 className="mb-0">Gas Boiler Service Report</h4>
            </div>

            {!isFormEditable && (
                <div className="alert alert-warning" role="alert">
                    <i className="bi bi-exclamation-triangle-fill me-2"></i>
                    This form is read-only because the check has been marked as completed.
                </div>
            )}
            <form onSubmit={handleSubmit}>
                {/* Address and Business Details Section */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Address and Business Details</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={license?.companyName}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Inspection Address</label>
                                    <textarea
                                        className="form-control"
                                        rows={3}
                                        value={installationAddress}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Post Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={postCode}
                                        disabled
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Registration Number</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.registeredBusinessRegNo}
                                        onChange={(e) => setFormData({ ...formData, registeredBusinessRegNo: e.target.value })}
                                        disabled={!isFormEditable || isSubmitted}
                                    />
                                </div>
                                {/* =========================================================
                                    OLD GAS ENGINEER FIELD - COMMENTED FOR REVIEW

                                <div className="mb-3">
                                    <label className="form-label">Gas Engineer Name</label>
                                    <input type="text" className="form-control" value={loggedInUserData?.name || ""} disabled />
                                </div>

                                ========================================================= */}

                                {/* NEW SHARED ENGINEER CONTROL - MATCHES AIR CONDITIONING */}
                                <SiteCheckEngineerSelector
                                    options={engineerOptions}
                                    value={selectedEngineer}
                                    onChange={handleEngineerSelect}
                                    isOpen={checkStatus === "Open"}
                                    disabled={isSubmitted || !isFormEditable}
                                    loading={isLoadingEngineers}
                                    error={engineerLoadError}
                                    label="Gas Engineer Name"
                                />
                                <div className="mb-3">
                                    <label className="form-label">Gas Safe Registration No</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedEngineer?.gasSafetyRegNo || formData.user?.gasSafetyRegNo || ""}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Company Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedEngineer?.companyName || formData.user?.companyName || ""}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Company Address</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={selectedEngineer?.companyAddress || formData.user?.companyAddress || ""}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Post Code</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={
                                            getPostCodeFromAddress(selectedEngineer?.companyAddress || formData.user?.companyAddress) || ""
                                        }
                                        disabled
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Rented Accommodation</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.rentedAccommodation}
                                        onChange={(e) => setFormData({ ...formData, rentedAccommodation: e.target.value })}
                                        disabled={!isFormEditable || isSubmitted}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Date & Time of Issue</label>
                                    <input
                                        type="datetime-local"
                                        className="form-control"
                                        value={formData.dateTimeOfIssue}
                                        onChange={(e) => setFormData({ ...formData, dateTimeOfIssue: e.target.value })}
                                        disabled={!isFormEditable || isSubmitted}
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Signature</label>
                                    <br />
                                    <img
                                        width="200"
                                        height="50"
                                        style={{ border: "1px solid" }}
                                        src={(selectedEngineer?.signature || formData.user?.signature || "") + "?" + sasToken}
                                        alt="Signature"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Work Description</label>
                            <textarea
                                className="form-control"
                                rows={5}
                                value={formData.workDescription}
                                onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
                                disabled={!isFormEditable || isSubmitted}
                            />
                        </div>
                    </div>
                </div>

                {/* Appliance Details Section */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Appliance Details</h5>
                    </div>
                    <div className="card-body">
                        <div className="row mb-4">
                            <div className="col-md-12">
                                <Autocomplete
                                    disabled={!isFormEditable || isSubmitted}
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
                                            label="Select a Boiler"
                                            variant="outlined"
                                            placeholder="Search boilers..."
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
                                        <label className="form-label">Manufacturer</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="manufacturer"
                                            value={selectedAsset.manufacturer}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Model Number</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="modelNumber"
                                            value={selectedAsset.model}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Asset ID</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={selectedAsset.assetId}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.selectedAsset && (
                            <div className="row">
                                <div className="col-md-12">
                                    <div className="mb-3">
                                        <label className="form-label">Location</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={`${selectedAsset.assetName} - ${selectedAsset.manufacturer} , Asset No-${formData.assetId} - ${selectedAsset.position}, ${selectedAsset.floor}, ${selectedAsset.room}`}
                                            disabled
                                        />
                                    </div>
                                </div>
                            </div>
                        )}

                        {formData.selectedAsset && (
                            <div className="row">
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Make</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            value={selectedAsset.manufacturer}
                                            disabled
                                        />
                                    </div>
                                </div>
                                <div className="col-md-4">
                                    <div className="mb-3">
                                        <label className="form-label">Type</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="type"
                                            value={selectedAsset.subCategory2}
                                            disabled
                                        />
                                    </div>
                                </div>

                                <div className="mb-3">
                                    <label className="form-label">Comments</label>
                                    <textarea
                                        className="form-control"
                                        rows={4}
                                        value={formData.comments}
                                        onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                                        disabled={!isFormEditable || isSubmitted}
                                    />
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Appliance Checks Section */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Appliance Checks</h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                <tr>
                                    <th>Check</th>
                                    <th>Yes</th>
                                    <th>No</th>
                                    <th>N/A</th>
                                    <th>Defect Found / Remedial Action Taken</th>
                                </tr>
                                </thead>
                                <tbody>
                                {formData.applianceChecks.map((check) => (
                                    <ApplianceCheckRow
                                        key={`appliance-${check.id}`}
                                        check={check}
                                        disabled={!isFormEditable || isSubmitted}
                                        onChange={handleApplianceCheckChange}
                                    />
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Safety Checks Section */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Safety Checks</h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <thead>
                                <tr>
                                    <th>Check</th>
                                    <th>Yes</th>
                                    <th>No</th>
                                    <th>N/A</th>
                                    <th>Defect Found / Remedial Action Taken</th>
                                </tr>
                                </thead>
                                <tbody>
                                {formData.safetyChecks.map((check) => (
                                    <SafetyCheckRow
                                        key={`safety-${check.id}`}
                                        check={check}
                                        disabled={!isFormEditable || isSubmitted}
                                        onChange={handleSafetyCheckChange}
                                    />
                                ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Findings Section */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Findings</h5>
                    </div>
                    <div className="card-body">
                        <div className="table-responsive">
                            <table className="table table-bordered">
                                <tbody>
                                <tr>
                                    <td>Is the installation and appliance safe to use?</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={formData.isInstallationSafe === 'Yes'}
                                            onChange={() => setFormData({ ...formData, isInstallationSafe: 'Yes' })}
                                            disabled={!isFormEditable || isSubmitted}
                                        /> Yes
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={formData.isInstallationSafe === 'No'}
                                            onChange={() => setFormData({ ...formData, isInstallationSafe: 'No' })}
                                            disabled={!isFormEditable || isSubmitted}
                                        /> No
                                    </td>
                                </tr>
                                <tr>
                                    <td>If No, has a gas warning notice been raised and warning labels or stickers attached?</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={formData.warningNoticeRaised === 'Yes'}
                                            onChange={() => setFormData({ ...formData, warningNoticeRaised: 'Yes' })}
                                            disabled={!isFormEditable || isSubmitted}
                                        /> Yes
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={formData.warningNoticeRaised === 'No'}
                                            onChange={() => setFormData({ ...formData, warningNoticeRaised: 'No' })}
                                            disabled={!isFormEditable || isSubmitted}
                                        /> No
                                    </td>
                                </tr>
                                <tr>
                                    <td>Has the installation been carried out to the relevant standard / manufacturers instructions?</td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={formData.installedToStandard === 'Yes'}
                                            onChange={() => setFormData({ ...formData, installedToStandard: 'Yes' })}
                                            disabled={!isFormEditable || isSubmitted}
                                        /> Yes
                                    </td>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={formData.installedToStandard === 'No'}
                                            onChange={() => setFormData({ ...formData, installedToStandard: 'No' })}
                                            disabled={!isFormEditable || isSubmitted}
                                        /> No
                                    </td>
                                </tr>
                                </tbody>
                            </table>
                        </div>

                        <div className="mb-3">
                            <label className="form-label">Necessary remedial work required:</label>
                            <textarea
                                className="form-control"
                                rows={3}
                                value={formData.necessaryRemedialWork}
                                onChange={(e) => setFormData({ ...formData, necessaryRemedialWork: e.target.value })}
                                disabled={!isFormEditable || isSubmitted}
                            />
                        </div>
                    </div>
                </div>

                {/* Signatures Section */}
                <div className="card mb-4">
                    <div className="card-header">
                        <h5 className="mb-0">Signatures</h5>
                    </div>
                    <div className="card-body">
                        <div className="row">
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Customer Name</label>
                                    {renderSiteContactField()}
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Customer Signature Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formatDate(formData.customerSignatureDate)}
                                        onChange={(e) => setFormData({ ...formData, customerSignatureDate: e.target.value })}
                                        disabled={!isFormEditable || isSubmitted}
                                    />
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div className="mb-3">
                                    <label className="form-label">Engineer Name</label>
                                    <input
                                        type="text"
                                        className="form-control"
                                        value={formData.engineerName}
                                        disabled
                                    />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Engineer Signature Date</label>
                                    <input
                                        type="date"
                                        className="form-control"
                                        value={formatDate(formData.engineerSignatureDate)}
                                        onChange={(e) => setFormData({ ...formData, engineerSignatureDate: e.target.value })}
                                        disabled={!isFormEditable || isSubmitted}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {showRiskAssessment && (
                    <div className="card mb-4">
                        <div className="card-header">
                            <h5 className="mb-0">Risk Assessment</h5>
                            {existingAction && (
                                <span className="badge bg-success ms-2">
                  Action #{existingAction.actionId} - {existingAction.status}
                </span>
                            )}
                        </div>
                        <div className="card-body">
                            {existingAction ? (
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
                                    desc={`Inspection - Gas - Gas Boiler Service`}
                                    siteId={siteSelectedForGlobal?.siteId}
                                    checkId={currentCheckId}
                                    createdBy={loggedInUserData?.id}
                                    taggedAsset={formData.selectedAsset?.assetId}
                                    onRiskAssessmentComplete={handleRiskAssessmentComplete}
                                    actionRaised={actionRaised}
                                    disabled={!isFormEditable || isSubmitted}
                                />
                            )}
                        </div>
                    </div>
                )}

                {!isSubmitted ? (
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={
                            isLoading ||
                            isGeneratingPDF ||
                            (showRiskAssessment && !actionRaised) ||
                            !isFormEditable ||
                            isSubmitted  // Add this
                            || !isgasEngineer
                        }
                    >
                        {isLoading ? 'Submitting...' : 'Submit Report'}
                    </button>
                ) : (
                    <div className="alert alert-success">
                        Report submitted successfully on {formatDate(formData.engineerSignatureDate)}
                    </div>
                )}
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
})(GasBoilerService);