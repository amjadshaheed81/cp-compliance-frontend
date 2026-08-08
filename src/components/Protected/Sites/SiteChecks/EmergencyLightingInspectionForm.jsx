import React, { useEffect, useState } from "react";
import { connect, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { get, post, uploadSiteCheckDoc, put } from "../../../../api";
import { getSiteAssets, getUsers } from "../../../../store/thunk/site";
import { saveAs } from 'file-saver';
import axios from 'axios';
import pdfTemplate from './pdf/EmergencyLighting.pdf';
import RiskScoreCard from "./RiskScoreCard";
import { formatDate, formatLocalDateTime } from "../../../../utils/dateFormat";
import {Autocomplete, Chip, TextField} from "@mui/material";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import { getUkLocalDate, getUkLocalDateAsDate, isCurrentUkInspectionDate } from "./shared/siteCheckDateUtils";

const EmergencyLightingInspectionForm = ({
                                           checkId,
                                           sasToken,
                                           siteAssets = [],
                                           getSiteAssets,
                                           getUsers,
                                           siteSelectedForGlobal = {},
                                           loggedInUserData = {},
                                           siteCheck = {},
                                           onCheckCreated // New callback prop
                                         }) => {
  // Add folder IDs state
  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    fireLogBook: null,
    emergencyLighting: null,
    monthlyTesting: null
  });
  const [isUploading, setIsUploading] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const license = JSON.parse(localStorage.getItem("license"));

  const [formData, setFormData] = useState({
    inspectionChecks: [
      {
        check: 1,
        checkQ: "All luminaires and signs are present",
        checkSelected: false,
        satisfactory: false,
        remarks: "",
      },
      {
        check: 2,
        checkQ: "Test switches present, suitably sited and keys available",
        satisfactory: false,
        checkSelected: false,
        remarks: "",
      },
      {
        check: 3,
        checkQ: "Lenses and legends are clean, unpainted & undamaged",
        satisfactory: false,
        checkSelected: false,
        remarks: "",
      },
      {
        check: 4,
        checkQ:
            "Luminaires functioning correctly & have lasted the duration of the test",
        satisfactory: false,
        checkSelected: false,
        remarks: "",
      },
      {
        check: 5,
        checkQ:
            "All luminaires switched over & charging LED's lit on completion of test",
        satisfactory: false,
        checkSelected: false,
        remarks: "",
      },
    ],
    additionalComments: "",
    allFittingsPassed: false,
    assetIds: [],
    selectedAssets: [],
    files: [],
    inspectionBy: loggedInUserData?.id || "",
    inspectionDate: getUkLocalDateAsDate(),
    user: loggedInUserData,
  });

  const [hoveredRemarksIndex, setHoveredRemarksIndex] = useState(null);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const users = useSelector((state) => state.site.users || []);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const [inspectionDetails, setInspectionDetails] = useState(null);
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isNewCheck, setIsNewCheck] = useState(!checkId); // Track if this is a new check\

  // NEW: Use the exact Site Check site/status for engineer/date behaviour.
  const authoritativeSiteId = siteCheck?.siteId
      ? Number(siteCheck.siteId)
      : Number(siteSelectedForGlobal?.siteId) || null;
  const checkStatus = inspectionDetails?.status || siteCheck?.status || "Open";
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
    selectedEngineerId: formData.inspectionBy,
    selectedEngineerUser: formData.user,
    lastEngineerId,
  });

  // NEW: Open checks always show today's UK date and default to the logged-in engineer.
  useEffect(() => {
    if (checkStatus !== "Open") return;
    setFormData((prev) => ({
      ...prev,
      inspectionDate: getUkLocalDateAsDate(),
      inspectionBy: prev.inspectionBy || loggedInUserData?.id || "",
      user: prev.user?.id ? prev.user : (loggedInUserData || {}),
    }));
  }, [checkStatus, loggedInUserData?.id]);


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
  const selectedAsset = siteAssets.find(
      (asset) => asset.assetId === formData.assetId
  );
  // Function to fetch inspection details
  const fetchInspectionDetails = async (checkId) => {
    try {
      console.log(`Fetching inspection details for checkId: ${checkId}`);
      const response = await get(`/api/site-check/check-id/${checkId}`);
      console.log('API Response:', response);

      if (!response) {
        console.error('No response received');
        return null;
      }

      const inspectionDetails = {
        checkId: response.checkId,
        siteId: response.siteId,
        type: response.type,
        subType: response.subType,
        category: response.category,
        dueDate: response.dueDate,
        status: response.status
      };

      console.log('Fetched inspection data:', inspectionDetails);
      setInspectionDetails(inspectionDetails);


      return inspectionDetails;
    } catch (error) {
      console.error('Error fetching inspection details:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      return null;
    }
  };

  //console.log('-->',license)

  // const handleRiskAssessmentComplete = async (actionResponse) => {
  //   try {
  //     if (!actionResponse?.actionId) {
  //       throw new Error("Invalid action response received");
  //     }
  //
  //     // Verify the new action has our current checkId
  //     const verifiedAction = await fetchActionById(actionResponse.actionId);
  //     if (!verifiedAction || verifiedAction.checkId !== currentCheckId) {
  //       throw new Error("Action was not properly linked to this inspection");
  //     }
  //
  //     setExistingAction(verifiedAction);
  //     setActionRaised(true);
  //
  //     // Update form data
  //     setFormData(prev => ({
  //       ...prev,
  //       actionId: verifiedAction.actionId
  //     }));
  //
  //     // Update inspection record
  //     if (checkId) {
  //       const inspectionPayload = {
  //         ...formData,
  //         checkId: checkId,
  //         siteId: siteSelectedForGlobal?.siteId,
  //         actionId: verifiedAction.actionId,
  //       };
  //
  //       // Update or create inspection record
  //       const existingInspections = await get(`/api/site-check/emergency-lighting/${checkId}`);
  //       console.log('-->',existingInspections);
  //       if (existingInspections?.length > 0) {
  //         await put(`/api/site-check/emergency-lighting/${checkId}`, inspectionPayload);
  //       } else {
  //         await post(`/api/site-check/emergency-lighting`, inspectionPayload);
  //       }
  //
  //       toast.success(`Action #${verifiedAction.actionId} successfully linked to inspection`);
  //     }
  //   } catch (error) {
  //     console.error("Error handling risk assessment completion:", error);
  //     toast.error(error.message || "Failed to process action completion");
  //
  //     // Rollback state changes if the operation failed
  //     setActionRaised(false);
  //     setExistingAction(null);
  //     setFormData(prev => ({ ...prev, actionId: null }));
  //   }
  // };

  const handleRiskAssessmentComplete = async (actionResponse) => {
    try {
      if (!actionResponse?.actionId) {
        throw new Error("Invalid action response received");
      }

      // Verify the action exists
      const verifiedAction = await fetchActionById(actionResponse.actionId);
      if (!verifiedAction) {
        throw new Error("Failed to verify created action");
      }

      // Update the action with checkId if we have one
      if (currentCheckId && !verifiedAction.checkId) {
        await put(`/api/site/actions/${verifiedAction.actionId}`, {
          ...verifiedAction,
          checkId: currentCheckId
        });
        verifiedAction.checkId = currentCheckId; // Update local copy
      }

      // Update all relevant states
      setExistingAction(verifiedAction);
      setActionRaised(true);
      setFormData(prev => ({
        ...prev,
        actionId: verifiedAction.actionId
      }));

      // Force re-render of risk assessment section
      setShowRiskAssessment(true);

      // Save the inspection data with the actionId
      const inspectionPayload = {
        ...formData,
        siteId: authoritativeSiteId,
        checkId: currentCheckId,
        actionId: verifiedAction.actionId,
        inspectionBy: formData.inspectionBy || loggedInUserData?.id,
        inspectionDate: getUkLocalDateAsDate(),
        type: 'Inspection',
        subType: 'Emergency Lighting',
        category: inspectionDetails?.category || 'Emergency Lighting'
      };

      if (currentCheckId) {
        const existingInspections = await get(`/api/site-check/emergency-lighting/${currentCheckId}`);
        if (existingInspections?.length > 0) {
          await put(`/api/site-check/emergency-lighting/${currentCheckId}`, inspectionPayload);
        } else {
          await post(`/api/site-check/emergency-lighting`, inspectionPayload);
        }
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

  // useEffect(() => {
  //   const hasUnsatisfactoryChecks = formData.inspectionChecks
  //       .slice(0, 5)
  //       .some(check => check.satisfactory === false);
  //
  //   setShowRiskAssessment(hasUnsatisfactoryChecks);
  //
  //   // Update actionRaised state based on existing action
  //   const isActionValid = existingAction && existingAction.checkId === checkId;
  //   setActionRaised(isActionValid);
  // }, [formData.inspectionChecks, checkId, existingAction]);

  useEffect(() => {
    const hasUnsatisfactoryChecks = formData.inspectionChecks
        .slice(0, 5)
        .some(check => check.satisfactory === false);

    const isActionValid = existingAction &&
        (Number(existingAction.checkId) === Number(currentCheckId));

    setShowRiskAssessment(hasUnsatisfactoryChecks);
    setActionRaised(isActionValid);
  }, [formData.inspectionChecks, currentCheckId, existingAction]);

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
      // First check if we have an actionId in form data
      if (formData.actionId) {
        const action = await fetchActionById(formData.actionId);
        // Only consider this action if its checkId matches current checkId
        if (action && Number(action.checkId) === Number(currentCheckId)) {
          setExistingAction(action);
          setActionRaised(true);
          return;
        }
        // If checkId doesn't match, clear the actionId from form data
        setFormData(prev => ({ ...prev, actionId: null }));
      }

      // Now look for other actions specifically for this checkId
      if (!siteSelectedForGlobal?.siteId || !currentCheckId) return;

      const response = await get(`/api/site/actions/${siteSelectedForGlobal.siteId}`);
      if (response && response.length > 0) {
        // Only consider actions with exact checkId match
        const relevantActions = response.filter(action =>
            Number(action.checkId) === Number(currentCheckId)
        );

        if (relevantActions.length > 0) {
          // Get the most recent action for this checkId
          const mostRecentAction = relevantActions.sort((a, b) =>
              new Date(b.createdAt) - new Date(a.createdAt)
          )[0];

          setExistingAction(mostRecentAction);
          setActionRaised(true);

          // Update formData with the actionId
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
  // Function to generate PDF
  const generatePDF = async (inspectionDateOverride = null) => {
    try {
      setIsGeneratingPDF(true);

      // Ensure we have inspection details
      let inspectionDetails = null;
      if (currentCheckId) {
        inspectionDetails = await fetchInspectionDetails(currentCheckId);
      }

      // Generate PDF content
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes);
      const form = pdfDoc.getForm();

      // Helper functions for setting form fields
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

      // Set client information
      setTextField('Name', license?.companyName || '');
      setTextField('Address', license?.companyAddress || '');

      // Set installation information
      setTextField('Name_2', formData.installationName || '');
      setTextField('Address_2', formData.installationAddress || '');

      // Set inspection company info
      setTextField('InspectionTest', loggedInUserData?.companyName || '');
      setTextField('Address_3', loggedInUserData?.companyAddress || '');

      // Set BSI category details
      setTextField('Type', formData.bsiCategoryType || '');
      setTextField('Mode', formData.bsiCategoryMode || '');
      setTextField('Facilities', formData.bsiCategoryFacilities || '');
      setTextField('Duration', formData.bsiCategoryDuration || '');

      // NEW: Use the exact submission date/selected engineer.
      const effectiveInspectionDate = inspectionDateOverride || formData.inspectionDate;
      const effectiveEngineer = selectedEngineer || (formData.user?.id ? formData.user : null) || loggedInUserData || {};

      // Set inspection date
      const formattedDate = effectiveInspectionDate
          ? new Date(effectiveInspectionDate).toLocaleDateString('en-GB')
          : '';
      setTextField('Date', formattedDate);

      // Process inspection checks
      for (let i = 1; i <= 10; i++) {
        setCheckbox(`CheckBox${i}`, false); // Reset all checkboxes first
      }

      formData.inspectionChecks.forEach((check, index) => {
        if (index < 5) { // We only have 5 checks in our form
          const checkboxName = `CheckBox${index + 1}`;

          // Mark as checked if the check was performed
          if (check.checkSelected !== undefined) {
            setCheckbox(checkboxName, check.checkSelected);
          }

          // Mark the right column if satisfactory
          if (check.satisfactory === true) {
            const rightCheckboxName = `CheckBox${index + 6}`;
            setCheckbox(rightCheckboxName, true);
          }

          // Set remarks if they exist
          const remarksField = `Remarks${index + 1}`;
          if (check.remarks) {
            setTextField(remarksField, check.remarks);
          }
        }
      });

      // Set additional comments
      setTextField('AdditionalComments', formData.additionalComments || '');

      // OLD: PDF inspector details were always taken from loggedInUserData.
      // NEW: Use the selected/saved engineer, matching Air Conditioning.
      setTextField('Engineer', effectiveEngineer?.name || '');
      setTextField('position', effectiveEngineer?.role || '');

      // Add the selected engineer's signature if available.
      if (effectiveEngineer?.signature) {
        try {
          const signatureUrl = `${effectiveEngineer.signature}?${sasToken}`;
          const signatureResponse = await fetch(signatureUrl);
          const signatureImageBytes = await signatureResponse.arrayBuffer();
          const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

          const signatureField = form.getButton('Image_af_image');
          if (signatureField) {
            signatureField.setImage(signatureImage);
          }
        } catch (error) {
          console.warn('Error setting signature image:', error);
        }
      }

      // Set the inspection category in the footer
      const categoryText = inspectionDetails?.category || 'Emergency Lighting';
      setTextField('Monthly', categoryText);

      // Flatten the form to make it non-editable
      try {
        form.flatten();
      } catch (error) {
        console.warn('Error flattening form:', error.message);
      }

      // Save the modified PDF
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });

      // Generate filename
      const fileName = `EmergencyLightingInspection_${siteSelectedForGlobal?.name || 'report'}_${getUkLocalDate()}.pdf`;

      // Save locally first
      const savedLocally = await savePdfToLocal(blob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      // Upload to server
      const uploadSuccess = await uploadPdfToServer(
          blob,
          fileName,
          inspectionDetails?.category || 'Emergency Lighting',
          effectiveInspectionDate
      );

      if (!uploadSuccess) {
        console.error('PDF upload to server failed');
      }

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsGeneratingPDF(false);
    }
  };


  useEffect(() => {
    // This effect ensures we have the latest action data when formData.actionId changes
    const fetchActionData = async () => {
      if (formData.actionId) {
        console.log('Action ID changed, fetching action:', formData.actionId);
        const action = await fetchActionById(formData.actionId);
        if (action) {
          setExistingAction(action);
          setActionRaised(true);
        } else {
          setExistingAction(null);
          setActionRaised(false);
        }
      }
    };

    fetchActionData();
  }, [formData.actionId],checkId);

  // Preserve exact folder names but make matching more robust
  const getFolderNameFromCategory = (category) => {
    switch(category) {
      case 'Emergency Lighting - weekly testing to meet BS5266':
        return 'Emergency Lighting - Weekly (Flick) Testing';
      case 'Emergency Lighting - monthly testing to meet BS5266':
        return 'Emergency Lighting - Monthly Testing'; 
      case 'Emergency Lighting - 6 monthly testing to meet BS5266':
        return 'Emergency Lighting - 6 Monthly Testing'; 
      case 'Emergency Lighting (systems more than 3 years old) 12 monthly Full discharge testing':
        return 'Emergency Lighting - 12 Monthly Testing';
      default:
        return 'Emergency Lighting - Monthly Testing';
    }
  };
  

  const fetchFolderStructure = async (siteId, category) => {
    try {
      // 1. Get parent folders
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);
      if (!parentFoldersResponse?.parentFolders) {
        throw new Error('No parent folders found');
      }

      // 2. Find Log Books (exact match)
      const logBooksFolder = parentFoldersResponse.parentFolders.find(
          f => f.name === '6 - Log Books'
      );
      if (!logBooksFolder) throw new Error('Log Books folder not found');

      // 3. Get Fire Log Book children
      const logBooksChildren = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);
      const fireLogBookFolder = logBooksChildren?.document?.childFolders?.find(
          f => f.name === 'Fire Log Book'
      );
      if (!fireLogBookFolder) throw new Error('Fire Log Book folder not found');

      // 4. Get Emergency Lighting children
      const fireLogChildren = await get(`/api/document/parent/${fireLogBookFolder.id}/folders?siteId=${siteId}`);
      const emergencyLightingFolder = fireLogChildren?.document?.childFolders?.find(
          f => f.name === 'Emergency Lighting to meet BS5266' || f.name === 'Emergency Lighting (BS5266)'
      );
      if (!emergencyLightingFolder) throw new Error('Emergency Lighting folder not found');

      // 5. Get target subfolder (CRITICAL FIX)
      const targetFolderName = getFolderNameFromCategory(category);
      const lightingChildren = await get(`/api/document/parent/${emergencyLightingFolder.id}/folders?siteId=${siteId}`);

      console.log('Searching for:', targetFolderName);
      console.log('Available subfolders:',
          lightingChildren?.document?.childFolders?.map(f => `${f.name} (${f.id})`) || []);

      // Find the EXACT matching subfolder
      const targetFolder = lightingChildren?.document?.childFolders?.find(
          f => f.name === targetFolderName
      );

      if (!targetFolder) {
        console.warn(`Exact subfolder "${targetFolderName}" not found, using parent folder`);
      }

      // FINAL FOLDER ID ASSIGNMENT (FIXED)
      const newFolderIds = {
        logBooks: logBooksFolder.id,
        fireLogBook: fireLogBookFolder.id,
        emergencyLighting: emergencyLightingFolder.id,
        monthlyTesting: targetFolder?.id || null // Don't fallback to parent ID
      };

      console.log('Final folder IDs:', newFolderIds);

      if (!newFolderIds.monthlyTesting) {
        throw new Error(`Target subfolder "${targetFolderName}" not found`);
      }

      setFolderIds(newFolderIds);
      return newFolderIds.monthlyTesting;

    } catch (error) {
      console.error('Folder structure error:', {
        error: error.message,
        siteId,
        category
      });
      return null;
    }
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

  const formatDateForBackend = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toISOString().replace('T', ' ').split('.')[0];
  };

  // Function to check if a file exists in the folder
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

  // Helper function to get the highest file version
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
        const maxVersion = Math.max(...versions);
        return maxVersion + 1;
      }
      return 1;
    } catch (error) {
      console.error('Error checking file versions:', error);
      return 1;
    }
  };

  // Function to save PDF to local storage
  const savePdfToLocal = async (pdfBlob, fileName) => {
    try {
      const blobUrl = URL.createObjectURL(pdfBlob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
      return true;
    } catch (error) {
      console.error('Error saving PDF locally:', error);
      return false;
    }
  };

  const uploadPdfToServer = async (pdfBlob, fileName, category, inspectionDateOverride = null) => {
    try {
      setIsUploading(true);

      // First save locally
      await savePdfToLocal(pdfBlob, fileName);

      // Ensure we have the latest folder structure
      const targetFolderId = await fetchFolderStructure(authoritativeSiteId, category);
      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const uploadFormData = new FormData();

      // Check if file exists
      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      if (exists && existingFile) {
        // Update existing file
        uploadFormData.append('file', pdfFile);

        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            id: existingFile.id,
            name: fileName,
            originalFileName: fileName,
            fileVersion: (existingFile.fileVersion || 1) + 1,
            siteId: authoritativeSiteId,
            issueDate: formatDateForBackend(inspectionDateOverride || formData.inspectionDate),
            expiryDate: formatDateForBackend(calculateExpiryDate(inspectionDateOverride || formData.inspectionDate, inspectionDetails?.repeatFrequency)),
              uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `EL-${new Date().getTime()}`
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
        // Create new file
        uploadFormData.append('files', pdfFile);

        const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            originalFileName: fileName,
            fileVersion: fileVersion,
            siteId: authoritativeSiteId,
            issueDate: formatDateForBackend(inspectionDateOverride || formData.inspectionDate),
            expiryDate: formatDateForBackend(calculateExpiryDate(inspectionDateOverride || formData.inspectionDate, inspectionDetails?.repeatFrequency)),
              uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `EL-${new Date().getTime()}`
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
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF: ' + error.message);
      return false;
    } finally {
      setIsUploading(false);
    }
  };


  const getInspection = async () => {
    try {
      const apiData = await get("/api/site-check/emergency-lighting/" + checkId);

      if (apiData) {
        let existingAction = null;
        if (apiData.actionId) {
          existingAction = await fetchActionById(apiData.actionId);
          if (existingAction) {
            setExistingAction(existingAction);
            setActionRaised(true);
          }
        }

        // Create a map of checks from API data for easier lookup
        const apiChecksMap = {};
        apiData.inspectionChecks?.forEach(check => {
          apiChecksMap[check.check] = check;
        });

        // Map asset IDs to full asset objects
        const selectedAssets = [];
        if (apiData.assetId && apiData.assetId.length > 0 && siteAssets.length > 0) {
          apiData.assetId.forEach(id => {
            const asset = siteAssets.find(a => a.assetId === id);
            if (asset) {
              selectedAssets.push(asset);
            }
          });
        }

        const savedEngineerId = apiData?.inspectionBy || apiData?.inspectionByUser?.id || null;
        setLastEngineerId(savedEngineerId);
        const engineerUser = apiData?.inspectionByUser ||
            users.find((user) => String(user.id) === String(savedEngineerId));
        const isCurrentOpenInspection =
            checkStatus === "Open" && isCurrentUkInspectionDate(apiData?.inspectionDate);

        setFormData((prev) => ({
          ...prev,
          id: apiData?.id || prev.id,
          selectedAssets: selectedAssets, // Set the mapped assets
          assetIds: selectedAssets.map(asset => asset.assetId), // Set the IDs
          installationName: apiData?.installationName || prev.installationName,
          installationAddress: apiData?.installationAddress || prev.installationAddress,
          bsiCategoryType: apiData?.bsiCategoryType || prev.bsiCategoryType,
          bsiCategoryMode: apiData?.bsiCategoryMode || prev.bsiCategoryMode,
          bsiCategoryFacilities: apiData?.bsiCategoryFacilities || prev.bsiCategoryFacilities,
          bsiCategoryDuration: apiData?.bsiCategoryDuration || prev.bsiCategoryDuration,
          inspectionDate: checkStatus === "Open"
              ? getUkLocalDateAsDate()
              : (apiData?.inspectionDate
                  ? new Date(`${String(apiData.inspectionDate).slice(0, 10)}T12:00:00`)
                  : prev.inspectionDate),
          inspectionChecks: prev.inspectionChecks.map(defaultCheck => {
            // Find matching check in API data
            const apiCheck = apiChecksMap[defaultCheck.check];

            return {
              ...defaultCheck, // Start with default values
              ...(apiCheck || {}), // Override with API values if they exist
              check: apiCheck?.check || defaultCheck.check, // Preserve check value from either source
              checkQ: defaultCheck.checkQ // Always keep the default question text
            };
          }),
          actionId: apiData?.actionId || prev.actionId,
          additionalComments: apiData?.additionalComments || prev.additionalComments,
          allFittingsPassed: apiData?.allFittingsPassed || prev.allFittingsPassed,
          file: apiData?.file || prev.files,
          // OLD: user: apiData?.inspectionByUser || prev.user,
          // NEW: same Open/Done engineer behaviour as Air Conditioning.
          inspectionBy: checkStatus === "Open"
              ? (isCurrentOpenInspection
                  ? (savedEngineerId || loggedInUserData?.id || "")
                  : (loggedInUserData?.id || ""))
              : (savedEngineerId || prev.inspectionBy || ""),
          user: checkStatus === "Open"
              ? (isCurrentOpenInspection
                  ? (engineerUser || loggedInUserData || {})
                  : (loggedInUserData || {}))
              : (engineerUser || prev.user || {}),
        }));

        const details = await fetchInspectionDetails(checkId);
        setInspectionDetails(details);

        setCompleted(true);
      }
    } catch (error) {
      console.error("Inspection load error:", error);
    }
  };


  const fetchCheckStatus = async () => {
    try {
      if (!checkId) return;

      const response = await get(`api/site-check/check-id/${checkId}`);
      if (response) {
        const isDone = response.status === 'Done';
        setIsFormEditable(!isDone);
        setIsSubmitted(isDone);

        if (isDone) {
          setInspectionDetails({
            type: response.type,
            subType: response.subType,
            category: response.category
          });
        }
      }
    } catch (error) {
      console.error('Error fetching check status:', error);
    }
  };
  useEffect(() => {
    const syncActionState = async () => {
      if (formData.actionId) {
        const action = await fetchActionById(formData.actionId);
        if (action) {
          setExistingAction(action);
          setActionRaised(true);
        }
      }
    };
    syncActionState();
  }, [formData.actionId]);

  useEffect(() => {
    const fetchData = async () => {
      getUsers();
      if (authoritativeSiteId) {
        await fetchFolderStructure(authoritativeSiteId);
      }

      if (checkId) {
        await getInspection();
        await fetchCheckStatus();
      }

      await fetchExistingActions();

      if (authoritativeSiteId) {
        getSiteAssets(authoritativeSiteId);
      }
    };

    fetchData();
  }, [authoritativeSiteId, checkId]);

  useEffect(() => {
    if (license?.companyName) {
      setFormData((prev) => ({
        ...prev,
        installationName: license.companyName,
      }));
    }

    if (!siteSelectedForGlobal.siteId) {
      return;
    }

    const addressParts = [
      siteSelectedForGlobal.address1,
      siteSelectedForGlobal.address2,
      siteSelectedForGlobal.city,
      siteSelectedForGlobal.area,
      siteSelectedForGlobal.postCode,
      siteSelectedForGlobal.country,
    ].filter((part) => part);

    const fullAddress = addressParts.join(", ");

    setFormData((prev) => ({
      ...prev,
      installationAddress: fullAddress,
    }));
  }, [license?.companyName, siteSelectedForGlobal]);

  const handleInputChange = (e, field) => {
    const value =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleAssetSelect = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      selectedAssets: newValue,
      assetIds: newValue.map(asset => asset.assetId)
    }));
  };

  // Remove a selected asset
  const handleRemoveAsset = (assetId) => {
    setFormData(prev => ({
      ...prev,
      selectedAssets: prev.selectedAssets.filter(asset => asset.assetId !== assetId),
      assetIds: prev.assetIds.filter(id => id !== assetId)
    }));
  };

  const handleCheckChange = (index, field, value) => {
    const updatedChecks = [...formData.inspectionChecks];
    updatedChecks[index][field] = value;
    setFormData((prev) => ({
      ...prev,
      inspectionChecks: updatedChecks,
    }));
  };

  const FILE_VALIDATION_CONFIG = {
    MAX_FILE_SIZE: 10 * 1024 * 1024,
    MAX_TOTAL_SIZE: 100 * 1024 * 1024,
    ALLOWED_TYPES: ["image/jpeg", "image/png", "application/pdf"],
    MAX_FILE_COUNT: 10,
  };

  const validateFiles = (newFiles, existingFiles = []) => {
    if (
        newFiles.length + existingFiles.length >
        FILE_VALIDATION_CONFIG.MAX_FILE_COUNT
    ) {
      return {
        isValid: false,
        error: `You can upload a maximum of ${FILE_VALIDATION_CONFIG.MAX_FILE_COUNT} files.`,
      };
    }

    const invalidFiles = newFiles.filter(
        (file) => !FILE_VALIDATION_CONFIG.ALLOWED_TYPES.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      return {
        isValid: false,
        error: "Only JPG, PNG, PDF, DOC, and DOCX files are allowed.",
      };
    }

    const oversizedFiles = newFiles.filter(
        (file) => file.size > FILE_VALIDATION_CONFIG.MAX_FILE_SIZE
    );
    if (oversizedFiles.length > 0) {
      return {
        isValid: false,
        error: `Some files exceed the maximum size of ${
            FILE_VALIDATION_CONFIG.MAX_FILE_SIZE / 1024 / 1024
        }MB.`,
      };
    }

    const currentTotalSize = existingFiles.reduce(
        (sum, file) => sum + file.size,
        0
    );
    const newTotalSize =
        currentTotalSize + newFiles.reduce((sum, file) => sum + file.size, 0);

    if (newTotalSize > FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE) {
      return {
        isValid: false,
        error: `Total size exceeds ${
            FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024
        }MB limit.`,
      };
    }

    return { isValid: true };
  };

  const handleFileChange = (e) => {
    const selectedFiles = Array.from(e.target.files);

    if (selectedFiles.length === 0) return;
    const validation = validateFiles(selectedFiles, formData.files);
    if (!validation.isValid) {
      toast.error(validation.error);
      e.target.value = "";
      return;
    }

    setFormData((prev) => ({
      ...prev,
      files: [...prev.files, ...selectedFiles],
    }));

    e.target.value = "";
  };
  const filteredAssets = React.useMemo(() => {
    return siteAssets?.filter(
        (asset) =>
            asset.category === "Electrical" &&
            asset.subCategory === "Emergency Lighting Installation"
    ) || [];
  }, [siteAssets]);


  const handleFileDelete = (index) => {
    setFormData((prev) => {
      const updatedFiles = [...prev.files];
      updatedFiles.splice(index, 1);
      return {
        ...prev,
        files: updatedFiles,
      };
    });
  };

  const handleDateChange = (date) => {
    setFormData((prev) => ({
      ...prev,
      inspectionDate: date || getUkLocalDateAsDate(),
    }));
  };

  // NEW: Shared engineer dropdown selection.
  const handleEngineerSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      inspectionBy: newValue?.id || "",
      user: newValue || {},
    }));
  };

  const submitInspection = async (e) => {
    e.preventDefault();

    if (!isFormEditable) {
      toast.error("This form is completed and cannot be modified");
      return;
    }

    if (!formData.inspectionBy || !selectedEngineer) {
      toast.error("Please select an active engineer for this Site Check.");
      return;
    }

    // Validate form
    const hasUnsatisfactoryChecks = formData.inspectionChecks
        .slice(0, 5)
        .some(check => check.satisfactory === false);

    if (hasUnsatisfactoryChecks && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    setIsLoading(true);

    try {
      // NEW: Open checks complete using today's UK date, matching Air Conditioning.
      const submissionInspectionDate =
          checkStatus === "Open" ? getUkLocalDateAsDate() : formData.inspectionDate;

      if (checkStatus === "Open") {
        setFormData((prev) => ({ ...prev, inspectionDate: submissionInspectionDate }));
      }

      // 1. First ensure we have the folder structure loaded
      const category = inspectionDetails?.category || 'Emergency Lighting';
      await fetchFolderStructure(authoritativeSiteId, category);

      // 2. Create/Update site check record
      const statusPayload = {
        siteId: authoritativeSiteId,
        type: siteCheck?.type || 'Inspection',
        // OLD: subType/category were rewritten to internal inspection values.
        // NEW: preserve the original Site Check routing values.
        subType: siteCheck?.subType || 'Emergency Lighting to meet BS5266',
        category: siteCheck?.category || category,
        status: 'Done',
        startDate: `${getUkLocalDate()}T00:00:00`,
        dueDate: formatLocalDateTime(calculateExpiryDate(submissionInspectionDate, inspectionDetails?.repeatFrequency)),
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

      // 3. Save inspection data
      const inspectionPayload = {
        ...formData,
        assetId: formData.assetIds || [],
        siteId: authoritativeSiteId,
        checkId: checkIdToUse,
        inspectionBy: formData.inspectionBy,
        inspectionDate: submissionInspectionDate,
        actionId: existingAction?.actionId || formData.actionId
      };

      const inspectionResponse = formData.id
          ? await put(`/api/site-check/emergency-lighting/${formData.id}`, inspectionPayload)
          : await post("/api/site-check/emergency-lighting", inspectionPayload);

      // 4. Generate and upload PDF
      const pdfResult = await generatePDF(submissionInspectionDate);
      if (!pdfResult.success) {
        console.error("PDF generation/upload failed");
      }

      // 5. Update state
      toast.success("Inspection submitted successfully");
      setIsSubmitted(true);
      setIsFormEditable(false);

      if (onCheckCreated && isNewCheck) {
        onCheckCreated(checkIdToUse);
      }

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit inspection");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRiskScore = () => {
    const unsatisfactoryCount = formData.inspectionChecks.filter(
        (check) => check.checkSelected && !check.satisfactory
    ).length;
    return unsatisfactoryCount * 5;
  };

  return (
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h4>Emergency Lighting Inspection & Test Certificate</h4>
          <small>BS5266-1: 2011</small>
        </div>

        {!isFormEditable && (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              This form is read-only because the check has been marked as completed.
            </div>
        )}
        <div className="card-body">
          <form onSubmit={submitInspection}>
            {/* Warning Section */}
            <div className="alert text-danger mb-4">
              <b>WARNING</b>{" "}
              <strong>
                – Full duration tests involve discharging the batteries, so the
                emergency lighting system will not be fully functional until the
                batteries have had time to recharge. For this reason, always carry
                out testing at times of minimal risk, or only test alternate
                luminaries at one time.
              </strong>
            </div>

            {/* Client Details Section */}
            <h5 className="mb-3">Details of the Client</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                      disabled
                      type="text"
                      style={{ height: "80px" }}
                      className="form-control"
                      value={license?.companyName}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                      disabled
                      rows={3}
                      className="form-control"
                      value={license?.companyAddress}
                  />
                </div>
              </div>
            </div>

            {/* Installation Details Section */}
            <h5 className="mb-3">Details of the Installation</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="installationName" className="form-label">
                    Name
                  </label>
                  <input
                      type="text"
                      style={{ height: "80px" }}
                      className="form-control"
                      value={formData?.installationName || ""}
                      disabled
                      required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="installationAddress" className="form-label">
                    Address
                  </label>
                  <textarea
                      rows={3}
                      className="form-control"
                      style={{
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                        fontWeight: "normal",
                      }}
                      value={formData?.installationAddress || ""}
                      required
                      disabled
                  />
                </div>
              </div>
            </div>
            <h5 className="mb-3">Summary of Installation</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="installationName" className="form-label">
                    Inspection and Test Carried out by :
                  </label>
                  <input
                      type="text"
                      style={{ height: "80px" }}
                      className="form-control"
                      value={loggedInUserData?.companyName}
                      disabled
                      required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label htmlFor="installationAddress" className="form-label">
                    Address
                  </label>
                  <textarea
                      rows={3}
                      className="form-control"
                      style={{
                        overflowY: "auto",
                        whiteSpace: "pre-wrap",
                        wordWrap: "break-word",
                        fontWeight: "normal",
                      }}
                      value={loggedInUserData?.companyAddress || ""}
                      required
                      disabled
                  />
                </div>
              </div>
            </div>

            {/* BSI Installation Category Section */}
            <h5 className="mb-3">BSI Installation Category</h5>
            <div className="row mb-3">
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="bsiCategoryType" className="form-label">
                    Type
                  </label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData?.bsiCategoryType || ""}
                      onChange={(e) => handleInputChange(e, "bsiCategoryType")}
                      disabled={!isFormEditable}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="bsiCategoryMode" className="form-label">
                    Mode
                  </label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData?.bsiCategoryMode || ""}
                      onChange={(e) => handleInputChange(e, "bsiCategoryMode")}
                      disabled={!isFormEditable}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="bsiCategoryFacilities" className="form-label">
                    Facilities
                  </label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData?.bsiCategoryFacilities || ""}
                      onChange={(e) =>
                          handleInputChange(e, "bsiCategoryFacilities")
                      }
                      disabled={!isFormEditable}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="bsiCategoryDuration" className="form-label">
                    Duration
                  </label>
                  <select
                      className="form-select"
                      value={formData?.bsiCategoryDuration || ""}
                      onChange={(e) => handleInputChange(e, "bsiCategoryDuration")}
                      disabled={!isFormEditable}
                  >
                    <option value="">Select</option>
                    <option value="30">30 minutes</option>
                    <option value="60">60 minutes</option>
                    <option value="120">120 minutes</option>
                    <option value="180">180 minutes</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Inspection Checks Section */}
            <h5 className="mb-3">Inspection & Test Carried Out By:</h5>
            <table className="table table-striped table-bordered mb-4">
              <thead>
              <tr>
                <th style={{ width: "60%" }}>Check</th>
                <th style={{ width: "20%" }}>Satisfactory</th>
                <th style={{ width: "20%" }}>Remarks</th>
              </tr>
              </thead>
              <tbody>
              {formData?.inspectionChecks?.map((check, index) => (
                  <tr key={index}>
                    <td>
                      <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={check?.checkSelected || ""}
                            onChange={(e) =>
                                handleCheckChange(
                                    index,
                                    "checkSelected",
                                    e.target.checked
                                )
                            }
                            disabled={!isFormEditable}
                        />
                        <label className="form-check-label">
                          {check?.checkQ || ""}
                        </label>
                      </div>
                    </td>
                    <td className="text-center">
                      <input
                          type="checkbox"
                          className="form-check-input"
                          checked={check?.satisfactory || ""}
                          onChange={(e) =>
                              handleCheckChange(
                                  index,
                                  "satisfactory",
                                  e.target.checked
                              )
                          }
                          disabled={!isFormEditable}
                      />
                    </td>
                    <td style={{ position: "relative" }}>
                      <input
                          type="text"
                          className="form-control"
                          value={check?.remarks || ""}
                          onChange={(e) =>
                              handleCheckChange(index, "remarks", e.target.value)
                          }
                          onMouseEnter={() => setHoveredRemarksIndex(index)}
                          onMouseLeave={() => setHoveredRemarksIndex(null)}
                          placeholder="Enter remarks..."
                          disabled={!isFormEditable}
                      />
                      {hoveredRemarksIndex === index && check.remarks && (
                          <div
                              style={{
                                position: "absolute",
                                top: "100%",
                                left: "-40px",
                                zIndex: 1000,
                                fontSize: "15px",
                                backgroundColor: "#fff",
                                border: "1px solid #ddd",
                                padding: "28px",
                                borderRadius: "4px",
                                boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                              }}
                          >
                            {check.remarks}
                          </div>
                      )}
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>

            <div className="row mb-4">
              <div className="col-md-12">
                <label className="form-label">Select Emergency Lighting Assets</label>
                <div className="d-flex align-items-center mb-2">
                  <button
                      type="button"
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          selectedAssets: filteredAssets,
                          assetIds: filteredAssets.map(asset => asset.assetId)
                        }));
                      }}
                      disabled={!isFormEditable}
                  >
                    Select All
                  </button>
                  <button
                      type="button"
                      className="btn btn-sm btn-outline-secondary"
                      onClick={() => {
                        setFormData(prev => ({
                          ...prev,
                          selectedAssets: [],
                          assetIds: []
                        }));
                      }}
                      disabled={!isFormEditable}
                  >
                    Clear All
                  </button>
                </div>
                <Autocomplete
                    multiple
                    disabled={!isFormEditable}
                    options={filteredAssets}
                    getOptionLabel={(option) =>
                        `${option.assetId}`
                    }
                    value={formData.selectedAssets}
                    onChange={handleAssetSelect}
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Search and select assets"
                            variant="outlined"
                            placeholder="Type to search..."
                        />
                    )}
                    renderTags={(value, getTagProps) => (
                        <div className="d-flex flex-wrap gap-1">
                          {value.map((option, index) => (
                              <Chip
                                  key={option.assetId}
                                  label={`${option.assetId} - ${option.assetName}`}
                                  onDelete={() => handleRemoveAsset(option.assetId)}
                                  {...getTagProps({ index })}
                              />
                          ))}
                        </div>
                    )}
                    renderOption={(props, option, { selected }) => (
                        <li {...props}>
                          <div className="d-flex align-items-center">
                            <input
                                type="checkbox"
                                checked={selected}
                                className="form-check-input me-2"
                                readOnly
                            />
                            <span>
              {option.assetId} - {option.assetName}
            </span>
                          </div>
                        </li>
                    )}
                    sx={{ width: "100%" }}
                    isOptionEqualToValue={(option, value) =>
                        option.assetId === value.assetId
                    }
                    disableCloseOnSelect
                />
              </div>
            </div>



            {showRiskAssessment && (
                <div className="card mb-4">
                  <div className="card-header">
                    <h5 className="mb-0">Risk Assessment</h5>
                    {existingAction && Number(existingAction.checkId) === Number(currentCheckId) && (
                        <span className="badge bg-success ms-2">
          Action #{existingAction.actionId} - {existingAction.status}
        </span>
                    )}
                  </div>
                  <div className="card-body">
                    {existingAction && Number(existingAction.checkId) === Number(currentCheckId) ? (
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
                            desc={`Inspection - Emergency Lighting to meet BS5266 - ${inspectionDetails?.category || ''}`}
                            siteId={siteSelectedForGlobal?.siteId}
                            checkId={currentCheckId}
                            taggedAsset={formData.assetIds.toString()}
                            createdBy={loggedInUserData?.id}
                            onRiskAssessmentComplete={handleRiskAssessmentComplete}
                            actionRaised={actionRaised}
                            disabled={!isFormEditable}
                        />
                    )}
                  </div>
                </div>
            )}
            {/* Additional Comments Section */}
            <h5 className="mb-1">Additional Comments & Deviations</h5>
            <p
                className="mb-2"
                style={{
                  fontSize: "12px",
                  fontWeight: "normal",
                  color: "#7b7b7b",
                }}
            >
              Please provide as much information as possible on luminaire failures
              & deviations including locations, luminaire types, make & model
              numbers
            </p>
            <div className="mb-4">
            <textarea
                rows={8}
                className="form-control"
                value={formData?.additionalComments || ""}
                onChange={(e) => handleInputChange(e, "additionalComments")}
                placeholder="Please provide Information"
                disabled={!isFormEditable}
            />
            </div>

            {/* Certification Statement */}
            <div className="border p-3 mb-4 bg-light">
              <p>
                We hereby certify that the emergency lighting system installation
                at the above premises has been inspected and tested by us in
                accordance with BS 5266-1: 2011, and to the best of our knowledge
                and belief, the installation complies at the time of inspection
                and testing with the recommendations given in BS 5266. Emergency
                lighting Part 1:2011. Code of practice for the Emergency lighting
                of premises, published by the BSI for a category (stated above)
                except as stated in the deviations above.
              </p>
            </div>

            {/* Inspector Details Section */}
            <h5 className="mb-3">For the Inspection & Test of the system:</h5>
            <div className="row mb-3">
              {/* =========================================================
                  OLD ENGINEER FIELD - COMMENTED FOR REVIEW

              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="inspector.name" className="form-label">Name</label>
                  <input disabled type="text" className="form-control" value={formData.user?.name || ""} />
                </div>
              </div>

              ========================================================= */}

              {/* NEW SHARED ENGINEER CONTROL - MATCHES AIR CONDITIONING */}
              <div className="col-md-3">
                <SiteCheckEngineerSelector
                    options={engineerOptions}
                    value={selectedEngineer}
                    onChange={handleEngineerSelect}
                    isOpen={checkStatus === "Open"}
                    disabled={isSubmitted || !isFormEditable}
                    loading={isLoadingEngineers}
                    error={engineerLoadError}
                    label="Name"
                />
              </div>

              {/* Position */}
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="inspector.position" className="form-label">
                    Position
                  </label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData.user?.role || ""}
                      disabled
                  />
                </div>
              </div>

              {/* Signature */}
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="inspector.signature" className="form-label">
                    Signature
                  </label>
                  <div
                      className="border rounded bg-white d-flex align-items-center"
                      style={{ height: "38px", padding: "2px" }}
                  >
                    <img
                        width="100%"
                        height="100%"
                        style={{ objectFit: "contain" }}
                        src={formData.user?.signature + "?" + sasToken}
                        alt="Signature"
                    />
                  </div>
                </div>
              </div>

              {/* Date */}
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="inspector.date" className="form-label">
                    Date
                  </label>
                  <DatePicker
                      selected={formData.inspectionDate || ""}
                      onChange={handleDateChange}
                      className="form-control"
                      dateFormat="dd/MM/yyyy"
                      wrapperClassName="w-100"
                      required
                      disabled={!isFormEditable}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <div className="d-flex gap-2">
                {!isSubmitted ? (
                    <button
                        type="submit"
                        className="btn btn-primary"
                        disabled={
                            isLoading ||
                            isGeneratingPDF ||
                            (showRiskAssessment && !actionRaised) ||
                            !isFormEditable
                        }
                    >
                      {isLoading ? 'Submitting...' :
                          isGeneratingPDF ? 'Generating PDF...' : 'Submit Inspection'}
                    </button>
                ) : (
                    <div className="alert alert-success">
                      Inspection submitted successfully on {formatDate(formData.inspectionDate)}
                    </div>
                )}
              </div>
            </div>
          </form>
          <style>
            {`
            /* For the chips container */
.d-flex.flex-wrap.gap-1 {
  gap: 0.5rem;
  padding: 0.5rem 0;
}

/* For the options list */
.MuiAutocomplete-option {
  padding: 8px 16px;
}

/* For the checkbox alignment */
.d-flex.align-items-center {
  align-items: center;
}

/* For the select/clear buttons */
.btn-sm {
  padding: 0.25rem 0.5rem;
  font-size: 0.875rem;
}
            `}
          </style>
        </div>
      </div>
  );
};

const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets || [],
  siteSelectedForGlobal: state.site.siteSelectedForGlobal || {},
  loggedInUserData: state.site.loggedInUserData || {},
  siteCheck: state.site.siteCheck || {},
});

export default connect(mapStateToProps, { getSiteAssets, getUsers })(
    EmergencyLightingInspectionForm
);
