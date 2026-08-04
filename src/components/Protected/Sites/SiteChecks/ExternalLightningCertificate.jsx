import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import {get, post, put} from "../../../../api";
import {
  getSiteAssets,
  getSiteById,
  getSiteDetailsById,
  getSites,
  getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { formatDate, formatLocalDateTime } from "../../../../utils/dateFormat";
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import axios from 'axios';
import pdfTemplate from './pdf/ExternalLightingCertificate.pdf';
import RiskScoreCard from "./RiskScoreCard";

let PDFLib;

if (typeof window !== 'undefined') {
  import('pdf-lib').then((pdfLib) => {
    PDFLib = pdfLib;
  });
}

// Helper function to fetch PDF as ArrayBuffer
const fetchPdfTemplate = async () => {
  try {
    // Fetch the PDF file using the imported URL
    const response = await fetch(pdfTemplate);

    if (!response.ok) {
      throw new Error('Failed to load PDF template: ' + response.statusText);
    }

    const arrayBuffer = await response.arrayBuffer();

    // Verify the PDF header
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

const ExternalLightningCertificate = ({
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
  //const license = JSON.parse(localStorage.getItem("license"));

  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    job: "",
    param1Remark: "", // fittingTypes
    param2Remark: "", // fittingQuantity
    param3Remark: "", // fittingLocation
    report: "",
    param1: "", // job complete
    param2: "", // parts required
    param3: "", // timers checked
    param4: "", // fittings operational
    client: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    selectedAsset: null,
    signedDate: new Date().toISOString().split("T")[0],
    clientUser: null,
    siteContactUser: null,
    actionId:null,
  });

  const sites = useSelector((state) => state.site.sites);
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
    electricalManagement: null,
    externalLighting: null
  });
  const [checkStatus, setCheckStatus] = useState('Open');
  const [isFormEditable, setIsFormEditable] = useState(true);
  // Initialize with the checkId prop if available, otherwise null
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
    const [inspectionDetails, setInspectionDetails] = useState(null);


    const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);

  // Get the navigate function from react-router
  const navigate = useNavigate();

  const isInternalUserTaggedWithSite = true

  const [popup, setPopup] = useState({
    show: false,
    content: "",
    position: { x: 0, y: 0 },
  });

  const handleMouseEnter = (e, content) => {
    if (!content) return;

    setPopup({
      show: true,
      content,
      position: {
        x: e.target.getBoundingClientRect().left,
        y: e.target.getBoundingClientRect().top - 10,
      },
    });
  };

  const handleMouseLeave = () => {
    setPopup((prev) => ({ ...prev, show: false }));
  };

  const fetchInspectionData = async () => {
    try {
      if (!checkId) return;

      if (isInternalUserTaggedWithSite && users.length === 0) {
        await getUsers();
      }

      const apiData = await get(
          `/api/site-check/generic-inspection/${checkId}`
      );
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

        setFormData((prev) => ({
          ...prev,
          address: prev.address,
          assetId: mostRecentItem.assetId || prev.assetId,
          siteContact: mostRecentItem.siteContact || prev.siteContact,
          inspectionDate: mostRecentItem.inspectionDate || prev.inspectionDate,
          siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
          job: mostRecentItem.job || prev.job,
          report: mostRecentItem.report || prev.report,
          param1: mostRecentItem.param1 || prev.param1,
          param2: mostRecentItem.param2 || prev.param2,
          param3: mostRecentItem.param3 || prev.param3,
          param4: mostRecentItem.param4 || prev.param4,
          param1Remark: mostRecentItem.param1Remark || prev.param1Remark,
          param2Remark: mostRecentItem.param2Remark || prev.param2Remark,
          param3Remark: mostRecentItem.param3Remark || prev.param3Remark,
          client: mostRecentItem.client || "",
          engineer:
              mostRecentItem.engineer || prev.engineer || loggedInUserData?.id,
          user: engineerUser || loggedInUserData || prev.user,
          selectedAsset: selectedAsset || prev.selectedAsset,
          signedDate: mostRecentItem.signedDate || prev.signedDate,
          clientUser: clientUser || null,
          siteContactUser: siteContactUser || null,
          actionId: mostRecentItem.actionId || null,
        }));
      }
    } catch (error) {
      console.error("Error fetching inspection data:", error);
      //toast.error("Failed to load inspection data");
    }
  };

  // Add this function to fetch a specific action by ID
  const fetchActionById = async (actionId) => {
    try {
      if (!actionId) return null;

      const response = await get(`/api/site/actions/id/${actionId}`);
      return response;
    } catch (error) {
      console.error("Error fetching action:", error);
      return null;
    }
  };

// Modify the fetchExistingActions function to use the specific endpoint when we have an actionId

  const fetchExistingActions = async () => {
    try {
      // First check if we have an actionId in form data
      if (formData.actionId) {
        const action = await fetchActionById(formData.actionId);
        // Only consider this action if its checkId matches currentCheckId
        if (action && action.checkId === currentCheckId) {
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
            action.checkId === currentCheckId
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

  const fetchFolderStructure = async (siteId) => {
    try {
      // First, get all parent folders for the site
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

      if (parentFoldersResponse?.parentFolders?.length > 0) {
        // Find the Log Books folder
        const logBooksFolder = parentFoldersResponse.parentFolders.find(
            folder => folder.name.trim() === '6 - Log Books'
        );

        if (logBooksFolder) {
          // Get the contents of Log Books folder
          const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

          if (logBooksResponse?.document?.childFolders) {
            // Find the Electrical Management folder
            const electricalManagementFolder = logBooksResponse.document.childFolders.find(
                folder => folder.name.trim() === 'Electrical Management'
            );

            if (electricalManagementFolder) {
              // Get the contents of Electrical Management folder
              const electricalResponse = await get(
                  `/api/document/parent/${electricalManagementFolder.id}/folders?siteId=${siteId}`
              );

              if (electricalResponse?.document?.childFolders) {
                // Find the External Lighting folder
                const externalLightingFolder = electricalResponse.document.childFolders.find(
                    folder => folder.name.trim() === 'External Lighting'
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
  }, [formData.actionId]);

  useEffect(() => {
    const fetchSiteCheckData = async () => {
      try {
        if (!siteSelectedForGlobal?.siteId) return;

        const response = await get(`/api/site-check/site/${siteSelectedForGlobal.siteId}`);
        if (response && response.length > 0) {
          // First try to find the exact checkId from URL
          let externalLightingCheck = checkId
              ? response.find(check => check.checkId === parseInt(checkId, 10))
              : null;

          // If not found by checkId, find first matching type
          // if (!externalLightingCheck) {
          //   externalLightingCheck = response.find(check =>
          //       check.type === 'Inspection' &&
          //       check.subType === 'Electrical' &&
          //       check.category === 'External Lighting Testing'
          //   );
          // }

          if (externalLightingCheck) {
            console.log('Found check:', {
              checkId: externalLightingCheck.checkId,
              requestedCheckId: checkId,
              matchType: externalLightingCheck.checkId === parseInt(checkId, 10) ? 'exact' : 'type-match'
            });

            setCurrentCheckId(externalLightingCheck.checkId);
            setCheckStatus(externalLightingCheck.status);

            setInspectionDetails(externalLightingCheck);
            // Set form editability based on status
            const isDone = externalLightingCheck.status === 'Done';
            setIsFormEditable(!isDone);
            setIsSubmitted(isDone);
            setShowPdfButton(isDone);
          } else {
            // If no matching check found, default to editable
            console.log('No matching check found, using checkId from URL:', checkId);
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
        if (siteSelectedForGlobal?.siteId) {
          await getSiteAssets(siteSelectedForGlobal?.siteId);
          await getSiteDetailsById(siteSelectedForGlobal?.siteId);
          await fetchFolderStructure(siteSelectedForGlobal.siteId);
          await fetchSiteCheckData();
          await fetchInspectionData();



          if (formData.actionId) {
            const action = await fetchActionById(formData.actionId);
            if (action) {
              setExistingAction(action);
              setActionRaised(true);
            } else {
              // Fall back to general fetch if specific fetch fails
              await fetchExistingActions();
            }
          } else {
            await fetchExistingActions();
          }

          const currentSite = sites.find(
              (site) => site.siteId === siteSelectedForGlobal.siteId
          );
          const siteData = currentSite || siteSelectedForGlobal;
          // Properly construct the address
          if (siteData) {
            const addressParts = [
              siteData.address1,
              siteData.address2,
              siteData.city,
              siteData.area,
              siteData.postCode,
              siteData.country,
            ].filter((part) => part && part.trim() !== ""); // Filter out empty/null parts

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
  ]);

  useEffect(() => {
    // Only show risk assessment if any check is "Fail"
    const showRisk = formData.param4 === "Fail";
    setShowRiskAssessment(showRisk);

    // Update actionRaised state based on existing action
    const isActionValid = existingAction && existingAction.checkId === currentCheckId;
    setActionRaised(isActionValid);
  }, [formData.param4, currentCheckId, existingAction]);

  const handleRiskAssessmentComplete = async (actionResponse) => {
    try {
      if (!actionResponse?.actionId) {
        throw new Error("Invalid action response received");
      }

      // Verify the new action has our current checkId
      const verifiedAction = await fetchActionById(actionResponse.actionId);
      if (!verifiedAction || verifiedAction.checkId !== currentCheckId) {
        throw new Error("Action was not properly linked to this inspection");
      }

      setExistingAction(verifiedAction);
      setActionRaised(true);

      // Update form data
      setFormData(prev => ({
        ...prev,
        actionId: verifiedAction.actionId
      }));

      // Update inspection record
      if (currentCheckId) {
        const inspectionPayload = {
          address: formData.address,
          assetId: formData.selectedAsset?.assetId || formData.assetId,
          siteContact: formData.siteContactUser?.id || formData.siteContact,
          inspectionDate: formData.inspectionDate,
          siteContactNo: formData.siteContactNo,
          job: formData.job,
          report: formData.report,
          param1: formData.param1,
          param2: formData.param2,
          param3: formData.param3,
          param4: formData.param4,
          param1Remark: formData.param1Remark,
          param2Remark: formData.param2Remark,
          param3Remark: formData.param3Remark,
          client: formData.clientUser?.id || formData.client,
          engineer: formData.engineer,
          user: formData.user,
          selectedAsset: formData.selectedAsset,
          signedDate: formData.signedDate,
          clientUser: formData.clientUser,
          siteContactUser: formData.siteContactUser,
          actionId: verifiedAction.actionId,
          checkId: currentCheckId,
          siteId: siteSelectedForGlobal?.siteId,
          type: 'Inspection',
          subType: 'External Lighting',
          category: 'External Lighting Certificate',
        };

        // Update or create inspection record
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

      // Rollback state changes if the operation failed
      setActionRaised(false);
      setExistingAction(null);
      setFormData(prev => ({ ...prev, actionId: null }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // Helper function to save PDF to local storage
  const savePdfToLocal = async (pdfBlob, fileName) => {
    try {
      // Create a temporary URL for the blob
      const url = URL.createObjectURL(pdfBlob);

      // Create a temporary link and trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();

      // Clean up
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

  // Function to get the highest file version for a given file name in a folder
  const getHighestFileVersion = async (folderId, fileName) => {
    try {
      const siteId = siteSelectedForGlobal?.siteId;
      if (!siteId) {
        console.warn('No site ID available for file version check');
        return 1;
      }

      console.log('Fetching files from folder:', folderId, 'for site:', siteId);
      const response = await get(`/api/document/parent/${folderId}/folders?siteId=${siteId}`);
      const files = response?.document?.files || [];

      console.log('Files in folder:', files);

      if (files.length > 0) {
        // Filter files with the same base name (without extension)
        const baseName = fileName.split('.')[0];
        console.log('Looking for files starting with:', baseName);

        const matchingFiles = files.filter(file =>
            file.name && file.name.startsWith(baseName)
        );

        console.log('Matching files:', matchingFiles);

        if (matchingFiles.length > 0) {
          // Get the highest version number
          const versions = matchingFiles.map(f => f.fileVersion || 1);
          const maxVersion = Math.max(...versions);
          console.log('Current versions:', versions, 'Max version:', maxVersion, 'Next version:', maxVersion + 1);
          return maxVersion + 1;
        }
      }
      console.log('No matching files found, using version 1');
      return 1; // Default to 1 if no matching files found
    } catch (error) {
      console.error('Error checking file versions:', error);
      return 1; // Default to 1 if there's an error
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

  // Helper function to upload PDF to the server
  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);

      const savedLocally = await savePdfToLocal(pdfBlob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });

      // Use the externalLighting folder ID if available, otherwise fall back to Log Books
      const targetFolderId = folderIds.externalLighting || folderIds.logBooks;

      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      // Check if file exists
      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      // Create FormData for both cases
      const formData = new FormData();

      if (exists && existingFile) {
        // File exists, use the new version upload endpoint
        formData.append('file', pdfFile);  // Single file for new version

        const documentRequestString = {
          folderId: targetFolderId,
          files: [{
            id: existingFile.id,
            name: fileName,
            originalFileName: fileName,
            fileVersion: existingFile.fileVersion + 1,
            siteId: siteSelectedForGlobal?.siteId || 0,
            issueDate: formatDateForBackend(formData.inspectionDate),
            expiryDate: formatDateForBackend(calculateExpiryDate(formData.inspectionDate, inspectionDetails?.repeatFrequency)),
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `ELC-${new Date().getTime()}`
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
          toast.success(`PDF uploaded successfully as version ${documentRequestString.fileVersion}!`);
          return true;
        }
      } else {
        // File doesn't exist, use the regular upload endpoint
        formData.append('files', pdfFile);  // Note: 'files' (plural) for new upload

        const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

        const documentRequestString = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            issueDate: formatDateForBackend(formData.inspectionDate),
            expiryDate: formatDateForBackend(calculateExpiryDate(formData.inspectionDate, inspectionDetails?.repeatFrequency)),
            note: 'External Lightning Certificate',
            fileVersion: fileVersion,
            siteId: siteSelectedForGlobal?.siteId || 0,
            originalFileName: fileName,
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `ELC-${new Date().getTime()}`
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

  // Function to save PDF to public folder (for development)
  const savePdfToPublic = async (pdfBlob, fileName) => {
    try {
      // In a real app, you would save to a server-side endpoint
      // For client-side only, we'll just return true without downloading
      // The actual download will be handled by uploadPdfToServer
      return true;
    } catch (error) {
      console.error('Error preparing PDF:', error);
      return false;
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

      const fields = form.getFields();
      fields.forEach(field => {
        try {
          console.log(`Field: ${field.getName()}, Type: ${field.constructor.name}`);
        } catch (error) {
          console.warn('Error getting field name:', error);
        }
      });



      const convertPassFail = (value) => {
        if (typeof value === 'string') {
          const lower = value.toLowerCase();
          if (lower === 'pass') return 'Yes';
          if (lower === 'fail') return 'No';
        }
        return value || '';
      };

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

      // Helper function to set checkbox
      const setCheckbox = (fieldName, isChecked) => {
        try {
          const field = form.getCheckBox(fieldName);
          if (field) {
            field.setValue(!!isChecked);
          } else {
            console.warn(`Checkbox not found: ${fieldName}`);
          }
        } catch (error) {
          console.warn(`Error setting checkbox ${fieldName}:`, error.message);
        }
      };

      const smallFont = 10;
      const mediumFont = 10;

      const addressLines = (formData.address || '').split(',');
      setTextField('AddressLine1', addressLines[0] || '', mediumFont);
      setTextField('AddressLine2', addressLines[1] || '', mediumFont);
      setTextField('city', addressLines[2] || '', mediumFont);
      setTextField('postalCode', addressLines[3] || '', mediumFont);
      setTextField('country', addressLines[4] || '', mediumFont);

      const siteContactName = formData.siteContactUser?.name || formData.siteContact || '';
      setTextField('siteContract', siteContactName, mediumFont);
      setTextField('contactNo', formData.siteContactNo || '', mediumFont);
      setTextField('jobNo', formData.job || '', mediumFont);

      // Format date as dd-mm-yyyy
      const formatDateString = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}-${month}-${year}`;
      };

      const formattedDate = formatDateString(formData.inspectionDate);
      setTextField('Date', formattedDate, mediumFont);

      // Fitting Information
      setTextField('Fitting Types', formData.param1Remark || '', smallFont);
      setTextField('Fitting Quanitity', formData.param2Remark || '', smallFont);
      setTextField('Fittings Location', formData.param3Remark || '', smallFont);

      setTextField('JobComplete', convertPassFail(formData.param1));
      setTextField('PartsRequired', convertPassFail(formData.param2));
      setTextField('Timers Checked', convertPassFail(formData.param3));
      setTextField('Fittings Operational', convertPassFail(formData.param4));

      setTextField('Engineers Report', formData.report || '', smallFont);

      // Use clientUser.name if it exists, otherwise fall back to client
      const clientName = formData.clientUser?.name || formData.client || '';
      // Use engineer name from users list if available, otherwise use the ID
      const engineer = users?.find(u => u.id === formData.engineer);
      const engineerName = engineer?.name || formData.engineer || '';

      setTextField('Clients Name', clientName, mediumFont);
      setTextField('Engineers Name', engineerName, mediumFont);

      // Signature dates (using the 'on' fields)
      setTextField('on', formattedDate, mediumFont);
      setTextField('on_2', formattedDate, mediumFont);

      // Additional fields that might be missing
      setTextField('Address', addressLines[0] || '', mediumFont);

      // Flatten the form to make it read-only
      try {
        form.flatten();
      } catch (error) {
        console.warn('Error flattening form:', error.message);
      }

      // Save the modified PDF
      const pdfBytesModified = await pdfDoc.save();

      // Create a blob
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });

      const fileName = `ExternalLightningReport.pdf`;

      setGeneratedPdfBlob(blob);

      const savedToPublic = await savePdfToPublic(blob, fileName);

      // Upload to server if requested
      let uploadedToServer = false;
      if (uploadToServer && savedToPublic) {
        uploadedToServer = await uploadPdfToServer(blob, fileName);
      } else if (savedToPublic) {
        // If not uploading to server but still need to download
        saveAs(blob, fileName);
      }

      // Show success message
      if (savedToPublic && (!uploadToServer || uploadedToServer)) {
        toast.success('PDF generated successfully!');
        setShowPdfButton(true);
      }

      return { success: true, fileName };

    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
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

    // Validation checks
    if (formData.param4 === "Fail" && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    if (!isFormEditable) {
      console.log('Submit prevented: Form is not editable');
      return;
    }

    // Form validation
    const errors = {};
    if (!formData.param1) errors.param1 = "Please select one option";
    if (!formData.param2) errors.param2 = "Please select one option";
    if (!formData.param3) errors.param3 = "Please select one option";
    if (!formData.param4) errors.param4 = "Please select one option";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
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
        siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
        type: 'Inspection',
        subType: 'Electrical',
        category: 'External Lighting Testing',
        status: 'Done',
        startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
        dueDate: formatLocalDateTime(calculateExpiryDate(formData.inspectionDate, inspectionDetails?.repeatFrequency)),
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
        siteId: siteSelectedForGlobal?.siteId,
        assetId: formData.selectedAsset?.assetId || formData.assetId,
        client: formData.clientUser?.id || formData.client,
        engineer: formData.engineer,
        siteContact: formData.siteContactUser?.id || formData.siteContact,
        type: 'Inspection',
        subType: 'External Lighting',
        category: 'External Lighting Certificate',
        checkId: currentCheckId || statusResponse?.checkId,
        param3Remark: formData.param3Remark,
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

      if (formData.actionId) {
        const action = await fetchActionById(formData.actionId);
        if (action) {
          setExistingAction(action);
          setActionRaised(true);
        }
      }

      console.log('Inspection data saved successfully:', saveResponse.data);

      // Generate PDF
      const pdfResult = await generatePDF(true);
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      toast.success("External lighting report saved and PDF generated successfully!");
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

  return (
      <div className="container mt-4 mb-5">
        <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
          <h4 className="mb-0">External Lighting Service Report</h4>
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
                    name="inspectionDate"
                    value={formatDate(formData.inspectionDate)}
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
              <h5 className="mb-0">Fitting Information</h5>
            </div>
            <div className="card-body">
              <div className="col">
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Fitting Types</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.param1Remark} // Using param1Remark for fitting types
                        onChange={(e) =>
                            setFormData({
                              ...formData,
                              param1Remark: e.target.value,
                            })
                        }
                        onMouseEnter={(e) =>
                            handleMouseEnter(e, formData.param1Remark)
                        }
                        onMouseLeave={handleMouseLeave}
                        disabled={isSubmitted}
                        required
                        style={{ width: "1200px" }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Fitting Quantity</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.param2Remark} // Using param2Remark for fitting quantity
                        onChange={(e) =>
                            setFormData({
                              ...formData,
                              param2Remark: e.target.value,
                            })
                        }
                        onMouseEnter={(e) =>
                            handleMouseEnter(e, formData.param2Remark)
                        }
                        onMouseLeave={handleMouseLeave}
                        disabled={isSubmitted}
                        required
                        style={{ width: "1200px" }}
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label">Fitting Location</label>
                    <input
                        type="text"
                        className="form-control"
                        value={formData.param3Remark} // Using param3Remark for fitting Location
                        onChange={(e) =>
                            setFormData({
                              ...formData,
                              param3Remark: e.target.value,
                            })
                        }
                        onMouseEnter={(e) =>
                            handleMouseEnter(e, formData.param3Remark)
                        }
                        onMouseLeave={handleMouseLeave}
                        disabled={isSubmitted}
                        required
                        style={{ width: "1200px" }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/*  Engineers Comments Section */}
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

          <div className="mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                  <tr>
                    <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "400px",
                        }}
                    >
                      Job Complete
                    </td>
                    <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "400px",
                        }}
                    >
                      Parts Required
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <select
                          className={`form-select ${
                              validationErrors.param1 ? "is-invalid" : ""
                          }`}
                          value={formData.param1}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param1: e.target.value,
                            });
                            if (validationErrors.param1) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param1;
                                return newErrors;
                              });
                            }
                          }}
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                      {validationErrors.param1 && (
                          <div className="invalid-feedback">
                            {validationErrors.param1}
                          </div>
                      )}
                    </td>
                    <td>
                      <select
                          className={`form-select ${
                              validationErrors.param2 ? "is-invalid" : ""
                          }`}
                          value={formData.param2}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param2: e.target.value,
                            });
                            if (validationErrors.param2) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param2;
                                return newErrors;
                              });
                            }
                          }}
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                      {validationErrors.param2 && (
                          <div className="invalid-feedback">
                            {validationErrors.param2}
                          </div>
                      )}
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mb-4 card">
            <div className="card-body col">
              <div className="card-header">
                <h6 className="mb-0" style={{ fontWeight: "bold" }}>
                  Service Items Undertaken
                </h6>
              </div>
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Timers Checked
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <select
                          className={`form-select ${
                              validationErrors.param3 ? "is-invalid" : ""
                          }`}
                          value={formData.param3}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param3: e.target.value,
                            });
                            if (validationErrors.param3) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param3;
                                return newErrors;
                              });
                            }
                          }}
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                      {validationErrors.param3 && (
                          <div className="invalid-feedback">
                            {validationErrors.param3}
                          </div>
                      )}
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Fittings Operational
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <select
                          className={`form-select ${
                              validationErrors.param4 ? "is-invalid" : ""
                          }`}
                          value={formData.param4}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param4: e.target.value,
                            });
                            if (validationErrors.param4) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param4;
                                return newErrors;
                              });
                            }
                          }}
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                      {validationErrors.param4 && (
                          <div className="invalid-feedback">
                            {validationErrors.param4}
                          </div>
                      )}
                    </td>
                  </tr>
                  </tbody>
                </table>

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
                                desc={`Inspection - Electrical - External Lighting Inspection`}
                                siteId={siteSelectedForGlobal?.siteId}
                                checkId={currentCheckId}
                                createdBy={loggedInUserData?.id}
                                onRiskAssessmentComplete={handleRiskAssessmentComplete}
                                actionRaised={actionRaised}
                                disabled={isSubmitted}
                            />
                        )}
                      </div>
                    </div>
                )}
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
                    value={formatDate(formData.signedDate)}
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
                    value={formData.user.name}
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
                    value={formatDate(formData.signedDate)}
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
                    {isFormEditable &&(
                        <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={
                                !isFormEditable ||
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
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
  getSiteDetailsById,
  getSiteById,
  getSiteAssets,
  getSites,
  getUsers,
})(ExternalLightningCertificate);