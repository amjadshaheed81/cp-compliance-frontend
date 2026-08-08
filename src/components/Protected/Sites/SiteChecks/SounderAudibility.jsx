import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { post, get, put } from "../../../../api";
import {
  getSiteAssets,
  getSiteById,
  getSiteDetailsById,
  getSites,
  getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { DeleteForever } from "@mui/icons-material";
import { formatDate, formatLocalDateTime } from "../../../../utils/dateFormat";
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import pdfTemplate from './pdf/Sounder Audibilty Certificate.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import axios from "axios";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import { getUkLocalDate, isCurrentUkInspectionDate } from "./shared/siteCheckDateUtils";

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

const SounderAudibilityForm = ({
                                 sasToken,
                                 checkId,
                                 subType,
                                 category,
                                 siteCheck,
                                 getSiteDetailsById,
                                 siteDetailsById,
                                 siteAssets,
                                 getSiteAssets,
                                 users,
                                 getUsers,
                                 siteSelectedForGlobal,
                                 loggedInUserData,
                               }) => {
  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    date: getUkLocalDate(),
    siteContactNo: "",
    job: "",
    manufacturer: "",
    modelNumber: "",
    position: "",
    floor: "",
    room: "",
    locations: Array(8).fill({
      spl: "",
      dba: "",
    }),
    clientName: "",
    engineerName: loggedInUserData?.name || "",
    selectedAsset: null,
    clientDate: getUkLocalDate(),
    engineerDate: getUkLocalDate(),
    client: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    clientUser: null,
    siteContactUser: null,
    actionId: null,
  });

  // NEW: Use the Site Check's own site, matching Air Conditioning.
  const authoritativeSiteId = siteCheck?.siteId
    ? Number(siteCheck.siteId)
    : Number(siteSelectedForGlobal?.siteId) || null;

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
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
  const [lastEngineerId, setLastEngineerId] = useState(null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
    const [inspectionDetails, setInspectionDetails] = useState(null);

  // NEW: Shared engineer behaviour copied from Air Conditioning.
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

  useEffect(() => {
    setLastEngineerId(null);
    setFormData((prev) => ({
      ...prev,
      engineer: siteCheck?.status === "Done" ? "" : (loggedInUserData?.id || ""),
      user: siteCheck?.status === "Done" ? {} : (loggedInUserData || {}),
      engineerName: siteCheck?.status === "Done" ? "" : (loggedInUserData?.name || ""),
      date: siteCheck?.status === "Open" ? getUkLocalDate() : prev.date,
      clientDate: siteCheck?.status === "Open" ? getUkLocalDate() : prev.clientDate,
      engineerDate: siteCheck?.status === "Open" ? getUkLocalDate() : prev.engineerDate,
    }));
  }, [checkId, authoritativeSiteId, siteCheck?.status, loggedInUserData?.id]);

    // Check if user is internal and tagged with selected site
  const isInternalUserTaggedWithSite =
      loggedInUserData?.taggedSites?.some(
          (site) => Number(site.id ?? site.siteId) === authoritativeSiteId
      );

  const fetchInspectionData = async (siteCheckStatus = checkStatus) => {
    try {
      if (!checkId) return;

      if (isInternalUserTaggedWithSite && users.length === 0) {
        await getUsers();
      }

      const apiData = await get(`/api/site-check/generic-inspection/${checkId}`);
      if (apiData && apiData.length > 0) {
        const mostRecentItem = apiData[apiData.length - 1];
        setLastEngineerId(mostRecentItem.engineer || null);
        const isCurrentOpenInspection =
          siteCheckStatus === "Open" &&
          isCurrentUkInspectionDate(mostRecentItem.date);
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
          // OLD: date: mostRecentItem.date || prev.date,
          // NEW: Open = current UK date; Done = saved date.
          date: siteCheckStatus === "Open"
            ? getUkLocalDate()
            : (mostRecentItem.date || prev.date),
          siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
          job: mostRecentItem.job || prev.job,
          locations: mostRecentItem.locations || prev.locations,
          client: mostRecentItem.client || "",
          // OLD engineer/user mapping retained for review.
          // engineer: mostRecentItem.engineer || prev.engineer || loggedInUserData?.id,
          // user: engineerUser || loggedInUserData || prev.user,
          // NEW: same Open/Done engineer behaviour as Air Conditioning.
          engineer: siteCheckStatus === "Open"
            ? (isCurrentOpenInspection
                ? (mostRecentItem.engineer || loggedInUserData?.id || "")
                : (loggedInUserData?.id || ""))
            : (mostRecentItem.engineer || prev.engineer || ""),
          user: siteCheckStatus === "Open"
            ? (isCurrentOpenInspection
                ? (engineerUser || loggedInUserData || {})
                : (loggedInUserData || {}))
            : (engineerUser || prev.user || {}),
          engineerName: siteCheckStatus === "Open"
            ? (isCurrentOpenInspection
                ? (engineerUser?.name || loggedInUserData?.name || "")
                : (loggedInUserData?.name || ""))
            : (engineerUser?.name || prev.engineerName || ""),
          selectedAsset: selectedAsset || prev.selectedAsset,
          // OLD:
          // clientDate: mostRecentItem.clientDate || prev.clientDate,
          // engineerDate: mostRecentItem.engineerDate || prev.engineerDate,
          // NEW: Open = current UK date; Done = saved dates.
          clientDate: siteCheckStatus === "Open"
            ? getUkLocalDate()
            : (mostRecentItem.clientDate || prev.clientDate),
          engineerDate: siteCheckStatus === "Open"
            ? getUkLocalDate()
            : (mostRecentItem.engineerDate || prev.engineerDate),
          clientUser: clientUser || null,
          siteContactUser: siteContactUser || null,
          actionId: mostRecentItem.actionId || null,
        }));
      }
    } catch (error) {
      console.error("Error fetching inspection data:", error);
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

  const selectedAsset = siteAssets.find(
      (asset) => asset.assetId === formData.assetId
  );

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
                    folder => folder.name === 'Fire Alarm (BS5839)'
                );

                if (miscellaneousFolder) {
                  const miscResponse = await get(
                      `/api/document/parent/${miscellaneousFolder.id}/folders?siteId=${siteId}`
                  );

                  if (miscResponse?.document?.childFolders) {
                    const sounderAudibilityFolder = miscResponse.document.childFolders.find(
                        folder => folder.name === 'Fire Alarm - Sounder Audibility Test'
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
        if (siteCheck && Number(siteCheck.checkId) === Number(checkId)) {
          setCurrentCheckId(siteCheck.checkId);
          setCheckStatus(siteCheck.status);
          setInspectionDetails(siteCheck);
          const isDone = siteCheck.status === "Done";
          setIsFormEditable(!isDone);
          setIsSubmitted(isDone);
          setShowPdfButton(isDone);
          return siteCheck;
        }
        if (!authoritativeSiteId) return null;

        const response = await get(`/api/site-check/site/${authoritativeSiteId}`);
        if (response && response.length > 0) {
          let sounderAudibilityCheck = checkId
              ? response.find(check => check.checkId === parseInt(checkId, 10))
              : null;

          if (sounderAudibilityCheck) {
            setCurrentCheckId(sounderAudibilityCheck.checkId);
            setCheckStatus(sounderAudibilityCheck.status);
            setInspectionDetails(sounderAudibilityCheck);
            const isDone = sounderAudibilityCheck.status === 'Done';
            setIsFormEditable(!isDone);
            setIsSubmitted(isDone);
            setShowPdfButton(isDone);
            return sounderAudibilityCheck;
          }
          else {
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
          const loadedSiteCheck = await fetchSiteCheckData();
          await fetchInspectionData(loadedSiteCheck?.status || siteCheck?.status || checkStatus);

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

          const siteData = siteDetailsById || siteSelectedForGlobal;

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

  // Replace the existing useEffect for showRiskAssessment
  useEffect(() => {
    // Check if any location has spl <= 64 or dba <= 64
    const shouldShowRiskAssessment = formData.locations.some(
        location =>
            (location.spl && parseFloat(location.spl) <= 64) ||
            (location.dba && parseFloat(location.dba) <= 64));

    setShowRiskAssessment(shouldShowRiskAssessment);

    const isActionValid = existingAction && existingAction.checkId === currentCheckId;
    setActionRaised(isActionValid);
  }, [formData.locations, currentCheckId, existingAction]);

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
          siteId: authoritativeSiteId,
          assetId: formData.selectedAsset?.assetId || formData.assetId,
          client: formData.clientUser?.id || formData.client,
          engineer: formData.engineer,
          siteContact: formData.siteContactUser?.id || formData.siteContact,
          type: 'Inspection',
          subType: 'Sounder Audibility',
          category: 'Sounder Audibility Report',
          checkId: currentCheckId,
          actionId: verifiedAction.actionId,
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
      const siteId = authoritativeSiteId;
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

  const uploadPdfToServer = async (pdfBlob, fileName, dateOverride) => {
    try {
      setIsUploading(true);
      const dateForUpload = dateOverride || formData.date;
      const savedLocally = await savePdfToLocal(pdfBlob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const targetFolderId = folderIds.sounderAudibility;

      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);
      // OLD: const formData = new FormData();
      // NEW: avoid hiding React formData state.
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
            issueDate: formatDateForBackend(dateForUpload),
            expiryDate: formatDateForBackend(calculateExpiryDate(dateForUpload, inspectionDetails?.repeatFrequency)),
              uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `SAR-${new Date().getTime()}`
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
            issueDate: formatDateForBackend(dateForUpload),
            expiryDate: formatDateForBackend(calculateExpiryDate(dateForUpload, inspectionDetails?.repeatFrequency)),
              note: 'Sounder Audibility Report',
            fileVersion: fileVersion,
            siteId: authoritativeSiteId || 0,
            originalFileName: fileName,
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `SAR-${new Date().getTime()}`
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
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const generatePDF = async (uploadToServer = true, submissionDateOverride) => {
    try {
      setIsGeneratingPDF(true);

      if (!PDFLib) {
        PDFLib = await import('pdf-lib');
      }

      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const form = pdfDoc.getForm();

      const setTextField = (fieldName, value, fontSize = 5) => {
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
      const effectiveDate = submissionDateOverride || formData.date;

      // Address and contact information
      const addressLines = (formData.address || '').split(',');
      setTextField('Address', addressLines[0] || '', smallFont);
      setTextField('Address_2', addressLines[1] || '', smallFont);
      setTextField('Address_3', addressLines[2] || '', smallFont);
      setTextField('Address_4', addressLines[3] || '', smallFont);

      // OLD: formData.date
      // NEW: exact UK submission date.
      setTextField('Date', moment(effectiveDate).format('DD/MM/YYYY'), smallFont);
      setTextField('Site Contact', formData.siteContactUser?.name || formData.siteContact || '', smallFont);
      setTextField('Site Contact No', formData.siteContactNo || '', smallFont);
      setTextField('Job No', formData.job || '', smallFont);

      // Equipment information
      setTextField('Manufacturer', selectedAsset?.manufacturer || '', smallFont);
      setTextField('Model Number', selectedAsset?.model || '', smallFont);
      setTextField('Location', [
        selectedAsset?.position,
        selectedAsset?.floor,
        selectedAsset?.room
      ].filter(Boolean).join(' - ') || '', smallFont);

      // Sound level measurements
      formData.locations.forEach((location, index) => {
        if (index < 8) { // PDF template has space for 8 locations
          setTextField(`spl_${index + 1}`, location.spl || '', smallFont);
          setTextField(`dba_${index + 1}`, location.dba || '', smallFont);
        }
      });

      // Signatures
      const clientName = formData.clientUser?.name || formData.clientName || '';
      const engineerName = formData.user?.name || '';

      setTextField('Clients Name', clientName, smallFont);
      setTextField('Engineers Name', engineerName, smallFont);
      // OLD: clientDate / engineerDate saved separately from the submission date.
      // NEW: Open completion uses the same current UK date.
      setTextField('on', moment(effectiveDate).format('DD/MM/YYYY'), smallFont);
      setTextField('on_2', moment(effectiveDate).format('DD/MM/YYYY'), smallFont);

      // Flatten and save
      form.flatten();
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const fileName = `SounderAudibilityReport_${formData.selectedAsset?.assetName || 'report'}.pdf`;

      setGeneratedPdfBlob(blob);
      setShowPdfButton(true);

      if (uploadToServer) {
        await uploadPdfToServer(blob, fileName, effectiveDate);
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

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // NEW: Shared engineer dropdown selection.
  const handleEngineerSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      engineer: newValue?.id || "",
      user: newValue || {},
      engineerName: newValue?.name || "",
    }));
    setValidationErrors((prev) => ({ ...prev, engineer: "" }));
  };

  const handleAssetSelect = (event, newValue) => {
    if (newValue) {
      setFormData((prev) => ({
        ...prev,
        selectedAsset: newValue,
        manufacturer: newValue.manufacturer || "",
        modelNumber: newValue.model || "",
        position: newValue.position || "",
        floor: newValue.floor || "",
        room: newValue.room || "",
        assetId: newValue.assetId || "",
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        selectedAsset: null,
        manufacturer: "",
        modelNumber: "",
        position: "",
        floor: "",
        room: "",
        assetId: "",
      }));
    }
  };

  const handleLocationChange = (index, field, value) => {
    const updatedLocations = [...formData.locations];
    updatedLocations[index] = {
      ...updatedLocations[index],
      [field]: value,
    };
    setFormData((prev) => ({
      ...prev,
      locations: updatedLocations,
    }));
  };




  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    if (isLoading) {
      console.log('Submit prevented: Already loading');
      return;
    }

    // Check if any location has background noise <= 64 dB(A)
    const hasLowBackgroundNoise = formData.locations.some(
        location =>
            (location.spl && parseFloat(location.spl) <= 64) ||
            (location.dba && parseFloat(location.dba) <= 64)
    );


    if (hasLowBackgroundNoise && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    if (!isFormEditable) {
      console.log('Submit prevented: Form is not editable');
      return;
    }

    // Form validation
    const errors = {};
    if (!formData.engineer || !selectedEngineer) {
      errors.engineer = "Please select an active engineer for this Site Check.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      if (errors.engineer) toast.error(errors.engineer);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
      const submissionDate = checkStatus === "Open" ? getUkLocalDate() : formData.date;
      if (checkStatus === "Open") {
        setFormData((prev) => ({
          ...prev,
          date: submissionDate,
          clientDate: submissionDate,
          engineerDate: submissionDate,
        }));
      }

      // First check if we have an existing inspection
      let existingInspection = null;
      if (currentCheckId) {
        try {
          const inspections = await get(`/api/site-check/generic-inspection/${currentCheckId}`);
          existingInspection = inspections?.length > 0 ? inspections[0] : null;
        } catch (error) {
          console.error('Error checking for existing inspection:', error);
        }
      }

      // First update or create the site check status
      const statusPayload = {
        siteId: parseInt(authoritativeSiteId, 10),
        type: siteCheck?.type || 'Inspection',
        // OLD: subType/category used internal values and broke UI routing.
        // NEW: preserve the original Site Check routing values.
        subType: siteCheck?.subType || 'Fire Alarm to meet BS5839',
        category: siteCheck?.category || 'Fire Alarm Sounder Audibilty',
        status: 'Done',
        startDate: `${submissionDate}T00:00:00`,
        dueDate: formatLocalDateTime(calculateExpiryDate(submissionDate, inspectionDetails?.repeatFrequency)),
        leadUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0',
        assistantUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0'
      };

      let statusResponse;
      if (currentCheckId) {
        // Update existing check
        statusPayload.checkId = parseInt(currentCheckId, 10);
        statusResponse = await put(
            `/api/site-check/${currentCheckId}`,
            statusPayload
        );
      } else {
        // Create new check
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

      // Then update or create the generic inspection record
      const inspectionPayload = {
        ...formData,
        siteId: authoritativeSiteId,
        assetId: formData.selectedAsset?.assetId || formData.assetId,
        client: formData.clientUser?.id || formData.client,
        engineer: formData.engineer,
        date: submissionDate,
        clientDate: submissionDate,
        engineerDate: submissionDate,
        siteContact: formData.siteContactUser?.id || formData.siteContact,
        type: 'Inspection',
        subType: 'Sounder Audibility',
        category: 'Sounder Audibility Report',
        checkId: currentCheckId || statusResponse?.checkId,
        actionId: formData.actionId,
      };

      let saveResponse;
      if (existingInspection) {
        // Update existing inspection
        saveResponse = await put(
            `/api/site-check/generic-inspection/${currentCheckId}`,
            inspectionPayload
        );
      } else {
        // Create new inspection
        saveResponse = await post(
            `/api/site-check/generic-inspection`,
            inspectionPayload
        );
      }

      if (![200, 201, 204].includes(saveResponse?.status)) {
        throw new Error('Failed to save inspection data');
      }

      console.log('Inspection data saved successfully:', saveResponse.data);

      // Generate PDF
      const pdfResult = await generatePDF(true, submissionDate);
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      toast.success("Sounder Audibility Report saved and PDF generated successfully!");
      setShowPdfButton(true);
      setIsSubmitted(true);
      setSubmissionSuccess(true);

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
                  (site) => Number(site.id ?? site.siteId) === authoritativeSiteId
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
                  clientName: newValue?.name || "",
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
            value={formData.clientName}
            onChange={handleInputChange}
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
                  (site) => Number(site.id ?? site.siteId) === authoritativeSiteId
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

  // Filter assets by category: Electrical > Fire Alarm > Sounder
  const filteredAssets =
      siteAssets?.filter(
          (asset) =>
              asset.category === "Electrical" &&
              asset.subCategory === "Fire Alarm" &&
              asset.subCategory2 === "Sounder"
      ) || [];

  return (
      <div className="container mt-4 mb-5">
        <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
          <h4 className="mb-0">BS5839 Sounder Audibility Report</h4>
        </div>
        {!isFormEditable && (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              This form is read-only because the check has been marked as completed.
            </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="row mb-4">
            <div className="col-md-6">
              <div className="mb-3 d-flex">
                <label
                    className="form-label"
                    style={{ fontWeight: "bold", marginRight: "20px" }}
                >
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
                    name="date"
                    value={formatDate(formData.date)}
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
                    disabled={isSubmitted}
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
                    disabled={isSubmitted}
                />
              </div>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header">
              <h5 className="mb-0">Select Sounder Device</h5>
            </div>
            <div className="card-body">
              <div className="row mb-4">
                <div className="col-md-12">
                  <Autocomplete
                      disabled={isSubmitted}
                      options={filteredAssets}
                      getOptionLabel={(option) =>
                          `${option.assetId} - ${option.assetName} (${
                              option.position || "NA"
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
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Position</label>
                        <input
                            type="text"
                            className="form-control"
                            name="position"
                            value={selectedAsset.position}
                            onChange={handleInputChange}
                            required
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
                        <label className="form-label">Room</label>
                        <input
                            type="text"
                            className="form-control"
                            name="room"
                            value={selectedAsset.room}
                            onChange={handleInputChange}
                            required
                            disabled
                        />
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>

          {/* Sound Pressure Level Measurements Section */}
          <div className="table-responsive mb-4">
            <table className="table table-bordered text-center align-middle" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead className="table-light">
              <tr>
                <th style={{ width: '20%' }}>Sound Pressure Level</th>
                <th style={{ width: '20%' }}></th>
                <th style={{ width: '20%' }}></th>
                <th style={{ width: '20%' }}></th>
                <th style={{ width: '20%' }}></th>
              </tr>
              </thead>
              <tbody>
              {formData.locations.map((location, index) => (
                  <tr key={index}>
                    {/* Location label */}
                    <td>{`Location ${index + 1}`}</td>

                    {/* Empty input box */}
                    <td>
                      <input
                          type="text"
                          className="form-control text-center border-2"
                          value={location.spl || ''}
                          onChange={(e) => handleLocationChange(index, 'spl', e.target.value)}
                          disabled={isSubmitted}
                      />
                    </td>

                    {/* SPL static text */}
                    <td><strong>SPL</strong></td>

                    {/* SPL input */}
                    <td>
                      <input
                          type="text"
                          className={`form-control text-center ${
                              validationErrors[`location_${index}_spl`] ? 'is-invalid' : ''
                          }`}
                          value={location.dba}
                          onChange={(e) => handleLocationChange(index, 'dba', e.target.value)}
                          disabled={isSubmitted}
                      />
                      {validationErrors[`location_${index}_spl`] && (
                          <div className="invalid-feedback">
                            {validationErrors[`location_${index}_spl`]}
                          </div>
                      )}
                    </td>

                    {/* dB(A) input */}
                    <td>
                      <strong>dB(A)</strong>
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>
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
                          desc={`Inspection - Fire Alarm to meet BS5839 - Fire Alarm Sounder Audibilty`}
                          siteId={authoritativeSiteId}
                          checkId={currentCheckId}
                          createdBy={loggedInUserData?.id}
                          taggedAsset={selectedAsset?.assetId}
                          onRiskAssessmentComplete={handleRiskAssessmentComplete}
                          actionRaised={actionRaised}
                          disabled={isSubmitted}
                      />
                  )}
                </div>
              </div>
          )}

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
                    name="clientDate"
                    value={formatDate(formData.clientDate)}
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
              {/* =========================================================
                  OLD ENGINEER FIELD - COMMENTED FOR REVIEW

              <div className="mb-3">
                <label className="form-label fw-bold">Engineer's Name</label>
                <input
                    type="text"
                    className="form-control"
                    name="engineerName"
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
                isOpen={checkStatus === "Open"}
                disabled={isSubmitted || !isFormEditable}
                loading={isLoadingEngineers}
                error={validationErrors.engineer || engineerLoadError}
              />
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input
                    type="date"
                    className="form-control"
                    name="engineerDate"
                    value={formatDate(formData.engineerDate)}
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
                <div className="text-center">
                  <div className="alert alert-success mb-4">
                    Report submitted successfully on {new Date().toISOString().split("T")[0]}
                  </div>
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
})(SounderAudibilityForm);
