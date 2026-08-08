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
import { formatDate, formatLocalDateTime } from "../../../../utils/dateFormat";
import InsertPhotoIcon from "@mui/icons-material/InsertPhoto";
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import pdfTemplate from './pdf/WaterHeater.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import { getUkLocalDate, isCurrentUkInspectionDate } from "./shared/siteCheckDateUtils";

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

const WaterHeaterCertificate = ({
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
                                  siteCheck = {},
                                }) => {
  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    inspectionDate: getUkLocalDate(),
    siteContactNo: "",
    job: "",
    manufacturer: "",
    modelNumber: "",
    param1Remark: "", // tankSize
    param2Remark: "", // image 1
    param3Remark: "", // image 2
    param4Remark: "", // image 3
    param5Remark: "", // image 4

    report: "",
    param1: "", // jobComplete
    param2: "", // partsRequired
    param6Remark: "", // ifYes
    param4: "", // unitOperational
    param5: "", // limescaleEvident
    param7Remark: "", // tempAfter60
    clientName: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    selectedAsset: null,
    signedDate: getUkLocalDate(),
    clientUser: null,
    siteContactUser: null,
    actionId: null,
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
    electricalManagement: null,
    externalLighting: null
  });
  const [checkStatus, setCheckStatus] = useState('Open');
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const navigate = useNavigate();

  // NEW: Use the Site Check itself as the authoritative site/status source.
  const authoritativeSiteId = siteCheck?.siteId
      ? Number(siteCheck.siteId)
      : Number(siteSelectedForGlobal?.siteId) || null;
  const [lastEngineerId, setLastEngineerId] = useState(null);
  const effectiveCheckStatus = siteCheck?.status || checkStatus || "Open";

  // NEW: Shared engineer list/selection matching Air Conditioning.
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
    status: effectiveCheckStatus,
    selectedEngineerId: formData.engineer,
    selectedEngineerUser: formData.user,
    lastEngineerId,
  });

  // NEW: Open = current UK date/logged-in engineer. Done is restored from API.
  useEffect(() => {
    if (effectiveCheckStatus !== "Open") return;

    setFormData((prev) => ({
      ...prev,
      inspectionDate: getUkLocalDate(),
      signedDate: getUkLocalDate(),
      engineer: prev.engineer || loggedInUserData?.id || "",
      user: prev.user?.id ? prev.user : (loggedInUserData || {}),
    }));
  }, [effectiveCheckStatus, loggedInUserData?.id]);

  const isInternalUserTaggedWithSite =
      (loggedInUserData?.userType === "Internal" || loggedInUserData?.userType === "External") &&
      loggedInUserData?.taggedSites?.some(
          (site) => Number(site.id ?? site.siteId) === Number(authoritativeSiteId)
      );

  useEffect(() => {
    const fetchSasToken = async () => {
      try {
        const token = await getSasToken();
        setSasToken(token);
        // Update any existing photo URLs with new token
        setUploadedPhotos(prev => prev.map(photo => ({
          ...photo,
          url: `${photo.url.split('?')[0]}?${token}`
        })));
      } catch (error) {
        console.error('Failed to fetch SAS token:', error);
      }
    };

    fetchSasToken();
  }, []);

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

        const savedEngineerId = mostRecentItem.engineer || null;
        setLastEngineerId(savedEngineerId);
        const isCurrentOpenInspection =
            effectiveCheckStatus === "Open" &&
            isCurrentUkInspectionDate(mostRecentItem.inspectionDate);

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
          signedDate: effectiveCheckStatus === "Open" ? getUkLocalDate() : (mostRecentItem.signedDate || prev.signedDate),
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
          // OLD: engineer/user always preferred the saved record, even while Open.
          // NEW: same Open/Done behaviour as Air Conditioning.
          engineer: effectiveCheckStatus === "Open"
              ? (isCurrentOpenInspection ? (savedEngineerId || loggedInUserData?.id || "") : (loggedInUserData?.id || ""))
              : (savedEngineerId || prev.engineer || ""),
          user: effectiveCheckStatus === "Open"
              ? (isCurrentOpenInspection ? (engineerUser || loggedInUserData || {}) : (loggedInUserData || {}))
              : (engineerUser || prev.user || {}),
          inspectionDate: effectiveCheckStatus === "Open"
              ? getUkLocalDate()
              : (mostRecentItem.inspectionDate || prev.inspectionDate),
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

  const selectedAsset = siteAssets.find(
      (asset) => asset.assetId === formData.assetId
  );

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

  useEffect(() => {
    const fetchSiteCheckData = async () => {
      try {
        if (!authoritativeSiteId) return;

        const response = await get(`/api/site-check/site/${authoritativeSiteId}`);
        if (response && response.length > 0) {
          let waterHeaterCheck = checkId
              ? response.find(check => check.checkId === parseInt(checkId, 10))
              : null;

          if (waterHeaterCheck) {
            setCurrentCheckId(waterHeaterCheck.checkId);
            setCheckStatus(waterHeaterCheck.status);

            const isDone = waterHeaterCheck.status === 'Done';
            setIsFormEditable(!isDone);
            setIsSubmitted(isDone);
            setShowPdfButton(isDone);

            // Set inspection details here
            const inspectionDetails = {
              checkId: waterHeaterCheck.checkId,
              siteId: waterHeaterCheck.siteId,
              type: waterHeaterCheck.type,
              subType: waterHeaterCheck.subType,
              category: waterHeaterCheck.category,
              dueDate: waterHeaterCheck.dueDate,
              status: waterHeaterCheck.status
            };
            setInspectionDetails(inspectionDetails);
          } else {
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
          await fetchSiteCheckData();
          await fetchInspectionData();

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

          const siteData = siteDetailsById ||
              (Number(siteSelectedForGlobal?.siteId) === Number(authoritativeSiteId)
                  ? siteSelectedForGlobal
                  : null);

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

          if (siteData?.siteContact) {
            setFormData((prev) => ({
              ...prev,
              siteContact: siteData.siteContact.name || "",
              siteContactNo: siteData.siteContact.phone || "",
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

  useEffect(() => {
    const shouldShowRiskAssessment = (formData.param4 === "Fail" && formData.param5 === "Pass" && formData.param2 === "Pass");
    setShowRiskAssessment(shouldShowRiskAssessment);

    const isActionValid = existingAction && existingAction.checkId === currentCheckId;
    setActionRaised(isActionValid);
  }, [formData.param4, currentCheckId, existingAction, formData.param5, formData.param2]);

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
          siteId: authoritativeSiteId,
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

  const getAllImages = () => {
    return [
      formData.param2Remark ? {
        url: formData.param2Remark.includes('?')
            ? formData.param2Remark
            : `${formData.param2Remark}?${sasToken}`,
        paramKey: 'param2Remark'
      } : null,
      formData.param3Remark ? {
        url: formData.param3Remark.includes('?')
            ? formData.param3Remark
            : `${formData.param3Remark}?${sasToken}`,
        paramKey: 'param3Remark'
      } : null,
      formData.param4Remark ? {
        url: formData.param4Remark.includes('?')
            ? formData.param4Remark
            : `${formData.param4Remark}?${sasToken}`,
        paramKey: 'param4Remark'
      } : null,
      formData.param5Remark ? {
        url: formData.param5Remark.includes('?')
            ? formData.param5Remark
            : `${formData.param5Remark}?${sasToken}`,
        paramKey: 'param5Remark'
      } : null,
    ].filter(Boolean);
  };

  const dateFormat = (date) => {
    return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
  }

  const uploadPdfToServer = async (pdfBlob, fileName, inspectionDateOverride = null) => {
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
            siteId: authoritativeSiteId || 0,
            issueDate: formatDateForBackend(inspectionDateOverride || formData.inspectionDate),
            expiryDate: formatDateForBackend(calculateExpiryDate(inspectionDateOverride || formData.inspectionDate, inspectionDetails?.repeatFrequency)),
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
            issueDate: formatDateForBackend(inspectionDateOverride || formData.inspectionDate),
            expiryDate: formatDateForBackend(calculateExpiryDate(inspectionDateOverride || formData.inspectionDate, inspectionDetails?.repeatFrequency)),
            note: 'Water Heater Service Report',
            fileVersion: fileVersion,
            siteId: authoritativeSiteId || 0,
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

  const generatePDF = async (uploadToServer = true, inspectionDateOverride = null) => {
    try {
      setIsGeneratingPDF(true);

      if (!PDFLib) {
        PDFLib = await import('pdf-lib');
      }

      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
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

      const smallFont = 8;

      // Address and contact information
      const addressLines = (formData.address || '').split(',');
      setTextField('Address', addressLines[0] || '', smallFont);
      setTextField('Address_2', addressLines[1] || '', smallFont);
      setTextField('Address_3', addressLines[2] || '', smallFont);
      setTextField('Address_4', addressLines[3] || '', smallFont);

      setTextField('Date', dateFormat(inspectionDateOverride || formData.inspectionDate), smallFont);
      setTextField('Site Contact', formData.siteContactUser?.name || formData.siteContact || '', smallFont);
      setTextField('Site Contact No', formData.siteContactNo || '', smallFont);
      setTextField('Job', formData.job || '', smallFont);

      // Equipment information
      setTextField('Manufacturer', formData.selectedAsset?.manufacturer || '', smallFont);
      setTextField('Model', formData.selectedAsset?.model || '', smallFont);
      setTextField('Serial', formData.selectedAsset?.serialNumber || '', smallFont);

      setTextField('Storage', formData.param1Remark || '', smallFont);


      const equipmentDetails = formData.selectedAsset ? [
        selectedAsset.position,
        selectedAsset.manufacturer,
        selectedAsset.assetName,
        selectedAsset.floor,
        selectedAsset.room,
        `Asset No-${formData.assetId}`,
      ].filter(Boolean).join(' - ') : 'Not specified';

      setTextField('Location', equipmentDetails, smallFont);

      // Test results
      setTextField('Job Complete', formData.param1 === 'Pass' ? 'Yes' : 'No', smallFont);
      setTextField('Parts Required', formData.param2 === 'Pass' ? 'Yes' : 'No', smallFont);
      setTextField('Unit', formData.param4 === 'Pass' ? 'Yes' : 'No', smallFont);
      setTextField('LimeScale', formData.param5 === 'Pass' ? 'Yes' : 'No', smallFont);

      setTextField('box', formData.param6Remark || '', smallFont);
      setTextField('Temp', formData.param7Remark || '', smallFont);

      // Report
      setTextField('report', formData.report || '', smallFont);

      // Signatures
      const clientName = formData.clientUser?.name || formData.client || '';
      const engineerName = selectedEngineer?.name || formData.user?.name || '';

      setTextField('Clients Name', clientName, smallFont);
      setTextField('Engineers Name', engineerName, smallFont);
      setTextField('on', dateFormat(inspectionDateOverride || formData.signedDate), smallFont);
      setTextField('on_2', dateFormat(inspectionDateOverride || formData.signedDate), smallFont);

      // Handle image embedding for PDF fields
      const imageFields = [
        { pdfField: 'param2Remark_af_image', formField: 'param2Remark' },
        { pdfField: 'param3Remark_af_image', formField: 'param3Remark' },
        { pdfField: 'param4Remark_af_image', formField: 'param4Remark' },
        { pdfField: 'param5Remark_af_image', formField: 'param5Remark' }
      ];

      for (const { pdfField, formField } of imageFields) {
        const imageUrl = formData[formField];
        if (!imageUrl) {
          console.log(`No image URL found for ${formField}`);
          continue;
        }

        try {
          const cleanUrl = imageUrl.split('?')[0];
          const imageUrlWithToken = `${cleanUrl}?${sasToken}`;
          console.log(`Processing image from: ${imageUrlWithToken}`);

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 10000);

          const imageResponse = await fetch(imageUrlWithToken, {
            signal: controller.signal
          });
          clearTimeout(timeout);

          if (!imageResponse.ok) {
            console.error(`HTTP error for ${formField}: ${imageResponse.status}`);
            continue;
          }

          const imageBytes = await imageResponse.arrayBuffer();

          if (imageBytes.byteLength < 100) {
            console.error(`Image too small or corrupted for ${formField}`);
            continue;
          }

          const image = await embedUniversalImage(imageBytes);
          console.log(`Successfully embedded image for ${formField}`);

          const imageField = form.getButton(pdfField);
          if (!imageField) {
            console.error(`PDF field ${pdfField} not found`);
            continue;
          }

          imageField.setImage(image);
          console.log(`Image set in field ${pdfField}`);

        } catch (error) {
          console.error(`Error processing ${formField} image:`, error);
        }
      }

      // Flatten and save
      form.flatten();
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const fileName = `WaterHeaterServiceCertificate_${formData.selectedAsset?.assetName || 'report'}.pdf`;

      setGeneratedPdfBlob(blob);
      setShowPdfButton(true);

      if (uploadToServer) {
        await uploadPdfToServer(blob, fileName, inspectionDateOverride || formData.inspectionDate);
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
              siteId: authoritativeSiteId || 0,
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
          siteId: authoritativeSiteId,
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
        siteId: authoritativeSiteId,
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
    if (!formData.engineer || !selectedEngineer) {
      errors.engineer = "Please select an active engineer for this Site Check.";
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
      // NEW: Open checks complete using today's UK date, matching Air Conditioning.
      const submissionInspectionDate =
          effectiveCheckStatus === "Open" ? getUkLocalDate() : formData.inspectionDate;

      if (effectiveCheckStatus === "Open") {
        setFormData((prev) => ({
          ...prev,
          inspectionDate: submissionInspectionDate,
          signedDate: submissionInspectionDate,
        }));
      }

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
        siteId: parseInt(authoritativeSiteId, 10),
        type: siteCheck?.type || 'Inspection',
        // OLD: subType/category used internal generic-inspection values.
        // NEW: preserve the UI routing values of the Site Check.
        subType: siteCheck?.subType || 'Legionella',
        category: siteCheck?.category || 'Water Heater Inspection & Service',
        status: 'Done',
        startDate: `${submissionInspectionDate}T00:00:00`,
        dueDate: formatLocalDateTime(calculateExpiryDate(submissionInspectionDate, inspectionDetails?.repeatFrequency)),
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
        siteId: authoritativeSiteId,
        assetId: formData.selectedAsset?.assetId || formData.assetId || null,
        client: formData.clientUser?.id || formData.client,
        engineer: formData.engineer,
        inspectionDate: submissionInspectionDate,
        signedDate: submissionInspectionDate,
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

      const pdfResult = await generatePDF(true, submissionInspectionDate);
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

  const renderClientNameField = () => {
    if (isInternalUserTaggedWithSite) {
      const filteredUsers =
          users?.filter((user) =>
              user.taggedSites?.some(
                  (site) => Number(site.id ?? site.siteId) === Number(authoritativeSiteId)
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

  const renderSiteContactField = () => {
    if (isInternalUserTaggedWithSite) {
      const filteredUsers =
          users?.filter((user) =>
              user.taggedSites?.some(
                  (site) => Number(site.id ?? site.siteId) === Number(authoritativeSiteId)
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

  // NEW: Shared engineer dropdown selection.
  const handleEngineerSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      engineer: newValue?.id || "",
      user: newValue || {},
    }));
    setValidationErrors((prev) => ({ ...prev, engineer: "" }));
  };

  const filteredAssets =
      siteAssets?.filter(
          (asset) =>
              asset.category === "Mechanical" &&
              asset.subCategory === "Water Services" &&
              asset.subCategory2 === "Calorifier"
      ) || [];

  return (
      <div className="container mt-4 mb-5">
        <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Water Heater Service Report</h4>
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
                    name="jobNo"
                    value={formData.jobNo}
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
                          `${option.assetId} - ${option.assetName} (${option.position || "NA"
                          } > ${option.floor || "NA"} > ${option.room || "NA"})`
                      }
                      value={formData.selectedAsset}
                      onChange={handleAssetSelect}
                      renderInput={(params) => (
                          <TextField
                              {...params}
                              label="Select a Water Heater"
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
                            value={selectedAsset?.manufacturer}
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
                            value={selectedAsset?.model}
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
                            value={selectedAsset?.serialNumber}
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
                            value={selectedAsset?.position}
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
                            value={selectedAsset?.floor}
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
                            value={selectedAsset?.room}
                            onChange={handleInputChange}
                            required
                            disabled
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">Storage (ltrs)</label>
                        <input
                            type="text"
                            className="form-control"
                            value={formData.param1Remark}
                            onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  param1Remark: e.target.value,
                                })
                            }
                            disabled={isSubmitted}
                        />
                      </div>
                    </div>
                  </div>
              )}
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-header d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Engineers Reports</h5>
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
              <div className="mb-3">
                <TextField
                    multiline
                    rows={16}
                    fullWidth
                    variant="outlined"
                    placeholder="---------------------------------------- Write your report below this line ----------------------------------------"
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

              {/* Photo Previews */}
              {uploadedPhotos.map((photo, index) => {
                const imageUrl = photo.url.includes('?')
                    ? photo.url
                    : `${photo.url}?${sasToken}`;

                return (
                    <div
                        key={index}
                        className="position-relative"
                        style={{
                          width: "100px",
                          height: "100px",
                          display: 'inline-block',
                          marginRight: '10px',
                          position: 'relative'
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
                            border: '1px solid #ddd',
                            borderRadius: '4px'
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

          <div className="mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Unit Operational
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Limescale Evident
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Temperature after 60 secs (°C)
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <select
                          className={`form-select ${validationErrors.param4 ? "is-invalid" : ""}`}
                          value={formData.param4}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param4: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                          className={`form-select ${validationErrors.param5 ? "is-invalid" : ""}`}
                          value={formData.param5}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param5: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <input
                          type="text"
                          className={`form-control ${validationErrors.param7Remark ? "is-invalid" : ""}`}
                          value={formData.param7Remark}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param7Remark: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      />
                    </td>
                  </tr>
                  </tbody>
                </table>
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
                      If yes Please Specify
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <select
                          className={`form-select ${validationErrors.param1 ? "is-invalid" : ""}`}
                          value={formData.param1}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param1: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                          className={`form-select ${validationErrors.param2 ? "is-invalid" : ""}`}
                          value={formData.param2}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param2: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <input
                          type="text"
                          className={`form-control ${validationErrors.param6Remark ? "is-invalid" : ""}`}
                          value={formData.param6Remark}
                          onChange={(e) =>
                              setFormData({
                                ...formData,
                                param6Remark: e.target.value,
                              })
                          }
                          disabled={isSubmitted}
                      />
                    </td>
                  </tr>
                  </tbody>
                </table>
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
                          desc={`Inspection - Water Heater Service`}
                          siteId={authoritativeSiteId}
                          checkId={currentCheckId}
                          createdBy={loggedInUserData?.id}
                          taggedAsset={formData.selectedAsset?.assetId}
                          onRiskAssessmentComplete={handleRiskAssessmentComplete}
                          actionRaised={actionRaised}
                          disabled={isSubmitted}
                          images={getAllImages()}
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
              {/* =========================================================
                  OLD ENGINEER FIELD - COMMENTED FOR REVIEW

              <div className="mb-3">
                <label className="form-label fw-bold">Engineer's Name</label>
                <input
                    type="text"
                    className="form-control"
                    value={formData.user?.name}
                    onChange={handleInputChange}
                    required
                    readOnly
                    disabled
                />
              </div>

              ========================================================= */}

              {/* NEW SHARED ENGINEER CONTROL - MATCHES AIR CONDITIONING */}
              <SiteCheckEngineerSelector
                  options={engineerOptions}
                  value={selectedEngineer}
                  onChange={handleEngineerSelect}
                  isOpen={effectiveCheckStatus === "Open"}
                  disabled={isSubmitted || !isFormEditable}
                  loading={isLoadingEngineers}
                  error={validationErrors.engineer || engineerLoadError}
              />
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input
                    type="date"
                    className="form-control"
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
                  Report submitted successfully on {getUkLocalDate()}
                </div>
                {showPdfButton && generatedPdfBlob && (
                    <button
                        className="btn btn-success"
                        onClick={() => savePdfToLocal(generatedPdfBlob, `WaterHeaterServiceCertificate_${formData.selectedAsset?.assetName || 'report'}.pdf`)}
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
})(WaterHeaterCertificate);