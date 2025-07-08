import { useEffect, useState } from "react";
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
import {formatDate} from "../../../../utils/dateFormat";

const EmergencyLightingInspectionForm = ({
                                           checkId,
                                           sasToken,
                                           siteAssets = [],
                                           getSiteAssets,
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
    siteAssetId: "",
    files: [],
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
  const [isNewCheck, setIsNewCheck] = useState(!checkId); // Track if this is a new check

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

  const handleRiskAssessmentComplete = async (actionResponse) => {
    try {
      if (!actionResponse?.actionId) {
        throw new Error("Invalid action response received");
      }

      setActionRaised(true);
      setExistingAction(actionResponse);

      setFormData(prev => ({
        ...prev,
        actionId: actionResponse.actionId
      }));

      toast.success(`Action #${actionResponse.actionId} raised successfully`);
    } catch (error) {
      console.error("Error handling risk assessment completion:", error);
      toast.error("Failed to process action completion");
    }
  };

  useEffect(() => {
    const hasUnsatisfactoryChecks = formData.inspectionChecks
        .slice(0, 5)
        .some(check => check.satisfactory === false);

    setShowRiskAssessment(hasUnsatisfactoryChecks);

    if (!hasUnsatisfactoryChecks) {
      setActionRaised(false);
    }
  }, [formData.inspectionChecks]);

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
        if (action) {
          setExistingAction(action);
          setActionRaised(true);
          return;
        }
      }

      if (!siteSelectedForGlobal?.siteId) return;

      const response = await get(`/api/site/actions/${siteSelectedForGlobal.siteId}`);
      if (response && response.length > 0) {
        const relevantActions = response.filter(action =>
            action.desc.includes('Emergency Lighting') ||
            action.type === 'Inspection'
        );

        if (relevantActions.length > 0) {
          const mostRecentAction = relevantActions.sort((a, b) =>
              new Date(b.createdAt) - new Date(a.createdAt)
          )[0];

          setExistingAction(mostRecentAction);
          setActionRaised(true);

          if (mostRecentAction.actionId && !formData.actionId) {
            setFormData(prev => ({
              ...prev,
              actionId: mostRecentAction.actionId
            }));
          }
        }
      }
    } catch (error) {
      console.error("Error fetching existing actions:", error);
    }
  };

  // Function to generate PDF
  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);

      let inspectionDetails = null;
      if (checkId) {
        inspectionDetails = await fetchInspectionDetails(checkId);
        console.log('Fetched inspection details:', inspectionDetails);
      }

      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const form = pdfDoc.getForm();

      // Set form fields
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

      setTextField('Name', license?.companyName || '');
      setTextField('Address', license?.companyAddress || '');
      setTextField('Name_2', loggedInUserData?.companyName || '');
      setTextField('Address_2', formData?.installationAddress || '');
      setTextField('InspectionTest', loggedInUserData?.companyName || '');
      setTextField('Address_3', loggedInUserData?.companyAddress || '');
      setTextField('Type', formData.bsiCategoryType || '');
      setTextField('Mode', formData.bsiCategoryMode || '');
      setTextField('Facilities', formData.bsiCategoryFacilities || '');
      setTextField('Duration', formData.bsiCategoryDuration || '');

      const formattedDate = formData.inspectionDate
          ? new Date(formData.inspectionDate).toLocaleDateString('en-GB')
          : '';
      setTextField('Date', formattedDate);

      // Process inspection checks
      for (let i = 1; i <= 10; i++) {
        setCheckbox(`CheckBox${i}`, false);
      }

      formData.inspectionChecks.forEach((check, index) => {
        if (!check) return;

        if (index < 5) {
          const checkboxName = `CheckBox${index + 1}`;

          if (check.satisfactory !== undefined) {
            setCheckbox(checkboxName, true);
          }

          if (check.satisfactory === true) {
            const rightCheckboxName = `CheckBox${index + 6}`;
            setCheckbox(rightCheckboxName, true);
          }

          const remarksField = `Remarks${index + 1}`;
          if (check.remarks) {
            setTextField(remarksField, check.remarks);
          }
        }
      });

      setTextField('AdditionalComments', formData.additionalComments || '');

      const inspector = users.find(u => u.id === loggedInUserData?.id);
      setTextField('Engineer', inspector?.name || loggedInUserData?.name || '');
      setTextField('position', loggedInUserData?.role || '');

      if (loggedInUserData?.signature) {
        try {
          const signatureUrl = `${loggedInUserData.signature}?${sasToken}`;
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

      const categoryText = inspectionDetails?.category || 'N/A';
      setTextField('Monthly', categoryText);

      await fetchFolderStructure(siteSelectedForGlobal?.siteId, categoryText);

      setCheckbox('InspectionTest', true);

      try {
        form.flatten();
      } catch (error) {
        console.warn('Error flattening form:', error.message);
      }

      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });

      const siteName = siteSelectedForGlobal?.name || 'emergency-lighting';
      const fileName = `EmergencyLightingInspection- ${inspectionDetails.category}.pdf`;

      const savedLocally = await savePdfToLocal(blob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      const targetFolderId = folderIds.monthlyTesting || folderIds.emergencyLighting ||
          folderIds.fireLogBook || folderIds.logBooks;

      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      const uploadFormData = new FormData();

      if (exists && existingFile) {
        uploadFormData.append('file', pdfFile);

        const documentRequestString = {
          folderId: targetFolderId,
          files: [{
            id: existingFile.id,
            name: fileName,
            originalFileName: fileName,
            fileVersion: (existingFile.fileVersion || 1) + 1,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `EL-${new Date().getTime()}`
          }]
        };

        uploadFormData.append('documentRequestString', JSON.stringify(documentRequestString));

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
          toast.success(`PDF uploaded successfully as version ${documentRequestString.files[0].fileVersion}!`);
          return { success: true, data: response.data };
        }
      } else {
        uploadFormData.append('files', pdfFile);

        const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

        const documentRequestString = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            originalFileName: fileName,
            fileVersion: fileVersion,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `EL-${new Date().getTime()}`
          }]
        };

        uploadFormData.append('documentRequestString', JSON.stringify(documentRequestString));

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
          toast.success(`PDF uploaded successfully as version ${fileVersion}!`);
          return { success: true, data: response.data };
        }
      }

      throw new Error('Upload failed: No response data');
    } catch (error) {
      console.error('Error generating PDF:', error);
      throw error;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Preserve exact folder names but make matching more robust
  const getFolderNameFromCategory = (category) => {
    // Keep original folder names exactly as they appear in the system
    switch(category) {
      case 'Emergency Lighting - weekly testing to meet BS5266':
        return 'Emergency Lighting - Weekly \'Flick\' Testing'; // Exact match
      case 'Emergency Lighting - monthly testing to meet BS5266':
        return ' Emergency Lighting - Monthly Testing'; // Note: Keep leading space
      case 'Emergency Lighting (systems more than 3 years old) 12 monthly Full discharge testing':
        return 'Emergency Lighting - 12 Monthly Testing';
      default:
        return 'Emergency Lighting - Monthly Testing'; // Default fallback
    }
  };

  const fetchFolderStructure = async (siteId, category) => {
    try {
      // 1. Get parent folders
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

      // 2. Find 'Log Books' (exact match including spaces)
      const logBooksFolder = parentFoldersResponse.parentFolders.find(
          folder => folder.name === 'Log Books' // Exact match
      );

      // 3. Find 'Fire Log Book'
      const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);
      const fireLogBookFolder = logBooksResponse.document.childFolders.find(
          folder => folder.name === 'Fire Log Book' // Exact match
      );

      // 4. Find 'Emergency Lighting to meet BS5266'
      const fireLogBookResponse = await get(`/api/document/parent/${fireLogBookFolder.id}/folders?siteId=${siteId}`);
      const emergencyLightingFolder = fireLogBookResponse.document.childFolders.find(
          folder => folder.name === 'Emergency Lighting to meet BS5266' // Exact match
      );

      // 5. Find target subfolder (using exact names)
      const targetFolderName = getFolderNameFromCategory(category);
      const emergencyLightingResponse = await get(`/api/document/parent/${emergencyLightingFolder.id}/folders?siteId=${siteId}`);

      console.log('Searching for exact folder name:', targetFolderName);
      console.log('Available subfolders:',
          emergencyLightingResponse.document.childFolders.map(f => f.name));

      const targetFolder = emergencyLightingResponse.document.childFolders.find(
          folder => folder.name === targetFolderName // Exact match
      );

      if (!targetFolder) {
        console.warn(`Exact folder "${targetFolderName}" not found, using parent folder instead`);
      }

      const newFolderIds = {
        logBooks: logBooksFolder.id,
        fireLogBook: fireLogBookFolder.id,
        emergencyLighting: emergencyLightingFolder.id,
        monthlyTesting: targetFolder?.id || emergencyLightingFolder.id // Fallback
      };

      console.log('Final folder IDs:', newFolderIds);
      setFolderIds(newFolderIds);
      return newFolderIds.monthlyTesting;

    } catch (error) {
      console.error('Error in folder structure lookup:', {
        error: error.message,
        siteId,
        category
      });
      return null;
    }
  };

  // Function to check if a file exists in the folder
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

  // Helper function to get the highest file version
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

  const getInspection = async () => {
    try {
      const apiData = await get(
          "/api/site-check/emergency-lighting/" + checkId
      );

      if (apiData) {
        let existingAction = null;
        if (apiData.actionId) {
          existingAction = await fetchActionById(apiData.actionId);
          if (existingAction) {
            setExistingAction(existingAction);
            setActionRaised(true);
          }
        }

        setFormData((prev) => ({
          ...prev,
          id: apiData?.id || prev.id,
          installationName: apiData?.installationName || prev.installationName,
          installationAddress:
              apiData?.installationAddress || prev.installationAddress,
          bsiCategoryType: apiData?.bsiCategoryType || prev.bsiCategoryType,
          bsiCategoryMode: apiData?.bsiCategoryMode || prev.bsiCategoryMode,
          bsiCategoryFacilities:
              apiData?.bsiCategoryFacilities || prev.bsiCategoryFacilities,
          bsiCategoryDuration:
              apiData?.bsiCategoryDuration || prev.bsiCategoryDuration,
          inspectionDate: apiData?.inspectionDate || prev.inspectionDate,
          inspectionChecks: apiData?.inspectionChecks?.length
              ? prev.inspectionChecks.map((defaultCheck, index) => ({
                ...defaultCheck,
                ...(apiData.inspectionChecks[index] || {}),
                check: defaultCheck.check,
              }))
              : prev.inspectionChecks,
          actionId: apiData?.actionId || prev.actionId,
          additionalComments:
              apiData?.additionalComments || prev.additionalComments,
          allFittingsPassed:
              apiData?.allFittingsPassed || prev.allFittingsPassed,
          siteAssetId: apiData?.siteAssetId || prev.siteAssetId,
          file: apiData?.file || prev.files,
          user: apiData?.inspectionByUser || prev.user,
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
    const fetchData = async () => {
      getUsers();
      if (siteSelectedForGlobal?.siteId) {
        await fetchFolderStructure(siteSelectedForGlobal.siteId);
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
    const value =
        e.target.type === "checkbox" ? e.target.checked : e.target.value;

    setFormData((prev) => ({
      ...prev,
      [field]: value,
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
      inspectionDate: date || new Date(),
    }));
  };

  const submitInspection = async (e) => {
    e.preventDefault();

    if (!isFormEditable) {
      toast.error("This form is completed and cannot be modified");
      return;
    }

    if (showRiskAssessment && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    const hasUnsatisfactoryChecks = formData.inspectionChecks
        .slice(0, 5)
        .some(check => check.satisfactory === false);

    if (hasUnsatisfactoryChecks && !actionRaised) {
      toast.error("Please complete the risk assessment for unsatisfactory checks");
      return;
    }

    setIsLoading(true);

    try {
      // First create or update the site check record
      const statusPayload = {
        siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
        type: 'Inspection',
        subType: 'Emergency Lighting',
        category: inspectionDetails?.category || 'Emergency Lighting',
        status: 'Done',
        startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
        leadUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0',
        assistantUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0'
      };

      let statusResponse;
      let actualCheckId = checkId;

      if (isNewCheck) {
        // Create new check
        statusResponse = await post('/api/site-check', statusPayload);
        if (statusResponse?.checkId) {
          actualCheckId = statusResponse.checkId;
          setIsNewCheck(false);
          if (onCheckCreated) {
            onCheckCreated(actualCheckId);
          }
        } else {
          throw new Error('Failed to create new check - no checkId returned');
        }
      } else {
        // Update existing check
        statusResponse = await put(`/api/site-check/${checkId}`, statusPayload);
      }

      if (![200, 201, 204].includes(statusResponse?.status)) {
        throw new Error('Failed to update site check status');
      }

      // Then submit the inspection data
      const payload = {
        ...formData,
        siteId: siteSelectedForGlobal?.siteId || "",
        checkId: actualCheckId,
        inspectionBy: loggedInUserData?.id,
        actionId: formData.actionId
      };

      // Upload files if any
      const certificateUrls = [];
      if (formData.files.length > 0) {
        try {
          const uploadPromises = formData.files.map((file) =>
              uploadSiteCheckDoc({
                file,
                siteId: siteSelectedForGlobal?.siteId,
                folderName: "EmergencyLighting",
              })
          );
          certificateUrls.push(...(await Promise.all(uploadPromises)));
          payload.certificateUrls = certificateUrls;
        } catch (uploadError) {
          console.error("File upload failed:", uploadError);
          toast.error("File upload failed");
          return;
        }
      }

      // Submit inspection data - use POST for new, PUT for existing
      if (formData.id) {
        await put("/api/site-check/emergency-lighting", payload);
      } else {
        await post("/api/site-check/emergency-lighting", payload);
      }

      // Generate PDF
      try {
        await generatePDF();
      } catch (error) {
        console.error('PDF generation failed:', error);
        toast.error('Failed to generate PDF');
      }

      toast.success("Inspection submitted successfully");
      setCompleted(true);
      setIsFormEditable(false);
      setIsSubmitted(true);

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
                            desc={`${inspectionDetails?.type || 'Inspection'} - ${inspectionDetails?.subType || ''} - ${inspectionDetails?.category || ''}`}
                            siteId={siteSelectedForGlobal?.siteId}
                            createdBy={loggedInUserData?.id}
                            taggedAsset={''}
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
              {/* Name */}
              <div className="col-md-3">
                <div className="mb-3">
                  <label htmlFor="inspector.name" className="form-label">
                    Name
                  </label>
                  <input
                      disabled
                      type="text"
                      className="form-control"
                      value={formData.user?.name || ""}
                  />
                </div>
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