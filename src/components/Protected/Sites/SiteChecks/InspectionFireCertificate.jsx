import React, { useEffect, useState } from "react";
import { connect, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { getSiteAssets, getUsers } from "../../../../store/thunk/site";
import { get, post, put } from "../../../../api";
import axios from 'axios';
import pdfTemplate from './pdf/Fire Alarm.pdf';
import RiskScoreCard from "./RiskScoreCard";
import { formatDate } from "../../../../utils/dateFormat";

const InspectionFireCertificate = ({
                                     checkId,
                                     sasToken,
                                     siteAssets = [],
                                     getSiteAssets,
                                     siteSelectedForGlobal = {},
                                     loggedInUserData = {},
                                     siteCheck = {},
                                     onCheckCreated
                                   }) => {
  const license = JSON.parse(localStorage.getItem("license"));
  const [isUploading, setIsUploading] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const [inspectionDetails, setInspectionDetails] = useState(null);
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isNewCheck, setIsNewCheck] = useState(!checkId);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const users = useSelector((state) => state.site.users || []);

  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    fireLogBook: null,
    fireAlarm: null,
    monthlyTesting: null
  });

  const [formData, setFormData] = useState({
    inspectionChecks: [
      {
        check: 1,
        checkQ: "Fire alarm & detection devices have been tested for correct operation",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 2,
        checkQ: "Fire alarm & detection devices are undamaged, unpainted & unobstructed",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 3,
        checkQ: "Automatic transmission of all signals to alarm receiving centre verified",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 4,
        checkQ: "All monitored circuits have been checked by simulation of fault condition",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 5,
        checkQ: "Printers have been checked, text is legible and supplies available",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 6,
        checkQ: "CIE functions checked for correct operation",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 7,
        checkQ: "The control equipment is in overall good condition",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 8,
        checkQ: "The buildings structure, occupancy and layout have not changed",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
      {
        check: 9,
        checkQ: "System log book examined & faults recorded have been attended to",
        checkSelected: false,
        remarks: "",
        satisfactory: false,
      },
    ],
    additionalComments: "",
    additionalComments1: "",
    additionalComments2: "",
    inspectionDate: new Date(),
    installationName: "",
    installationAddress: "",
    inspectionBy: loggedInUserData?.id,
    batteryCount: 0,
    batteryVoltage: "",
    batteryCapacity: "",
    batteryVented: false,
    falseAlarmsCount: 0,
    falseAlarmsRate: "",
    systemCondition: "",
    batteryTestResults: [
      {
        batteryIdentifier: "A",
        voltage: "",
        charge: "",
        installedDate: null
      },
      {
        batteryIdentifier: "B",
        voltage: "",
        charge: "",
        installedDate: null
      }
    ], files: [],
    user: loggedInUserData,
    actionId: null,
  });

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

  // Function to fetch inspection details
  const fetchInspectionDetails = async (checkId) => {
    try {
      const response = await get(`/api/site-check/check-id/${checkId}`);
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

      return inspectionDetails;
    } catch (error) {
      console.error('Error fetching inspection details:', error);
      return null;
    }
  };

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
        verifiedAction.checkId = currentCheckId;
      }

      // Update all relevant states
      setExistingAction(verifiedAction);
      setActionRaised(true);
      setFormData(prev => ({
        ...prev,
        actionId: verifiedAction.actionId
      }));

      // Save the inspection data with the actionId
      const inspectionPayload = {
        ...formData,
        siteId: siteSelectedForGlobal?.siteId,
        checkId: currentCheckId,
        actionId: verifiedAction.actionId,
        inspectionBy: loggedInUserData.id,
        type: 'Inspection',
        subType: 'Fire Alarm',
        category: inspectionDetails?.category || 'Fire Alarm'
      };

      if (currentCheckId) {
        const existingInspections = await get(`/api/site-check/fire-alarm-inspection/${currentCheckId}`);
        if (existingInspections?.length > 0) {
          await put(`/api/site-check/fire-alarm-inspection/${currentCheckId}`, inspectionPayload);
        } else {
          await post(`/api/site-check/fire-alarm-inspection`, inspectionPayload);
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

  // Replace the existing useEffect that controls showRiskAssessment
  useEffect(() => {

    const hasAdditionalComments = formData.additionalComments.trim().length > 0;

    const isActionValid = existingAction &&
        (Number(existingAction.checkId) === Number(currentCheckId));

    setShowRiskAssessment(hasAdditionalComments);
    setActionRaised(isActionValid);
  }, [formData.additionalComments, currentCheckId, existingAction]);


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
      if (formData.actionId) {
        const action = await fetchActionById(formData.actionId);
        if (action && Number(action.checkId) === Number(currentCheckId)) {
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
            Number(action.checkId) === Number(currentCheckId)
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

  // Generate PDF function
  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);

      // Ensure we have inspection details
      let inspectionDetails = null;
      if (currentCheckId) {
        inspectionDetails = await fetchInspectionDetails(currentCheckId);
      }

      // Generate PDF content
      const { PDFDocument } = await import('pdf-lib');
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
      setTextField('inspectionTest', loggedInUserData?.companyName || '');
      setTextField('Address_3', loggedInUserData?.companyAddress || '');

      // Set inspection date
      const formattedDate = formData.inspectionDate
          ? new Date(formData.inspectionDate).toLocaleDateString('en-GB')
          : '';
      setTextField('Date', formattedDate);

      // Process inspection checks
      for (let i = 1; i <= 9; i++) {
        setCheckbox(`CheckBox${i}`, false);
      }

      formData.inspectionChecks.forEach((check, index) => {
        if (index < 9) {
          const checkboxName = `CheckBox${index + 1}`;
          if (check.checkSelected !== undefined) {
            setCheckbox(checkboxName, check.checkSelected);
          }
          if (check.satisfactory === true) {
            const rightCheckboxName = `CheckBox${index + 10}`;
            setCheckbox(rightCheckboxName, true);
          }
          const remarksField = `Remarks${index + 1}`;
          if (check.remarks) {
            setTextField(remarksField, check.remarks);
          }
        }
      });

      // Set battery information
      setTextField('BatteryCount', formData.batteryCount.toString() || '');
      setTextField('BatteryVoltage', formData.batteryVoltage || '');
      setTextField('BatteryCapacity', formData.batteryCapacity || '');
      setCheckbox('BatteryVented', formData.batteryVented);

      formData.batteryTestResults.slice(0, formData.batteryCount).forEach((battery, index) => {
        setTextField(`voltage${index + 1}`, battery.voltage || '');
        setTextField(`charge${index + 1}`, battery.charge || '');
        setTextField(`installedDate${index + 1}`,
            battery.installedDate ? formatDate(battery.installedDate) : '');
      });

      // Set false alarm information
      setTextField('FalseAlarmsCount', formData.falseAlarmsCount || '');
      setTextField('FalseAlarmsRate', formData.falseAlarmsRate || '');
      setTextField('details', inspectionDetails?.category || '');


      // Set system condition
      setCheckbox('SystemConditionSatisfactory', formData.systemCondition === 'satisfactory');
      setCheckbox('SystemConditionUnsatisfactory', formData.systemCondition === 'unsatisfactory');

      // Set additional comments
      setTextField('additionalComments', formData.additionalComments || '');
      setTextField('additionalComments1', formData.additionalComments1 || '');
      setTextField('additionalComments2', formData.additionalComments2 || '');

      // Set inspector details
      const inspector = users.find(u => u.id === loggedInUserData?.id);
      setTextField('Engineer', inspector?.name || loggedInUserData?.name || '');
      setTextField('Position', loggedInUserData?.role || '');

      // Add signature if available
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
      const fileName = `FireAlarmInspection_${inspectionDetails?.category || 'report'}.pdf`;

      // Save locally first
      //await savePdfToLocal(blob, fileName);

      // Upload to server
      await uploadPdfToServer(
          blob,
          fileName,
          inspectionDetails?.category || 'Fire Alarm'
      );

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + error.message);
      return { success: false, error: error.message };
    } finally {
      setIsGeneratingPDF(false);
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

  const getFolderNameFromCategory = (category) => {
    // Keep original folder names exactly as they appear in the system
    switch (category) {
      case 'Fire Alarm - Weekly Call Point testing to meet BS5839':
        return 'Fire Alarm -  Weekly Testing';
      case 'Fire Alarm - monthly testing to meet BS5839':
        return 'Fire Alarm - Monthly Testing';
      case 'Fire Alarm - 6 monthly testing to meet BS5839':
        return 'Fire Alarm - 6 Monthly Testing';
      case 'Fire Alarm - 12 monthly testing to meet BS5839':
        return 'Fire Alarm - 12 Monthly Testing';
      default:
        return 'Fire Alarm - Monthly Testing'; // Default fallback
    }
  };

  const handleBatteryChange = (index, field, value) => {
    const updatedBatteries = [...formData.batteryTestResults];
    updatedBatteries[index][field] = value;
    setFormData(prev => ({
      ...prev,
      batteryTestResults: updatedBatteries
    }));
  };

  // Fetch folder structure function
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

      // 4. Get Fire Alarm children
      const fireLogChildren = await get(`/api/document/parent/${fireLogBookFolder.id}/folders?siteId=${siteId}`);
      const fireAlarmFolder = fireLogChildren?.document?.childFolders?.find(
          f => f.name === 'Fire Alarm(BS5839)'
      );
      if (!fireAlarmFolder) throw new Error('Fire Alarm folder not found');

      // 5. Get target subfolder (CRITICAL FIX)
      const targetFolderName = getFolderNameFromCategory(category);
      const fireAlarmChildren = await get(`/api/document/parent/${fireAlarmFolder.id}/folders?siteId=${siteId}`);

      console.log('Searching for:', targetFolderName);
      console.log('Available subfolders:',
          fireAlarmChildren?.document?.childFolders?.map(f => `${f.name} (${f.id})`) || []);

      // Find the EXACT matching subfolder
      const targetFolder = fireAlarmChildren?.document?.childFolders?.find(
          f => f.name === targetFolderName
      );

      if (!targetFolder) {
        console.warn(`Exact subfolder "${targetFolderName}" not found, using parent folder`);
      }

      // FINAL FOLDER ID ASSIGNMENT (FIXED)
      const newFolderIds = {
        logBooks: logBooksFolder.id,
        fireLogBook: fireLogBookFolder.id,
        fireAlarm: fireAlarmFolder.id,
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

  const uploadPdfToServer = async (pdfBlob, fileName, category) => {
    try {
      setIsUploading(true);

      // First save locally
      await savePdfToLocal(pdfBlob, fileName);

      // Ensure we have the latest folder structure
      const targetFolderId = await fetchFolderStructure(siteSelectedForGlobal?.siteId, category);
      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const formData = new FormData();

      // Helper function to format date for backend
      const formatDateForBackend = (dateString) => {
        if (!dateString) return null; // Handle missing date

        // Convert to Date object (works for ISO strings like "2025-08-23T00:00:00")
        const date = new Date(dateString);

        // Format as "YYYY-MM-DD HH:MM:SS" (same as issueDate)
        return date.toISOString().replace('T', ' ').split('.')[0];
      };

      // Check if file exists
      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      if (exists && existingFile) {
        // Update existing file
        formData.append('file', pdfFile);

        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            id: existingFile.id,
            name: fileName,
            originalFileName: fileName,
            fileVersion: (existingFile.fileVersion || 1) + 1,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: formatDateForBackend(new Date()),
            expiryDate: formatDateForBackend(inspectionDetails.dueDate),
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `FA-${new Date().getTime()}`
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
        // Create new file
        formData.append('files', pdfFile);

        const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            originalFileName: fileName,
            fileVersion: fileVersion,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: formatDateForBackend(new Date()),
            expiryDate: formatDateForBackend(inspectionDetails.dueDate),
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `FA-${new Date().getTime()}`
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
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF: ' + error.message);
      return false;
    } finally {
      setIsUploading(false);
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
        const maxVersion = Math.max(...versions);
        return maxVersion + 1;
      }
      return 1;
    } catch (error) {
      console.error('Error checking file versions:', error);
      return 1;
    }
  };

  const getInspection = async () => {
    try {
      const apiData = await get(`/api/site-check/fire-alarm-inspection/${checkId}`);

      if (apiData) {
        let existingAction = null;
        if (apiData.actionId) {
          existingAction = await fetchActionById(apiData.actionId);
          if (existingAction) {
            setExistingAction(existingAction);
            setActionRaised(true);
          }
        }
        const batteryData = apiData.batteryTestResults || [];
        const defaultBatteries = [
          { batteryIdentifier: "A", voltage: "", charge: "", installedDate: null },
          { batteryIdentifier: "B", voltage: "", charge: "", installedDate: null }
        ];

        const loadedBatteries = defaultBatteries.map((battery, index) => {
          return batteryData[index] ? { ...battery, ...batteryData[index] } : battery;
        });



        // Create a map of checks from API data for easier lookup
        const apiChecksMap = {};
        apiData.inspectionChecks?.forEach(check => {
          apiChecksMap[check.check] = check;
        });

        setFormData(prev => ({
          ...prev,
          id: apiData?.id || prev.id,
          installationName: apiData?.installationName || prev.installationName,
          installationAddress: apiData?.installationAddress || prev.installationAddress,
          batteryCount: Math.min(batteryData.length, 2), // Ensure max 2 batteries
          batteryTestResults: loadedBatteries,
          batteryVoltage: apiData?.batteryVoltage || prev.batteryVoltage,
          batteryCapacity: apiData?.batteryCapacity || prev.batteryCapacity,
          batteryVented: apiData?.batteryVented || prev.batteryVented,
          falseAlarmsCount: apiData?.falseAlarmsCount || prev.falseAlarmsCount,
          falseAlarmsRate: apiData?.falseAlarmsRate || prev.falseAlarmsRate,
          systemCondition: apiData?.systemCondition || prev.systemCondition,
          inspectionChecks: prev.inspectionChecks.map(defaultCheck => {
            const apiCheck = apiChecksMap[defaultCheck.check];
            return {
              ...defaultCheck,
              ...(apiCheck || {}),
              checkQ: defaultCheck.checkQ
            };
          }),
          actionId: apiData?.actionId || prev.actionId,
          additionalComments: apiData?.additionalComments || prev.additionalComments,
          additionalComments1: apiData?.additionalComments1 || prev.additionalComments1,
          additionalComments2: apiData?.additionalComments2 || prev.additionalComments2,
          files: apiData?.files || prev.files,
          user: apiData?.inspectionByUser || prev.user,
        }));

        const details = await fetchInspectionDetails(checkId);
        setInspectionDetails(details);

        setCompleted(true);
      }
    } catch (error) {
      console.error("Inspection load error:", error);
      toast.error("Failed to load inspection data");
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
      if (siteSelectedForGlobal?.siteId) {
        await fetchFolderStructure(siteSelectedForGlobal.siteId, 'Fire Alarm');
      }

      if (checkId) {
        await getInspection();
        await fetchCheckStatus();
      }

      await fetchExistingActions();

      if (siteSelectedForGlobal?.siteId) {
        getSiteAssets(siteSelectedForGlobal.siteId);
      }
    };

    fetchData();
  }, [siteSelectedForGlobal?.siteId, checkId]);

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
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCheckChange = (index, field, value) => {
    const updatedChecks = [...formData.inspectionChecks];
    updatedChecks[index][field] = value;

    if (field === "checkSelected") {
      updatedChecks[index].satisfactory = value;
    }

    setFormData(prev => ({
      ...prev,
      inspectionChecks: updatedChecks,
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({ ...prev, inspectionDate: date || new Date() }));
  };



  const submitInspection = async (e) => {
    e.preventDefault();

    if (!isFormEditable) {
      toast.error("This form is completed and cannot be modified");
      return;
    }

    if (!formData.systemCondition) {
      toast.error("Please select system condition (Satisfactory/Unsatisfactory)");
      return;
    }



    const hasAdditionalComments = formData.additionalComments.trim().length > 0;

    if (hasAdditionalComments && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    setIsLoading(true);

    try {
      // 1. First create/update site check record
      const statusPayload = {
        siteId: siteSelectedForGlobal?.siteId,
        type: 'Inspection',
        subType: 'Fire Alarm',
        category: 'Fire Alarm',
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

      // 2. Save inspection data
      const inspectionPayload = {
        ...formData,
        siteId: siteSelectedForGlobal?.siteId,
        checkId: checkIdToUse,
        inspectionBy: loggedInUserData?.id,
        actionId: existingAction?.actionId || formData.actionId,
        batteryTestResults: formData.batteryTestResults.slice(0, formData.batteryCount)
      };

      const inspectionResponse = formData.id
          ? await put(`/api/site-check/fire-alarm-inspection/${formData.id}`, inspectionPayload)
          : await post("/api/site-check/fire-alarm-inspection", inspectionPayload);

      // 3. Generate and upload PDF
      const pdfResult = await generatePDF();
      if (!pdfResult.success) {
        console.error("PDF generation/upload failed");
      }

      // 4. Update state
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

  return (
      <div className="card mb-4">
        <div className="card-header bg-primary text-white">
          <h4>Fire Alarm Inspection & Test Certificate</h4>
          <small>BS5839 – 1: 2013</small>
        </div>

        {!isFormEditable && (
            <div className="alert alert-warning" role="alert">
              <i className="bi bi-exclamation-triangle-fill me-2"></i>
              This form is read-only because the check has been marked as completed.
            </div>
        )}

        <div className="card-body">
          <form onSubmit={submitInspection}>
            {/* Client Details Section */}
            <h5 className="mb-3">Details of the Client</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                      type="text"
                      className="form-control"
                      value={license?.companyName}
                      disabled
                      required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                      rows={4}
                      className="form-control"
                      value={license?.companyAddress}
                      disabled
                      required
                  />
                </div>
              </div>
            </div>

            {/* Installation Details Section */}
            <h5 className="mb-3">Details of the Installation</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData.installationName}
                      disabled
                      required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                      rows={2}
                      className="form-control"
                      value={formData.installationAddress}
                      disabled
                      required
                  />
                </div>
              </div>
            </div>

            {/* Extent of System and Variations */}
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    The extent of liability of the signatory is limited to the system described. Extent of system covered by this report:
                  </label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData.additionalComments1 || ""}
                      onChange={(e) => handleInputChange(e, "additionalComments1")}
                      disabled={!isFormEditable}
                      required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">
                    Variations from the recommendations of Clause 45 of BS 5839-1:2013 for periodic or annual inspection and test:
                  </label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData.additionalComments2 || ""}
                      onChange={(e) => handleInputChange(e, "additionalComments2")}
                      disabled={!isFormEditable}
                      required
                  />
                </div>
              </div>
            </div>

            {/* Summary of Test & Inspection */}
            <h5 className="mb-3">Summary of Test & Inspection</h5>
            <div className="row mb-3">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Inspection & Test Carried Out By:</label>
                  <input
                      type="text"
                      className="form-control"
                      value={loggedInUserData.companyName || ""}
                      disabled
                      required
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Address:</label>
                  <textarea
                      rows={2}
                      className="form-control"
                      value={loggedInUserData.companyAddress || ""}
                      disabled
                      required
                  />
                </div>
              </div>
            </div>

            {/* Inspection Checks Section */}
            <h5 className="mb-3">Inspection Checks</h5>
            <table className="table table-striped table-bordered mb-4">
              <thead>
              <tr>
                <th style={{ width: "60%" }}>Check</th>
                <th style={{ width: "20%" }}>Remarks</th>
              </tr>
              </thead>
              <tbody>
              {formData.inspectionChecks.map((check, index) => (
                  <tr key={index}>
                    <td>
                      <div className="form-check">
                        <input
                            type="checkbox"
                            className="form-check-input"
                            checked={check.checkSelected}
                            onChange={(e) =>
                                handleCheckChange(index, "checkSelected", e.target.checked)
                            }
                            disabled={!isFormEditable}
                        />
                        <label className="form-check-label">{check.checkQ}</label>
                      </div>
                    </td>

                    <td>
                      <input
                          type="text"
                          className="form-control"
                          value={check.remarks}
                          onChange={(e) =>
                              handleCheckChange(index, "remarks", e.target.value)
                          }
                          placeholder="Enter remarks..."
                          disabled={!isFormEditable}
                      />
                    </td>
                  </tr>
              ))}
              </tbody>
            </table>



            {/* Battery Information Section */}
            {/* Battery Information Section */}
            <div className="card mb-4">
              <div className="card-header bg-primary text-white">
                Battery Information
              </div>
              <div className="card-body">
                <div className="row mb-3">
                  <div className="col-md-6">
                    <div className="form-group mb-3">
                      <label>No. of Batteries:</label>
                      <div className="input-group">
                        <select
                            className="form-control"
                            value={formData.batteryCount}
                            onChange={(e) => {
                              const count = parseInt(e.target.value) || 0;
                              setFormData(prev => ({
                                ...prev,
                                batteryCount: count
                              }));
                            }}
                            disabled={!isFormEditable}
                        >
                          <option value="0">0</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                        </select>
                        <span className="input-group-text">
                        (for more than 2, record results on a separate numbered page)
                      </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group mb-3">
                      <label>Battery Voltage:</label>
                      <div className="input-group">
                        <input
                            type="number"
                            className="form-control"
                            step="0.1"
                            value={formData.batteryVoltage}
                            onChange={(e) => handleInputChange(e, "batteryVoltage")}
                            disabled={!isFormEditable}
                        />
                        <span className="input-group-text">V</span>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <div className="form-group mb-3">
                      <label>Battery Capacity:</label>
                      <div className="input-group">
                        <input
                            type="number"
                            className="form-control"
                            value={formData.batteryCapacity}
                            onChange={(e) => handleInputChange(e, "batteryCapacity")}
                            disabled={!isFormEditable}
                        />
                        <span className="input-group-text">Ah</span>
                      </div>
                      <small className="text-muted">
                        (if batteries are vented, make a note in the observations section)
                      </small>
                    </div>
                  </div>
                </div>

                <div className="border-top pt-3">
                  <h5>Battery Load Test Results</h5>

                  {formData.batteryTestResults.slice(0, formData.batteryCount).map((battery, index) => (
                      <div key={index} className="row mb-3">
                        <div className="col-md-12">
                          <div className="d-flex align-items-center">
                            <strong className="me-2">Battery {battery.batteryIdentifier}:</strong>
                            <div className="input-group input-group-sm me-2" style={{ width: "200px" }}>
                              <span className="input-group-text">Voltage:</span>
                              <input
                                  type="number"
                                  className="form-control"
                                  step="0.1"
                                  min={0}
                                  value={battery.voltage}
                                  onChange={(e) => handleBatteryChange(index, "voltage", e.target.value)}
                                  disabled={!isFormEditable}
                              />
                              <span className="input-group-text">V</span>
                            </div>
                            <div className="input-group input-group-sm me-2" style={{ width: "200px" }}>
                              <span className="input-group-text">Charge:</span>
                              <input
                                  type="number"
                                  className="form-control"
                                  step="0.01"
                                  min={0}
                                  value={battery.charge}
                                  onChange={(e) => handleBatteryChange(index, "charge", e.target.value)}
                                  disabled={!isFormEditable}
                              />
                              <span className="input-group-text">Ah</span>
                            </div>

                            <div className="input-group input-group-md me-2" style={{ width: "240px" }}>
                              <span className="input-group-text">Date Installed:</span>
                              <DatePicker
                                  selected={battery.installedDate ? new Date(battery.installedDate) : null}
                                  onChange={(date) => handleBatteryChange(index, "installedDate", date)}
                                  className="form-control"
                                  dateFormat="dd/MM/yyyy"
                                  disabled={!isFormEditable}
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                  ))}

                  <div className="mt-3">
                    <small className="text-muted">
                      (For category M systems, enter not applicable "N/A")
                    </small>
                    <div className="form-group">
                      <p className="mb-1">
                        During the past 12 months,{" "}
                        <input
                            type="number"
                            min={0}
                            className="form-control d-inline"
                            style={{ width: "60px" }}
                            value={formData.falseAlarmsCount}
                            onChange={(e) => handleInputChange(e, "falseAlarmsCount")}
                            disabled={!isFormEditable}
                        />{" "}
                        false alarms have occurred.
                      </p>
                      <p className="mb-0">
                        The number of false alarms equates to{" "}
                        <input
                            type="text"
                            className="form-control d-inline"
                            style={{ width: "80px" }}
                            value={formData.falseAlarmsRate}
                            onChange={(e) => handleInputChange(e, "falseAlarmsRate")}
                            disabled={!isFormEditable}
                        />{" "}
                        false alarms per 100 AFD's per annum.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Work/Action Required Section */}
            <h5 className="mb-1">The following work/action is considered necessary:</h5>
            <div className="mb-4">
            <textarea
                rows={4}
                className="form-control"
                value={formData.additionalComments}
                onChange={(e) => handleInputChange(e, "additionalComments")}
                placeholder="Describe any necessary work or action..."
                disabled={!isFormEditable}
            />
            </div>

            {/* Risk Assessment Section */}
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
                            desc={`Inspection - Fire Alarm to meet BS5839 - ${inspectionDetails?.category || ''}`}
                            siteId={siteSelectedForGlobal?.siteId}
                            checkId={currentCheckId}
                            createdBy={loggedInUserData?.id}
                            onRiskAssessmentComplete={handleRiskAssessmentComplete}
                            actionRaised={actionRaised}
                            disabled={!isFormEditable}
                        />
                    )}
                  </div>
                </div>
            )}

            {/* System Condition Section */}
            <div className="border p-3 mb-4 bg-light">
              <p>
                I/We being the competent person(s) responsible (as indicated by
                my/our signature(s) below) for the inspection and servicing of the
                fire alarm system, particulars of which are set out above, CERTIFY
                that the said work for which I/we have been responsible complies
                to the best of my/our knowledge and belief with the
                recommendations of Clause 45 of BS 5839–1: 2013 quarterly
                inspection of vented batteries/periodic inspection and test over a
                12 month period except for the variations, if any, stated in this
                certificate.
              </p>
              <p className="mt-3">
                I/We further declare that in my/our judgement, the said system was overall in:
              </p>
              <div className="form-check">
                <input
                    className="form-check-input"
                    type="radio"
                    name="systemCondition"
                    id="systemConditionSatisfactory"
                    value="satisfactory"
                    checked={formData.systemCondition === "satisfactory"}
                    onChange={(e) => handleInputChange(e, "systemCondition")}
                    disabled={!isFormEditable}
                />
                <label className="form-check-label" htmlFor="systemConditionSatisfactory">
                  a satisfactory
                </label>
              </div>
              <div className="form-check">
                <input
                    className="form-check-input"
                    type="radio"
                    name="systemCondition"
                    id="systemConditionUnsatisfactory"
                    value="unsatisfactory"
                    checked={formData.systemCondition === "unsatisfactory"}
                    onChange={(e) => handleInputChange(e, "systemCondition")}
                    disabled={!isFormEditable}
                />
                <label className="form-check-label" htmlFor="systemConditionUnsatisfactory">
                  an unsatisfactory
                </label>
              </div>
              <p className="mt-2">condition at the time the inspection and servicing was carried out, and that it should be further inspected as recommended.</p>
            </div>

            {/* Inspector Details Section */}
            <h5 className="mb-3">For the Inspection & Test of the system:</h5>
            <div className="row mb-3">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData.user?.name || ""}
                      disabled
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Position</label>
                  <input
                      type="text"
                      className="form-control"
                      value={formData.user?.role || ""}
                      disabled
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Signature</label>
                  <br />
                  <img
                      width="200"
                      height="50"
                      style={{ border: "1px solid" }}
                      src={formData.user?.signature + "?" + sasToken}
                      alt="Signature"
                  />
                </div>
              </div>
              <div className="col-md-2">
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <DatePicker
                      selected={formData.inspectionDate}
                      onChange={handleDateChange}
                      className="form-control"
                      dateFormat="dd/MM/yyyy"
                      required
                      disabled={!isFormEditable}
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end">
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
          </form>
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
    InspectionFireCertificate
);