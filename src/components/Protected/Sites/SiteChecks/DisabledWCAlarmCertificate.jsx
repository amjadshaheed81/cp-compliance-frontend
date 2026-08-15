import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { get, post, put } from "../../../../api";
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
import pdfTemplate from './pdf/DisabledWCAlarmCertificate.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import axios from "axios";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import {
  getUkLocalDate,
  isCurrentUkInspectionDate,
  toJavaLocalDateTime,
  toJavaLocalDate,
} from "./shared/siteCheckDateUtils";

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

const DisabledWCAlarmCertificate = ({
                                      sasToken,
                                      checkId,
                                      subType,
                                      category,
                                      siteCheck,
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
    inspectionDate: getUkLocalDate(),
    siteContactNo: "",
    job: "",
    report: "",
    param1: "", // Pull Switch Check
    param2: "", // Reset Point Check
    param3: "", // Over Door Light Check
    param4: "", // Over Door Sounder Check
    param5: "", // Control Point / Intercom Check
    param6: "", // Pass/Fail Check
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
  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    plantAndEquipment: null,
    miscellaneousService: null,
    disabledWCAlarm: null
  });
  const [checkStatus, setCheckStatus] = useState('Open');
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [lastEngineerId, setLastEngineerId] = useState(null);
  const [showRiskAssessment, setShowRiskAssessment] = useState(false);
  const [actionRaised, setActionRaised] = useState(false);
  const [existingAction, setExistingAction] = useState(null);
  const [inspectionDetails, setInspectionDetails] = useState(null);
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

  const isInternalUserTaggedWithSite = true;

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

        const selectedAsset = siteAssets.find(
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

          selectedAsset: selectedAsset || prev.selectedAsset,

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
      // toast.error("Failed to load inspection data");
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
    (asset) => String(asset.assetId) === String(formData.assetId)
  );

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
      if (!authoritativeSiteId || !currentCheckId) return;

      const response = await get(`/api/site/actions/${authoritativeSiteId}`);
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
                folder => folder.name.trim() === 'Plant and Equipment'
            );

            if (plantAndEquipmentFolder) {
              const plantAndEquipmentResponse = await get(
                  `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
              );

              if (plantAndEquipmentResponse?.document?.childFolders) {
                const miscellaneousFolder = plantAndEquipmentResponse.document.childFolders.find(
                    folder => folder.name.trim() === 'Miscellaneous Service Documents'
                );

                if (miscellaneousFolder) {
                  const miscResponse = await get(
                      `/api/document/parent/${miscellaneousFolder.id}/folders?siteId=${siteId}`
                  );

                  if (miscResponse?.document?.childFolders) {
                    const disabledWCAlarmFolder = miscResponse.document.childFolders.find(
                        folder => folder.name.trim() === 'Disabled WC Alarm' ||
                            folder.name.trim() === 'Disabled WC Alarm Testing'
                    );

                    setFolderIds({
                      logBooks: logBooksFolder.id,
                      plantAndEquipment: plantAndEquipmentFolder.id,
                      miscellaneousService: miscellaneousFolder.id,
                      disabledWCAlarm: disabledWCAlarmFolder?.id || null
                    });

                    return disabledWCAlarmFolder?.id || null;
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

        const disabledWCCheck = checkId
          ? response?.find(
              (check) => Number(check.checkId) === Number(checkId)
            )
          : null;

        if (disabledWCCheck) {
          return applySiteCheckState(disabledWCCheck);
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
    const shouldShowRiskAssessment = formData.param6 === "Fail";
    setShowRiskAssessment(shouldShowRiskAssessment);

    // Update actionRaised state based on existing action
    const isActionValid = existingAction && existingAction.checkId === currentCheckId;
    setActionRaised(isActionValid);
  }, [formData.param6, currentCheckId, existingAction]);

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
          subType: 'Disabled WC Alarm',
          category: 'Disabled WC Alarm Certificate',
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
        folderIds.disabledWCAlarm || folderIds.logBooks;

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
            referenceNumber: `DWC-${new Date().getTime()}`,
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
            note: 'Disabled WC Alarm Certificate',
            fileVersion,
            siteId: authoritativeSiteId || 0,
            originalFileName: fileName,
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `DWC-${new Date().getTime()}`,
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
      setTextField('AddressLine1', addressLines[0] || '', smallFont);
      setTextField('AddressLine2', addressLines[1] || '', smallFont);
      setTextField('city', addressLines[2] || '', smallFont);
      setTextField('postalCode', addressLines[3] || '', smallFont);
      setTextField('country', addressLines[4] || '', smallFont);

      // OLD:
      // setTextField('Date', dateFormat(formData.inspectionDate), smallFont);

      // NEW: Use the exact UK date used by the Open-to-Done submission.
      setTextField('Date', dateFormat(effectiveInspectionDate), smallFont);
      setTextField('siteContact', formData.siteContactUser?.name || '', smallFont);
      setTextField('contactNo', formData.siteContactNo || '', smallFont);
      setTextField('jobNo', formData.job || '', smallFont);

      const equipmentDetailsLocation = [
        selectedAsset.floor,
        selectedAsset.room,
        selectedAsset.position,
        selectedAsset.assetName
      ].filter(Boolean).join(' - ');

      // Equipment information
      setTextField('Manufacturer', selectedAsset?.manufacturer || '', mediumFont);
      setTextField('Model Number', selectedAsset?.model || '', mediumFont);
      setTextField('Location', equipmentDetailsLocation, mediumFont);

      // Test results
      setTextField('PullSwitchCheck', formData.param1 === 'Pass' ? 'Yes' : 'No', mediumFont);
      setTextField('ResetPointCheck', formData.param2 === 'Pass' ? 'Yes' : 'No', mediumFont);
      setTextField('OverDoorCheck', formData.param3 === 'Pass' ? 'Yes' : 'No', mediumFont);
      setTextField('OverDoorSound', formData.param4 === 'Pass' ? 'Yes' : 'No', mediumFont);
      setTextField('ControlPointCheck', formData.param5 === 'Pass' ? 'Yes' : 'No', mediumFont);
      setTextField('PassFail', formData.param6 || '', mediumFont);

      // Report
      setTextField('EngineerReport', formData.report || '', mediumFont);

      // Signatures
      const clientName = formData.clientUser?.name || formData.client || '';
      const engineerName = formData.user?.name || '';

      setTextField('Clients Name', clientName, mediumFont);
      setTextField('Engineers Name', engineerName, mediumFont);
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
      const fileName = `DisabledWCAlarmCertificate_${formData.selectedAsset?.assetName || 'report'}.pdf`;

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');

    if (isLoading) {
      console.log('Submit prevented: Already loading');
      return;
    }

    const hasFailures = formData.param6 === "Fail";

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
          const inspections = await get(
            `/api/site-check/generic-inspection/${currentCheckId}`
          );
          existingInspection =
            inspections?.length > 0 ? inspections[0] : null;
        } catch (error) {
          console.error('Error checking for existing inspection:', error);
        }
      }

      const statusPayload = {
        siteId: parseInt(authoritativeSiteId, 10),
        type: siteCheck?.type || 'Inspection',

        // OLD:
        // subType: 'Plant and Equipment Inspection',
        // category: 'Disabled WC Alarm Certificate',

        // NEW: Preserve the values used by UpdateSiteCheck routing.
        subType: siteCheck?.subType || 'Electrical',
        category: siteCheck?.category || 'WC Alarm Testing',
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
        subType: 'Disabled WC Alarm',
        category: 'Disabled WC Alarm Certificate',
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

      const pdfResult = await generatePDF(
        true,
        submissionInspectionDate
      );
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      toast.success(
        "Disabled WC Alarm report saved and PDF generated successfully!"
      );
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
              asset.category === "Electrical" &&
              asset.subCategory === "Distress Alarm" &&
              asset.subCategory2 === "Disabled WC Alarm"
      ) || [];

  return (
      <div className="container mt-4 mb-5">
        <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
          <h4 className="mb-0">Disabled WC Alarm Certificate</h4>
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
                      Pull Switch Check
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Reset Point Check
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Over Door Light Check
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

          <div className="mb-4">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-bordered">
                  <tbody>
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Over Door Sounder Check
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Control Point / Intercom Check
                    </td>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Pass/Fail
                    </td>
                  </tr>
                  <tr>
                    <td>
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
                    <td>
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
                    </td>
                    <td>
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
                          desc={`Inspection - Electrical - Disabled WC Alarm Inspection`}
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
})(DisabledWCAlarmCertificate);