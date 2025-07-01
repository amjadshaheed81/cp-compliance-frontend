import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { get, post } from "../../../../api";
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
import { saveAs } from 'file-saver';
import axios from 'axios';
import pdfTemplate from './pdf/AirConditioningCertificate.pdf';
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

const AirConditioning = ({
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
  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    job: "",
    manufacturer: "",
    modelNumber: "",
    position: "",
    floor: "",
    room: "",
    serialNo: "",
    report: "",
    param1: "", // jobComplete
    param2: "", // partsRequired
    param3: "", // fGasCheck
    param4: "", // filtersCleaned
    param5: "", // indoorCoilCleaned
    param6: "", // outdoorCoilCleaned
    param7: "", // systemLeakCheck
    param8: "", // drainPumpTest
    param9: "", // electricalConnectionsCheck
    param10: "", // temperatureChecks
    param1Remark: "", // ofn
    param2Remark: "", // welding
    param3Remark: "", // refrigerant
    param4Remark: "", // reclaimCylinder
    param5Remark: "", // cleaningChemicals
    param6Remark: "", // airSpray
    client: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    selectedAsset: null,
    signedDate: new Date().toISOString().split("T")[0],
    clientUser: null,
    siteContactUser: null,
    actionId: null,
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
    EnvironmentalLogBook: null,
    AirConditioningServiceAndMaintenanceRecords: null
  });
  const [checkStatus, setCheckStatus] = useState('Open');
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const navigate = useNavigate();

  const isInternalUserTaggedWithSite = true;

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

        setFormData((prev) => ({
          ...prev,
          address: prev.address,
          assetId: mostRecentItem.assetId || prev.assetId,
          siteContact: mostRecentItem.siteContact || prev.siteContact,
          inspectionDate: mostRecentItem.inspectionDate || prev.inspectionDate,
          siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
          job: mostRecentItem.job || prev.job,
          manufacturer: mostRecentItem.manufacturer || prev.manufacturer,
          modelNumber: mostRecentItem.modelNumber || prev.modelNumber,
          position: mostRecentItem.position || prev.position,
          floor: mostRecentItem.floor || prev.floor,
          room: mostRecentItem.room || prev.room,
          serialNo: mostRecentItem.serialNo || prev.serialNo,
          report: mostRecentItem.report || prev.report,
          param1: mostRecentItem.param1 || prev.param1,
          param2: mostRecentItem.param2 || prev.param2,
          param3: mostRecentItem.param3 || prev.param3,
          param4: mostRecentItem.param4 || prev.param4,
          param5: mostRecentItem.param5 || prev.param5,
          param6: mostRecentItem.param6 || prev.param6,
          param7: mostRecentItem.param7 || prev.param7,
          param8: mostRecentItem.param8 || prev.param8,
          param9: mostRecentItem.param9 || prev.param9,
          param10: mostRecentItem.param10 || prev.param10,
          param1Remark: mostRecentItem.param1Remark || prev.param1Remark,
          param2Remark: mostRecentItem.param2Remark || prev.param2Remark,
          param3Remark: mostRecentItem.param3Remark || prev.param3Remark,
          param4Remark: mostRecentItem.param4Remark || prev.param4Remark,
          param5Remark: mostRecentItem.param5Remark || prev.param5Remark,
          param6Remark: mostRecentItem.param6Remark || prev.param6Remark,
          client: mostRecentItem.client || "",
          engineer: mostRecentItem.engineer || prev.engineer || loggedInUserData?.id,
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
      toast.error("Failed to load inspection data");
    }
  };

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
            action.desc.includes('Air Conditioning') ||
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
            const EnvironmentalLogBookFolder = logBooksResponse.document.childFolders.find(
                folder => folder.name.trim() === 'Environmental Log Book'
            );

            if (EnvironmentalLogBookFolder) {
              const environmentalResponse = await get(
                  `/api/document/parent/${EnvironmentalLogBookFolder.id}/folders?siteId=${siteId}`
              );

              if (environmentalResponse?.document?.childFolders) {
                const airConditioningFolder = environmentalResponse.document.childFolders.find(
                    folder => folder.name.trim() === 'Air Conditioning Service & Maintenance Records'
                );

                setFolderIds({
                  logBooks: logBooksFolder.id,
                  EnvironmentalLogBook: EnvironmentalLogBookFolder.id,
                  AirConditioningServiceAndMaintenanceRecords: airConditioningFolder?.id || null
                });

                return airConditioningFolder?.id || null;
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
        if (siteSelectedForGlobal?.siteId) {
          const response = await get(`/api/site-check/site/${siteSelectedForGlobal.siteId}`);
          if (response && response.length > 0) {
            const airConditioningCheck = response.find(
                check => check.category === 'Air Conditioning' || check.subType === 'Air Conditioning'
            );

            if (airConditioningCheck) {
              setCurrentCheckId(airConditioningCheck.checkId);
              setCheckStatus(airConditioningCheck.status);
              setIsFormEditable(airConditioningCheck.status === 'Open');
            }
          }
        }
      } catch (error) {
        console.error('Error fetching site check data:', error);
        toast.error('Failed to load site check status');
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
          await fetchInspectionData();
          await fetchSiteCheckData();

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

          const currentSite = sites.find(
              (site) => site.siteId === siteSelectedForGlobal.siteId
          );
          const siteData = currentSite || siteSelectedForGlobal;

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
  ]);

  useEffect(() => {
    const hasFailures = [
      formData.param1, formData.param2, formData.param3, formData.param4,
      formData.param5, formData.param6, formData.param7, formData.param8,
      formData.param9, formData.param10
    ].some(val => val === "Fail" || val === "No");

    setShowRiskAssessment(hasFailures);
    if (!hasFailures) {
      setActionRaised(false);
    }
  }, [
    formData.param1, formData.param2, formData.param3, formData.param4,
    formData.param5, formData.param6, formData.param7, formData.param8,
    formData.param9, formData.param10
  ]);

  const handleRiskAssessmentComplete = async (actionResponse) => {
    try {
      const completeAction = await fetchActionById(actionResponse.actionId);

      if (completeAction) {
        setActionRaised(true);
        setExistingAction(completeAction);
        setFormData(prev => ({
          ...prev,
          actionId: completeAction.actionId
        }));
        toast.success(`Action #${completeAction.actionId} raised successfully`);
      } else {
        toast.error("Failed to fetch complete action details");
      }
    } catch (error) {
      console.error("Error handling risk assessment completion:", error);
      toast.error("Failed to process action completion");
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
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

  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);
      const savedLocally = await savePdfToLocal(pdfBlob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const targetFolderId = folderIds.airConditioning || folderIds.logBooks;

      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

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
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `AC-${new Date().getTime()}`
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
        formData.append('files', pdfFile);
        const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

        const documentRequestString = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
                .toISOString().replace('T', ' ').split('.')[0],
            note: 'Air Conditioning Certificate',
            fileVersion: fileVersion,
            siteId: siteSelectedForGlobal?.siteId || 0,
            originalFileName: fileName,
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `AC-${new Date().getTime()}`
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

  const savePdfToPublic = async (pdfBlob, fileName) => {
    try {
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

      // Asset Information
      setTextField('Manufacturer', formData.manufacturer || '', smallFont);
      setTextField('ModelNumber', formData.modelNumber || '', smallFont);
      setTextField('SerialNumber', formData.serialNo || '', smallFont);
      setTextField('Position', formData.position || '', smallFont);
      setTextField('Floor', formData.floor || '', smallFont);
      setTextField('Room', formData.room || '', smallFont);

      // Service Items
      setTextField('JobComplete', convertPassFail(formData.param1));
      setTextField('PartsRequired', convertPassFail(formData.param2));
      setTextField('FGasCheck', convertPassFail(formData.param3));
      setTextField('FiltersCleaned', convertPassFail(formData.param4));
      setTextField('IndoorCoilCleaned', convertPassFail(formData.param5));
      setTextField('OutdoorCoilCleaned', convertPassFail(formData.param6));
      setTextField('SystemLeakCheck', convertPassFail(formData.param7));
      setTextField('DrainPumpTest', convertPassFail(formData.param8));
      setTextField('ElectricalConnectionsCheck', convertPassFail(formData.param9));
      setTextField('TemperatureChecks', convertPassFail(formData.param10));

      // Materials Used
      setTextField('OFN', formData.param1Remark || '', smallFont);
      setTextField('Welding', formData.param2Remark || '', smallFont);
      setTextField('Refrigerant', formData.param3Remark || '', smallFont);
      setTextField('ReclaimCylinder', formData.param4Remark || '', smallFont);
      setTextField('CleaningChemicals', formData.param5Remark || '', smallFont);
      setTextField('AirSpray', formData.param6Remark || '', smallFont);

      setTextField('EngineersReport', formData.report || '', smallFont);

      const clientName = formData.clientUser?.name || formData.client || '';
      const engineer = users?.find(u => u.id === formData.engineer);
      const engineerName = engineer?.name || formData.engineer || '';

      setTextField('ClientsName', clientName, mediumFont);
      setTextField('EngineersName', engineerName, mediumFont);

      setTextField('on', formattedDate, mediumFont);
      setTextField('on_2', formattedDate, mediumFont);
      setTextField('Address', addressLines[0] || '', mediumFont);

      try {
        form.flatten();
      } catch (error) {
        console.warn('Error flattening form:', error.message);
      }

      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const fileName = `AirConditioningReport.pdf`;

      setGeneratedPdfBlob(blob);
      const savedToPublic = await savePdfToPublic(blob, fileName);

      let uploadedToServer = false;
      if (uploadToServer && savedToPublic) {
        uploadedToServer = await uploadPdfToServer(blob, fileName);
      } else if (savedToPublic) {
        saveAs(blob, fileName);
      }

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

    const hasFailures = [
      formData.param1, formData.param2, formData.param3, formData.param4,
      formData.param5, formData.param6, formData.param7, formData.param8,
      formData.param9, formData.param10
    ].some(val => val === "Fail" || val === "No");

    if (hasFailures && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    if (!isFormEditable) {
      console.log('Submit prevented: Form is not editable');
      return;
    }

    const errors = {};
    if (!formData.param1) errors.param1 = "Please select one option";
    if (!formData.param2) errors.param2 = "Please select one option";
    if (!formData.param3) errors.param3 = "Please select one option";
    if (!formData.param4) errors.param4 = "Please select one option";
    if (!formData.param5) errors.param5 = "Please select one option";
    if (!formData.param6) errors.param6 = "Please select one option";
    if (!formData.param7) errors.param7 = "Please select one option";
    if (!formData.param8) errors.param8 = "Please select one option";
    if (!formData.param9) errors.param9 = "Please select one option";
    if (!formData.param10) errors.param10 = "Please select one option";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
      const effectiveCheckId = currentCheckId || checkId;

      if (!effectiveCheckId) {
        console.error('Cannot submit: No check ID available');
        throw new Error('No inspection check found. Please refresh the page and try again.');
      }

      console.log('Updating site check status with checkId:', effectiveCheckId);

      const payload = {
        checkId: parseInt(effectiveCheckId, 10),
        siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
        type: 'Inspection',
        subType: 'Mechanical',
        category: 'Air Conditioning',
        status: 'Done',
        startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
        leadUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0',
        assistantUserID: loggedInUserData?.id ? String(loggedInUserData.id) : '0'
      };

      console.log('Sending PUT request to update site check:', {
        url: `/api/site-check/${effectiveCheckId}`,
        payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') ? 'token-exists' : 'no-token'}`
        }
      });

      const startTime = Date.now();
      const response = await axios.put(
          `/api/site-check/${effectiveCheckId}`,
          payload,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
      );

      const endTime = Date.now();
      console.log(`API call completed in ${endTime - startTime}ms`, response);

      if (response.status === 200 || response.status === 204) {
        console.log('Successfully updated site check status');
        setCheckStatus('Done');
        setIsFormEditable(false);
        console.log('Site check status updated successfully:', response.data);

        const saveResponse = await axios.post(
            '/api/site-check/generic-inspection',
            {
              ...formData,
              siteId: siteSelectedForGlobal?.siteId,
              assetId: formData.selectedAsset?.assetId || formData.assetId,
              client: formData.clientUser?.id || formData.client,
              engineer: formData.engineer,
              siteContact: formData.siteContactUser?.id || formData.siteContact,
              type: 'Inspection',
              subType: 'Air Conditioning',
              category: 'Air Conditioning Service',
              checkId: checkId,
              actionId: formData.actionId,
            },
            {
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
              }
            }
        );

        if (saveResponse.status === 200 || saveResponse.status === 201) {
          console.log('Form data saved successfully:', saveResponse.data);

          const pdfResult = await generatePDF(true);
          if (pdfResult.success) {
            toast.success("Air Conditioning report saved and PDF generated successfully!");
            setShowPdfButton(true);
            setIsSubmitted(true);
            setSubmissionSuccess(true);

            setTimeout(() => {
              navigate(-1);
            }, 1500);
          } else {
            throw new Error(pdfResult.error || "Failed to generate PDF");
          }
        } else {
          throw new Error(`Failed to save form data: ${saveResponse.statusText}`);
        }

        return response;
      } else {
        console.warn('Unexpected response status:', response.status);
        throw new Error(`Unexpected response status: ${response.status}`);
      }
    } catch (error) {
      console.error('Error in form submission:', error);
      console.error('Error details:', error.response?.data || error.message);
      toast.error(error.message || 'Failed to submit form');
      throw error;
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

  const filteredAssets =
      siteAssets?.filter(
          (asset) =>
              asset.category === "Mechanical" &&
              asset.subCategory === "Air Conditioning" &&
              asset.subCategory2 === "Air Conditioning Unit (Indoor)"
      ) || [];

  const handleAssetSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      assetId: newValue ? newValue.assetId : "",
      selectedAsset: newValue,
      manufacturer: newValue ? newValue.manufacturer : "",
      modelNumber: newValue ? newValue.model : "",
      position: newValue ? newValue.position : "",
      floor: newValue ? newValue.floor : "",
      room: newValue ? newValue.room : "",
      serialNo: newValue ? newValue.serialNumber : "",
    }));
  };

  return (
      <div className="container mt-4 mb-5">
        <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Air Conditioning Service Report</h4>
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
              <h5 className="mb-0">Device Information</h5>
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
                              label="Select an Air Conditioning Unit"
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
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Manufacturer</label>
                        <input
                            type="text"
                            className="form-control"
                            name="manufacturer"
                            value={formData.manufacturer}
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
                            value={formData.modelNumber}
                            onChange={handleInputChange}
                            required
                            disabled
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Serial Number</label>
                        <input
                            type="text"
                            className="form-control"
                            name="serialNo"
                            value={formData.serialNo}
                            onChange={handleInputChange}
                            required
                            disabled
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Asset No</label>
                        <input
                            type="text"
                            className="form-control"
                            name="assetId"
                            value={`Asset No - ${formData.selectedAsset.assetId}`}
                            onChange={handleInputChange}
                            required
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
                            name="position"
                            value={formData.position}
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
                            value={formData.floor}
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
                            value={formData.room}
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
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Job Complete
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Parts Required
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      F Gas Check Complete
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
                    <td>
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
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="mb-4 card">
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h5>Service Items Undertaken</h5>
                  <div className="d-flex flex-column gap-3 mt-3">
                    <div>
                      <label className="form-label fw-bold">
                        Filters Cleaned
                      </label>
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
                    </div>

                    <div>
                      <label className="form-label fw-bold">
                        Indoor Coil Cleaned
                      </label>
                      <select
                          className={`form-select ${
                              validationErrors.param5 ? "is-invalid" : ""
                          }`}
                          value={formData.param5}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param5: e.target.value,
                            });
                            if (validationErrors.param5) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param5;
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
                      {validationErrors.param5 && (
                          <div className="invalid-feedback">
                            {validationErrors.param5}
                          </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label fw-bold">
                        Outdoor Coil Cleaned
                      </label>
                      <select
                          className={`form-select ${
                              validationErrors.param6 ? "is-invalid" : ""
                          }`}
                          value={formData.param6}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param6: e.target.value,
                            });
                            if (validationErrors.param6) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param6;
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
                      {validationErrors.param6 && (
                          <div className="invalid-feedback">
                            {validationErrors.param6}
                          </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label fw-bold">
                        System Leak Check
                      </label>
                      <select
                          className={`form-select ${
                              validationErrors.param7 ? "is-invalid" : ""
                          }`}
                          value={formData.param7}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param7: e.target.value,
                            });
                            if (validationErrors.param7) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param7;
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
                      {validationErrors.param7 && (
                          <div className="invalid-feedback">
                            {validationErrors.param7}
                          </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label fw-bold">
                        Drain/Pump Test
                      </label>
                      <select
                          className={`form-select ${
                              validationErrors.param8 ? "is-invalid" : ""
                          }`}
                          value={formData.param8}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param8: e.target.value,
                            });
                            if (validationErrors.param8) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param8;
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
                      {validationErrors.param8 && (
                          <div className="invalid-feedback">
                            {validationErrors.param8}
                          </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label fw-bold">
                        Electrical Connections Check
                      </label>
                      <select
                          className={`form-select ${
                              validationErrors.param9 ? "is-invalid" : ""
                          }`}
                          value={formData.param9}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param9: e.target.value,
                            });
                            if (validationErrors.param9) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param9;
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
                      {validationErrors.param9 && (
                          <div className="invalid-feedback">
                            {validationErrors.param9}
                          </div>
                      )}
                    </div>

                    <div>
                      <label className="form-label fw-bold">
                        Temperature Checks
                      </label>
                      <select
                          className={`form-select ${
                              validationErrors.param10 ? "is-invalid" : ""
                          }`}
                          value={formData.param10}
                          onChange={(e) => {
                            setFormData({
                              ...formData,
                              param10: e.target.value,
                            });
                            if (validationErrors.param10) {
                              setValidationErrors((prev) => {
                                const newErrors = { ...prev };
                                delete newErrors.param10;
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
                      {validationErrors.param10 && (
                          <div className="invalid-feedback">
                            {validationErrors.param10}
                          </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="col-md-6">
                  <h5>Materials Used</h5>
                  <div className="d-flex flex-column gap-3 mt-3">
                    <div>
                      <label className="form-label fw-bold">OFN</label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.param1Remark}
                          onChange={(e) =>
                              setFormData({ ...formData, param1Remark: e.target.value })
                          }
                          disabled={isSubmitted}
                      />
                    </div>

                    <div>
                      <label className="form-label fw-bold">Welding</label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.param2Remark}
                          onChange={(e) =>
                              setFormData({ ...formData, param2Remark: e.target.value })
                          }
                          disabled={isSubmitted}
                      />
                    </div>

                    <div>
                      <label className="form-label fw-bold">Refrigerant</label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.param3Remark}
                          onChange={(e) =>
                              setFormData({ ...formData, param3Remark: e.target.value })
                          }
                          disabled={isSubmitted}
                      />
                    </div>
                    <div>
                      <label className="form-label fw-bold">
                        Reclaim Cylinder
                      </label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.param4Remark}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param4Remark: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      />
                    </div>
                    <div>
                      <label className="form-label fw-bold">
                        Cleaning Chemicals
                      </label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.param5Remark}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param5Remark: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      />
                    </div>
                    <div>
                      <label className="form-label fw-bold">Air Spray</label>
                      <input
                          type="text"
                          className="form-control"
                          value={formData.param6Remark}
                          onChange={(e) =>
                              setFormData({ ...formData, param6Remark: e.target.value })
                          }
                          disabled={isSubmitted}
                      />
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
                                <p><strong>Priority:</strong> {existingAction.priority}</p>
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
                              desc={`Inspection - Mechanical - Air Conditioning - ${formatDate(formData.inspectionDate)}`}
                              siteId={siteSelectedForGlobal?.siteId}
                              assignedTo={loggedInUserData?.id}
                              createdBy={loggedInUserData?.id}
                              onRiskAssessmentComplete={handleRiskAssessmentComplete}
                              actionRaised={actionRaised}
                          />
                      )}
                    </div>
                  </div>
              )}
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
                    {isFormEditable && (
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
})(AirConditioning);