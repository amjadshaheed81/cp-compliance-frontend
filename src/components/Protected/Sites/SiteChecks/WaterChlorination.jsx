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
import { formatDate } from "../../../../utils/dateFormat";
import { saveAs } from "file-saver";
import axios from "axios";
import pdfTemplate from "./pdf/Chlorination Certificate.pdf";
import RiskScoreCard2 from "./RiskScoreCard2";
import { PDFDocument } from "pdf-lib";

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
}) => {
  const license = JSON.parse(localStorage.getItem("license"));
  

  // State initialization
  const [tankCapacity, setTankCapacity] = useState("");
  const [formData, setFormData] = useState({
    site: "",
    clientAddress: license?.companyAddress || "",
    siteContact: "",
    date: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    job: "",
    report: "",
    clientName: "",
    engineerName: loggedInUserData?.name || "",
    param5Remark: loggedInUserData?.signature || "",
    selectedAsset: null,
    clientDate: new Date().toISOString().split("T")[0],
    engineerDate: new Date().toISOString().split("T")[0],
    param1Remark: "", //sterilant: "",
    param2Remark: "", //neutralisingAgent: "",
    param3Remark: "", //contactPeriod: "",
    param4Remark: "", //finalSystemAnalysis: "",
    param6Remark: tankCapacity || "",
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



  const defaultReportTemplate = `Carried out a clean and chlorination in line with Health & Safety HSE L8 and BS6700-2006 to the system described above from Cold Water Storage Tank distribution pipework through to all hot, cold and mixer water outlets through ought the building. The tank was thoroughly cleaned to remove bacteria and sterilised. A sterilant contact period of one (12) hour was allowed in order to comply. 
On completion of the contact period the tank and system was flushed and refiled with fresh incoming MCW and placed into service 
The capacity of the tank is ${tankCapacity} litres`;
  
  
  
  // Memoized values
  const selectedAsset = React.useMemo(
    () => siteAssets.find((asset) => asset.assetId === formData.assetId),
    [siteAssets, formData.assetId]
  );

  const filteredAssets = React.useMemo(
    () =>
      siteAssets?.filter(
        (asset) =>
          asset.category === "Mechanical" &&
          asset.subCategory === "Water Services"
      ) || [],
    [siteAssets]
  );

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
        (folder) => folder.name.trim() === "Log Books"
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
        (folder) => folder.name.trim() === "Storage Tank Chlorination"
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

      if (!siteSelectedForGlobal?.siteId || !state.currentCheckId) return;

      const response = await get(
        `/api/site/actions/${siteSelectedForGlobal.siteId}`
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

  const fetchSiteCheckData = useCallback(async () => {
    try {
      if (!siteSelectedForGlobal?.siteId) return;

      const response = await get(
        `/api/site-check/site/${siteSelectedForGlobal.siteId}`
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
  }, [checkId, siteSelectedForGlobal]);

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
        const siteId = siteSelectedForGlobal?.siteId;
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
    [siteSelectedForGlobal]
  );

  const checkFileExists = useCallback(
    async (folderId, fileName) => {
      try {
        const siteId = siteSelectedForGlobal?.siteId;
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
    [siteSelectedForGlobal]
  );

  const uploadPdfToServer = useCallback(
    async (pdfBlob, fileName) => {
      try {
        setState((prev) => ({ ...prev, isUploading: true }));

        // First save locally
        const savedLocally = await savePdfToLocal(pdfBlob, fileName);
        if (!savedLocally) {
          throw new Error("Failed to save PDF locally");
        }

        const targetFolderId =
          state.folderIds.chlorinationService || state.folderIds.logBooks;
        if (!targetFolderId) {
          throw new Error("Could not determine target folder for PDF upload");
        }

        const version = await getHighestFileVersion(targetFolderId, fileName);
        const fileExists = await checkFileExists(targetFolderId, fileName);

        const formData = new FormData();
        formData.append("file", pdfBlob, fileName);
        formData.append("siteId", siteSelectedForGlobal.siteId);
        formData.append("parentId", targetFolderId);
        formData.append("fileVersion", version);
        formData.append("createdBy", loggedInUserData.id);
        formData.append("modifiedBy", loggedInUserData.id);

        if (fileExists.exists) {
          await put(`/api/document/${fileExists.file.id}`, formData);
        } else {
          await post("/api/document", formData);
        }

        return true;
      } catch (error) {
        console.error("Error uploading PDF:", error);
        return false;
      } finally {
        setState((prev) => ({ ...prev, isUploading: false }));
      }
    },
    [savePdfToLocal, state.folderIds, siteSelectedForGlobal, loggedInUserData]
  );

  console.log('clientAddress', formData.clientAddress);
  const generatePDF = useCallback(
    async (uploadToServer = true) => {
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

        const formattedDate = formatDateString(formData.date);
        const engineer = users?.find((u) => u.id === formData.engineer);

        const setMultilineTextField = (baseFieldName, text) => {
        if (!text) return;
        
        const lines = text.split('\n');
        for (let i = 0; i < lines.length; i++) {
          const fieldName = `${baseFieldName}${i > 0 ? `_${i + 1}` : ''}`;
          try {
            const field = form.getTextField(fieldName);
            if (field) {
              field.setText(lines[i] || "");
              if (field.setFontSize) field.setFontSize(8);
            }
          } catch (error) {
            console.warn(`Error setting field ${fieldName}:`, error.message);
          }
        }
      };

        // Set form fields
        // const addressLines = (formData.address || "").split(",");
        // setTextField("Address", addressLines[0] || "", 8);
        // setTextField("Address_2", addressLines[1] || "", 8);
        // setTextField("Address_3", addressLines[2] || "", 8);
        // setTextField("Address_4", addressLines[3] || "", 8);

        setTextField("Date", formattedDate, 8);
        setMultilineTextField("Client", license.companyAddress || "", 8);
        setTextField("Site", formData.site || "", 8);
        

        // Work details
        setTextField(
          "default",
          formData.report || "",
          8
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

        if (loggedInUserData?.signature) {
        try {
          const signatureUrl = `${loggedInUserData.signature}?${sasToken}`;
          const signatureResponse = await fetch(signatureUrl);
          const signatureImageBytes = await signatureResponse.arrayBuffer();
          const signatureImage = await pdfDoc.embedPng(signatureImageBytes);

          const signatureField = form.getButton('Signature_af_image');
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
          uploadedToServer = await uploadPdfToServer(blob, fileName);
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

    setState((prev) => ({ ...prev, isLoading: true }));

    try {

      const finalReport = defaultReportTemplate.replace('${tankCapacity}', tankCapacity);
      const statusPayload = {
        siteId: parseInt(siteSelectedForGlobal?.siteId, 10),
        type: "Maintenance",
        subType: "Chlorination",
        category: "Water Chlorination",
        status: "Done",
        startDate: new Date().toISOString().split("T")[0] + "T00:00:00",
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
          setState((prev) => ({
            ...prev,
            currentCheckId: statusResponse.checkId,
          }));
        }
      }

      const chlorinationPayload = {
        ...formData,
        siteId: siteSelectedForGlobal?.siteId,
        assetId: '',
        report: finalReport,
        client: formData.clientUser?.id || formData.clientName,
        engineer: formData.engineer,
        siteContact: formData.siteContactUser?.id || formData.siteContact,
        type: "Maintenance",
        subType: "Chlorination",
        category: "Water Chlorination",
        checkId: state.currentCheckId || statusResponse?.checkId,
        actionId: formData.actionId || null,
      };

      if (state.currentCheckId && formData.actionId) {
        await put(
          `/api/site-check/generic-inspection/${state.currentCheckId}`,
          chlorinationPayload
        );
      } else {
        await post(`/api/site-check/generic-inspection`, chlorinationPayload);
      }

      const pdfResult = await generatePDF(true);
      if (!pdfResult.success) {
        throw new Error(pdfResult.error || "Failed to generate PDF");
      }

      toast.success("Water chlorination certificate saved successfully!");
      setState((prev) => ({
        ...prev,
        showPdfButton: true,
        isSubmitted: true,
      }));

      setTimeout(() => navigate(-1), 1500);
    } catch (error) {
      console.error("Error in form submission:", error);
      toast.error(error.message || "Failed to submit form");
    } finally {
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  // Initial data loading
  useEffect(() => {
    const fetchData = async () => {
      setState((prev) => ({ ...prev, isLoading: true }));
      try {
        if (siteSelectedForGlobal?.siteId) {
          await Promise.all([
            getSiteAssets(siteSelectedForGlobal.siteId),
            getSiteDetailsById(siteSelectedForGlobal.siteId),
            fetchFolderStructure(siteSelectedForGlobal.siteId),
            fetchSiteCheckData(),
          ]);

          if (isInternalUserTaggedWithSite && users.length === 0) {
            await getUsers();
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
            setFormData((prev) => ({ ...prev, site: fullAddress }));
          }

          if (siteSelectedForGlobal.siteContact) {
            setFormData((prev) => ({
              ...prev,
              siteContact: siteSelectedForGlobal.siteContact.name || "",
              siteContactNo: siteSelectedForGlobal.siteContact.phone || "",
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
    sites,
    users.length,
  ]);

  const handleRiskAssessmentComplete = useCallback(
    async (actionResponse) => {
      try {
        if (!actionResponse?.actionId) {
          return;
        }

        const verifiedAction = await fetchActionById(actionResponse.actionId);
        if (!verifiedAction) {
          throw new Error("Action verification failed");
        }

        setState((prev) => ({
          ...prev,
          existingAction: verifiedAction,
          actionRaised: true,
        }));

        setFormData((prev) => ({
          ...prev,
          actionId: verifiedAction.actionId,
        }));

        if (state.currentCheckId) {
          const inspectionPayload = {
            ...formData,
            actionId: verifiedAction.actionId,
          };

          if (state.currentCheckId) {
            await put(
              `/api/site-check/generic-inspection/${state.currentCheckId}`,
              inspectionPayload
            );
          }
        }

        toast.success(
          `Action #${verifiedAction.actionId} successfully linked to inspection`
        );
      } catch (error) {
        console.error("Error handling risk assessment completion:", error);
        if (error.message !== "No action was created") {
          toast.error(error.message || "Failed to process action");
        }
      }
    },
    [fetchActionById, formData, state.currentCheckId]
  );

  // Render functions
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
              clientName: newValue?.name || "",
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
              disabled={state.isSubmitted}
              style={{ height: "40px" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                  padding: "0 5px",
                },
              }}
            />
          )}
          disabled={state.isSubmitted}
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
            clientName: e.target.value,
            clientUser: { name: e.target.value },
            siteContact: e.target.value,
            siteContactUser: { name: e.target.value },
          }));
        }}
        required
        disabled={state.isSubmitted}
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
              clientName: newValue?.name || "",
              clientUser: newValue || null,
            }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              required
              disabled={state.isSubmitted}
              style={{ height: "40px" }}
              sx={{
                "& .MuiOutlinedInput-root": {
                  height: "40px",
                  padding: "0 5px",
                },
              }}
            />
          )}
          disabled={state.isSubmitted}
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
            siteContactUser: { name: e.target.value },
            clientName: e.target.value,
            clientUser: { name: e.target.value },
          }));
        }}
        required
        disabled={state.isSubmitted}
      />
    );
  };

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
            onChange={(e) => setTankCapacity(e.target.value)}
            disabled={state.isSubmitted}
          />
        </div>
      </div>
      <TextField
        multiline
        rows={16}
        fullWidth
        variant="outlined"
        value={formData.report || defaultReportTemplate}
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
                siteId={siteSelectedForGlobal?.siteId}
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
       
          </div>
          <div className="col-md-2">
            <div className="mb-3">
              <label className="form-label">Signature</label>
              <br />
              <img
                width="200"
                height="50"
                style={{ border: "1px solid" }}
                src={loggedInUserData?.signature + "?" + sasToken}
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
                {new Date().toISOString().split("T")[0]}
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
