import React, { useState, useEffect, useCallback } from "react";
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
import {
  Autocomplete,
  TextField,
  CircularProgress,
  Button,
} from "@mui/material";
import { formatDate, formatLocalDateTime } from "../../../../utils/dateFormat";
import { saveAs } from "file-saver";
import axios from "axios";
import pdfTemplate from "./pdf/Chlorination Certificate.pdf";
import RiskScoreCard2 from "./RiskScoreCard2";
import { PDFDocument } from "pdf-lib";
import SiteCheckEngineerSelector from "./shared/SiteCheckEngineerSelector";
import useSiteCheckEngineers from "./shared/useSiteCheckEngineers";
import { getUkLocalDate, isCurrentUkInspectionDate } from "./shared/siteCheckDateUtils";

const WaterChlorinationCertificate = ({
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
  siteCheck = {},
}) => {
  const license = JSON.parse(localStorage.getItem("license"));


  // State initialization
  const [tankCapacity, setTankCapacity] = useState("");
  const getDefaultReportTemplate = (capacity) => `Carried out a clean and chlorination in line with Health & Safety HSE L8 and BS6700-2006 to the system described above from Cold Water Storage Tank distribution pipework through to all hot, cold and mixer water outlets through ought the building. The tank was thoroughly cleaned to remove bacteria and sterilised. A sterilant contact period of one (12) hour was allowed in order to comply. 
On completion of the contact period the tank and system was flushed and refiled with fresh incoming MCW and placed into service 
The capacity of the tank is ${capacity} litres`;

  const [formData, setFormData] = useState({
    site: "",
    clientAddress: license?.companyAddress || "",
    siteContact: "",
    date: getUkLocalDate(),
    siteContactNo: "",
    job: "",
    report: "" || getDefaultReportTemplate(tankCapacity),
    clientName: "",
    engineerName: loggedInUserData?.name || "",
    param5Remark: loggedInUserData?.signature || "",
    selectedAsset: null,
    clientDate: getUkLocalDate(),
    engineerDate: getUkLocalDate(),
    param1Remark: "", //sterilant: "",
    param2Remark: "", //neutralisingAgent: "",
    param3Remark: "", //contactPeriod: "",
    param4Remark: "", //finalSystemAnalysis: "",
    param6Remark: tankCapacity || "",
    param7Remark: "", //systemDescription: "",
    user: loggedInUserData || {},
    engineer: loggedInUserData?.id || "",
    clientUser: null,
    siteContactUser: null,
    actionId: null,
  });

  const [state, setState] = useState({
    isSubmitted: false,
    isLoading: false,
    isGeneratingPDF: false,
    isUploading: false,
    showPdfButton: false,
    checkStatus: "Open",
    isFormEditable: true,
    actionRaised: false,
    validationErrors: {},
    folderIds: {
      logBooks: null,
      plantAndEquipment: null,
      waterServices: null,
      chlorinationService: null,
    },
    currentCheckId: checkId || null,
    existingAction: null,
    generatedPdfBlob: null,
  });

  const sites = useSelector((state) => state.site.sites);
  const navigate = useNavigate();
  const isInternalUserTaggedWithSite = true;
  const [inspectionDetails, setInspectionDetails] = useState(null);

  // NEW: Use the actual Site Check for site/status selection.
  const authoritativeSiteId = siteCheck?.siteId
    ? Number(siteCheck.siteId)
    : Number(siteSelectedForGlobal?.siteId) || null;
  const effectiveCheckStatus = siteCheck?.status || state.checkStatus || "Open";
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
    status: effectiveCheckStatus,
    selectedEngineerId: formData.engineer,
    selectedEngineerUser: formData.user,
    lastEngineerId,
  });

  // NEW: Open checks always show today's UK date and default to logged-in engineer.
  useEffect(() => {
    if (effectiveCheckStatus !== "Open") return;

    setFormData((prev) => ({
      ...prev,
      date: getUkLocalDate(),
      clientDate: getUkLocalDate(),
      engineerDate: getUkLocalDate(),
      engineer: prev.engineer || loggedInUserData?.id || "",
      engineerName: prev.user?.id ? (prev.user.name || prev.engineerName) : (loggedInUserData?.name || ""),
      param5Remark: prev.user?.id ? (prev.user.signature || prev.param5Remark) : (loggedInUserData?.signature || ""),
      user: prev.user?.id ? prev.user : (loggedInUserData || {}),
    }));
  }, [effectiveCheckStatus, loggedInUserData?.id]);

  // Event handlers


  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  // API functions
  const fetchFolderStructure = useCallback(async (siteId) => {
    try {
      const parentFoldersResponse = await get(
        `/api/document/site/${siteId}/parent/folders`
      );

      const logBooksFolder = parentFoldersResponse?.parentFolders?.find(
        (folder) => folder.name.trim() === "6 - Log Books"
      );

      if (!logBooksFolder) return null;

      const logBooksResponse = await get(
        `/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`
      );
      const plantAndEquipmentFolder =
        logBooksResponse?.document?.childFolders?.find(
          (folder) => folder.name.trim() === "Water Log Book"
        );

      if (!plantAndEquipmentFolder) return null;

      const plantAndEquipmentResponse = await get(
        `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
      );
      const waterServicesFolder =
        plantAndEquipmentResponse?.document?.childFolders?.find(
          (folder) => folder.name.trim() === "Service & Maintenance"
        );

      if (!waterServicesFolder) return null;

      const waterResponse = await get(
        `/api/document/parent/${waterServicesFolder.id}/folders?siteId=${siteId}`
      );
      const chlorinationFolder = waterResponse?.document?.childFolders?.find(
        (folder) => folder.name.trim() === "Water : Water Tank Chlorination"
      );

      setState((prev) => ({
        ...prev,
        folderIds: {
          ...prev.folderIds,
          logBooks: logBooksFolder.id,
          plantAndEquipment: plantAndEquipmentFolder.id,
          waterServices: waterServicesFolder.id,
          chlorinationService: chlorinationFolder?.id || null,
        },
      }));
      console.log("Folder structure fetched successfully:", {
        logBooks: logBooksFolder.id,
        plantAndEquipment: plantAndEquipmentFolder.id,
        waterServices: waterServicesFolder.id,
        chlorinationService: chlorinationFolder?.id || null,
      });

      return chlorinationFolder?.id || null;
    } catch (error) {
      console.error("Error fetching folder structure:", error);
      toast.error("Failed to load document folders");
      return null;
    }
  }, []);

  const fetchActionById = useCallback(async (actionId) => {
    if (!actionId) return null;
    try {
      return await get(`/api/site/actions/id/${actionId}`);
    } catch (error) {
      console.error("Error fetching action:", error);
      return null;
    }
  }, []);

  const fetchExistingActions = useCallback(async () => {
    try {
      if (formData.actionId) {
        const action = await fetchActionById(formData.actionId);
        if (action?.checkId === state.currentCheckId) {
          setState((prev) => ({
            ...prev,
            existingAction: action,
            actionRaised: true,
          }));
          return;
        }
        setFormData((prev) => ({ ...prev, actionId: null }));
      }

      if (!authoritativeSiteId || !state.currentCheckId) return;

      const response = await get(
        `/api/site/actions/${authoritativeSiteId}`
      );
      const relevantActions = response?.filter(
        (action) => action.checkId === state.currentCheckId
      );

      if (relevantActions?.length > 0) {
        const mostRecentAction = relevantActions.sort(
          (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
        )[0];

        setState((prev) => ({
          ...prev,
          existingAction: mostRecentAction,
          actionRaised: true,
        }));
        setFormData((prev) => ({
          ...prev,
          actionId: mostRecentAction.actionId,
        }));
      }
    } catch (error) {
      console.error("Error fetching existing actions:", error);
    }
  }, [
    fetchActionById,
    formData.actionId,
    siteSelectedForGlobal,
    state.currentCheckId,
  ]);

  const fetchInspectionData = useCallback(async () => {
    try {
      if (!state.currentCheckId) return;

      // Fetch inspection data for this checkId
      const apiData = await get(`/api/site-check/generic-inspection/${state.currentCheckId}`);

      if (apiData && apiData.length > 0) {
        const mostRecentItem = apiData[apiData.length - 1];

        // Find related users
        const clientUser = users.find(user => String(user.id) === String(mostRecentItem.client));
        const siteContactUser = users.find(user => String(user.id) === String(mostRecentItem.siteContact));
        const savedEngineerId = mostRecentItem.engineer || null;
        setLastEngineerId(savedEngineerId);
        const engineerUser = users.find(user => String(user.id) === String(savedEngineerId));
        const isCurrentOpenInspection =
          effectiveCheckStatus === "Open" &&
          isCurrentUkInspectionDate(mostRecentItem.date);

        // Fetch action data if actionId exists
        let existingAction = null;
        if (mostRecentItem.actionId) {
          existingAction = await fetchActionById(mostRecentItem.actionId);
        }

        // Update form data with fetched values
        setFormData(prev => ({
          ...prev,
          site: mostRecentItem.site || prev.site,
          clientAddress: mostRecentItem.clientAddress || license?.companyAddress || "",
          siteContact: mostRecentItem.siteContact || prev.siteContact,
          date: effectiveCheckStatus === "Open" ? getUkLocalDate() : (mostRecentItem.date || prev.date),
          siteContactNo: mostRecentItem.siteContactNo || prev.siteContactNo,
          job: mostRecentItem.job || prev.job,
          report: mostRecentItem.report || getDefaultReportTemplate(mostRecentItem.param6Remark || tankCapacity),
          clientName: mostRecentItem.clientName || prev.clientName,
          engineerName: effectiveCheckStatus === "Open"
            ? (isCurrentOpenInspection ? (engineerUser?.name || mostRecentItem.engineerName || loggedInUserData?.name || "") : (loggedInUserData?.name || ""))
            : (engineerUser?.name || mostRecentItem.engineerName || prev.engineerName || ""),
          param5Remark: effectiveCheckStatus === "Open"
            ? (isCurrentOpenInspection ? (engineerUser?.signature || mostRecentItem.param5Remark || loggedInUserData?.signature || "") : (loggedInUserData?.signature || ""))
            : (engineerUser?.signature || mostRecentItem.param5Remark || prev.param5Remark || ""),
          param1Remark: mostRecentItem.param1Remark || prev.param1Remark,
          param2Remark: mostRecentItem.param2Remark || prev.param2Remark,
          param3Remark: mostRecentItem.param3Remark || prev.param3Remark,
          param4Remark: mostRecentItem.param4Remark || prev.param4Remark,
          param6Remark: mostRecentItem.param6Remark || tankCapacity,
          param7Remark: mostRecentItem.param7Remark || prev.param7Remark,
          engineer: effectiveCheckStatus === "Open"
            ? (isCurrentOpenInspection ? (savedEngineerId || loggedInUserData?.id || "") : (loggedInUserData?.id || ""))
            : (savedEngineerId || prev.engineer || ""),
          user: effectiveCheckStatus === "Open"
            ? (isCurrentOpenInspection ? (engineerUser || loggedInUserData || {}) : (loggedInUserData || {}))
            : (engineerUser || prev.user || {}),
          clientDate: effectiveCheckStatus === "Open" ? getUkLocalDate() : (mostRecentItem.clientDate || prev.clientDate),
          engineerDate: effectiveCheckStatus === "Open" ? getUkLocalDate() : (mostRecentItem.engineerDate || prev.engineerDate),
          clientUser: clientUser || null,
          siteContactUser: siteContactUser || null,
          actionId: mostRecentItem.actionId || null
        }));

        // Update state with action info
        setState(prev => ({
          ...prev,
          existingAction,
          actionRaised: !!existingAction
        }));
      }
    } catch (error) {
      console.error("Error fetching inspection data:", error);
      toast.error("Failed to load inspection data");
    }
  }, [state.currentCheckId, users, fetchActionById, loggedInUserData, tankCapacity, effectiveCheckStatus]);

  const fetchSiteCheckData = useCallback(async () => {
    try {
      if (!authoritativeSiteId) return;

      const response = await get(
        `/api/site-check/site/${authoritativeSiteId}`
      );
      const chlorinationCheck = checkId
        ? response?.find((check) => check.checkId === parseInt(checkId, 10))
        : null;


      if (chlorinationCheck) {
        const isDone = chlorinationCheck.status === "Done";
        setState((prev) => ({
          ...prev,
          currentCheckId: chlorinationCheck.checkId,
          checkStatus: chlorinationCheck.status,
          isFormEditable: !isDone,
          isSubmitted: isDone,
          showPdfButton: isDone,
        }));

        // Set inspection details here
        const inspectionDetails = {
          checkId: chlorinationCheck.checkId,
          siteId: chlorinationCheck.siteId,
          type: chlorinationCheck.type,
          subType: chlorinationCheck.subType,
          category: chlorinationCheck.category,
          dueDate: chlorinationCheck.dueDate,
          status: chlorinationCheck.status
        };
        console.log('Setting inspection details:', inspectionDetails);
        setInspectionDetails(inspectionDetails);
      } else {
        setState((prev) => ({
          ...prev,
          currentCheckId: checkId ? parseInt(checkId, 10) : null,
          isFormEditable: true,
          isSubmitted: false,
          showPdfButton: false,
        }));
      }
    } catch (error) {
      console.error("Error fetching site check data:", error);
      toast.error("Failed to load site check status");
      setState((prev) => ({ ...prev, isFormEditable: true }));
    }
  }, [checkId, authoritativeSiteId]);

  // PDF functions
  const fetchPdfTemplate = useCallback(async () => {
    try {
      const response = await fetch(pdfTemplate);
      if (!response.ok) {
        throw new Error("Failed to load PDF template: " + response.statusText);
      }

      const arrayBuffer = await response.arrayBuffer();
      const header = new Uint8Array(arrayBuffer, 0, 5);
      const headerStr = String.fromCharCode.apply(null, header);

      if (headerStr !== "%PDF-") {
        throw new Error("Invalid PDF file: Missing PDF header");
      }

      return arrayBuffer;
    } catch (error) {
      console.error("Error loading PDF template:", error);
      throw new Error("Failed to load PDF template: " + error.message);
    }
  }, []);

  const savePdfToLocal = useCallback(async (pdfBlob, fileName) => {
    try {
      const url = URL.createObjectURL(pdfBlob);
      const a = document.createElement("a");
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
      console.error("Error saving PDF locally:", error);
      return false;
    }
  }, []);

  const getHighestFileVersion = useCallback(
    async (folderId, fileName) => {
      try {
        const siteId = authoritativeSiteId;
        if (!siteId) return 1;

        const response = await get(
          `/api/document/parent/${folderId}/folders?siteId=${siteId}`
        );
        const files = response?.document?.files || [];
        const baseName = fileName.split(".")[0];
        const matchingFiles = files.filter((file) =>
          file.name?.startsWith(baseName)
        );

        return matchingFiles.length > 0
          ? Math.max(...matchingFiles.map((f) => f.fileVersion || 1)) + 1
          : 1;
      } catch (error) {
        console.error("Error checking file versions:", error);
        return 1;
      }
    },
    [authoritativeSiteId]
  );

  const checkFileExists = useCallback(
    async (folderId, fileName) => {
      try {
        const siteId = authoritativeSiteId;
        if (!siteId || !folderId) return { exists: false, file: null };

        const response = await get(
          `/api/document/parent/${folderId}/folders?siteId=${siteId}`
        );
        const files = response?.document?.files || [];
        const baseName = fileName.split(".")[0];
        const existingFile = files.find((file) =>
          file.name?.startsWith(baseName)
        );

        return {
          exists: !!existingFile,
          file: existingFile || null,
        };
      } catch (error) {
        console.error("Error checking file existence:", error);
        return { exists: false, file: null };
      }
    },
    [authoritativeSiteId]
  );

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

  const formatDateForBackend = (dateVal) => {
    if (!dateVal) return null;
    const d = new Date(dateVal);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  };

  const uploadPdfToServer = useCallback(
    async (pdfBlob, fileName, inspectionDateOverride = null) => {
      let exists;
      try {
        setState((prev) => ({ ...prev, isUploading: true }));

        // First save locally
        const savedLocally = await savePdfToLocal(pdfBlob, fileName);
        if (!savedLocally) {
          throw new Error("Failed to save PDF locally");
        }

        const targetFolderId = state.folderIds.chlorinationService || state.folderIds.logBooks;
        if (!targetFolderId) {
          throw new Error("Could not determine target folder for PDF upload");
        }

        // Check if file exists and get current version
        const fileCheck = await checkFileExists(targetFolderId, fileName);
        exists = fileCheck.exists;
        const existingFile = fileCheck.file;

        const fileVersion = exists && existingFile
          ? existingFile.fileVersion + 1
          : await getHighestFileVersion(targetFolderId, fileName);

        // Prepare form data with comprehensive metadata
        const uploadFormData = new FormData();
        uploadFormData.append(
          exists ? "file" : "files",
          new File([pdfBlob], fileName, { type: "application/pdf" })
        );

        // Add document metadata as JSON string
        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            ...(exists && existingFile ? { id: existingFile.id } : {}),
            name: fileName.split(".")[0],
            originalFileName: fileName,
            fileVersion,
            siteId: authoritativeSiteId || 0,
            issueDate: formatDateForBackend(inspectionDateOverride || formData.date),
            expiryDate: formatDateForBackend(calculateExpiryDate(inspectionDateOverride || formData.date, inspectionDetails?.repeatFrequency)),
            uploaderUserId: loggedInUserData?.id || 0,
            reviewerUserId: loggedInUserData?.id || 0,
            referenceNumber: `WTC-${new Date().getTime()}`
          }]
        };
        uploadFormData.append("documentRequestString", JSON.stringify(documentRequest));

        // Make API request
        const method = exists ? "put" : "post";
        const url = exists
          ? "/api/document/file/newVersion/upload"
          : "/api/document/files/upload";

        const response = await axios({
          method,
          url,
          data: uploadFormData,
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${localStorage.getItem("token")}`
          }
        });

        if (response.data) {
          toast.success(`PDF ${exists ? "updated" : "uploaded"} successfully as version ${fileVersion}!`);
          return true;
        }

        throw new Error("Upload failed: No response data");
      } catch (error) {
        console.error(`Error ${exists ? "updating" : "uploading"} PDF:`, error);
        toast.error(`Failed to ${exists ? "update" : "upload"} PDF`);
        return false;
      } finally {
        setState((prev) => ({ ...prev, isUploading: false }));
      }
    },
    [
      savePdfToLocal,
      checkFileExists,
      getHighestFileVersion,
      loggedInUserData,
      siteSelectedForGlobal,
      state.folderIds
    ]
  );

  //console.log('site data -->', formData.site);

  const handleTankCapacityChange = (e) => {
    const capacity = e.target.value;
    setTankCapacity(capacity);
    setFormData(prev => ({
      ...prev,
      param6Remark: capacity,
      report: getDefaultReportTemplate(capacity)
    }));
  };

  console.log('report template -->', formData.report);
  const generatePDF = useCallback(
    async (uploadToServer = true, inspectionDateOverride = null) => {
      try {
        setState((prev) => ({ ...prev, isGeneratingPDF: true }));

        const pdfBytes = await fetchPdfTemplate();
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const form = pdfDoc.getForm();

        const setTextField = (fieldName, value, fontSize = 10) => {
          try {
            const field = form.getTextField(fieldName);
            if (field) {
              field.setText(value || "");
              try {
                if (field.setFontSize) field.setFontSize(fontSize);
              } catch (e) {
                console.warn(`Could not set font size for ${fieldName}:`, e);
              }
            }
          } catch (error) {
            console.warn(`Error setting field ${fieldName}:`, error.message);
          }
        };

        // Format date as dd-mm-yyyy
        const formatDateString = (dateString) => {
          if (!dateString) return "";
          const date = new Date(dateString);
          return `${String(date.getDate()).padStart(2, "0")}-${String(
            date.getMonth() + 1
          ).padStart(2, "0")}-${date.getFullYear()}`;
        };

        const formattedDate = formatDateString(inspectionDateOverride || formData.date);
        const engineer = selectedEngineer || users?.find((u) => String(u.id) === String(formData.engineer));



        // Set form fields
        // const addressLines = (formData.address || "").split(",");
        // setTextField("Address", addressLines[0] || "", 8);
        // setTextField("Address_2", addressLines[1] || "", 8);
        // setTextField("Address_3", addressLines[2] || "", 8);
        // setTextField("Address_4", addressLines[3] || "", 8);

        setTextField("Date", formattedDate, 10);
        setTextField("client", license.companyAddress || "", 10);
        setTextField("site", formData.site || "", 10);
        setTextField("system", formData.param7Remark || "", 10);

        // Work details
        setTextField(
          "default", // Make sure this matches the exact field name in your PDF
          formData.report || getDefaultReportTemplate(formData.param6Remark || tankCapacity),
          10
        );

        // Chlorination details
        setTextField("Sterilant", formData.param1Remark || "", 10);
        setTextField(
          "Neutralising Agent",
          formData.param2Remark || "",
          10
        );
        setTextField("Contact Period", formData.param3Remark || "", 10);
        setTextField(
          "Final System Analysis",
          formData.param4Remark || "",
          10
        );

        // Signatures
        //setTextField("Client Name", formData.clientName || "", 10);
        setTextField(
          "Engineers Name",
          engineer?.name || formData.engineerName || "",
          10
        );

        //setTextField("Client Date", formatDateString(formData.clientDate), 10);
        // setTextField(
        //   "Engineer Date",
        //   formatDateString(formData.engineerDate),
        //   10
        // );

        if (engineer?.signature || formData.param5Remark) {
          try {
            const signatureBaseUrl = engineer?.signature || formData.param5Remark;
            const signatureUrl = `${signatureBaseUrl}?${sasToken}`;
            const signatureResponse = await fetch(signatureUrl);
            const signatureImageBytes = await signatureResponse.arrayBuffer();
            const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

            const signatureField = form.getButton('signature_af_image');
            if (signatureField) {
              signatureField.setImage(signatureImage);
            }
          } catch (error) {
            console.warn('Error setting signature image:', error);
          }
        }

        try {
          form.flatten();
        } catch (error) {
          console.warn("Error flattening form:", error.message);
        }

        const pdfBytesModified = await pdfDoc.save();
        const blob = new Blob([pdfBytesModified], { type: "application/pdf" });
        const fileName = `WaterChlorinationCertificate_${formattedDate}.pdf`;

        setState((prev) => ({ ...prev, generatedPdfBlob: blob }));

        let uploadedToServer = false;
        if (uploadToServer) {
          uploadedToServer = await uploadPdfToServer(blob, fileName, inspectionDateOverride || formData.date);
        }

        if (uploadedToServer || !uploadToServer) {
          toast.success("PDF generated successfully!");
          setState((prev) => ({ ...prev, showPdfButton: true }));
        }

        return { success: true, fileName };
      } catch (error) {
        console.error("Error generating PDF:", error);
        toast.error(
          "Failed to generate PDF: " + (error.message || "Unknown error")
        );
        return { success: false, error: error.message };
      } finally {
        setState((prev) => ({ ...prev, isGeneratingPDF: false }));
      }
    },
    [fetchPdfTemplate, formData, uploadPdfToServer, users]
  );

  // Main form submission handler
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (state.isLoading) return;

    const validationErrors = {};
    if (!formData.engineer || !selectedEngineer) {
      validationErrors.engineer = "Please select an active engineer for this Site Check.";
    }
    if (Object.keys(validationErrors).length > 0) {
      setState((prev) => ({ ...prev, validationErrors }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, validationErrors: {} }));

    try {
      const submissionInspectionDate =
        effectiveCheckStatus === "Open" ? getUkLocalDate() : formData.date;

      if (effectiveCheckStatus === "Open") {
        setFormData((prev) => ({
          ...prev,
          date: submissionInspectionDate,
          clientDate: submissionInspectionDate,
          engineerDate: submissionInspectionDate,
        }));
      }

      const finalReport = getDefaultReportTemplate(tankCapacity);
      const statusPayload = {
        siteId: parseInt(authoritativeSiteId, 10),
        type: siteCheck?.type || "Inspection",
        // OLD: Maintenance/Chlorination/Water Chlorination changed the UI route.
        // NEW: preserve the Site Check routing values.
        subType: siteCheck?.subType || "Legionella",
        category: siteCheck?.category || "Water - Storage System Chlorination",
        status: "Done",
        startDate: `${submissionInspectionDate}T00:00:00`,
        dueDate: formatLocalDateTime(calculateExpiryDate(submissionInspectionDate, inspectionDetails?.repeatFrequency)),
        leadUserID: String(loggedInUserData?.id || "0"),
        assistantUserID: String(loggedInUserData?.id || "0"),
      };

      let statusResponse;
      if (state.currentCheckId) {
        statusPayload.checkId = parseInt(state.currentCheckId, 10);
        statusResponse = await put(
          `/api/site-check/${state.currentCheckId}`,
          statusPayload
        );
      } else {
        statusResponse = await post(`/api/site-check`, statusPayload);
        if (statusResponse?.checkId) {
          setState(prev => ({
            ...prev,
            currentCheckId: statusResponse.checkId,
          }));
        }
      }

      const chlorinationPayload = {
        ...formData,
        siteId: authoritativeSiteId,
        assetId: '',
        report: finalReport,
        client: formData.clientUser?.id || formData.clientName,
        engineer: formData.engineer,
        engineerName: selectedEngineer?.name || formData.engineerName || "",
        param5Remark: selectedEngineer?.signature || formData.param5Remark || "",
        date: submissionInspectionDate,
        clientDate: submissionInspectionDate,
        engineerDate: submissionInspectionDate,
        siteContact: formData.siteContactUser?.id || formData.siteContact,
        type: "Maintenance",
        subType: "Chlorination",
        category: "Water Chlorination",
        checkId: state.currentCheckId || statusResponse?.checkId,
        actionId: formData.actionId || null,
      };

      // Determine whether to PUT or POST based on actionId presence
      if (state.currentCheckId && formData.actionId) {
        // If we have both checkId and actionId, do PUT (update existing)
        await put(
          `/api/site-check/generic-inspection/${state.currentCheckId}`,
          chlorinationPayload
        );
      } else {
        // Otherwise do POST (create new)
        await post(
          `/api/site-check/generic-inspection`,
          chlorinationPayload
        );
      }


      const pdfResult = await generatePDF(true, submissionInspectionDate);
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      toast.success("Water chlorination certificate saved successfully!");
      setState(prev => ({
        ...prev,
        showPdfButton: true,
        isSubmitted: true,
      }));

      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error(error.message || "Failed to submit form");
    } finally {
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        if (authoritativeSiteId) {
          await Promise.all([
            getSiteAssets(authoritativeSiteId),
            getSiteDetailsById(authoritativeSiteId),
            fetchFolderStructure(authoritativeSiteId),
            fetchSiteCheckData(),
            fetchInspectionData(),
          ]);

          if (isInternalUserTaggedWithSite && users.length === 0) {
            await getUsers();
          }

          const currentSite = sites.find(
            (site) => Number(site.siteId ?? site.id) === Number(authoritativeSiteId)
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
            setFormData((prev) => ({ ...prev, site: fullAddress }));
          }

          if (siteData?.siteContact) {
            setFormData((prev) => ({
              ...prev,
              siteContact: siteData.siteContact.name || "",
              siteContactNo: siteData.siteContact.phone || "",
            }));
          }

          if (formData.actionId) {
            const action = await fetchActionById(formData.actionId);
            if (action) {
              setState((prev) => ({
                ...prev,
                existingAction: action,
                actionRaised: true,
              }));
            } else {
              await fetchExistingActions();
            }
          } else {
            await fetchExistingActions();
          }
        }
      } catch (error) {
        console.error("Error fetching site data:", error);
        toast.error("Failed to load site details");
      } finally {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    fetchData();
  }, [
    fetchActionById,
    fetchExistingActions,
    fetchFolderStructure,
    fetchSiteCheckData,
    getSiteAssets,
    getSiteDetailsById,
    getUsers,
    isInternalUserTaggedWithSite,
    siteSelectedForGlobal,
    authoritativeSiteId,
    sites,
    users.length,
  ]);

  const handleRiskAssessmentComplete = async (actionResponse) => {
    try {
      if (!actionResponse?.actionId) {
        // No action was created, which is fine since it's optional
        return;
      }

      // Verify the action exists
      const verifiedAction = await fetchActionById(actionResponse.actionId);
      if (!verifiedAction) {
        throw new Error("Failed to verify created action");
      }

      // Update the action with checkId if we have one
      if (state.currentCheckId && !verifiedAction.checkId) {
        await put(`/api/site/actions/${verifiedAction.actionId}`, {
          ...verifiedAction,
          checkId: state.currentCheckId
        });
        verifiedAction.checkId = state.currentCheckId; // Update local copy
      }

      // Update all relevant states
      setState(prev => ({
        ...prev,
        existingAction: verifiedAction,
        actionRaised: true
      }));
      setFormData(prev => ({
        ...prev,
        actionId: verifiedAction.actionId
      }));

      // Save the inspection data with the actionId
      const inspectionPayload = {
        ...formData,
        siteId: authoritativeSiteId,
        engineer: formData.engineer,
        engineerName: selectedEngineer?.name || formData.engineerName || "",
        param5Remark: selectedEngineer?.signature || formData.param5Remark || "",
        date: getUkLocalDate(),
        clientDate: getUkLocalDate(),
        engineerDate: getUkLocalDate(),
        checkId: state.currentCheckId,
        actionId: verifiedAction.actionId,
        type: 'Maintenance',
        subType: 'Chlorination',
        category: 'Water Chlorination'
      };

      if (state.currentCheckId) {
        try {
          // Try to create first
          await post(`/api/site-check/generic-inspection`, inspectionPayload);
        } catch (error) {
          if (error.response?.status === 409) { // Conflict - already exists
            await put(`/api/site-check/generic-inspection/${state.currentCheckId}`, inspectionPayload);
          } else {
            throw error;
          }
        }
      }

      toast.success(`Action #${verifiedAction.actionId} successfully linked to inspection`);
    } catch (error) {
      console.error("Error handling risk assessment completion:", error);
      toast.error(error.message || "Failed to process action");
    }
  };

  // NEW: Shared engineer dropdown selection.
  const handleEngineerSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      engineer: newValue?.id || "",
      engineerName: newValue?.name || "",
      param5Remark: newValue?.signature || "",
      user: newValue || {},
    }));
    setState((prev) => ({
      ...prev,
      validationErrors: { ...prev.validationErrors, engineer: "" },
    }));
  };

  // Render functions


  return (
    <div className="container mt-4 mb-5">
      <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Water Chlorination Certificate</h4>
      </div>

      {!state.isFormEditable && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          This form is read-only because the check has been marked as completed.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="row mb-4">
          <div className="row">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3 d-flex flex-column">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Site
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="site"
                    value={formData.site || ""}
                    disabled
                    style={{
                      width: "100%",
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
              <div className="col-md-6">
                <div className="mb-3 d-flex flex-column">
                  <label className="form-label" style={{ fontWeight: "bold" }}>
                    Client Address
                  </label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="clientAddress"
                    value={formData.clientAddress || ""}
                    disabled
                    style={{
                      width: "100%",
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
                style={{ height: "40px", padding: "0 10px", width: "100%" }}
                disabled={state.isSubmitted}
              />
            </div>
          </div>
        </div>


        <div className="col-md-6">
          <div className="mb-3">
            <label className="form-label">Details of System</label>
            <input
              type="text"
              className="form-control"
              name="param7Remark"
              value={formData.param7Remark}
              onChange={handleInputChange}
              disabled={state.isSubmitted}
            />
          </div>
        </div>



        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Details of Work Carried Out</h5>
          </div>
          <div className="card-body">
            <div className="mb-3">
              <div className="row mb-3">
                <div className="col-md-3">
                  <label className="form-label">Tank Capacity (litres)</label>
                  <input
                    type="text"
                    className="form-control"
                    value={tankCapacity}
                    onChange={handleTankCapacityChange}
                    disabled={state.isSubmitted}
                  />
                </div>
              </div>
              <TextField
                multiline
                rows={16}
                fullWidth
                variant="outlined"
                value={formData.report || getDefaultReportTemplate(tankCapacity)}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    report: e.target.value,
                  })
                }
                style={{ height: "400px" }}
                disabled={state.isSubmitted}
              />
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Chlorination Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Sterilant</label>
                  <input
                    type="text"
                    className="form-control"
                    name="param1Remark"
                    value={formData.param1Remark}
                    onChange={handleInputChange}
                    disabled={state.isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Neutralising Agent</label>
                  <input
                    type="text"
                    className="form-control"
                    name="param2Remark"
                    value={formData.param2Remark}
                    onChange={handleInputChange}
                    disabled={state.isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Contact Period</label>
                  <input
                    type="text"
                    className="form-control"
                    name="param3Remark"
                    value={formData.param3Remark}
                    onChange={handleInputChange}
                    disabled={state.isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Final System Analysis</label>
                  <input
                    type="text"
                    className="form-control"
                    name="param4Remark"
                    value={formData.param4Remark}
                    onChange={handleInputChange}
                    disabled={state.isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="card mb-4">
          <div className="card-header d-flex justify-content-between align-items-center">
            <div>
              <h5 className="mb-0">Risk Assessment</h5>
              <small className="text-muted">
                (Optional - only complete if issues were found)
              </small>
            </div>
            {state.existingAction && (
              <span className="badge bg-success ms-2">
                Action #{state.existingAction.actionId} -{" "}
                {state.existingAction.status}
              </span>
            )}
          </div>
          <div className="card-body">
            {state.existingAction ? (
              <div className="existing-action">
                <div className="row">
                  <div className="col-md-6">
                    <p>
                      <strong>Observation:</strong>{" "}
                      {state.existingAction.observation}
                    </p>
                    <p>
                      <strong>Required Action:</strong>{" "}
                      {state.existingAction.requiredAction}
                    </p>
                    <p>
                      <strong>Risk Score:</strong>{" "}
                      {state.existingAction.riskScore}
                    </p>
                  </div>
                  <div className="col-md-6">
                    <p>
                      <strong>Description: </strong> {state.existingAction.desc}
                    </p>
                    <p>
                      <strong>Due Date:</strong>{" "}
                      {formatDate(state.existingAction.dueDate)}
                    </p>
                    <p>
                      <strong>Status:</strong> {state.existingAction.status}
                    </p>
                  </div>
                </div>
                {state.existingAction.comments && (
                  <div className="mt-3">
                    <h6>Comments:</h6>
                    <p>{state.existingAction.comments}</p>
                  </div>
                )}
              </div>
            ) : (
              <RiskScoreCard2
                desc={`Maintenance - Chlorination - Water Chlorination`}
                siteId={authoritativeSiteId}
                checkId={state.currentCheckId}
                createdBy={loggedInUserData?.id}
                taggedAsset={''}
                onRiskAssessmentComplete={handleRiskAssessmentComplete}
                actionRaised={state.actionRaised}
                disabled={state.isSubmitted}
                isOptional={true}
              />
            )}
          </div>
        </div>

        <div className="row mt-4">
          <div className="col-md-5">
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
              isOpen={effectiveCheckStatus === "Open"}
              disabled={state.isSubmitted || !state.isFormEditable}
              loading={isLoadingEngineers}
              error={state.validationErrors.engineer || engineerLoadError}
            />

          </div>
          <div className="col-md-2">
            <div className="mb-3">
              <label className="form-label">Signature</label>
              <br />
              <img
                width="200"
                height="50"
                style={{ border: "1px solid" }}
                src={(selectedEngineer?.signature || formData.param5Remark || "") + "?" + sasToken}
                alt="Engineer Signature"
              />
            </div>
          </div>
        </div>

        <div className="mt-4 print-hide">
          {!state.isSubmitted ? (
            <div className="d-flex justify-content-between mt-3">
              <Button
                variant="contained"
                color="secondary"
                onClick={() => window.history.back()}
              >
                Back
              </Button>
              <div>
                {state.isFormEditable && (
                  <Button
                    type="submit"
                    variant="contained"
                    color="primary"
                    disabled={
                      !state.isFormEditable ||
                      state.isLoading ||
                      state.isGeneratingPDF
                    }
                    startIcon={
                      state.isLoading ? <CircularProgress size={20} /> : null
                    }
                  >
                    {state.isLoading ? "Submitting..." : "Submit Certificate"}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center">
              <div className="alert alert-success mb-4">
                Certificate submitted successfully on{" "}
                {getUkLocalDate()}
              </div>
            </div>
          )}
        </div>
      </form>

      <style jsx>{`
        .is-invalid {
          border-color: #dc3545 !important;
        }
        .invalid-feedback {
          display: block;
          width: 100%;
          margin-top: 0.25rem;
          font-size: 0.875em;
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
})(WaterChlorinationCertificate);
