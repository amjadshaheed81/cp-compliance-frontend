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
    engineer: loggedInUserData?.id || "",
    // Appliance Details
    assetId: "",
    selectedAsset: null,
    comments: "",
    postCode: "",

    // Appliance Checks - Now as an array
    applianceChecks: [
      { id: 1, question: "Heat Exchanger", satisfactory: null, remarks: "" },
      { id: 2, question: "Burner / Injectors", satisfactory: null, remarks: "" },
      { id: 3, question: "Flame Picture", satisfactory: null, remarks: "" },
      { id: 4, question: "Ignition", satisfactory: null, remarks: "" },
      { id: 5, question: "Electrics", satisfactory: null, remarks: "" },
      { id: 6, question: "Controls", satisfactory: null, remarks: "" },
      { id: 7, question: "Leaks gas / water", satisfactory: null, remarks: "" },
      { id: 8, question: "Gas connections", satisfactory: null, remarks: "" },
      { id: 9, question: "Seals", satisfactory: null, remarks: "" },
      { id: 10, question: "Pipework", satisfactory: null, remarks: "" },
      { id: 11, question: "Fans", satisfactory: null, remarks: "" },
      { id: 12, question: "Fireplace", satisfactory: null, remarks: "" },
      { id: 13, question: "Closure plate & PBS10 tape", satisfactory: null, remarks: "" },
      { id: 14, question: "Allowable location", satisfactory: null, remarks: "" },
      { id: 15, question: "Stability", satisfactory: null, remarks: "" },
      { id: 16, question: "Return air / Plenum", satisfactory: null, remarks: "" },
    ],

    // Safety Checks - Now as an array
    safetyChecks: [
      { id: 1, question: "Ventilation", satisfactory: null, remarks: "" },
      { id: 2, question: "Flue Termination", satisfactory: null, remarks: "" },
      { id: 3, question: "Smoke pellet flue flow test", satisfactory: null, remarks: "" },
      { id: 4, question: "Smoke match flue flow test", satisfactory: null, remarks: "" },
      { id: 5, question: "Working pressure", satisfactory: null, remarks: "" },
      { id: 6, question: "Safety device", satisfactory: null, remarks: "" },
      { id: 7, question: "Other (regulations etc)", satisfactory: null, remarks: "" },
      {
        id: 8,
        question: "Gas tightness test performed",
        satisfactory: null,
        remarks: "",
        result: "" // Additional field for this specific check
      },
    ],
    actionId: null,

    // Findings
    isInstallationSafe: "",
    warningNoticeRaised: "",
    installedToStandard: "",

    // Remedial Work
    necessaryRemedialWork: "",

    // Signatures
    siteContact: "",
    customerSignatureDate: new Date().toISOString().split("T")[0],
    engineerName: loggedInUserData?.name || "",
    engineerSignatureDate: new Date().toISOString().split("T")[0],

    // Additional fields for functionality
    clientUser: null,
    siteContactUser: null,
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
    miscellaneousService: null,
    sounderAudibility: null
  });


  const [checkStatus, setCheckStatus] = useState('Open');
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const navigate = useNavigate();

  const isInternalUserTaggedWithSite =
    loggedInUserData?.taggedSites?.some(
      (site) => site.id === siteSelectedForGlobal?.siteId
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


  // Effect to fetch inspection data when checkId changes
  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        if (!checkId) return;

        if (isInternalUserTaggedWithSite && users.length === 0) {
          await getUsers();
        }

        const apiData = await get(`/api/site-check/gas-boiler-inspection/${checkId}`);
        if (apiData && apiData.length > 0) {
          const mostRecentItem = apiData[0]; // Assuming the first item is the most recent


          // Transform the API data back into our form structure
          const transformedData = {
            // Address and Business Details
            installationAddress: mostRecentItem.installationAddress,
            registeredBusinessRegNo: mostRecentItem.registeredBusinessRegNo,
            rentedAccommodation: mostRecentItem.rentedAccommodation,
            dateTimeOfIssue: mostRecentItem.dateTimeOfIssue,
            workDescription: mostRecentItem.workDescription,
            engineer: mostRecentItem.engineer,

            // Appliance Details
            assetId: mostRecentItem.assetId,
            selectedAsset: siteAssets.find(asset => asset.assetId === mostRecentItem.assetId),

            // Appliance Checks
            applianceChecks: mostRecentItem.applianceChecks || formData.applianceChecks.map(check => ({
              ...check,
              satisfactory: mostRecentItem[`applianceCheck${check.id}`]?.satisfactory,
              remarks: mostRecentItem[`applianceCheck${check.id}`]?.remarks
            })),

            // Safety Checks
            safetyChecks: mostRecentItem.safetyChecks || formData.safetyChecks.map(check => ({
              ...check,
              satisfactory: mostRecentItem[`safetyCheck${check.id}`]?.satisfactory,
              remarks: mostRecentItem[`safetyCheck${check.id}`]?.remarks,
              ...(check.id === 8 && { result: mostRecentItem.gasTightnessTestResult })
            })),

            // Findings
            isInstallationSafe: mostRecentItem.isInstallationSafe,
            warningNoticeRaised: mostRecentItem.warningNoticeRaised,
            installedToStandard: mostRecentItem.installedToStandard,
            necessaryRemedialWork: mostRecentItem.necessaryRemedialWork,

            // Signatures
            siteContact: mostRecentItem.siteContact,
            customerSignatureDate: mostRecentItem.customerSignatureDate,
            engineerName: mostRecentItem.engineerName,
            engineerSignatureDate: mostRecentItem.engineerSignatureDate,

            // Metadata
            actionId: mostRecentItem.actionId
          };

          setFormData(transformedData);
          setInspectionDetails(mostRecentItem);
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
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

      if (parentFoldersResponse?.parentFolders?.length > 0) {
        const logBooksFolder = parentFoldersResponse.parentFolders.find(
          folder => folder.name.trim() === 'Log Books'
        );

        if (logBooksFolder) {
          const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

          if (logBooksResponse?.document?.childFolders) {
            const plantAndEquipmentFolder = logBooksResponse.document.childFolders.find(
              folder => folder.name.trim() === 'Plant and Equipment'
            );

            if (plantAndEquipmentFolder) {
              const plantAndEquipmentResponse = await get(
                `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
              );

              if (plantAndEquipmentResponse?.document?.childFolders) {
                const miscellaneousFolder = plantAndEquipmentResponse.document.childFolders.find(
                  folder => folder.name.trim() === 'Miscellaneous Service'
                );

                if (miscellaneousFolder) {
                  const miscResponse = await get(
                    `/api/document/parent/${miscellaneousFolder.id}/folders?siteId=${siteId}`
                  );

                  if (miscResponse?.document?.childFolders) {
                    const sounderAudibilityFolder = miscResponse.document.childFolders.find(
                      folder => folder.name.trim() === 'Documents'
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
          // Address and Business Details
          installationAddress: formData.installationAddress,
          registeredBusinessRegNo: formData.registeredBusinessRegNo,
          rentedAccommodation: formData.rentedAccommodation,
          dateTimeOfIssue: formData.dateTimeOfIssue,
          workDescription: formData.workDescription,
          engineer: formData.engineer,

          // Appliance Details
          assetId: formData.assetId,
          manufacturer: formData.selectedAsset?.manufacturer || "",
          model: formData.selectedAsset?.model || "",
          location: `${formData.selectedAsset?.position}, ${formData.selectedAsset?.floor}, ${formData.selectedAsset?.room}`,

          // Appliance Checks
          applianceChecks: formData.applianceChecks.map(check => ({
            id: check.id,
            question: check.question,
            satisfactory: check.satisfactory,
            remarks: check.remarks
          })),

          // Safety Checks
          safetyChecks: formData.safetyChecks.map(check => ({
            id: check.id,
            question: check.question,
            satisfactory: check.satisfactory,
            remarks: check.remarks,
            ...(check.id === 8 && { result: check.result }) // Special field for gas tightness test
          })),

          // Findings
          isInstallationSafe: formData.isInstallationSafe,
          warningNoticeRaised: formData.warningNoticeRaised,
          installedToStandard: formData.installedToStandard,
          necessaryRemedialWork: formData.necessaryRemedialWork,

          // Signatures
          siteContact: formData.siteContact,
          customerSignatureDate: formData.customerSignatureDate,
          engineerName: formData.engineerName,
          engineerSignatureDate: formData.engineerSignatureDate,

          // Metadata
          siteId: siteSelectedForGlobal?.siteId,
          type: "Inspection",
          subType: "Gas Boiler",
          category: "Gas Boiler Service",
          checkId: currentCheckId,
          actionId: formData.actionId
        };

        const existingInspections = await get(`/api/site-check/gas-boiler-inspection/${currentCheckId}`);
        if (existingInspections?.length > 0) {
          await put(`/api/site-check/gas-boiler-inspection/${currentCheckId}`, inspectionPayload);
        } else {
          await post(`/api/site-check/gas-boiler-inspection`, inspectionPayload);
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
          const inspections = await get(`/api/site-check/gas-boiler-inspection/${currentCheckId}`);
          existingInspection = inspections?.length > 0 ? inspections[0] : null;
        } catch (error) {
          console.error('Error checking for existing inspection:', error);
        }
      }

      const statusPayload = {
        siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
        type: "Inspection",
        subType: "Gas Boiler",
        category: "Gas Boiler Service",
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
        // Address and Business Details
        installationAddress: formData.installationAddress,
        registeredBusinessRegNo: formData.registeredBusinessRegNo,
        rentedAccommodation: formData.rentedAccommodation,
        dateTimeOfIssue: formData.dateTimeOfIssue,
        workDescription: formData.workDescription,
        engineer: formData.engineer,

        // Appliance Details
        assetId: formData.assetId,
        manufacturer: formData.selectedAsset?.manufacturer || "",
        model: formData.selectedAsset?.model || "",
        location: `${formData.selectedAsset?.position}, ${formData.selectedAsset?.floor}, ${formData.selectedAsset?.room}`,

        // Appliance Checks
        applianceChecks: formData.applianceChecks.map(check => ({
          id: check.id,
          question: check.question,
          satisfactory: check.satisfactory,
          remarks: check.remarks
        })),

        // Safety Checks
        safetyChecks: formData.safetyChecks.map(check => ({
          id: check.id,
          question: check.question,
          satisfactory: check.satisfactory,
          remarks: check.remarks,
          ...(check.id === 8 && { result: check.result }) // Special field for gas tightness test
        })),

        // Findings
        isInstallationSafe: formData.isInstallationSafe,
        warningNoticeRaised: formData.warningNoticeRaised,
        installedToStandard: formData.installedToStandard,
        necessaryRemedialWork: formData.necessaryRemedialWork,

        // Signatures
        siteContact: formData.siteContact,
        customerSignatureDate: formData.customerSignatureDate,
        engineerName: formData.engineerName,
        engineerSignatureDate: formData.engineerSignatureDate,

        // Metadata
        siteId: siteSelectedForGlobal?.siteId,

        checkId: currentCheckId,
        actionId: formData.actionId
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
  const generatePDF = async (uploadToServer = true) => {
    try {
      setIsGeneratingPDF(true);

      if (!PDFLib) {
        PDFLib = await import('pdf-lib');
      }

      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      //const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const form = pdfDoc.getForm();

      // Helper function to set text fields
      const setTextField = (fieldName, value, fontSize = 8) => {
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
          } else {
            console.warn(`Field not found: ${fieldName}`);
          }
        } catch (error) {
          console.warn(`Error setting field ${fieldName}:`, error.message);
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

      // In the generatePDF function, update the checkbox setting logic:
      const setCheckboxFields = (checks, prefix) => {
        checks.forEach(check => {
          const baseFieldName = `${prefix}_${check.id}`; // Simplified field name structure

          // Clear all options first
          setCheckbox(`${baseFieldName}_Yes`, false);
          setCheckbox(`${baseFieldName}_No`, false);
          setCheckbox(`${baseFieldName}_NA`, false);

          // Set the appropriate checkbox based on satisfactory value
          if (check.satisfactory === true) {
            setCheckbox(`${baseFieldName}_Yes`, true);
          } else if (check.satisfactory === false) {
            setCheckbox(`${baseFieldName}_No`, true);
          } else {
            setCheckbox(`${baseFieldName}_NA`, true);
          }

          // Set remarks or result
          if (check.id === 8) { // Special case for gas tightness test
            setTextField(`${baseFieldName}_Result`, check.result || '');
          } else {
            setTextField(`${baseFieldName}_Remarks`, check.remarks || '');
          }
        });
      };

      // Call with proper prefixes
      setCheckboxFields(formData.applianceChecks, 'Appliance');
      setCheckboxFields(formData.safetyChecks, 'Safety');


      // Address and Business Details
      const addressLines = (formData.installationAddress || '').split(',');
      setTextField('Address', addressLines[0] || '',);
      setTextField('Address_2', addressLines[1] || '',);
      setTextField('Address_3', addressLines[2] || '',);

      setTextField('Name', license?.name || '',);


      setTextField('Reg No', formData.registeredBusinessRegNo || '');
      setTextField('Gas Engineer', loggedInUserData?.name || '');
      setTextField('Gas Safe Registered Engineer No', loggedInUserData?.gasSafeRegNo || '');
      setTextField('Company', loggedInUserData.companyName || '');
      setTextField('Address', loggedInUserData?.companyAddress || '');
      setTextField('Post Code', formData.postCode || '');
      setTextField('postCode', loggedInUserData?.companyAddress?.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s\d[A-Z]{2}/)?.[0] || '');
      setCheckbox('Rented Accommodation', formData.rentedAccommodation);
      setTextField('Date  Time of Issue', formatDate(formData.dateTimeOfIssue));
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
      setCheckbox('check1', formData.isInstallationSafe === 'Yes');
      setCheckbox('check2', formData.isInstallationSafe === 'No');

      setCheckbox('check3', formData.warningNoticeRaised === 'Yes');
      setCheckbox('check4', formData.warningNoticeRaised === 'No');

      setCheckbox('check5', formData.installedToStandard === 'Yes');
      setCheckbox('check6', formData.installedToStandard === 'No');

      // Remedial Work
      const remedialWork = (formData.necessaryRemedialWork || '').split(',');
      setTextField('remedialWork', remedialWork[0] || '');
      setTextField('remedialWork2', remedialWork[1] || '');
      setTextField('remedialWork3', remedialWork[2] || '');
      setTextField('remedialWork4', remedialWork[3] || '');
      setTextField('remedialWork5', remedialWork[4] || '');
      setTextField('remedialWork6', remedialWork[5] || '');

      // Signatures
      // setTextField('Customer Signature', formData.customerName);
      setTextField('Print Name', formData.customerName);
      setTextField('Date', formatDate(formData.customerSignatureDate));


      setTextField('Print Name_2', formData.engineerName);
      setTextField('Date_2', formatDate(formData.engineerSignatureDate));

      if (loggedInUserData?.signature) {
        try {
          const signatureUrl = `${loggedInUserData.signature}?${sasToken}`;
          const signatureResponse = await fetch(signatureUrl);
          const signatureImageBytes = await signatureResponse.arrayBuffer();

          let signatureImage;

          // Try PNG first, then JPG if that fails
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


  const CheckRow = ({ check, onCheckChange, disabled, prefix }) => {
    const handleRadioChange = (value) => {
      onCheckChange(check.id, value, check.remarks || check.result || "");
    };

    const handleRemarksChange = (e) => {
      onCheckChange(check.id, check.satisfactory, e.target.value);
    };

    return (
      <tr>
        <td>{check.question}</td>
        <td>
          <input
            type="radio"
            name={`${prefix}-check-${check.id}`}  // Add prefix here
            checked={check.satisfactory === true}
            onChange={() => handleRadioChange(true)}
            disabled={disabled}
          />
        </td>
        <td>
          <input
            type="radio"
            name={`${prefix}-check-${check.id}`}  // Add prefix here
            checked={check.satisfactory === false}
            onChange={() => handleRadioChange(false)}
            disabled={disabled}
          />
        </td>
        <td>
          <input
            type="radio"
            name={`${prefix}-check-${check.id}`}  // Add prefix here
            checked={check.satisfactory === null}
            onChange={() => handleRadioChange(null)}
            disabled={disabled}
          />
        </td>
        <td>
          {check.id === 8 ? (
            <select
              className="form-control"
              value={check.result}
              onChange={handleRemarksChange}
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
              value={check.remarks}
              onChange={handleRemarksChange}
              disabled={disabled}
            />
          )}
        </td>
      </tr>
    );
  };


  const handleApplianceCheckChange = (id, satisfactory, remarksOrResult = "") => {
    setFormData(prev => {
      const updatedChecks = prev.applianceChecks.map(check => {
        if (check.id === id) {
          return { ...check, satisfactory, remarks: remarksOrResult };
        }
        return check;
      });
      return { ...prev, applianceChecks: updatedChecks };
    });
  };

  const handleSafetyCheckChange = (id, satisfactory, remarksOrResult = "") => {
    setFormData(prev => {
      const updatedChecks = prev.safetyChecks.map(check => {
        if (check.id === id) {
          if (id === 8) { // Gas tightness test
            return { ...check, satisfactory, result: remarksOrResult };
          }
          return { ...check, satisfactory, remarks: remarksOrResult };
        }
        return check;
      });
      return { ...prev, safetyChecks: updatedChecks };
    });
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
              clientName: newValue?.name || "",
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
        value={formData.siteContact}
        onChange={handleInputChange}
        required
        disabled={isSubmitted}
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
                      value={selectedAsset.manufacturer}
                      required
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
                      onChange={handleInputChange}
                      required
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
                    disabled={isSubmitted}
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
                  {formData.applianceChecks.map(check => (
                    <CheckRow
                      key={`appliance-${check.id}`}
                      check={check}
                      onCheckChange={handleApplianceCheckChange}
                      disabled={isSubmitted}
                      prefix="appliance"  // Add this
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
                  {formData.safetyChecks.map(check => (
                    <CheckRow
                      key={`safety-${check.id}`}
                      check={check}
                      onCheckChange={handleSafetyCheckChange}
                      disabled={isSubmitted}
                      prefix="safety"  // Add this
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
                  {renderSiteContactField()}
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
                    (showRiskAssessment && !actionRaised) || !isgasEngineer
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