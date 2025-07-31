import React, { useState, useEffect } from "react";
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
import { Autocomplete, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import { v4 as uuidv4 } from 'uuid';
import pdfTemplate from './pdf/GasBoilerService.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
}) => {
  const license = JSON.parse(localStorage.getItem("license"));

  const [formData, setFormData] = useState({
    // Address and Business Details
    installationAddress: "",
    registeredBusinessRegNo: "",
    rentedAccommodation: "",
    dateTimeOfIssue: new Date().toISOString().split("T")[0],
    workDescription: "",
    engineerSignature: "",

    // Appliance Details
    assetId: "",

    // Appliance Checks
    heatExchanger: { checked: false, defect: "" },
    burnerInjectors: { checked: false, defect: "" },
    flamePicture: { checked: false, defect: "" },
    ignition: { checked: false, defect: "" },
    electrics: { checked: false, defect: "" },
    controls: { checked: false, defect: "" },
    leaksGasWater: { checked: false, defect: "" },
    gasConnections: { checked: false, defect: "" },
    seals: { checked: false, defect: "" },
    pipework: { checked: false, defect: "" },
    fans: { checked: false, defect: "" },
    fireplace: { checked: false, defect: "" },
    closurePlatePBS10Tape: { checked: false, defect: "" },
    allowableLocation: { checked: false, defect: "" },
    stability: { checked: false, defect: "" },
    returnAirPlenum: { checked: false, defect: "" },

    // Safety Checks
    ventilation: { checked: false, defect: "" },
    flueTermination: { checked: false, defect: "" },
    smokePelletFlueFlowTest: { checked: false, defect: "" },
    smokeMatchFlueFlowTest: { checked: false, defect: "" },
    workingPressure: { checked: false, defect: "" },
    safetyDevice: { checked: false, defect: "" },
    otherRegulations: { checked: false, defect: "" },
    gasTightnessTestPerformed: { checked: false, result: "" },

    // Findings
    isInstallationSafe: "",
    warningNoticeRaised: "",
    installedToStandard: "",

    // Remedial Work
    necessaryRemedialWork: "",

    // Signatures
    customerName: "",
    customerSignatureDate: new Date().toISOString().split("T")[0],
    engineerName: loggedInUserData?.name || "",
    engineerSignatureDate: new Date().toISOString().split("T")[0],

    // Additional fields for functionality
    selectedAsset: null,
    clientUser: null,
    siteContactUser: null,
    actionId: null,
    uploadedPhotos: [],
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [inspectionDetails, setInspectionDetails] = useState(null);
  const [sasToken, setSasToken] = useState('');
  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    plantAndEquipment: null,
    gasBoilerService: null
  });
  const [checkStatus, setCheckStatus] = useState('Open');
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const navigate = useNavigate();

  const isInternalUserTaggedWithSite =
    (loggedInUserData?.userType === "External" && loggedInUserData.trade === "Gas Engineer") &&
    loggedInUserData?.taggedSites?.some(
      (site) => site.id === siteSelectedForGlobal?.siteId
    );

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


  // Effect to fetch inspection data when checkId changes
  useEffect(() => {
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
            (user) => user.id === mostRecentItem.engineer
          );
          const siteContactUser = users.find(
            (user) => user.id === mostRecentItem.siteContact
          );

          // Load photos from parameters
          const photosFromApi = [];
          for (let i = 2; i <= 5; i++) {
            const paramKey = `param${i}Remark`;
            const photoUrl = mostRecentItem[paramKey];
            if (photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('http')) {
              photosFromApi.push({
                url: `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}${sasToken}`,
                paramKey
              });
            }
          }

          setUploadedPhotos(photosFromApi);

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
            signedDate: mostRecentItem.signedDate || prev.signedDate,
            siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
            jobNo: mostRecentItem.jobNo || prev.jobNo,
            engineersReport: mostRecentItem.engineersReport || prev.engineersReport,
            param1: mostRecentItem.param1 || prev.param1,
            param2: mostRecentItem.param2 || prev.param2,
            param3: mostRecentItem.param3 || prev.param3,
            param4: mostRecentItem.param4 || prev.param4,
            param5: mostRecentItem.param5 || prev.param5,
            param6: mostRecentItem.param6 || prev.param6,
            param1Remark: mostRecentItem.param1Remark || prev.param1Remark,
            param2Remark: mostRecentItem.param2Remark || prev.param2Remark,
            param3Remark: mostRecentItem.param3Remark || prev.param3Remark,
            param4Remark: mostRecentItem.param4Remark || prev.param4Remark,
            param5Remark: mostRecentItem.param5Remark || prev.param5Remark,
            client: mostRecentItem.client || "",
            engineer: mostRecentItem.engineer || prev.engineer || loggedInUserData?.id,
            user: engineerUser || loggedInUserData || prev.user,
            selectedAsset: selectedAsset || prev.selectedAsset,
            clientDate: mostRecentItem.clientDate || prev.clientDate,
            engineerDate: mostRecentItem.engineerDate || prev.engineerDate,
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

    fetchInspectionData();
  }, [checkId, siteAssets, users, sasToken]);

  useEffect(() => {
    const fetchData = async () => {
      // Set company name from license if available
      if (license?.companyName) {
        setFormData((prev) => ({
          ...prev,
          installationName: license.companyName,
        }));
      }

      // Return early if no site ID is selected
      if (!siteSelectedForGlobal?.siteId) {
        return;
      }

      try {
        // Fetch complete site data from API
        const fullSiteData = await get(`/api/site/site/${siteSelectedForGlobal.siteId}`);

        // Construct address parts array, filtering out any undefined/empty values
        const addressParts = [
          fullSiteData.address1,
          fullSiteData.address2,
          fullSiteData.city,
          fullSiteData.area,
          fullSiteData.postCode,
          fullSiteData.country // Now guaranteed to come from the API response
        ].filter(part => part && part.trim() !== '');

        // Join address parts with commas
        const fullAddress = addressParts.join(", ");

        // Update form data with the complete address
        setFormData((prev) => ({
          ...prev,
          postCode: fullSiteData.postCode || "",
          installationAddress: fullAddress,
        }));

        // // Optional: Log the address parts for debugging
        // console.log('Complete address parts:', {
        //   address1: fullSiteData.address1,
        //   address2: fullSiteData.address2,
        //   city: fullSiteData.city,
        //   area: fullSiteData.area,
        //   postCode: fullSiteData.postCode,
        //   country: fullSiteData.country
        // });

      } catch (error) {
        console.error('Error fetching site details:', error);
        toast.error('Failed to load site address details');
      }
    };

    fetchData();
  }, [license?.companyName, siteSelectedForGlobal?.siteId]); // Added siteId to dependency array

  // Function to fetch action by ID
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

  // Function to fetch existing actions for the current check
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

      if (!siteSelectedForGlobal?.siteId || !currentCheckId) return;

      const response = await get(`/api/site/actions/${siteSelectedForGlobal.siteId}`);
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

  // Function to fetch folder structure for document storage
  const fetchFolderStructure = async (siteId) => {
    try {
      // First, get all parent folders for the site
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

      if (parentFoldersResponse?.parentFolders?.length > 0) {
        // Find the Log Books folder
        const logBooksFolder = parentFoldersResponse.parentFolders.find(
          folder => folder.name.trim() === 'Log Books'
        );

        if (logBooksFolder) {
          // Get the contents of Log Books folder
          const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

          if (logBooksResponse?.document?.childFolders) {
            // Find the Electrical Management folder
            const electricalManagementFolder = logBooksResponse.document.childFolders.find(
              folder => folder.name.trim() === 'Plant and Equipment'
            );

            if (electricalManagementFolder) {
              // Get the contents of Electrical Management folder
              const electricalResponse = await get(
                `/api/document/parent/${electricalManagementFolder.id}/folders?siteId=${siteId}`
              );

              if (electricalResponse?.document?.childFolders) {
                // Find the External Lighting folder
                const externalLightingFolder = electricalResponse.document.childFolders.find(
                  folder => folder.name.trim() === 'Water Heater Inspection'
                );

                // Update state with all found folder IDs
                setFolderIds({
                  logBooks: logBooksFolder.id,
                  electricalManagement: electricalManagementFolder.id,
                  externalLighting: externalLightingFolder?.id || null
                });

                return externalLightingFolder?.id || null;
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

  // Handler for risk assessment completion
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
          siteId: siteSelectedForGlobal?.siteId,
          type: 'Inspection',
          subType: 'Water Heater',
          category: 'Water Heater Service',
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

  // Generic input change handler
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Function to save PDF locally
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
  const formatDateForBackend = (dateString) => {
    if (!dateString) return null; // Handle missing date

    // Convert to Date object (works for ISO strings like "2025-08-23T00:00:00")
    const date = new Date(dateString);

    // Format as "YYYY-MM-DD HH:MM:SS" (same as issueDate)
    return date.toISOString().replace('T', ' ').split('.')[0];
  };

  // Function to upload PDF to server
  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);
      const savedLocally = await savePdfToLocal(pdfBlob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const targetFolderId = folderIds.externalLighting;

      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      // First check if file exists
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
            expiryDate: formatDateForBackend(inspectionDetails?.dueDate),
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `WHR-${new Date().getTime()}`
          }]
        };

        formData.append('documentRequestString', JSON.stringify(documentRequestString));
        const response = await axios({
          method: 'put',
          url: '/api/document/file/newVersion/upload',
          data: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json'
          }
        });

        if (response.data) {
          toast.success(`PDF uploaded successfully as version ${documentRequestString.files[0].fileVersion}!`);
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
            expiryDate: formatDateForBackend(inspectionDetails?.dueDate),
            note: 'Water Heater Service Report',
            fileVersion: fileVersion,
            siteId: siteSelectedForGlobal?.siteId || 0,
            originalFileName: fileName,
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `WHR-${new Date().getTime()}`
          }]
        };

        formData.append('documentRequestString', JSON.stringify(documentRequestString));
        const response = await axios({
          method: 'post',
          url: '/api/document/files/upload',
          data: formData,
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
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to check if file exists
  const checkFileExists = async (folderId, fileName) => {
    try {
      const siteId = siteSelectedForGlobal?.siteId;
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

  // Function to get highest file version
  const getHighestFileVersion = async (folderId, fileName) => {
    try {
      const siteId = siteSelectedForGlobal?.siteId;
      if (!siteId) {
        console.warn('No site ID available for file version check');
        return 1;
      }

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

  // Handler for photo upload
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);

    try {
      // Determine available parameters
      const availableParams = [];
      for (let i = 2; i <= 5; i++) {
        const paramKey = `param${i}Remark`;
        if (!formData[paramKey]) {
          availableParams.push(paramKey);
        }
      }

      const filesToUpload = files.slice(0, availableParams.length);
      const token = sasToken || await getSasToken();

      const uploadResults = await Promise.all(
        filesToUpload.map(async (file, index) => {
          const response = await uploadSiteCheckDoc({
            siteId: siteSelectedForGlobal?.siteId || 0,
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

      const formUpdates = uploadResults.reduce((acc, photo) => {
        acc[photo.paramKey] = photo.url;
        return acc;
      }, {});

      setFormData(prev => ({
        ...prev,
        ...formUpdates
      }));

      setUploadedPhotos(prev => [
        ...prev,
        ...uploadResults
      ].slice(0, 4));

      // Save to API
      if (currentCheckId) {
        const payload = {
          checkId: currentCheckId,
          siteId: siteSelectedForGlobal?.siteId,
          type: 'Inspection',
          subType: 'Water Heater',
          category: 'Water Heater Service',
          ...formUpdates
        };

        const existingInspections = await get(`/api/site-check/generic-inspection/${currentCheckId}`);
        if (existingInspections?.length > 0) {
          await put(`/api/site-check/generic-inspection/${currentCheckId}`, payload);
        } else {
          await post(`/api/site-check/generic-inspection`, payload);
        }
      }

      toast.success("Photos uploaded successfully!");
    } catch (error) {
      console.error("Photo upload error:", error);
      toast.error(error.message || 'Upload failed');
    } finally {
      setUploadingPhotos(false);
    }
  };

  // Handler for removing photos
  const handleRemovePhoto = (index) => {
    const photoToRemove = uploadedPhotos[index];

    setUploadedPhotos(prev => prev.filter((_, i) => i !== index));

    if (photoToRemove.paramKey) {
      setFormData(prev => ({
        ...prev,
        [photoToRemove.paramKey]: ""
      }));
    }

    if (currentCheckId && photoToRemove.paramKey) {
      const payload = {
        checkId: currentCheckId,
        siteId: siteSelectedForGlobal?.siteId,
        type: 'Inspection',
        subType: 'Water Heater',
        category: 'Water Heater Service',
        [photoToRemove.paramKey]: ""
      };

      put(`/api/site-check/generic-inspection/${currentCheckId}`, payload)
        .catch(error => {
          console.error("Error removing photo from API:", error);
          toast.error("Failed to update photo in database");
        });
    }
  };

  // Handler for asset selection
  const handleAssetSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      selectedAsset: newValue || null,
      manufacturer: newValue?.manufacturer || "",
      modelNumber: newValue?.model || "",
      position: newValue?.position || "",
      floor: newValue?.floor || "",
      room: newValue?.room || "",
      assetId: newValue?.assetId || "",
    }));
  };

  // Form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    if (isLoading) {
      console.log('Submit prevented: Already loading');
      return;
    }

    const hasFailures = formData.param2 === "Pass" && formData.param4 === "Fail" && formData.param5 === "Pass";

    if (hasFailures && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    if (!isFormEditable) {
      console.log('Submit prevented: Form is not editable');
      return;
    }

    const errors = {};

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
        siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
        type: 'Inspection',
        subType: 'Water Heater',
        category: 'Water Heater Service',
        status: 'Done',
        startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
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
        siteId: siteSelectedForGlobal?.siteId,
        assetId: formData.selectedAsset?.assetId || formData.assetId || null,
        client: formData.clientUser?.id || formData.client,
        engineer: formData.engineer,
        siteContact: formData.siteContactUser?.id || formData.siteContact,
        type: 'Inspection',
        subType: 'Water Heater',
        category: 'Water Heater Service',
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

      toast.success("Water Heater Service report saved and PDF generated successfully!");
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

  // Function to render client name field based on user type
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
          setFormData({
            ...formData,
            client: e.target.value,
            clientNameText: e.target.value,
            siteContact: e.target.value,
            siteContactName: e.target.value,
          });
        }}
        required
        disabled={isSubmitted}
      />
    );
  };

  // Function to render site contact field based on user type
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
          setFormData({
            ...formData,
            siteContact: e.target.value,
            siteContactName: e.target.value,
            client: e.target.value,
            clientNameText: e.target.value,
          });
        }}
        required
        disabled={isSubmitted}
      />
    );
  };

  const generatePDF = async (uploadToServer = true) => {
    try {
      setIsGeneratingPDF(true);

      if (!PDFLib) {
        PDFLib = await import('pdf-lib');
      }

      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const form = pdfDoc.getForm();

      // Helper function to set text fields
      const setTextField = (fieldName, value) => {
        try {
          const field = form.getTextField(fieldName);
          if (field) {
            field.setText(value || '');
          }
        } catch (error) {
          console.warn(`Error setting text field ${fieldName}:`, error);
        }
      };

      // Helper function to set checkbox fields
      const setCheckbox = (fieldName, isChecked) => {
        try {
          const field = form.getCheckBox(fieldName);
          if (field) {
            isChecked ? field.check() : field.uncheck();
          }
        } catch (error) {
          console.warn(`Error setting checkbox ${fieldName}:`, error);
        }
      };

      // Address and Business Details
      setTextField('Inspection Address', formData.installationAddress);
      setTextField('Registered Business Name', formData.registeredBusinessName);
      setTextField('Reg No', formData.registeredBusinessRegNo);
      setTextField('Gas Engineer', formData.gasEngineerName);
      setTextField('Gas Safe Registered Engineer No', formData.gasSafeRegNo);
      setTextField('Company', formData.companyName);
      setTextField('Company Address', formData.companyAddress);
      setTextField('Post Code', formData.postCode);
      setCheckbox('Rented Accommodation', formData.rentedAccommodation);
      setTextField('Date & Time of Issue', formatDate(formData.dateTimeOfIssue));
      setTextField('Work Description', formData.workDescription);
      setTextField('Engineers Signature', formData.engineerSignature);

      // Appliance Details
      setTextField('Make', formData.applianceMake);
      setTextField('Type', formData.applianceType);
      setTextField('Model', formData.applianceModel);
      setTextField('Location', formData.applianceLocation);

      // Appliance Checks
      setCheckbox('Heat Exchanger_Yes', formData.heatExchanger.checked);
      setCheckbox('Heat Exchanger_No', !formData.heatExchanger.checked);
      setTextField('Heat Exchanger_Defect', formData.heatExchanger.defect);
      
      // Repeat for all appliance checks...
      setCheckbox('Burner / Injectors_Yes', formData.burnerInjectors.checked);
      setCheckbox('Burner / Injectors_No', !formData.burnerInjectors.checked);
      setTextField('Burner / Injectors_Defect', formData.burnerInjectors.defect);

      // Safety Checks
      setCheckbox('Ventilation_Yes', formData.ventilation.checked);
      setCheckbox('Ventilation_No', !formData.ventilation.checked);
      setTextField('Ventilation_Defect', formData.ventilation.defect);

      // Findings
      setCheckbox('Is the installation and appliance safe to use_Yes', formData.isInstallationSafe === 'Yes');
      setCheckbox('Is the installation and appliance safe to use_No', formData.isInstallationSafe === 'No');
      
      setCheckbox('If No gas warning notice been raised_Yes', formData.warningNoticeRaised === 'Yes');
      setCheckbox('If No gas warning notice been raised_No', formData.warningNoticeRaised === 'No');
      
      setCheckbox('Has the installation been carried out to the relevant standard_Yes', formData.installedToStandard === 'Yes');
      setCheckbox('Has the installation been carried out to the relevant standard_No', formData.installedToStandard === 'No');

      // Remedial Work
      setTextField('Necessary remedial work required', formData.necessaryRemedialWork);

      // Signatures
      setTextField('Customer Signature', formData.customerName);
      setTextField('Customer Print Name', formData.customerName);
      setTextField('Customer Date', formatDate(formData.customerSignatureDate));
      
      setTextField('Engineers Signature', formData.engineerName);
      setTextField('Engineer Print Name', formData.engineerName);
      setTextField('Engineer Date', formatDate(formData.engineerSignatureDate));

      // Flatten and save
      form.flatten();
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const fileName = `GasBoilerServiceCertificate_${formData.applianceMake || 'report'}.pdf`;

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

  const handleCheckboxChange = (field, isChecked) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        checked: isChecked
      }
    }));
  };

  const handleDefectChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: {
        ...prev[field],
        defect: value
      }
    }));
  };

  const renderCheckboxRow = (label, fieldName) => {
    return (
      <tr>
        <td>{label}</td>
        <td>
          <input
            type="checkbox"
            checked={formData[fieldName].checked}
            onChange={(e) => handleCheckboxChange(fieldName, e.target.checked)}
            disabled={isSubmitted}
          />
        </td>
        <td>
          <input
            type="checkbox"
            checked={!formData[fieldName].checked}
            onChange={(e) => handleCheckboxChange(fieldName, !e.target.checked)}
            disabled={isSubmitted}
          />
        </td>
        <td>
          <input
            type="checkbox"
            disabled
          />
        </td>
        <td>
          <input
            type="text"
            className="form-control"
            value={formData[fieldName].defect}
            onChange={(e) => handleDefectChange(fieldName, e.target.value)}
            disabled={isSubmitted}
          />
        </td>
      </tr>
    );
  };

  const renderSafetyCheckboxRow = (label, fieldName) => {
    return (
      <tr>
        <td>{label}</td>
        <td>
          <input
            type="checkbox"
            checked={formData[fieldName].checked}
            onChange={(e) => handleCheckboxChange(fieldName, e.target.checked)}
            disabled={isSubmitted}
          />
        </td>
        <td>
          <input
            type="checkbox"
            checked={!formData[fieldName].checked}
            onChange={(e) => handleCheckboxChange(fieldName, !e.target.checked)}
            disabled={isSubmitted}
          />
        </td>
        <td>
          <input
            type="checkbox"
            disabled
          />
        </td>
        <td>
          <input
            type="text"
            className="form-control"
            value={formData[fieldName].defect}
            onChange={(e) => handleDefectChange(fieldName, e.target.value)}
            disabled={isSubmitted}
          />
        </td>
      </tr>
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
              {/* Left Column - Inspection Address */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={license?.companyName}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Inspection Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.installationAddress}
                    onChange={(e) => setFormData({ ...formData, installationAddress: e.target.value })}
                    disabled
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label">Post Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.postCode}
                    onChange={(e) => setFormData({ ...formData, postCode: e.target.value })}
                    disabled
                  />
                </div>
              </div>

              {/* Right Column - Registered Business Details */}
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Registration Number</label>
                  <input
                    type="text"
                    className="form-control"
                    value={formData.registeredBusinessRegNo}
                    onChange={(e) => setFormData({ ...formData, registeredBusinessRegNo: e.target.value })}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gas Engineer Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={loggedInUserData?.name || ""}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Gas Safe Registration No</label>
                  <input
                    type="text"
                    className="form-control"
                    value={loggedInUserData?.gasSafetyRegNo || ""}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Company Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={loggedInUserData?.companyName || ""}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Company Address</label>
                  <input
                    type="text"
                    className="form-control"
                    value={loggedInUserData?.companyAddress || ""}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Post Code</label>
                  <input
                    type="text"
                    className="form-control"
                    value={
                      loggedInUserData?.companyAddress?.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s\d[A-Z]{2}/)?.[0] || ""
                    }
                    disabled
                  />
                </div>
              </div>
            </div>

            {/* Bottom Row - Rented Accommodation and Date/Time */}
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Rented Accommodation</label>

                  <input
                    type="text"
                    className="form-control"
                    value={formData.rentedAccommodation}
                    onChange={(e) => setFormData({ ...formData, rentedAccommodation: e.target.value })}
                    disabled={isSubmitted}
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
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Signature</label>
                  <br />
                  <img
                    width="200"
                    height="50"
                    style={{ border: "1px solid" }}
                    src={loggedInUserData?.signature + "?" + sasToken}
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
                disabled={isSubmitted}
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
                      label="Select a Sounder Device"
                      variant="outlined"
                      placeholder="Search sounders..."
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
                      onChange={handleInputChange}
                      required
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
                      onChange={handleInputChange}
                      required
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
                      readOnly
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
                      name="make"
                      value={formData.make}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitted}

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
                      value={formData.type}
                      onChange={handleInputChange}
                      required
                      disabled={isSubmitted}
                    />
                  </div>
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
                  {renderCheckboxRow("Heat Exchanger", "heatExchanger")}
                  {renderCheckboxRow("Burner / Injectors", "burnerInjectors")}
                  {renderCheckboxRow("Flame Picture", "flamePicture")}
                  {renderCheckboxRow("Ignition", "ignition")}
                  {renderCheckboxRow("Electrics", "electrics")}
                  {renderCheckboxRow("Controls", "controls")}
                  {renderCheckboxRow("Leaks gas / water", "leaksGasWater")}
                  {renderCheckboxRow("Gas connections", "gasConnections")}
                  {renderCheckboxRow("Seals", "seals")}
                  {renderCheckboxRow("Pipework", "pipework")}
                  {renderCheckboxRow("Fans", "fans")}
                  {renderCheckboxRow("Fireplace", "fireplace")}
                  {renderCheckboxRow("Closure plate & PBS10 tape", "closurePlatePBS10Tape")}
                  {renderCheckboxRow("Allowable location", "allowableLocation")}
                  {renderCheckboxRow("Stability", "stability")}
                  {renderCheckboxRow("Return air / Plenum", "returnAirPlenum")}
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
                  {renderSafetyCheckboxRow("Ventilation", "ventilation")}
                  {renderSafetyCheckboxRow("Flue Termination", "flueTermination")}
                  {renderSafetyCheckboxRow("Smoke pellet flue flow test", "smokePelletFlueFlowTest")}
                  {renderSafetyCheckboxRow("Smoke match flue flow test", "smokeMatchFlueFlowTest")}
                  {renderSafetyCheckboxRow("Working pressure", "workingPressure")}
                  {renderSafetyCheckboxRow("Safety device", "safetyDevice")}
                  {renderSafetyCheckboxRow("Other (regulations etc)", "otherRegulations")}
                  <tr>
                    <td>Gas tightness test performed</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={formData.gasTightnessTestPerformed.checked}
                        onChange={(e) => setFormData({
                          ...formData,
                          gasTightnessTestPerformed: {
                            ...formData.gasTightnessTestPerformed,
                            checked: e.target.checked
                          }
                        })}
                        disabled={isSubmitted}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={!formData.gasTightnessTestPerformed.checked}
                        onChange={(e) => setFormData({
                          ...formData,
                          gasTightnessTestPerformed: {
                            ...formData.gasTightnessTestPerformed,
                            checked: !e.target.checked
                          }
                        })}
                        disabled={isSubmitted}
                      />
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        disabled
                      />
                    </td>
                    <td>
                      <select
                        className="form-control"
                        value={formData.gasTightnessTestPerformed.result}
                        onChange={(e) => setFormData({
                          ...formData,
                          gasTightnessTestPerformed: {
                            ...formData.gasTightnessTestPerformed,
                            result: e.target.value
                          }
                        })}
                        disabled={isSubmitted}
                      >
                        <option value="">Select Result</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
                      </select>
                    </td>
                  </tr>
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
                        onChange={() => setFormData({...formData, isInstallationSafe: 'Yes'})}
                        disabled={isSubmitted}
                      /> Yes
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={formData.isInstallationSafe === 'No'}
                        onChange={() => setFormData({...formData, isInstallationSafe: 'No'})}
                        disabled={isSubmitted}
                      /> No
                    </td>
                  </tr>
                  <tr>
                    <td>If No, has a gas warning notice been raised and warning labels or stickers attached?</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={formData.warningNoticeRaised === 'Yes'}
                        onChange={() => setFormData({...formData, warningNoticeRaised: 'Yes'})}
                        disabled={isSubmitted}
                      /> Yes
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={formData.warningNoticeRaised === 'No'}
                        onChange={() => setFormData({...formData, warningNoticeRaised: 'No'})}
                        disabled={isSubmitted}
                      /> No
                    </td>
                  </tr>
                  <tr>
                    <td>Has the installation been carried out to the relevant standard / manufacturers instructions?</td>
                    <td>
                      <input
                        type="checkbox"
                        checked={formData.installedToStandard === 'Yes'}
                        onChange={() => setFormData({...formData, installedToStandard: 'Yes'})}
                        disabled={isSubmitted}
                      /> Yes
                    </td>
                    <td>
                      <input
                        type="checkbox"
                        checked={formData.installedToStandard === 'No'}
                        onChange={() => setFormData({...formData, installedToStandard: 'No'})}
                        disabled={isSubmitted}
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
                onChange={(e) => setFormData({...formData, necessaryRemedialWork: e.target.value})}
                disabled={isSubmitted}
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
                  <input
                    type="text"
                    className="form-control"
                    value={formData.customerName}
                    onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Customer Signature Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formatDate(formData.customerSignatureDate)}
                    onChange={(e) => setFormData({...formData, customerSignatureDate: e.target.value})}
                    disabled={isSubmitted}
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
                    onChange={(e) => setFormData({...formData, engineerName: e.target.value})}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Engineer Signature Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={formatDate(formData.engineerSignatureDate)}
                    onChange={(e) => setFormData({...formData, engineerSignatureDate: e.target.value})}
                    disabled={isSubmitted}
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
                  desc={`Inspection - Gas Boiler Service`}
                  siteId={siteSelectedForGlobal?.siteId}
                  checkId={currentCheckId}
                  createdBy={loggedInUserData?.id}
                  taggedAsset={formData.selectedAsset?.assetId}
                  onRiskAssessmentComplete={handleRiskAssessmentComplete}
                  actionRaised={actionRaised}
                  disabled={isSubmitted}
                  images={''}
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
              Report submitted successfully on {new Date().toISOString().split("T")[0]}
            </div>
            {showPdfButton && generatedPdfBlob && (
              <button
                className="btn btn-success"
                onClick={() => savePdfToLocal(generatedPdfBlob, `GasBoilerServiceCertificate_${formData.applianceMake || 'report'}.pdf`)}
              >
                Download PDF
              </button>
            )}
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