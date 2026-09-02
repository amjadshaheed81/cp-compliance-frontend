import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { get, post, put } from "../../../../api";
import {
  getSiteAssets,
  getSiteDetailsById,
  getSites,
  getUsers,
} from "../../../../store/thunk/site";
import { Autocomplete, TextField } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import pdfTemplate from './pdf/CCTV.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import axios from "axios";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import SiteCheckEngineerSignature from "./shared/SiteCheckEngineerSignature";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import {
  getUkLocalDate,
  isCurrentUkInspectionDate,
  toJavaLocalDateTime,
  toJavaLocalDate,
} from "./shared/siteCheckDateUtils";
import SiteCheckDueSummary from "./shared/SiteCheckDueSummary";
import SiteCheckBackButton from "./shared/SiteCheckBackButton";
import { calculateSiteCheckDueDate } from "../../../../utils/siteCheckRecurrence";

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

const CctvAlarmCertificate = ({
                                sasToken,
                                checkId,
                                subType,
                                category,
                                siteCheck,
                                siteDetailsById,
                                getSiteDetailsById,
                                siteAssets,
                                getSiteAssets,
                                users,
                                getUsers,
                                siteSelectedForGlobal = {},
                                loggedInUserData,
                              }) => {
  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    inspectionDate: getUkLocalDate(),
    siteContactNo: "",
    job: "",
    report: "",
    param1: "",
    param2: "",
    param3: "",// Image Quality Check
    param4: "",// lenses cleaned
    param5: "", // DVR Recording Check
    param6: "", // Electrical Connection Check
    client: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    selectedAsset: null,
    signedDate: getUkLocalDate(),
    clientUser: null,
    siteContactUser: null,
    actionId: null,
  });

  const sites = useSelector((state) => state.site.sites);

  // NEW: Use the Site Check's own site for engineers, assets and documents.
  // The global selected site is retained only as a fallback while the parent loads.
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
    const [inspectionDetails, setInspectionDetails] = useState(null);

    const [folderIds, setFolderIds] = useState({
    logBooks: null,
    plantAndEquipment: null,
    miscellaneousService: null,
    cctvService: null
  });
  const [checkStatus, setCheckStatus] = useState('Open');
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [lastEngineerId, setLastEngineerId] = useState(null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const navigate = useNavigate();

  // NEW: Shared engineer list/selection behaviour copied from Air Conditioning.
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
    leadEngineerId: siteCheck?.leadUserID,
  });

  // NEW: Reset the common engineer/date fields when another Site Check opens.
  // A Done inspection is then restored from its saved inspection record.
  useEffect(() => {
    setLastEngineerId(null);

    setFormData((prev) => ({
      ...prev,
      engineer:
        siteCheck?.status === "Done"
          ? ""
          : (loggedInUserData?.id || ""),
      user:
        siteCheck?.status === "Done"
          ? {}
          : (loggedInUserData || {}),
      inspectionDate:
        siteCheck?.status === "Open"
          ? getUkLocalDate()
          : prev.inspectionDate,
      signedDate:
        siteCheck?.status === "Open"
          ? getUkLocalDate()
          : prev.signedDate,
    }));
  }, [
    checkId,
    authoritativeSiteId,
    siteCheck?.status,
    loggedInUserData?.id,
    loggedInUserData?.name,
  ]);

  // NEW: An Open check defaults to the logged-in engineer. A deliberate
  // selection is not replaced while the engineer works through the form.
  useEffect(() => {
    if (checkStatus !== "Open" || !loggedInUserData?.id) {
      return;
    }

    setFormData((prev) => {
      if (
        prev.engineer &&
        String(prev.engineer) !== String(loggedInUserData.id)
      ) {
        return prev;
      }

      const loggedInEngineer =
        engineerOptions.find(
          (user) => String(user.id) === String(loggedInUserData.id)
        ) || loggedInUserData;

      if (
        String(prev.engineer || "") === String(loggedInEngineer.id) &&
        prev.user?.name === loggedInEngineer.name
      ) {
        return prev;
      }

      return {
        ...prev,
        engineer: loggedInEngineer.id,
        user: loggedInEngineer,
      };
    });
  }, [
    checkId,
    checkStatus,
    loggedInUserData?.id,
    loggedInUserData?.name,
    engineerOptions,
  ]);

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

  const isInternalUserTaggedWithSite =
      (loggedInUserData?.userType === "Internal" || loggedInUserData?.userType === "External" ) &&
      loggedInUserData?.taggedSites?.some(
          (site) =>
            Number(site.id ?? site.siteId) === authoritativeSiteId
      );

  const selectedAsset = siteAssets.find(
      (asset) => String(asset.assetId) === String(formData.assetId)
  );

  const fetchInspectionData = async (siteCheckStatus = checkStatus) => {
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
        setLastEngineerId(mostRecentItem.engineer || null);

        const selectedInspectionAsset = siteAssets.find(
          (asset) =>
            String(asset.assetId) === String(mostRecentItem.assetId)
        );

        const clientUser = users.find(
          (user) => String(user.id) === String(mostRecentItem.client)
        );
        const engineerUser = users.find(
          (user) => String(user.id) === String(mostRecentItem.engineer)
        );
        const siteContactUser = users.find(
          (user) =>
            String(user.id) === String(mostRecentItem.siteContact)
        );

        let existingInspectionAction = null;
        if (mostRecentItem.actionId) {
          existingInspectionAction = await fetchActionById(
            mostRecentItem.actionId
          );
          if (existingInspectionAction) {
            setExistingAction(existingInspectionAction);
            setActionRaised(true);
          }
        }

        const isCurrentOpenInspection =
          siteCheckStatus === "Open" &&
          isCurrentUkInspectionDate(mostRecentItem.inspectionDate);

        const openInspectionEngineer = isCurrentOpenInspection
          ? (engineerUser || loggedInUserData || {})
          : (loggedInUserData || {});

        setFormData((prev) => ({
          ...prev,
          address: prev.address,
          assetId: mostRecentItem.assetId || prev.assetId,
          siteContact:
            mostRecentItem.siteContact || prev.siteContact,

          // OLD:
          // inspectionDate:
          //   mostRecentItem.inspectionDate || prev.inspectionDate,

          // NEW: Open uses today's UK date; Done uses the saved date.
          inspectionDate:
            siteCheckStatus === "Open"
              ? getUkLocalDate()
              : (mostRecentItem.inspectionDate || prev.inspectionDate),

          siteContactNo:
            mostRecentItem.siteContactNo || prev.siteContactNo,
          job: mostRecentItem.job || prev.job,
          report: mostRecentItem.report || prev.report,
          param1: mostRecentItem.param1 || prev.param1,
          param2: mostRecentItem.param2 || prev.param2,
          param3: mostRecentItem.param3 || prev.param3,
          param4: mostRecentItem.param4 || prev.param4,
          param5: mostRecentItem.param5 || prev.param5,
          param6: mostRecentItem.param6 || prev.param6,
          client: mostRecentItem.client || "",

          // OLD:
          // engineer:
          //   mostRecentItem.engineer ||
          //   prev.engineer ||
          //   loggedInUserData?.id,
          // user: engineerUser || loggedInUserData || prev.user,

          // NEW: Match Air Conditioning Open/Done engineer behaviour.
          engineer:
            siteCheckStatus === "Open"
              ? (
                  isCurrentOpenInspection
                    ? (
                        mostRecentItem.engineer ||
                        loggedInUserData?.id ||
                        ""
                      )
                    : (loggedInUserData?.id || "")
                )
              : (mostRecentItem.engineer || prev.engineer || ""),
          user:
            siteCheckStatus === "Open"
              ? openInspectionEngineer
              : (engineerUser || prev.user || {}),

          selectedAsset:
            selectedInspectionAsset || prev.selectedAsset,

          // OLD:
          // signedDate:
          //   mostRecentItem.signedDate || prev.signedDate,

          // NEW: Open uses today's UK date; Done uses the saved date.
          signedDate:
            siteCheckStatus === "Open"
              ? getUkLocalDate()
              : (mostRecentItem.signedDate || prev.signedDate),

          clientUser: clientUser || null,
          siteContactUser: siteContactUser || null,
          actionId: mostRecentItem.actionId || null,
        }));
      } else {
        setLastEngineerId(null);
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

  const fetchFolderStructure = async (siteId) => {
    try {
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);

      if (parentFoldersResponse?.parentFolders?.length > 0) {
        const logBooksFolder = parentFoldersResponse.parentFolders.find(
            folder => folder.name.trim() === '6 - Log Books'
        );

        if (logBooksFolder) {
          const logBooksResponse = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);

          if (logBooksResponse?.document?.childFolders) {
            const plantAndEquipmentFolder = logBooksResponse.document.childFolders.find(
                folder => folder.name.trim() === 'Electrical Management'
            );

            if (plantAndEquipmentFolder) {
              const plantAndEquipmentResponse = await get(
                  `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
              );

              if (plantAndEquipmentResponse?.document?.childFolders) {
                const miscellaneousFolder = plantAndEquipmentResponse.document.childFolders.find(
                    folder => folder.name.trim() === 'Security Systems'
                );

                if (miscellaneousFolder) {
                  const miscResponse = await get(
                      `/api/document/parent/${miscellaneousFolder.id}/folders?siteId=${siteId}`
                  );

                  if (miscResponse?.document?.childFolders) {
                    const cctvServiceFolder = miscResponse.document.childFolders.find(
                        folder => folder.name.trim() === 'CCTV Service & Maintenance'
                    );

                    setFolderIds({
                      logBooks: logBooksFolder.id,
                      plantAndEquipment: plantAndEquipmentFolder.id,
                      miscellaneousService: miscellaneousFolder.id,
                      cctvService: cctvServiceFolder?.id || null
                    });

                    console.log(logBooksFolder.id,plantAndEquipmentFolder.id, miscellaneousFolder.id, cctvServiceFolder.id);
                    console.log(cctvServiceFolder.id)
                    return cctvServiceFolder?.id || null;
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
    const applySiteCheckState = (loadedSiteCheck) => {
      if (!loadedSiteCheck) {
        return null;
      }

      setInspectionDetails(loadedSiteCheck);
      setCurrentCheckId(loadedSiteCheck.checkId);
      setCheckStatus(loadedSiteCheck.status);

      const isDone = loadedSiteCheck.status === "Done";
      setIsFormEditable(!isDone);
      setIsSubmitted(isDone);
      setShowPdfButton(isDone);

      return loadedSiteCheck;
    };

    const fetchSiteCheckData = async () => {
      try {
        // NEW: Prefer the exact Site Check already loaded by UpdateSiteCheck.
        if (
          siteCheck &&
          Number(siteCheck.checkId) === Number(checkId)
        ) {
          return applySiteCheckState(siteCheck);
        }

        /*
         * OLD BEHAVIOUR RETAINED AS A FALLBACK:
         * The component used to retrieve every Site Check for the globally
         * selected site and then search for checkId.
         */
        if (!authoritativeSiteId) return null;

        const response = await get(
          `/api/site-check/site/${authoritativeSiteId}`
        );

        const cctvCheck = checkId
          ? response?.find(
              (check) => Number(check.checkId) === Number(checkId)
            )
          : null;

        if (cctvCheck) {
          return applySiteCheckState(cctvCheck);
        }

        setCurrentCheckId(checkId ? parseInt(checkId, 10) : null);
        setIsFormEditable(true);
        setIsSubmitted(false);
        setShowPdfButton(false);
        return null;
      } catch (error) {
        console.error("Error fetching site check data:", error);
        toast.error("Failed to load site check status");
        setIsFormEditable(true);
        return null;
      }
    };

    const fetchData = async () => {
      setIsLoading(true);

      try {
        if (!authoritativeSiteId) {
          return;
        }

        // OLD:
        // await getSiteAssets(siteSelectedForGlobal?.siteId);
        // await getSiteDetailsById(siteSelectedForGlobal?.siteId);
        // await fetchFolderStructure(siteSelectedForGlobal.siteId);

        // NEW: Use the Site Check's own site.
        await getSiteAssets(authoritativeSiteId);
        await getSiteDetailsById(authoritativeSiteId);
        await fetchFolderStructure(authoritativeSiteId);

        const loadedSiteCheck = await fetchSiteCheckData();
        await fetchInspectionData(
          loadedSiteCheck?.status || checkStatus
        );

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
          (site) =>
            Number(site.siteId ?? site.id) === authoritativeSiteId
        );

        const selectedGlobalSiteId = Number(
          siteSelectedForGlobal?.siteId ?? siteSelectedForGlobal?.id
        );

        const siteData =
          currentSite ||
          (
            selectedGlobalSiteId === authoritativeSiteId
              ? siteSelectedForGlobal
              : null
          );

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
          setFormData((prev) => ({
            ...prev,
            address: fullAddress,
          }));

          if (siteData.siteContact) {
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
    siteCheck,
    checkId,
    authoritativeSiteId,
    siteSelectedForGlobal,
    getSiteAssets,
    getSiteDetailsById,
    users.length,
    isInternalUserTaggedWithSite,
    getUsers,
  ]);

  useEffect(() => {
    const shouldShowRiskAssessment = ["param3", "param4", "param5", "param6"].some(
        param => formData[param] === "Fail"
    );
    setShowRiskAssessment(shouldShowRiskAssessment);

    const isActionValid = existingAction && existingAction.checkId === currentCheckId;
    setActionRaised(isActionValid);
  }, [formData.param3, formData.param4, formData.param5, formData.param6, currentCheckId, existingAction]);

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
          param5: formData.param5,
          param6: formData.param6,

          client: formData.clientUser?.id || formData.client,
          engineer: formData.engineer,
          user: formData.user,
          selectedAsset: formData.selectedAsset,
          signedDate: formData.signedDate,
          clientUser: formData.clientUser,
          siteContactUser: formData.siteContactUser,
          actionId: verifiedAction.actionId,
          checkId: currentCheckId,
          siteId: authoritativeSiteId,
          type: 'Inspection',
          subType: 'CCTV',
          category: 'CCTV Service',
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
      ...(name === "inspectionDate" ? { signedDate: value } : {}),
    }));
  };

  // NEW: Save both the selected engineer ID and the complete user object.
  // The PDF reads the name from formData.user.
  const handleEngineerSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      engineer: newValue?.id || "",
      user: newValue || {},
    }));

    setValidationErrors((prev) => ({
      ...prev,
      engineer: "",
    }));
  };

    const calculateExpiryDate = (visitDate, repeatFrequency) =>
      calculateSiteCheckDueDate(visitDate, repeatFrequency);

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

  const handleAssetSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      assetId: newValue ? newValue.assetId : "",
      selectedAsset: newValue || null,
    }));
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

  const dateFormat = (date) => {
    return moment(date, 'YYYY-MM-DD').format('DD/MM/YYYY');
  }

  const uploadPdfToServer = async (
    pdfBlob,
    fileName,
    inspectionDateOverride
  ) => {
    try {
      setIsUploading(true);

      const inspectionDateForUpload =
        inspectionDateOverride || formData.inspectionDate;

      const savedLocally = await savePdfToLocal(pdfBlob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }

      const pdfFile = new File([pdfBlob], fileName, {
        type: 'application/pdf',
      });
      const targetFolderId =
        folderIds.cctvService || folderIds.logBooks;

      if (!targetFolderId) {
        throw new Error(
          'Could not determine target folder for PDF upload'
        );
      }

      const { exists, file: existingFile } =
        await checkFileExists(targetFolderId, fileName);

      /*
       * OLD CODE - COMMENTED FOR REVIEW
       *
       * const formData = new FormData();
       * issueDate: toJavaLocalDateTime(formData.inspectionDate)
       *
       * The local FormData variable hid the React formData state.
       */

      // NEW: Use a clearly named upload object and the exact UK date used
      // by the Site Check, inspection record and PDF.
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
            issueDate: toJavaLocalDateTime(
              inspectionDateForUpload
            ),
            expiryDate: toJavaLocalDateTime(
              calculateExpiryDate(
                inspectionDateForUpload,
                inspectionDetails?.repeatFrequency
              )
            ),
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `CCTV-${new Date().getTime()}`,
          }],
        };

        uploadFormData.append(
          'documentRequestString',
          JSON.stringify(documentRequestString)
        );

        const response = await axios({
          method: 'put',
          url: '/api/document/file/newVersion/upload',
          data: uploadFormData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
            'Accept': 'application/json',
          },
        });

        if (response.data) {
          toast.success(
            `PDF uploaded successfully as version ${documentRequestString.files[0].fileVersion}!`
          );
          return true;
        }
      } else {
        uploadFormData.append('files', pdfFile);

        const fileVersion = await getHighestFileVersion(
          targetFolderId,
          fileName
        );

        const documentRequestString = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            issueDate: toJavaLocalDateTime(
              inspectionDateForUpload
            ),
            expiryDate: toJavaLocalDateTime(
              calculateExpiryDate(
                inspectionDateForUpload,
                inspectionDetails?.repeatFrequency
              )
            ),
            note: 'CCTV Service Certificate',
            fileVersion,
            siteId: authoritativeSiteId || 0,
            originalFileName: fileName,
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `CCTV-${new Date().getTime()}`,
          }],
        };

        uploadFormData.append(
          'documentRequestString',
          JSON.stringify(documentRequestString)
        );

        const response = await axios({
          method: 'post',
          url: '/api/document/files/upload',
          data: uploadFormData,
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
          },
        });

        if (response.data) {
          toast.success(
            `PDF uploaded successfully as version ${fileVersion}!`
          );
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

  const generatePDF = async (
    uploadToServer = true,
    inspectionDateOverride
  ) => {
    try {
      setIsGeneratingPDF(true);

      if (!PDFLib) {
        PDFLib = await import('pdf-lib');
      }

      const pdfBytes = await fetchPdfTemplate();
      const pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      const helveticaFont = await pdfDoc.embedFont(PDFLib.StandardFonts.Helvetica);
      const form = pdfDoc.getForm();

      // Debug: Log all field names
      console.log('PDF Form Fields:');
      form.getFields().forEach((field, i) => {
        try {
          const name = field.getName();
          const type = field.constructor.name;
          console.log(`${i + 1}. ${name} (${type})`);
        } catch (error) {
          console.warn('Error getting field info:', error);
        }
      });

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
      const mediumFont = 10;
      const effectiveInspectionDate =
        inspectionDateOverride || formData.inspectionDate;

      // Address and contact information
      const addressLines = (formData.address || '').split(',');
      setTextField('Address',   addressLines[0] || '', smallFont);
      setTextField('Address_2', addressLines[1] || '', smallFont);
      setTextField('Address_3', addressLines[2] || '', smallFont);
      setTextField('Address_4', addressLines[3] || '', smallFont);

      // OLD:
      // setTextField('Date', dateFormat(formData.inspectionDate), smallFont);

      // NEW: Use the exact UK date used by the Open-to-Done submission.
      setTextField('Date', dateFormat(effectiveInspectionDate), smallFont);
      setTextField('Site Contact', formData.siteContactUser?.name || '', smallFont);
      setTextField('Site Contact No', formData.siteContactNo || '', smallFont);
      setTextField('Job No', formData.job || '', smallFont);

      const equipmentDetailsLocation = [
        selectedAsset.floor,
        selectedAsset.room,
        selectedAsset.position,
        selectedAsset.assetName
      ].filter(Boolean).join(' - ');

      // Equipment information
      setTextField('DVR Manufacturer', selectedAsset?.manufacturer || '', smallFont);
      setTextField('DVR Model Number', selectedAsset?.model || '', smallFont);
      setTextField('DVR Details', equipmentDetailsLocation, smallFont);

      // Test results
      setTextField('Job Complete', formData.param1 === 'Pass' ? 'Yes' : 'No', smallFont);
      setTextField('Parts Required', formData.param2 === 'Pass' ? 'Yes' : 'No', smallFont);
      setTextField('ImageCheck', formData.param3 === 'Pass' ? 'Pass' : 'Fail', smallFont);
      setTextField('LensesCleaned', formData.param4 === 'Pass' ? 'Pass' : 'Fail', smallFont);
      setTextField('DVRCheck', formData.param5 === 'Pass' ? 'Pass' : 'Fail', smallFont);
      setTextField('ElectricalCheck', formData.param6 === 'Pass' ? 'Pass' : 'Fail', smallFont);



      // Report
      setTextField('Engineers Report', formData.report || '', smallFont);

      // Signatures
      const clientName = formData.clientUser?.name || formData.client || '';
      const engineerName = formData.user?.name || '';

      setTextField('Clients Name', clientName, smallFont);
      setTextField('Engineers Name', engineerName, smallFont);
      // OLD:
      // setTextField('on', dateFormat(formData.signedDate), smallFont);
      // setTextField('on_2', dateFormat(formData.signedDate), smallFont);

      // NEW: Open submission uses today's UK date consistently.
      setTextField('on', dateFormat(formData.signedDate), smallFont);
      setTextField('on_2', dateFormat(formData.signedDate), smallFont);

      // Flatten and save
      form.flatten();
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const fileName = `CCTVServiceCertificate_${formData.selectedAsset?.assetName || 'report'}.pdf`;

      setGeneratedPdfBlob(blob);
      setShowPdfButton(true);

      if (uploadToServer) {
        await uploadPdfToServer(
          blob,
          fileName,
          effectiveInspectionDate
        );
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

  useEffect(() => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    if (isLoading) {
      console.log('Submit prevented: Already loading');
      return;
    }

    // Validation checks
    const hasFailures = [
      formData.param3,
      formData.param4,
      formData.param5,
      formData.param6
    ].some(val => val === "Fail");

    if (hasFailures && !actionRaised) {
      toast.error("Please complete the risk assessment before submitting");
      return;
    }

    if (!isFormEditable) {
      console.log('Submit prevented: Form is not editable');
      return;
    }

    const errors = {};

    // NEW: The engineer must be a valid option for this Site Check site.
    if (!formData.engineer || !selectedEngineer) {
      errors.engineer =
        "Please select an active engineer for this Site Check.";
    }

    if (!formData.param1) errors.param1 = "Please select one option";
    if (!formData.param2) errors.param2 = "Please select one option";
    if (!formData.param3) errors.param3 = "Please select one option";
    if (!formData.param4) errors.param4 = "Please select one option";
    if (!formData.param5) errors.param5 = "Please select one option";
    if (!formData.param6) errors.param6 = "Please select one option";

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);

      if (errors.engineer) {
        toast.error(errors.engineer);
      }

      return;
    }

    setValidationErrors({});
    setIsLoading(true);

    try {
      // NEW: Match Air Conditioning. An Open check is completed using
      // today's UK date rather than an older inspection record date.
      const submissionInspectionDate = formData.inspectionDate;
      const submissionSignedDate = formData.signedDate;

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

        // OLD:
        // subType: 'CCTV',
        // category: 'CCTV Service',

        // NEW: Preserve the values used by UpdateSiteCheck routing.
        subType: siteCheck?.subType || 'Intruder Alarm',
        category:
          siteCheck?.category || 'CCTV Servicing & Inspection',
        status: 'Done',

        // OLD:
        // startDate:
        //   new Date().toISOString().split('T')[0] + 'T00:00:00',
        // dueDate:
        //   formatLocalDateTime(
        //     calculateExpiryDate(
        //       formData.inspectionDate,
        //       inspectionDetails?.repeatFrequency
        //     )
        //   ),

        // NEW: Use one current UK date throughout the completed check.
        startDate: new Date().toISOString().split('T')[0] + 'T00:00:00',
        dueDate: toJavaLocalDateTime(
          calculateExpiryDate(
            submissionInspectionDate,
            inspectionDetails?.repeatFrequency
          )
        ),
        leadUserID: loggedInUserData?.id
          ? String(loggedInUserData.id)
          : '0',
        assistantUserID: loggedInUserData?.id
          ? String(loggedInUserData.id)
          : '0',
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

      const inspectionPayload = {
        ...formData,
        siteId: authoritativeSiteId,
        assetId: formData.selectedAsset?.assetId || formData.assetId,
        client: formData.clientUser?.id || formData.client,
        engineer: formData.engineer,

        // NEW: Explicitly save the UK submission date, not stale state.
        inspectionDate: toJavaLocalDate(submissionInspectionDate),
        signedDate: toJavaLocalDate(submissionSignedDate),

        siteContact: formData.siteContactUser?.id || formData.siteContact,
        type: 'Inspection',
        subType: 'CCTV',
        category: 'CCTV Service',
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

      const pdfResult = await generatePDF(
        true,
        submissionInspectionDate
      );
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      toast.success("CCTV Service report saved and PDF generated successfully!");
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
                  (site) =>
                    Number(site.id ?? site.siteId) === authoritativeSiteId
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
                  (site) =>
                    Number(site.id ?? site.siteId) === authoritativeSiteId
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

  const filteredAssets =
      siteAssets?.filter(
          (asset) => asset.category === "Electrical" && asset.subCategory === "CCTV"
      ) || [];

  return (
      <div className="container mt-4 mb-5">
        <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
          <h4 className="mb-0">CCTV Service Report</h4>
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
                <label className="form-label">Inspection Date</label>
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
                      value={selectedAsset}
                      onChange={handleAssetSelect}
                      renderInput={(params) => (
                          <TextField
                              {...params}
                              label="Select a CCTV Device"
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
                        <label className="form-label">DVR Manufacturer</label>
                        <input
                            type="text"
                            className="form-control"
                            name="manufacturer"
                            value={selectedAsset.manufacturer || ""}
                            onChange={handleInputChange}
                            required
                            disabled
                        />
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="mb-3">
                        <label className="form-label">DVR Model Number</label>
                        <input
                            type="text"
                            className="form-control"
                            name="model"
                            value={selectedAsset.model || ""}
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
                            value={selectedAsset.position || ""}
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
                            value={selectedAsset.floor || ""}
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
                            value={selectedAsset.room || ""}
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

          {popup.show && (
              <div
                  className="remark-popup"
                  style={{
                    position: "fixed",
                    left: `${popup.position.x}px`,
                    top: `${popup.position.y}px`,
                    transform: "translateY(-100%)",
                    zIndex: 1000,
                    maxWidth: "400px",
                    padding: "10px",
                    backgroundColor: "#fff",
                    border: "1px solid #ddd",
                    borderRadius: "4px",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    wordBreak: "break-word",
                  }}
              >
                {popup.content}
              </div>
          )}

          <div className="mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                  <tr>
                    <td>
                      <div className="mb-3">
                        <label className="form-label">Job Complete</label>
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
                      </div>
                    </td>
                    <td>
                      <div className="mb-3">
                        <label className="form-label">Parts Required</label>
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
                      </div>
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
                  <tr style={{ fontSize: "18px" }}>
                    <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "400px",
                        }}
                    >
                      Service Items Undertaken
                    </td>
                    <td
                        style={{
                          textAlign: "center",
                          fontWeight: "bold",
                          width: "400px",
                        }}
                    >

                    </td>
                  </tr>

                  <tr style={{ fontSize: "22px" }}>
                    <td>
                      <div className="mb-3">
                        <label className="form-label">
                          Image Quality Check
                        </label>
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
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                        {validationErrors.param3 && (
                            <div className="invalid-feedback">
                              {validationErrors.param3}
                            </div>
                        )}
                      </div>
                    </td>
                    <td>

                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="mb-3">
                        <label className="form-label">Lenses Cleaned</label>
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
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                        {validationErrors.param4 && (
                            <div className="invalid-feedback">
                              {validationErrors.param4}
                            </div>
                        )}
                      </div>
                    </td>
                    <td>

                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="mb-3">
                        <label className="form-label">
                          DVR Recording Check
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
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                        {validationErrors.param5 && (
                            <div className="invalid-feedback">
                              {validationErrors.param5}
                            </div>
                        )}
                      </div>
                    </td>
                    <td>

                    </td>
                  </tr>

                  <tr>
                    <td>
                      <div className="mb-3">
                        <label className="form-label">
                          Electrical Connection Check
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
                          <option value="Pass">Pass</option>
                          <option value="Fail">Fail</option>
                        </select>
                        {validationErrors.param6 && (
                            <div className="invalid-feedback">
                              {validationErrors.param6}
                            </div>
                        )}
                      </div>
                    </td>
                    <td>

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
                          desc={`Inspection - CCTV System Service`}
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
                <label className="form-label">Signed Date</label>
                <input
                    type="date"
                    className="form-control"
                    name="signedDate"
                    value={formatDate(formData.inspectionDate || formData.signedDate)}
                    readOnly
                    required
                    style={{
                      height: "40px",
                      padding: "0 10px",
                      width: "100%",
                      backgroundColor: "#f8f9fa",
                    }}
                />
              </div>
            </div>
            <div className="col-md-6">
              {/*
                =========================================================
                OLD ENGINEER FIELD - COMMENTED FOR REVIEW

                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Engineer's Name
                  </label>
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

                =========================================================
              */}

              {/* ======================================================
                  NEW SHARED ENGINEER CONTROL
                  MATCHES AIR CONDITIONING BEHAVIOUR
              ====================================================== */}
              <SiteCheckEngineerSelector
                options={engineerOptions}
                value={selectedEngineer}
                onChange={handleEngineerSelect}
                isOpen={checkStatus === "Open"}
                disabled={isSubmitted || !isFormEditable}
                loading={isLoadingEngineers}
                error={
                  validationErrors.engineer ||
                  engineerLoadError
                }
              />
              <SiteCheckEngineerSignature
                  engineer={selectedEngineer}
                  engineerId={formData.engineer || formData.user?.id}
                  fallbackSignature={formData.user?.signature || ""}
                  sasToken={sasToken}
              />
            </div>
          </div>

          <div className="mt-4 print-hide">
            {!isSubmitted ? (
                <div className="d-flex justify-content-between mt-3">
                  <SiteCheckBackButton />
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
                    Report submitted successfully on {getUkLocalDate()}
                  </div>
                </div>
            )}
          </div>
        {!isSubmitted && (
          <div className="d-flex justify-content-end print-hide">
            <SiteCheckDueSummary
              inspectionDate={formData.inspectionDate}
              repeatFrequency={siteCheck?.repeatFrequency || inspectionDetails?.repeatFrequency}
            />
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
  getSiteAssets,
  getSites,
  getUsers,
})(CctvAlarmCertificate);
