import { useEffect, useState } from "react";
import { connect, useSelector } from "react-redux";
import { toast } from "react-toastify";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { get, post, uploadSiteCheckDoc } from "../../../../api";
import { getSiteAssets, getUsers } from "../../../../store/thunk/site";
import { saveAs } from 'file-saver';
import axios from 'axios';
import pdfTemplate from './pdf/EmergencyLighting.pdf';

const EmergencyLightingInspectionForm = ({
                                           checkId,
                                           sasToken,
                                           siteAssets = [],
                                           getSiteAssets,
                                           siteSelectedForGlobal = {},
                                           loggedInUserData = {},
                                           siteCheck = {},
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

      console.log('Fetched inspection data:', response);
      return response; // Return the entire response object
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

  // Function to generate PDF
  const generatePDF = async () => {
    try {
      setIsGeneratingPDF(true);

      // Fetch inspection details to get the category
      let inspectionDetails = null;
      if (checkId) {
        inspectionDetails = await fetchInspectionDetails(checkId);
        console.log('Fetched inspection details:', inspectionDetails);
      }

      // Dynamically import pdf-lib
      const { PDFDocument, rgb } = await import('pdf-lib');
      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFDocument.load(pdfBytes);

      const form = pdfDoc.getForm();

      // Log all fields for debugging
      const fields = form.getFields();
      console.log('=== PDF Form Fields ===');
      const fieldNames = [];
      const checkboxes = [];

      // First pass: Collect all fields
      fields.forEach((field, index) => {
        try {
          const name = field.getName();
          const type = field.constructor.name;
          fieldNames.push({ name, type });

          if (type.includes('PDFCheckBox')) {
            checkboxes.push({ index, name, type });
          }

          console.log(`[${index}] Field: ${name}, Type: ${type}`);
        } catch (error) {
          console.warn('Error getting field name:', error);
        }
      });

      // Log checkboxes in a more readable format
      console.log('=== Checkbox Fields ===');
      console.table(checkboxes.map((cb, i) => ({
        'Index': i,
        'Field Index': cb.index,
        'Name': cb.name,
        'Type': cb.type
      })));

      // Log field names that might be related to our form
      const relevantFields = fieldNames.filter(f =>
          f.name.match(/CheckBox|Remarks|Name|Address|Date|Type|Mode|Facilities|Duration|AdditionalComments|Engineer|position|Image_af_image|Monthly|InspectionTest/i)
      );
      console.log('=== Relevant Form Fields ===');
      console.table(relevantFields.map((f, i) => ({
        'Index': i,
        'Name': f.name,
        'Type': f.type
      })));

      // Helper function to set text fields
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
          } else {
            console.warn(`Field not found: ${fieldName}`);
          }
        } catch (error) {
          console.warn(`Error setting field ${fieldName}:`, error.message);
        }
      };

      // Helper function to set checkboxes using check() and uncheck() methods
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

      const addressLines = (formData.installationAddress || '').split(',');
      setTextField('Address', addressLines[0] || '');
      setTextField('Address_2', addressLines[1] || '');
      setTextField('Address_3', addressLines.slice(2).join(', ') || '');

      setTextField('Type', formData.bsiCategoryType || '');
      setTextField('Mode', formData.bsiCategoryMode || '');
      setTextField('Facilities', formData.bsiCategoryFacilities || '');
      setTextField('Duration', formData.bsiCategoryDuration || '');

      const formattedDate = formData.inspectionDate
          ? new Date(formData.inspectionDate).toLocaleDateString('en-GB')
          : '';
      setTextField('Date', formattedDate);

      console.log('Inspection Checks:', formData.inspectionChecks);


      for (let i = 1; i <= 10; i++) {
        setCheckbox(`CheckBox${i}`, false);
      }



      // First, clear all checkboxes
      for (let i = 1; i <= 10; i++) {
        setCheckbox(`CheckBox${i}`, false);
      }

      // Process each inspection check and map to the correct checkbox
      formData.inspectionChecks.forEach((check, index) => {
        if (!check) return;

        // For the first 5 items, map to the left column checkboxes (1-5)
        if (index < 5) {
          const checkboxName = `CheckBox${index + 1}`;
          console.log(`Processing check ${index} (${check.checkQ}):`, {
            checkboxName,
            status: check.satisfactory === true ? 'Satisfactory' :
                check.satisfactory === false ? 'Unsatisfactory' : 'N/A'
          });

          // Set the left checkbox if the item is marked
          if (check.satisfactory !== undefined) {
            setCheckbox(checkboxName, true);
            console.log(`Marking ${checkboxName} as checked`);
          }

          // Set the corresponding right checkbox if satisfactory is true
          if (check.satisfactory === true) {
            const rightCheckboxName = `CheckBox${index + 6}`; // Map to 6-10
            console.log(`Marking ${rightCheckboxName} as Satisfactory`);
            setCheckbox(rightCheckboxName, true);
          }

          // Set remarks
          const remarksField = `Remarks${index + 1}`;
          if (check.remarks) {
            console.log(`Setting ${remarksField} to:`, check.remarks);
            setTextField(remarksField, check.remarks);
          }
        }
      });

      // Additional Comments
      setTextField('AdditionalComments', formData.additionalComments || '');

      // Inspector Details
      const inspector = users.find(u => u.id === loggedInUserData?.id);
      setTextField('Engineer', inspector?.name || loggedInUserData?.name || '');
      setTextField('position', inspector?.role || '');

      // Handle signature image
      if (loggedInUserData?.signature) {
        try {
          const signatureUrl = `${loggedInUserData.signature}?${sasToken}`;
          const signatureResponse = await fetch(signatureUrl);
          const signatureImageBytes = await signatureResponse.arrayBuffer();
          const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

          // Get the signature field and set the image
          const signatureField = form.getButton('Image_af_image');
          if (signatureField) {
            signatureField.setImage(signatureImage);
          }
        } catch (error) {
          console.warn('Error setting signature image:', error);
        }
      }

      // Set the Monthly field with the category from API response
      const categoryText = inspectionDetails?.category || 'N/A';
      console.log('Setting Monthly field with category:', categoryText);
      setTextField('Monthly', categoryText);

      // Fetch folder structure based on category
      await fetchFolderStructure(siteSelectedForGlobal?.siteId, categoryText);

      // Set default value for test performed checkbox
      setCheckbox('InspectionTest', true);  // Test performed checkbox

      // Flatten the form to make it read-only
      try {
        form.flatten();
      } catch (error) {
        console.warn('Error flattening form:', error.message);
      }

      // Save the modified PDF
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });

      // Generate filename
      const siteName = siteSelectedForGlobal?.name || 'emergency-lighting';
      const dateStr = new Date().toISOString().split('T')[0];
      const fileName = `EmergencyLightingInspection.pdf`;

      // Upload to server if needed
      const savedLocally = await savePdfToLocal(blob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([blob], fileName, { type: 'application/pdf' });

      // Use the monthlyTesting folder ID if available, otherwise fall back to emergencyLighting folder
      const targetFolderId = folderIds.monthlyTesting || folderIds.emergencyLighting ||
          folderIds.fireLogBook || folderIds.logBooks;

      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      // Helper function to check if file exists and get its details
      const checkFileExists = async (folderId, fileName) => {
        try {
          const siteId = siteSelectedForGlobal?.siteId;
          if (!siteId || !folderId) return { exists: false, file: null };

          const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
          const files = response?.document?.files || [];

          // Find file with the same base name (without extension)
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

          // Find matching files (same base name)
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

      // Check if file exists
      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      const uploadFormData = new FormData();

      if (exists && existingFile) {
        // File exists, use the new version upload endpoint
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
        // File doesn't exist, use the regular upload endpoint
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
      toast.error('Failed to generate PDF: ' + error.message);
      throw error;
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  // Function to map category text to folder name
  const getFolderNameFromCategory = (category) => {
    // Trim any whitespace from the category text
    const normalizedCategory = (category || '').trim();

    // Check for weekly testing pattern (case insensitive)
    if (/weekly.*testing/i.test(normalizedCategory)) {
      return 'Emergency Lighting - Weekly \'Flick\' Testing';
    }
    // Check for 6 monthly testing pattern (case insensitive)
    else if (/6.*monthly.*testing/i.test(normalizedCategory)) {
      return 'Emergency Lighting - 6 Monthly Testing';
    }
    // Check for 6 monthly testing pattern (case insensitive)
    else if (/1.*monthly.*testing/i.test(normalizedCategory)) {
      return ' Emergency Lighting - Monthly Testing';
    }
    // Check for 12 monthly/annual testing pattern (case insensitive)
    else if (/(12.*monthly|annual).*testing/i.test(normalizedCategory)) {
      return 'Emergency Lighting - 12 Monthly Testing';
    }
    // Default to monthly testing if no specific pattern matches
    return 'Emergency Lighting - Monthly Testing';
  };

  // Function to fetch folder structure
  const fetchFolderStructure = async (siteId, category) => {
    try {
      // First, get all parent folders for the site
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

      if (parentFoldersResponse?.parentFolders?.length > 0) {
        // Find the Log Books folder
        const logBooksFolder = parentFoldersResponse.parentFolders.find(
            folder => folder.name.trim() === 'Log Books'
        );

        if (logBooksFolder) {
          const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

          if (logBooksResponse?.document?.childFolders) {
            const fireLogBookFolder = logBooksResponse.document.childFolders.find(
                folder => folder.name.trim() === 'Fire Log Book'
            );

            if (fireLogBookFolder) {
              // Get the contents of Fire Log Book folder
              const fireLogBookResponse = await get(
                  `/api/document/parent/${fireLogBookFolder.id}/folders?siteId=${siteId}`
              );

              if (fireLogBookResponse?.document?.childFolders) {
                // Find the Emergency Lighting to meet BS5266 folder
                const emergencyLightingFolder = fireLogBookResponse.document.childFolders.find(
                    folder => folder.name.trim() === 'Emergency Lighting to meet BS5266'
                );

                if (emergencyLightingFolder) {
                  // Get the contents of Emergency Lighting to meet BS5266 folder
                  const emergencyLightingResponse = await get(
                      `/api/document/parent/${emergencyLightingFolder.id}/folders?siteId=${siteId}`
                  );

                  if (emergencyLightingResponse?.document?.childFolders) {
                    // Find the target folder based on category
                    const targetFolderName = getFolderNameFromCategory(category);
                    const targetFolder = emergencyLightingResponse.document.childFolders.find(
                        folder => folder.name.trim() === targetFolderName
                    );

                    const newFolderIds = {
                      logBooks: logBooksFolder.id,
                      fireLogBook: fireLogBookFolder.id,
                      emergencyLighting: emergencyLightingFolder.id,
                      monthlyTesting: targetFolder?.id || emergencyLightingFolder.id
                    };

                    setFolderIds(newFolderIds);

                    return newFolderIds.monthlyTesting;
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
      // toast.error('Failed to load document folders');
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

      // Find file with the same base name (without extension)
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

      // Find matching files (same base name)
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
      // Create a blob URL
      const blobUrl = URL.createObjectURL(pdfBlob);

      // Create a temporary anchor element
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;

      // Append to body and trigger click
      document.body.appendChild(a);
      a.click();

      // Clean up
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      return true;
    } catch (error) {
      console.error('Error saving PDF locally:', error);
      return false;
    }
  };

  // Helper function to upload PDF to the server
  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);

      const savedLocally = await savePdfToLocal(pdfBlob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Use the monthlyTesting folder ID if available, otherwise fall back to emergencyLighting folder
      const targetFolderId = folderIds.monthlyTesting || folderIds.emergencyLighting ||
          folderIds.fireLogBook || folderIds.logBooks;

      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      // Check if file exists
      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      const formData = new FormData();

      if (exists && existingFile) {
        // File exists, use the new version upload endpoint
        formData.append('file', pdfFile);

        const documentRequestString = {
          folderId: targetFolderId,
          files: [{
            id: existingFile.id,
            name: fileName,
            originalFileName: fileName,
            fileVersion: existingFile.fileVersion + 1,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `EL-${new Date().getTime()}`
          }]
        };

        formData.append('documentRequestString', JSON.stringify(documentRequestString));

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
          toast.success(`PDF uploaded successfully as version ${documentRequestString.files[0].fileVersion}!`);
          return true;
        }
      } else {
        // File doesn't exist, use the regular upload endpoint
        formData.append('files', pdfFile);

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

        formData.append('documentRequestString', JSON.stringify(documentRequestString));

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

  const getInspection = async () => {
    try {
      const apiData = await get(
          "/api/site-check/emergency-lighting/" + checkId
      );
      // if (data && data.length > 0) {
      //  const apiData = data[0];
      if (apiData) {
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
                check: defaultCheck.check, // Always keep the original check text
              }))
              : prev.inspectionChecks,

          // Merge simple fields
          additionalComments:
              apiData?.additionalComments || prev.additionalComments,
          allFittingsPassed:
              apiData?.allFittingsPassed || prev.allFittingsPassed,
          siteAssetId: apiData?.siteAssetId || prev.siteAssetId,
          file: apiData?.file || prev.files,
          user: apiData?.inspectionByUser || prev.user,
        }));

        setCompleted(true);
      }
    } catch (error) {
      toast.error("Failed to load inspection data");
      console.error("Inspection load error:", error);
    }
  };

  useEffect(() => {
    getUsers();
    if (siteSelectedForGlobal?.siteId) {
      fetchFolderStructure(siteSelectedForGlobal.siteId);
    }
    getInspection();
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal.siteId);
    }
  }, [siteSelectedForGlobal?.siteId]);

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
    console.log("siteSelectedForGlobal", siteSelectedForGlobal);
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
    MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB per file
    MAX_TOTAL_SIZE: 100 * 1024 * 1024, // 100MB total
    ALLOWED_TYPES: ["image/jpeg", "image/png", "application/pdf"],
    MAX_FILE_COUNT: 10, // Maximum number of files allowed
  };

  const validateFiles = (newFiles, existingFiles = []) => {
    // Check if adding new files would exceed max count
    if (
        newFiles.length + existingFiles.length >
        FILE_VALIDATION_CONFIG.MAX_FILE_COUNT
    ) {
      return {
        isValid: false,
        error: `You can upload a maximum of ${FILE_VALIDATION_CONFIG.MAX_FILE_COUNT} files.`,
      };
    }

    // Check for invalid file types
    const invalidFiles = newFiles.filter(
        (file) => !FILE_VALIDATION_CONFIG.ALLOWED_TYPES.includes(file.type)
    );
    if (invalidFiles.length > 0) {
      return {
        isValid: false,
        error: "Only JPG, PNG, PDF, DOC, and DOCX files are allowed.",
      };
    }

    // Check for oversized files
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

    // Check total size limit
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

    // If validation passes, update state
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

    // Generate PDF first
    try {
      await generatePDF();
    } catch (error) {
      console.error('PDF generation failed:', error);
      // toast.error('Failed to generate PDF, but continuing with form submission');
    }
    if (formData.files.length > FILE_VALIDATION_CONFIG.MAX_FILE_COUNT) {
      toast.error(
          `Maximum ${FILE_VALIDATION_CONFIG.MAX_FILE_COUNT} files allowed.`
      );
      return;
    }

    const totalSize = formData.files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE) {
      toast.error(
          `Total file size exceeds ${
              FILE_VALIDATION_CONFIG.MAX_TOTAL_SIZE / 1024 / 1024
          }MB limit.`
      );
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        ...formData,
        siteId: siteSelectedForGlobal?.siteId || "",
        checkId,
        inspectionBy: loggedInUserData?.id,
      };

      // Upload file if exists
      const certificateUrls = [];
      if (formData.files.length > 0) {
        try {
          // Upload all files in parallel
          const uploadPromises = formData.files.map((file) =>
              uploadSiteCheckDoc({
                file,
                siteId: siteSelectedForGlobal?.siteId,
                folderName: "EmergencyLighting",
              })
          );

          certificateUrls.push(...(await Promise.all(uploadPromises)));
          payload.certificateUrls = certificateUrls; // Changed from certificateUrl to certificateUrls (array)
        } catch (uploadError) {
          console.error("File upload failed:", uploadError);
          toast.error("File upload failed");
          return;
        }
      }

      // Submit inspection data
      await post("/api/site-check/emergency-lighting", payload);

      // Create action item
      // if (siteSelectedForGlobal?.siteId && \oggedInUserData?.id) {
      //   const actionData = {
      //     type: "Inspection",
      //     status: "Reported",
      //     observation: "Emergency Lighting Inspection",
      //     desc: `${siteCheck?.type || "Emergency Lighting"} - ${moment().format(
      //       "DD/MM/YYYY"
      //     )}`,
      //     requiredAction: "Review inspection results",
      //     riskScore: calculateRiskScore(),
      //     dueDate: new Date(),
      //     createdAt: new Date(),
      //     siteId: siteSelectedForGlobal.siteId,
      //     userId: loggedInUserData.id,
      //     actionImage: certificateUrls,
      //     taggedAsset: formData.siteAssetId,
      //   };

      //   await put("/api/site/actions", actionData);
      // }

      toast.success("Inspection submitted successfully");
      setCompleted(true);
    } catch (error) {
      console.error("Submission error:", error);
      toast.error("Failed to submit inspection");
    } finally {
      setIsLoading(false);
    }
  };

  const calculateRiskScore = () => {
    // Implement your risk score calculation logic here
    // Example: Count unsatisfactory checks
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
                      value={formData?.installationAddress || ""}
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
            />
            </div>

            {/* File Upload Section */}
            {/* File Upload Section */}
            {/*  */}

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
                  />
                </div>
              </div>
            </div>

            <div className="d-flex justify-content-end">
              <div className="d-flex gap-2">
                <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                >
                  {isLoading ? "Submitting..." : "Submit Inspection"}
                </button>
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