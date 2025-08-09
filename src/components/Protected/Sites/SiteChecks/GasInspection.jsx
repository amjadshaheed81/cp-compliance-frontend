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
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import { v4 as uuidv4 } from 'uuid';
import pdfTemplate from './pdf/GasSafety.pdf';
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

const GasSafetyRecord = ({
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
  const [sasToken, setSasToken] = useState('');
  const navigate = useNavigate();
  const gasEngineerPostCode = loggedInUserData?.companyAddress?.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s\d[A-Z]{2}/)?.[0]

  const adminPostCode = license?.companyAddress?.match(/[A-Z]{1,2}\d{1,2}[A-Z]?\s\d[A-Z]{2}/)?.[0];

  console.log(license)
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    ref: "",
    gasSafeRegNo: loggedInUserData?.gasSafetyRegNo || "",
    serialNo: "",

    // Registered Business Details
    registeredBusinessName: loggedInUserData?.name || "",
    registeredBusinessAddress: loggedInUserData?.companyAddress || "",
    registeredBusinessPostcode: gasEngineerPostCode || "",
    registeredBusinessContact: loggedInUserData?.phone || "",

    // Landlord/Homeowner Details
    landlordName: `${license?.adminFirstName} ${license?.adminLastName}` || "",
    landlordAddress: `${license?.companyAddress}` || "",
    landlordPostcode: adminPostCode || "",
    landlordContact: `${license?.adminContact}` || "",

    // Site Details
    siteName: "",
    siteAddress: "",
    sitePostcode: "",
    siteContactNo: "",

    // Appliance Details
    assetId: "",
    selectedAsset: null,
    applianceLocation: "",
    applianceType: "",
    applianceManufacturer: "",
    applianceModel: "",
    applianceOwnedByLandlord: "Yes",
    applianceInspected: "Yes",
    flueType: "",

    // Inspection Details
    operatingPressure: "",
    safetyDevicesOperating: "Yes",
    ventilationSatisfactory: "Yes",
    flueVisualCondition: "Pass",
    flueOperationChecks: "Pass",
    combustionAnalyserReading: "",
    applianceServiced: "Yes",
    applianceSafeToUse: "Yes",

    // Final Check Results
    gasTightnessTest: "Pass",
    protectiveBonding: "Yes",
    emergencyControlAccessible: "Yes",
    pipeworkVisualInspection: "Yes",
    coAlarmFitted: "Yes",
    fireAlarmFitted: "Yes",

    // Combustion Performance Readings
    combustionLowCO: "",
    combustionLowCO2: "",
    combustionLowRatio: "",
    combustionHighCO: "",
    combustionHighCO2: "",
    combustionHighRatio: "",

    // Images
    param2: "", // Image 1
    param3: "", // Image 2
    param4: "", // Image 3
    param5: "", // Image 4

    // Signatures
    engineerName: loggedInUserData?.name || "",
    engineerSignatureDate: new Date().toISOString().split("T")[0],
    receivedByName: "",
    receivedByPosition: "",
    receivedByDate: new Date().toISOString().split("T")[0],

    nextInspectionDue: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    actionId: null
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [uploadedPhotos, setUploadedPhotos] = useState([]);
  const [existingAction, setExistingAction] = useState(null);
  const [actionRaised, setActionRaised] = useState(false);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);

  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    gasSafety: null,
    gasRecords: null
  });

  const isInternalUserTaggedWithSite = loggedInUserData?.taggedSites?.some(
    (site) => site.id === siteSelectedForGlobal?.siteId
  );

  const isGasEngineer = (loggedInUserData?.userType === "External" && loggedInUserData.trade === "Gas Engineer");

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

  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        if (!checkId) return;

        if (isInternalUserTaggedWithSite && users.length === 0) {
          await getUsers();
        }

        const apiData = await get(`/api/site-check/gas-safety-inspection/${checkId}`);
        if (apiData && apiData.length > 0) {
          const mostRecentItem = apiData[0];

          setFormData(mostRecentItem);

          // Load photos from parameters
          const photosFromApi = [];
          for (let i = 2; i <= 5; i++) {
            const paramKey = `param${i}`;
            const photoUrl = mostRecentItem[paramKey];
            if (photoUrl && typeof photoUrl === 'string' && photoUrl.startsWith('http')) {
              photosFromApi.push({
                url: `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}${sasToken}`,
                paramKey
              });
            }
          }

          setUploadedPhotos(photosFromApi);

          if (mostRecentItem.actionId) {
            const action = await fetchActionById(mostRecentItem.actionId);
            setExistingAction(action);
          }
        }
      } catch (error) {
        console.error("Error fetching inspection data:", error);
        toast.error("Failed to load inspection data");
      }
    };

    fetchInspectionData();
  }, [checkId, users, sasToken]);

  useEffect(() => {
    const hasFailures = [
      formData.flueVisualCondition,
      formData.flueOperationChecks,
      formData.gasTightnessTest,
      formData.applianceSafeToUse,
      formData.protectiveBonding,
      formData.emergencyControlAccessible,
      formData.pipeworkVisualInspection,
      formData.coAlarmFitted,
      formData.fireAlarmFitted,
      formData.safetyDevicesOperating,
      formData.ventilationSatisfactory,
      formData.applianceServiced,
    ].some(val => val === "Fail" || val === "No");

    setShowRiskAssessment(hasFailures);

    // Update actionRaised state based on existing action
    const isActionValid = existingAction && existingAction.checkId === currentCheckId;
    setActionRaised(isActionValid);


  }, [
    formData.flueVisualCondition,
    formData.flueOperationChecks,
    formData.gasTightnessTest,
    formData.applianceSafeToUse,
    currentCheckId,
    existingAction,
    formData.protectiveBonding,
    formData.emergencyControlAccessible,
    formData.pipeworkVisualInspection,
    formData.coAlarmFitted,
    formData.fireAlarmFitted,
    formData.safetyDevicesOperating,
    formData.ventilationSatisfactory,
    formData.applianceServiced
  ]);

  useEffect(() => {
    const fetchData = async () => {
      if (!siteSelectedForGlobal?.siteId) {
        return;
      }

      try {
        const fullSiteData = await get(`/api/site/site/${siteSelectedForGlobal.siteId}`);

        console.log('Full site data:', fullSiteData);
        // Set site details in form
        setFormData(prev => ({
          ...prev,
          siteName: fullSiteData.siteName || "",
          siteAddress: [
            fullSiteData.address1,
            fullSiteData.address2,
            fullSiteData.city,
            fullSiteData.area
          ].filter(part => part && part.trim() !== '').join(", "),
          sitePostcode: fullSiteData.postCode || "",
        }));

        // Set engineer details from logged in user
        if (loggedInUserData) {
          setFormData(prev => ({
            ...prev,
            registeredBusinessName: loggedInUserData.companyName || "",
            registeredBusinessAddress: loggedInUserData.companyAddress || "",
            registeredBusinessPostcode: loggedInUserData.companyPostcode || "",
            registeredBusinessContact: loggedInUserData.phone || "",
            gasSafeRegNo: loggedInUserData.gasSafeRegNo || ""
          }));
        }

        await fetchFolderStructure(siteSelectedForGlobal.siteId);
      } catch (error) {
        console.error('Error fetching site details:', error);
        toast.error('Failed to load site details');
      }
    };

    fetchData();
  }, [siteSelectedForGlobal?.siteId, loggedInUserData]);

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
          actionId: verifiedAction.actionId,
          checkId: currentCheckId,
          siteId: siteSelectedForGlobal?.siteId,
        };

        const existingInspections = await get(`/api/site-check/gas-safety-inspection/${currentCheckId}`);
        if (existingInspections?.length > 0) {
          await put(`/api/site-check/gas-safety-inspection/${currentCheckId}`, inspectionPayload);
        } else {
          await post(`/api/site-check/gas-safety-inspection`, inspectionPayload);
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

  const fetchFolderStructure = async (siteId) => {
    try {
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);
      if (!parentFoldersResponse?.parentFolders) {
        throw new Error('No parent folders found');
      }

      const logBooksFolder = parentFoldersResponse.parentFolders.find(
        f => f.name.trim() === 'Log Books'
      );
      if (!logBooksFolder) throw new Error('Log Books folder not found');

      const logBooksChildren = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);
      const gasSafetyFolder = logBooksChildren?.document?.childFolders?.find(
        f => f.name.trim() === 'Plant and Equipment'
      );
      if (!gasSafetyFolder) throw new Error('Gas Safety folder not found');

      const gasSafetyChildren = await get(`/api/document/parent/${gasSafetyFolder.id}/folders?siteId=${siteId}`);
      const gasRecordsFolder = gasSafetyChildren?.document?.childFolders?.find(
        f => f.name.trim() === 'Gas Safety Certificate'
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

  const getHighestFileVersion = async (folderId, fileName) => {
    try {
      const siteId = siteSelectedForGlobal?.siteId;
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

  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);
      await savePdfToLocal(pdfBlob, fileName);

      const targetFolderId = folderIds.gasRecords || await fetchFolderStructure(siteSelectedForGlobal?.siteId);
      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const formData = new FormData();

      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      if (exists && existingFile) {
        formData.append('file', pdfFile);
        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            id: existingFile.id,
            name: fileName,
            originalFileName: fileName,
            fileVersion: existingFile.fileVersion + 1,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `GBS-${new Date().getTime()}`
          }]
        };

        formData.append('documentRequestString', JSON.stringify(documentRequest));
        const response = await axios.put(
          '/api/document/file/newVersion/upload',
          formData,
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
        formData.append('files', pdfFile);
        const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            originalFileName: fileName,
            fileVersion: fileVersion,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `GBS-${new Date().getTime()}`
          }]
        };

        formData.append('documentRequestString', JSON.stringify(documentRequest));
        const response = await axios.post(
          '/api/document/files/upload',
          formData,
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
      toast.error('Failed to upload PDF: ' + error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    setUploadingPhotos(true);

    try {
      // Determine available parameters
      const availableParams = [];
      for (let i = 2; i <= 5; i++) {
        const paramKey = `param${i}`;
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
        acc[photo.paramKey] = photo.baseUrl;
        return acc;
      }, {});

      setFormData(prev => ({
        ...prev,
        ...formUpdates
      }));

      setUploadedPhotos(prev => [
        ...prev,
        ...uploadResults.map(photo => ({
          ...photo,
          url: `${photo.baseUrl}?${token}`
        }))
      ].slice(0, 4));

      // Save to API
      if (currentCheckId) {
        const payload = {
          checkId: currentCheckId,
          siteId: siteSelectedForGlobal?.siteId,
          type: 'Inspection',
          subType: 'Gas Safety',
          category: 'Gas Safety Record',
          ...formUpdates
        };

        const existingInspections = await get(`/api/site-check/gas-safety-inspection/${currentCheckId}`);
        if (existingInspections?.length > 0) {
          await put(`/api/site-check/gas-safety-inspection/${currentCheckId}`, payload);
        } else {
          await post("/api/site-check/gas-safety-inspection", payload);
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
        subType: 'Gas Safety',
        category: 'Gas Safety Record',
        [photoToRemove.paramKey]: ""
      };

      put(`/api/site-check/gas-safety-inspection/${currentCheckId}`, payload)
        .catch(error => {
          console.error("Error removing photo from API:", error);
          toast.error("Failed to update photo in database");
        });
    }
  };

  const selectedAsset = siteAssets.find(
    (asset) => asset.assetId === formData.assetId
  );


  const getAllImages = () => {
    return [
      formData.param2 ? {
        url: formData.param2.includes('?')
          ? formData.param2
          : `${formData.param2}?${sasToken}`,
        paramKey: 'param2'
      } : null,
      formData.param3 ? {
        url: formData.param3.includes('?')
          ? formData.param3
          : `${formData.param3}?${sasToken}`,
        paramKey: 'param3'
      } : null,
      formData.param4 ? {
        url: formData.param4.includes('?')
          ? formData.param4
          : `${formData.param4}?${sasToken}`,
        paramKey: 'param4'
      } : null,
      formData.param5 ? {
        url: formData.param5.includes('?')
          ? formData.param5
          : `${formData.param5}?${sasToken}`,
        paramKey: 'param5'
      } : null,
    ].filter(Boolean);
  };


  const handleAssetSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      assetId: newValue ? newValue.assetId : "",
      selectedAsset: newValue || null,
    }));
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
            isChecked ? field.check() : field.uncheck();
          }
        } catch (error) {
          console.warn(`Error setting checkbox ${fieldName}:`, error);
        }
      };

      // Set form data in PDF
      setTextField('Date', formatDate(formData.date));
      setTextField('Ref', formData.ref || '');
      setTextField('Gas Safe Reg No', formData.gasSafeRegNo || '');
      setTextField('Serial no', formData.serialNo || '');

      // Registered Business Details
      setTextField('Name', formData.registeredBusinessName || '');
      const businessAddressLines = (formData.registeredBusinessAddress || '').split(',');
      setTextField('Address', businessAddressLines[0] || '');
      setTextField('Address_2', businessAddressLines[1] || '');
      setTextField('Postcode', formData.registeredBusinessPostcode || '');
      setTextField('Contact Number', formData.registeredBusinessContact || '');

      // Landlord/Homeowner Details
      setTextField('Name_2', formData.landlordName || '');
      const landlordAddressLines = (formData.landlordAddress || '').split(',');
      setTextField('Address_3', landlordAddressLines[0] || '');
      setTextField('Address_4', landlordAddressLines[1] || '');
      setTextField('Postcode_2', formData.landlordPostcode || '');
      setTextField('Contact Number_2', formData.landlordContact || '');

      // Site Details
      setTextField('Name_3', formData.siteName || '');
      const siteAddressLines = (formData.siteAddress || '').split(',');
      setTextField('Address_5', siteAddressLines[0] || '');
      setTextField('Address_6', siteAddressLines[1] || '');
      setTextField('Postcode_3', formData.sitePostcode || '');
      setTextField('Contact Number_3', formData.siteContactNo || '');

      // Appliance Details
      setTextField('Location', formData.applianceLocation || '');
      setTextField('Type', formData.applianceType || '');
      setTextField('Manufacturer', formData.applianceManufacturer || '');
      setTextField('Model', formData.applianceModel || '');
      setCheckbox('Yes', formData.applianceOwnedByLandlord === "Yes");
      setCheckbox('Yes_2', formData.applianceInspected === "Yes");
      setTextField('Flue Type', formData.flueType || '');

      // Inspection Details
      setTextField('Operating Pressure', formData.operatingPressure || '');
      setCheckbox('Yes_3', formData.safetyDevicesOperating === "Yes");
      setCheckbox('Yes_4', formData.ventilationSatisfactory === "Yes");
      setTextField('Visual condition of flue & termination', formData.flueVisualCondition || '');
      setTextField('Flue operation checks', formData.flueOperationChecks || '');
      setTextField('Combustion analyser reading', formData.combustionAnalyserReading || '');
      setCheckbox('Yes_5', formData.applianceServiced === "Yes");
      setCheckbox('Yes_6', formData.applianceSafeToUse === "Yes");

      // Final Check Results
      setTextField('Outcome of gas tightness test', formData.gasTightnessTest || '');
      setCheckbox('Yes_7', formData.protectiveBonding === "Yes");
      setCheckbox('Yes_8', formData.emergencyControlAccessible === "Yes");
      setCheckbox('Yes_9', formData.pipeworkVisualInspection === "Yes");
      setCheckbox('Yes_10', formData.coAlarmFitted === "Yes");
      setCheckbox('Yes_11', formData.fireAlarmFitted === "Yes");

      // Combustion Performance Readings
      setTextField('Low', formData.combustionLowCO || '');
      setTextField('High', formData.combustionHighCO || '');
      setTextField('Low_2', formData.combustionLowCO2 || '');
      setTextField('High_2', formData.combustionHighCO2 || '');
      setTextField('Low_3', formData.combustionLowRatio || '');
      setTextField('High_3', formData.combustionHighRatio || '');

      // Next Inspection
      setTextField('Next Inspection Is Due Before', formatDate(formData.nextInspectionDue));

      // Signatures
      setTextField('Gas Engineer', formData.engineerName || '');
      setTextField('Date_2', formatDate(formData.engineerSignatureDate));
      setTextField('Name_4', formData.receivedByName || '');
      setTextField('Position', formData.receivedByPosition || '');
      setTextField('Date_3', formatDate(formData.receivedByDate));

      if (loggedInUserData?.signature) {
        try {
          const signatureUrl = `${loggedInUserData.signature}?${sasToken}`;
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

      // Handle images on second page
      if (uploadedPhotos.length > 0) {
        try {
          const pages = pdfDoc.getPages();
          if (pages.length >= 2) {
            const secondPage = pages[1];

            // Add "Accompanying Images" heading
            secondPage.drawText("Accompanying Images", {
              x: 50,
              y: 700,
              size: 14,
            });

            // Define positions for images
            const imagePositions = [
              { x: 50, y: 550, width: 200, height: 150 },  // Image 1 position
              { x: 300, y: 550, width: 200, height: 150 }, // Image 2 position
              { x: 50, y: 350, width: 200, height: 150 },  // Image 3 position
              { x: 300, y: 350, width: 200, height: 150 }  // Image 4 position
            ];

            // Process up to 4 images
            for (let i = 0; i < Math.min(uploadedPhotos.length, 4); i++) {
              const photo = uploadedPhotos[i];
              try {
                const cleanUrl = photo.url.split('?')[0];
                const imageUrlWithToken = `${cleanUrl}?${sasToken}`;

                const controller = new AbortController();
                const timeout = setTimeout(() => controller.abort(), 10000);

                const imageResponse = await fetch(imageUrlWithToken, {
                  signal: controller.signal
                });
                clearTimeout(timeout);

                if (!imageResponse.ok) {
                  console.error(`HTTP error for image ${i}: ${imageResponse.status}`);
                  continue;
                }

                const imageBytes = await imageResponse.arrayBuffer();

                if (imageBytes.byteLength < 100) {
                  console.error(`Image too small or corrupted for image ${i}`);
                  continue;
                }

                const image = await embedUniversalImage(imageBytes);
                const { x, y, width, height } = imagePositions[i];
                secondPage.drawImage(image, {
                  x,
                  y,
                  width,
                  height,
                });

              } catch (error) {
                console.error(`Error processing image ${i}:`, error);
              }
            }
          }
        } catch (error) {
          console.error('Error adding images to PDF:', error);
        }
      }

      form.flatten();
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const fileName = `GasSafetyRecord_${siteSelectedForGlobal?.siteId || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;

      setGeneratedPdfBlob(blob);
      setShowPdfButton(true);

      if (uploadToServer) {
        await uploadPdfToServer(blob, fileName);
      }

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !isFormEditable) return;

    const hasFailures = [
      formData.flueVisualCondition,
      formData.flueOperationChecks,
      formData.gasTightnessTest,
      formData.applianceSafeToUse,
      formData.protectiveBonding,
      formData.emergencyControlAccessible,
      formData.pipeworkVisualInspection,
      formData.coAlarmFitted,
      formData.fireAlarmFitted,
      formData.safetyDevicesOperating,
      formData.ventilationSatisfactory,
      formData.applianceServiced,
    ].some(val => val === "Fail" || val === "No");


    if (hasFailures && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    setIsLoading(true);

    try {
      const statusPayload = {
        siteId: siteSelectedForGlobal?.siteId,
        type: 'Inspection',
        subType: 'Gas Safety',
        category: 'Gas Safety Record',
        status: 'Done',
        startDate: new Date().toISOString(),
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

      const inspectionPayload = {
        ...formData,
        actionId: formData.actionId,
        siteId: siteSelectedForGlobal?.siteId,
        checkId: checkIdToUse
      };

      const inspectionResponse = checkIdToUse
        ? await put(`/api/site-check/gas-safety-inspection/${checkIdToUse}`, inspectionPayload)
        : await post("/api/site-check/gas-safety-inspection", inspectionPayload);

      const pdfResult = await generatePDF(true);
      if (!pdfResult.success) {
        console.error("PDF generation/upload failed");
      }

      toast.success("Gas Safety Record submitted successfully");
      setIsSubmitted(true);
      setIsFormEditable(false);

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit Gas Safety Record");
    } finally {
      setIsLoading(false);
    }
  };


  const filteredAssets =
    siteAssets?.filter(
      (asset) =>
        asset.category === "Mechanical" &&
        asset.subCategory === "Central Heating"
    ) || [];

  return (
    <div className="container mt-4 mb-5">
      <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Gas Safety Record</h4>
      </div>

      {!isFormEditable && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          This form is read-only because the check has been marked as completed.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Record Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              {/* <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Ref</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ref"
                    value={formData.ref}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div> */}
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Gas Safe Reg No</label>
                  <input
                    type="text"
                    className="form-control"
                    name="gasSafeRegNo"
                    value={loggedInUserData?.gasSafetyRegNo}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
              {/* <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Serial No</label>
                  <input
                    type="text"
                    className="form-control"
                    name="serialNo"
                    value={formData.serialNo}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div> */}
            </div>
          </div>
        </div>

        {/* Registered Business Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Registered Business Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="registeredBusinessName"
                    value={formData.registeredBusinessName}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="registeredBusinessAddress"
                    value={formData.registeredBusinessAddress}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Postcode</label>
                  <input
                    type="text"
                    className="form-control"
                    name="registeredBusinessPostcode"
                    value={gasEngineerPostCode}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="registeredBusinessContact"
                    value={formData.registeredBusinessContact}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Landlord/Homeowner Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Landlord/Homeowner Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="landlordName"
                    value={formData.landlordName}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="landlordAddress"
                    value={formData.landlordAddress}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Postcode</label>
                  <input
                    type="text"
                    className="form-control"
                    name="landlordPostcode"
                    value={formData.landlordPostcode}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="landlordContact"
                    value={formData.landlordContact}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Site Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Site Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="siteName"
                    value={formData.siteName}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="siteAddress"
                    value={formData.siteAddress}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Postcode</label>
                  <input
                    type="text"
                    className="form-control"
                    name="sitePostcode"
                    value={formData.sitePostcode}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="siteContactNo"
                    value={formData.siteContactNo}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

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
                  value={selectedAsset}
                  onChange={handleAssetSelect}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select a Disabled WC Alarm Device"
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
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      className="form-control"
                      value={`${selectedAsset.assetName} - Asset No-${formData.assetId} - ${selectedAsset.manufacturer} ,  - ${selectedAsset.position}, ${selectedAsset.floor}, ${selectedAsset.room}`}
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
                    <label className="form-label">Type</label>
                    <input
                      type="text"
                      className="form-control"
                      name="type"
                      value={selectedAsset.subCategory}
                      disabled
                    />
                  </div>
                </div>
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
                    <label className="form-label">Owned by Landlord</label>
                    <select
                      className="form-control"
                      name="applianceOwnedByLandlord"
                      value={formData.applianceOwnedByLandlord}
                      onChange={handleInputChange}
                      disabled={!isFormEditable || isSubmitted}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Appliance Inspected</label>
                    <select
                      className="form-control"
                      name="applianceInspected"
                      value={formData.applianceInspected}
                      onChange={handleInputChange}
                      disabled={!isFormEditable || isSubmitted}
                    >
                      <option value="Yes">Yes</option>
                      <option value="No">No</option>
                    </select>
                  </div>
                </div>

                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label">Flue Type</label>
                    <input
                      type="text"
                      className="form-control"
                      name="flueType"
                      value={formData.flueType}
                      onChange={handleInputChange}
                      disabled={!isFormEditable || isSubmitted}
                    />
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>


        {/* Inspection Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Inspection Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Operating Pressure (mbars) or heat input (kW/h)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="operatingPressure"
                    value={formData.operatingPressure}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Safety devices operating correctly?</label>
                  <select
                    className="form-control"
                    name="safetyDevicesOperating"
                    value={formData.safetyDevicesOperating}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Satisfactory Ventilation?</label>
                  <select
                    className="form-control"
                    name="ventilationSatisfactory"
                    value={formData.ventilationSatisfactory}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Visual condition of flue & termination</label>
                  <select
                    className="form-control"
                    name="flueVisualCondition"
                    value={formData.flueVisualCondition}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Flue operation checks</label>
                  <select
                    className="form-control"
                    name="flueOperationChecks"
                    value={formData.flueOperationChecks}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Combustion analyser reading</label>
                  <input
                    type="text"
                    className="form-control"
                    name="combustionAnalyserReading"
                    value={formData.combustionAnalyserReading}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Was appliance serviced?</label>
                  <select
                    className="form-control"
                    name="applianceServiced"
                    value={formData.applianceServiced}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Is appliance safe to use?</label>
                  <select
                    className="form-control"
                    name="applianceSafeToUse"
                    value={formData.applianceSafeToUse}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Check Results */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Final Check Results</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Outcome of gas tightness test</label>
                  <select
                    className="form-control"
                    name="gasTightnessTest"
                    value={formData.gasTightnessTest}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Is the main protective equipotential bonding satisfactory?</label>
                  <select
                    className="form-control"
                    name="protectiveBonding"
                    value={formData.protectiveBonding}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Is the emergency control accessible?</label>
                  <select
                    className="form-control"
                    name="emergencyControlAccessible"
                    value={formData.emergencyControlAccessible}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Satisfactory visual inspection of gas installation pipework?</label>
                  <select
                    className="form-control"
                    name="pipeworkVisualInspection"
                    value={formData.pipeworkVisualInspection}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">CO alarm fitted and working?</label>
                  <select
                    className="form-control"
                    name="coAlarmFitted"
                    value={formData.coAlarmFitted}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Smoke/fire alarm fitted and working?</label>
                  <select
                    className="form-control"
                    name="fireAlarmFitted"
                    value={formData.fireAlarmFitted}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>


        {/**Risk Score Card */}

        {
          showRiskAssessment && (
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
                    desc={`Inspection - Gas Safety - ${formData.applianceType || 'Appliance'} Inspection`}
                    siteId={siteSelectedForGlobal?.siteId}
                    checkId={currentCheckId}
                    createdBy={loggedInUserData?.id}
                    taggedAsset={formData.assetId}
                    onRiskAssessmentComplete={handleRiskAssessmentComplete}
                    actionRaised={actionRaised}
                      disabled={!isFormEditable || isSubmitted}
                    images={getAllImages()}
                  />
                )}
              </div>
            </div>
          )
        }

        {/* Combustion Performance Readings */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Combustion Performance Readings</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Low</h6>
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionLowCO"
                        value={formData.combustionLowCO}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO2</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionLowCO2"
                        value={formData.combustionLowCO2}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Ratio</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionLowRatio"
                        value={formData.combustionLowRatio}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <h6>High</h6>
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionHighCO"
                        value={formData.combustionHighCO}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO2</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionHighCO2"
                        value={formData.combustionHighCO2}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Ratio</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionHighRatio"
                        value={formData.combustionHighRatio}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Inspection */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Next Inspection</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Next Inspection Is Due Before</label>
                  <input
                    type="date"
                    className="form-control"
                    name="nextInspectionDue"
                    value={formData.nextInspectionDue}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Photo Upload Section */}
        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Accompanying Images</h5>
            <div>
              <input
                type="file"
                id="photo-upload"
                multiple
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: "none" }}
                disabled={isSubmitted || uploadingPhotos || uploadedPhotos.length >= 4 || !isFormEditable}
              />
              <label
                htmlFor="photo-upload"
                className={`btn btn-sm btn-primary ${(isSubmitted || !isFormEditable || uploadedPhotos.length >= 4) ? 'disabled' : ''}`}
                style={{
                  cursor: (isSubmitted || !isFormEditable || uploadedPhotos.length >= 4) ? 'not-allowed' : 'pointer',
                  opacity: (isSubmitted || !isFormEditable || uploadedPhotos.length >= 4) ? 0.6 : 1
                }}
              >
                {uploadingPhotos ? (
                  <span>Uploading...</span>
                ) : (
                  <>
                    <InsertPhotoIcon fontSize="small" />
                    Add Photos ({uploadedPhotos.length}/4)
                  </>
                )}
              </label>
              {uploadedPhotos.length >= 4 && (
                <span className="ms-2 text-danger">Maximum photos reached</span>
              )}
            </div>
          </div>
          <div className="card-body">
            <div className="d-flex flex-wrap">
              {uploadedPhotos.map((photo, index) => {
                const imageUrl = photo.url.includes('?')
                  ? photo.url
                  : `${photo.url}?${sasToken}`;

                return (
                  <div
                    key={index}
                    className="position-relative me-3 mb-3"
                    style={{
                      width: "150px",
                      height: "150px",
                    }}
                  >
                    <img
                      src={imageUrl}
                      alt={`Preview ${index}`}
                      className="img-thumbnail"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
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
                        onClick={() => handleRemovePhoto(index)}
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
                        aria-label={`Remove photo ${index + 1}`}
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

        {/* Signatures */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Signatures</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Gas Engineer</label>
                  <input
                    type="text"
                    className="form-control"
                    name="engineerName"
                    value={formData.engineerName}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="engineerSignatureDate"
                    value={formData.engineerSignatureDate}
                    onChange={handleInputChange}
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
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Received By (Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="receivedByName"
                    value={formData.receivedByName}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-control"
                    name="receivedByPosition"
                    value={formData.receivedByPosition}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="receivedByDate"
                    value={formData.receivedByDate}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

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
                    !isGasEngineer
                  }
                >
                  {isLoading ? 'Submitting...' : 'Submit Record'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center print-hide">
            <div className="alert alert-success mb-4">
              Gas Safety Record submitted successfully on {new Date().toISOString().split("T")[0]}
            </div>
            {showPdfButton && generatedPdfBlob && (
              <button
                className="btn btn-success"
                onClick={() => savePdfToLocal(generatedPdfBlob, `GasSafetyRecord_${siteSelectedForGlobal?.siteId}_${new Date().toISOString().split('T')[0]}.pdf`)}
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
})(GasSafetyRecord);