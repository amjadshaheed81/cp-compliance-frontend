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
import { formatDate } from "../../../../utils/dateFormat";
import { v4 as uuidv4 } from 'uuid';
import pdfTemplate from './pdf/GasSafety.pdf';
import RiskScoreCard from "./RiskScoreCard";
import moment from "moment";
import axios from "axios";
import { useNavigate } from "react-router-dom";

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
    return arrayBuffer;
  } catch (error) {
    console.error('Error loading PDF template:', error);
    throw new Error('Failed to load PDF template: ' + error.message);
  }
};

const GasSafetyRecord = ({
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
}) => {
  const license = JSON.parse(localStorage.getItem("license"));
  const [sasToken, setSasToken] = useState('');
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    ref: "",
    gasSafeRegNo: "",
    serialNo: "",

    // Registered Business Details
    registeredBusinessName: "",
    registeredBusinessAddress: "",
    registeredBusinessPostcode: "",
    registeredBusinessContact: "",

    // Landlord/Homeowner Details
    landlordName: "",
    landlordAddress: "",
    landlordPostcode: "",
    landlordContact: "",

    // Site Details
    siteName: "",
    siteAddress: "",
    sitePostcode: "",
    siteContact: "",

    // Appliance Details
    applianceLocation: "",
    applianceType: "",
    applianceManufacturer: "",
    applianceModel: "",
    applianceOwnedByLandlord: "Yes",
    applianceInspected: "Yes",
    flueType: "",

    // Inspection Details
    operatingPressure: "",
    safetyDevicesOperating: "Yes",
    ventilationSatisfactory: "Yes",
    flueVisualCondition: "Pass",
    flueOperationChecks: "Pass",
    combustionAnalyserReading: "",
    applianceServiced: "Yes",
    applianceSafeToUse: "Yes",

    // Final Check Results
    gasTightnessTest: "Pass",
    protectiveBonding: "Yes",
    emergencyControlAccessible: "Yes",
    pipeworkVisualInspection: "Yes",
    coAlarmFitted: "Yes",
    fireAlarmFitted: "Yes",

    // Combustion Performance Readings
    combustionLowCO: "",
    combustionLowCO2: "",
    combustionLowRatio: "",
    combustionHighCO: "",
    combustionHighCO2: "",
    combustionHighRatio: "",

    // Signatures
    engineerName: loggedInUserData?.name || "",
    engineerSignatureDate: new Date().toISOString().split("T")[0],
    receivedByName: "",
    receivedByPosition: "",
    receivedByDate: new Date().toISOString().split("T")[0],

    nextInspectionDue: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split("T")[0],
    actionId: null
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [currentCheckId, setCurrentCheckId] = useState(checkId || null);
  const [isFormEditable, setIsFormEditable] = useState(true);
  const [existingAction, setExistingAction] = useState(null);

  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    gasSafety: null,
    gasRecords: null
  });

  const isInternalUserTaggedWithSite = loggedInUserData?.taggedSites?.some(
    (site) => site.id === siteSelectedForGlobal?.siteId
  );

  const isGasEngineer = (loggedInUserData?.userType === "External" && loggedInUserData.trade === "Gas Engineer");

  useEffect(() => {
    const fetchToken = async () => {
      try {
        const token = await getSasToken();
        setSasToken(token);
      } catch (error) {
        console.error('Failed to fetch SAS token:', error);
      }
    };

    fetchToken();
  }, []);

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

  useEffect(() => {
    const fetchInspectionData = async () => {
      try {
        if (!checkId) return;

        if (isInternalUserTaggedWithSite && users.length === 0) {
          await getUsers();
        }

        const apiData = await get(`/api/site-check/gas-safety-record/${checkId}`);
        if (apiData && apiData.length > 0) {
          const mostRecentItem = apiData[0];
          setFormData(mostRecentItem);

          if (mostRecentItem.actionId) {
            const action = await fetchActionById(mostRecentItem.actionId);
            setExistingAction(action);
          }
        }
      } catch (error) {
        console.error("Error fetching inspection data:", error);
        toast.error("Failed to load inspection data");
      }
    };

    fetchInspectionData();
  }, [checkId, users, sasToken]);

  useEffect(() => {
    const fetchData = async () => {
      if (!siteSelectedForGlobal?.siteId) {
        return;
      }

      try {
        const fullSiteData = await get(`/api/site/site/${siteSelectedForGlobal.siteId}`);

        // Set site details in form
        setFormData(prev => ({
          ...prev,
          siteName: fullSiteData.siteName || "",
          siteAddress: [
            fullSiteData.address1,
            fullSiteData.address2,
            fullSiteData.city,
            fullSiteData.area
          ].filter(part => part && part.trim() !== '').join(", "),
          sitePostcode: fullSiteData.postCode || "",
          siteContact: fullSiteData.siteContact || ""
        }));

        // Set engineer details from logged in user
        if (loggedInUserData) {
          setFormData(prev => ({
            ...prev,
            registeredBusinessName: loggedInUserData.companyName || "",
            registeredBusinessAddress: loggedInUserData.companyAddress || "",
            registeredBusinessPostcode: loggedInUserData.companyPostcode || "",
            registeredBusinessContact: loggedInUserData.phone || "",
            gasSafeRegNo: loggedInUserData.gasSafeRegNo || ""
          }));
        }

        await fetchFolderStructure(siteSelectedForGlobal.siteId);
      } catch (error) {
        console.error('Error fetching site details:', error);
        toast.error('Failed to load site details');
      }
    };

    fetchData();
  }, [siteSelectedForGlobal?.siteId, loggedInUserData]);

  const fetchFolderStructure = async (siteId) => {
    try {
      const parentFoldersResponse = await get(`/api/document/site/${siteId}/parent/folders`);
      if (!parentFoldersResponse?.parentFolders) {
        throw new Error('No parent folders found');
      }

      const logBooksFolder = parentFoldersResponse.parentFolders.find(
        f => f.name.trim() === 'Log Books'
      );
      if (!logBooksFolder) throw new Error('Log Books folder not found');

      const logBooksChildren = await get(`/api/document/parent/${logBooksFolder.id}/folders?siteId=${siteId}`);
      const gasSafetyFolder = logBooksChildren?.document?.childFolders?.find(
        f => f.name.trim() === 'Gas Safety'
      );
      if (!gasSafetyFolder) throw new Error('Gas Safety folder not found');

      const gasSafetyChildren = await get(`/api/document/parent/${gasSafetyFolder.id}/folders?siteId=${siteId}`);
      const gasRecordsFolder = gasSafetyChildren?.document?.childFolders?.find(
        f => f.name.trim() === 'Gas Safety Records'
      );

      const newFolderIds = {
        logBooks: logBooksFolder.id,
        gasSafety: gasSafetyFolder.id,
        gasRecords: gasRecordsFolder?.id || null
      };

      setFolderIds(newFolderIds);
      return newFolderIds.gasRecords;

    } catch (error) {
      console.error('Folder structure error:', error);
      toast.error('Failed to load document folders');
      return null;
    }
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
        return Math.max(...versions) + 1;
      }
      return 1;
    } catch (error) {
      console.error('Error checking file versions:', error);
      return 1;
    }
  };

  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);
      await savePdfToLocal(pdfBlob, fileName);

      const targetFolderId = folderIds.boilerService || await fetchFolderStructure(siteSelectedForGlobal?.siteId);
      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }

      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      const formData = new FormData();

      const { exists, file: existingFile } = await checkFileExists(targetFolderId, fileName);

      if (exists && existingFile) {
        formData.append('file', pdfFile);
        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            id: existingFile.id,
            name: fileName,
            originalFileName: fileName,
            fileVersion: existingFile.fileVersion + 1,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `GBS-${new Date().getTime()}`
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
        formData.append('files', pdfFile);
        const fileVersion = await getHighestFileVersion(targetFolderId, fileName);

        const documentRequest = {
          folderId: targetFolderId,
          files: [{
            name: fileName.split('.')[0],
            originalFileName: fileName,
            fileVersion: fileVersion,
            siteId: siteSelectedForGlobal?.siteId,
            issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
            expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().replace('T', ' ').split('.')[0],
            uploaderUserId: loggedInUserData?.id,
            reviewerUserId: loggedInUserData?.id,
            referenceNumber: `GBS-${new Date().getTime()}`
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
      throw new Error('Upload failed: No response data');
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF: ' + error.message);
      return false;
    } finally {
      setIsUploading(false);
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

      const setTextField = (fieldName, value, fontSize = 8) => {
        try {
          const field = form.getTextField(fieldName);
          if (field) {
            field.setText(value || '');
            if (field.setFontSize) {
              field.setFontSize(fontSize);
            }
          }
        } catch (error) {
          console.warn(`Error setting field ${fieldName}:`, error.message);
        }
      };

      const setCheckbox = (fieldName, isChecked) => {
        try {
          const field = form.getCheckBox(fieldName);
          if (field) {
            isChecked ? field.check() : field.uncheck();
          }
        } catch (error) {
          console.warn(`Error setting checkbox ${fieldName}:`, error);
        }
      };

      // Set form data in PDF
      setTextField('Date', formatDate(formData.date));
      setTextField('Ref', formData.ref || '');
      setTextField('Gas Safe Reg No', formData.gasSafeRegNo || '');
      setTextField('Serial no', formData.serialNo || '');

      // Registered Business Details
      setTextField('Name', formData.registeredBusinessName || '');
      const businessAddressLines = (formData.registeredBusinessAddress || '').split(',');
      setTextField('Address', businessAddressLines[0] || '');
      setTextField('Address_2', businessAddressLines[1] || '');
      setTextField('Postcode', formData.registeredBusinessPostcode || '');
      setTextField('Contact Number', formData.registeredBusinessContact || '');

      // Landlord/Homeowner Details
      setTextField('Name_2', formData.landlordName || '');
      const landlordAddressLines = (formData.landlordAddress || '').split(',');
      setTextField('Address_3', landlordAddressLines[0] || '');
      setTextField('Address_4', landlordAddressLines[1] || '');
      setTextField('Postcode_2', formData.landlordPostcode || '');
      setTextField('Contact Number_2', formData.landlordContact || '');

      // Site Details
      setTextField('Name_3', formData.siteName || '');
      const siteAddressLines = (formData.siteAddress || '').split(',');
      setTextField('Address_5', siteAddressLines[0] || '');
      setTextField('Address_6', siteAddressLines[1] || '');
      setTextField('Postcode_3', formData.sitePostcode || '');
      setTextField('Contact Number_3', formData.siteContact || '');

      // Appliance Details
      setTextField('Location', formData.applianceLocation || '');
      setTextField('Type', formData.applianceType || '');
      setTextField('Manufacturer', formData.applianceManufacturer || '');
      setTextField('Model', formData.applianceModel || '');
      setCheckbox('Yes', formData.applianceOwnedByLandlord === "Yes");
      setCheckbox('Yes_2', formData.applianceInspected === "Yes");
      setTextField('Flue Type', formData.flueType || '');

      // Inspection Details
      setTextField('Operating Pressure', formData.operatingPressure || '');
      setCheckbox('Yes_3', formData.safetyDevicesOperating === "Yes");
      setCheckbox('Yes_4', formData.ventilationSatisfactory === "Yes");
      setTextField('Visual condition of flue & termination', formData.flueVisualCondition || '');
      setTextField('Flue operation checks', formData.flueOperationChecks || '');
      setTextField('Combustion analyser reading', formData.combustionAnalyserReading || '');
      setCheckbox('Yes_5', formData.applianceServiced === "Yes");
      setCheckbox('Yes_6', formData.applianceSafeToUse === "Yes");

      // Final Check Results
      setTextField('Outcome of gas tightness test', formData.gasTightnessTest || '');
      setCheckbox('Yes_7', formData.protectiveBonding === "Yes");
      setCheckbox('Yes_8', formData.emergencyControlAccessible === "Yes");
      setCheckbox('Yes_9', formData.pipeworkVisualInspection === "Yes");
      setCheckbox('Yes_10', formData.coAlarmFitted === "Yes");
      setCheckbox('Yes_11', formData.fireAlarmFitted === "Yes");

      // Combustion Performance Readings
      setTextField('Low', formData.combustionLowCO || '');
      setTextField('High', formData.combustionHighCO || '');
      setTextField('Low_2', formData.combustionLowCO2 || '');
      setTextField('High_2', formData.combustionHighCO2 || '');
      setTextField('Low_3', formData.combustionLowRatio || '');
      setTextField('High_3', formData.combustionHighRatio || '');

      // Next Inspection
      setTextField('Next Inspection Is Due Before', formatDate(formData.nextInspectionDue));

      // Signatures
      setTextField('Gas Engineer', formData.engineerName || '');
      setTextField('Date_2', formatDate(formData.engineerSignatureDate));
      setTextField('Name_4', formData.receivedByName || '');
      setTextField('Position', formData.receivedByPosition || '');
      setTextField('Date_3', formatDate(formData.receivedByDate));

      if (loggedInUserData?.signature) {
        try {
          const signatureUrl = `${loggedInUserData.signature}?${sasToken}`;
          const signatureResponse = await fetch(signatureUrl);
          const signatureImageBytes = await signatureResponse.arrayBuffer();

          let signatureImage;
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

      form.flatten();
      const pdfBytesModified = await pdfDoc.save();
      const blob = new Blob([pdfBytesModified], { type: 'application/pdf' });
      const fileName = `GasSafetyRecord_${siteSelectedForGlobal?.siteId || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;

      setGeneratedPdfBlob(blob);
      setShowPdfButton(true);

      if (uploadToServer) {
        await uploadPdfToServer(blob, fileName);
      }

      return { success: true, fileName };
    } catch (error) {
      console.error('Error generating PDF:', error);
      return { success: false, error: error.message };
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isLoading || !isFormEditable) return;

    setIsLoading(true);

    try {
      const statusPayload = {
        siteId: siteSelectedForGlobal?.siteId,
        type: 'Inspection',
        subType: 'Gas Safety',
        category: 'Gas Safety Record',
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

      const inspectionPayload = {
        ...formData,
        siteId: siteSelectedForGlobal?.siteId,
        checkId: checkIdToUse
      };

      const inspectionResponse = checkIdToUse
        ? await put(`/api/site-check/gas-safety-record/${checkIdToUse}`, inspectionPayload)
        : await post("/api/site-check/gas-safety-record", inspectionPayload);

      const pdfResult = await generatePDF(true);
      if (!pdfResult.success) {
        console.error("PDF generation/upload failed");
      }

      toast.success("Gas Safety Record submitted successfully");
      setIsSubmitted(true);
      setIsFormEditable(false);

    } catch (error) {
      console.error("Submission error:", error);
      toast.error(error.message || "Failed to submit Gas Safety Record");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mt-4 mb-5">
      <div className="header text-center bg-light p-4 mb-4 rounded d-flex justify-content-between align-items-center">
        <h4 className="mb-0">Gas Safety Record</h4>
      </div>

      {!isFormEditable && (
        <div className="alert alert-warning" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-2"></i>
          This form is read-only because the check has been marked as completed.
        </div>
      )}

      <form onSubmit={handleSubmit}>
        {/* Header Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Record Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Ref</label>
                  <input
                    type="text"
                    className="form-control"
                    name="ref"
                    value={formData.ref}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Gas Safe Reg No</label>
                  <input
                    type="text"
                    className="form-control"
                    name="gasSafeRegNo"
                    value={formData.gasSafeRegNo}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <div className="mb-3">
                  <label className="form-label">Serial No</label>
                  <input
                    type="text"
                    className="form-control"
                    name="serialNo"
                    value={formData.serialNo}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Registered Business Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Registered Business Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="registeredBusinessName"
                    value={formData.registeredBusinessName}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="registeredBusinessAddress"
                    value={formData.registeredBusinessAddress}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Postcode</label>
                  <input
                    type="text"
                    className="form-control"
                    name="registeredBusinessPostcode"
                    value={formData.registeredBusinessPostcode}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="registeredBusinessContact"
                    value={formData.registeredBusinessContact}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Landlord/Homeowner Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Landlord/Homeowner Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="landlordName"
                    value={formData.landlordName}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="landlordAddress"
                    value={formData.landlordAddress}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Postcode</label>
                  <input
                    type="text"
                    className="form-control"
                    name="landlordPostcode"
                    value={formData.landlordPostcode}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="landlordContact"
                    value={formData.landlordContact}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Site Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Site Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Name</label>
                  <input
                    type="text"
                    className="form-control"
                    name="siteName"
                    value={formData.siteName}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Address</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    name="siteAddress"
                    value={formData.siteAddress}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Postcode</label>
                  <input
                    type="text"
                    className="form-control"
                    name="sitePostcode"
                    value={formData.sitePostcode}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="siteContact"
                    value={formData.siteContact}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appliance Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Appliance Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    name="applianceLocation"
                    value={formData.applianceLocation}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Type</label>
                  <input
                    type="text"
                    className="form-control"
                    name="applianceType"
                    value={formData.applianceType}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Manufacturer</label>
                  <input
                    type="text"
                    className="form-control"
                    name="applianceManufacturer"
                    value={formData.applianceManufacturer}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Model</label>
                  <input
                    type="text"
                    className="form-control"
                    name="applianceModel"
                    value={formData.applianceModel}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Owned by Landlord</label>
                  <select
                    className="form-control"
                    name="applianceOwnedByLandlord"
                    value={formData.applianceOwnedByLandlord}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Appliance Inspected</label>
                  <select
                    className="form-control"
                    name="applianceInspected"
                    value={formData.applianceInspected}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label">Flue Type</label>
                  <input
                    type="text"
                    className="form-control"
                    name="flueType"
                    value={formData.flueType}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Inspection Details */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Inspection Details</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Operating Pressure (mbars) or heat input (kW/h)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="operatingPressure"
                    value={formData.operatingPressure}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Safety devices operating correctly?</label>
                  <select
                    className="form-control"
                    name="safetyDevicesOperating"
                    value={formData.safetyDevicesOperating}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Satisfactory Ventilation?</label>
                  <select
                    className="form-control"
                    name="ventilationSatisfactory"
                    value={formData.ventilationSatisfactory}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Visual condition of flue & termination</label>
                  <select
                    className="form-control"
                    name="flueVisualCondition"
                    value={formData.flueVisualCondition}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Flue operation checks</label>
                  <select
                    className="form-control"
                    name="flueOperationChecks"
                    value={formData.flueOperationChecks}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
              </div>
              <div className="col-md-4">
                <div className="mb-3">
                  <label className="form-label">Combustion analyser reading</label>
                  <input
                    type="text"
                    className="form-control"
                    name="combustionAnalyserReading"
                    value={formData.combustionAnalyserReading}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Was appliance serviced?</label>
                  <select
                    className="form-control"
                    name="applianceServiced"
                    value={formData.applianceServiced}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Is appliance safe to use?</label>
                  <select
                    className="form-control"
                    name="applianceSafeToUse"
                    value={formData.applianceSafeToUse}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Final Check Results */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Final Check Results</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Outcome of gas tightness test</label>
                  <select
                    className="form-control"
                    name="gasTightnessTest"
                    value={formData.gasTightnessTest}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Pass">Pass</option>
                    <option value="Fail">Fail</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Is the main protective equipotential bonding satisfactory?</label>
                  <select
                    className="form-control"
                    name="protectiveBonding"
                    value={formData.protectiveBonding}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Is the emergency control accessible?</label>
                  <select
                    className="form-control"
                    name="emergencyControlAccessible"
                    value={formData.emergencyControlAccessible}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Satisfactory visual inspection of gas installation pipework?</label>
                  <select
                    className="form-control"
                    name="pipeworkVisualInspection"
                    value={formData.pipeworkVisualInspection}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">CO alarm fitted and working?</label>
                  <select
                    className="form-control"
                    name="coAlarmFitted"
                    value={formData.coAlarmFitted}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Smoke/fire alarm fitted and working?</label>
                  <select
                    className="form-control"
                    name="fireAlarmFitted"
                    value={formData.fireAlarmFitted}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  >
                    <option value="Yes">Yes</option>
                    <option value="No">No</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Combustion Performance Readings */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Combustion Performance Readings</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <h6>Low</h6>
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionLowCO"
                        value={formData.combustionLowCO}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO2</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionLowCO2"
                        value={formData.combustionLowCO2}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Ratio</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionLowRatio"
                        value={formData.combustionLowRatio}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <h6>High</h6>
                <div className="row">
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionHighCO"
                        value={formData.combustionHighCO}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">CO2</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionHighCO2"
                        value={formData.combustionHighCO2}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="mb-3">
                      <label className="form-label">Ratio</label>
                      <input
                        type="text"
                        className="form-control"
                        name="combustionHighRatio"
                        value={formData.combustionHighRatio}
                        onChange={handleInputChange}
                        disabled={isSubmitted}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Next Inspection */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Next Inspection</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Next Inspection Is Due Before</label>
                  <input
                    type="date"
                    className="form-control"
                    name="nextInspectionDue"
                    value={formData.nextInspectionDue}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signatures */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Signatures</h5>
          </div>
          <div className="card-body">
            <div className="row">
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Gas Engineer</label>
                  <input
                    type="text"
                    className="form-control"
                    name="engineerName"
                    value={formData.engineerName}
                    onChange={handleInputChange}
                    disabled
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="engineerSignatureDate"
                    value={formData.engineerSignatureDate}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Signature</label>
                  <br />
                  <img
                    width="200"
                    height="50"
                    style={{ border: "1px solid" }}
                    src={loggedInUserData?.signature + "?" + sasToken}
                    alt="Signature"
                  />
                </div>
              </div>
              <div className="col-md-6">
                <div className="mb-3">
                  <label className="form-label">Received By (Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="receivedByName"
                    value={formData.receivedByName}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Position</label>
                  <input
                    type="text"
                    className="form-control"
                    name="receivedByPosition"
                    value={formData.receivedByPosition}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Date</label>
                  <input
                    type="date"
                    className="form-control"
                    name="receivedByDate"
                    value={formData.receivedByDate}
                    onChange={handleInputChange}
                    disabled={isSubmitted}
                  />
                </div>
              </div>
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
                    !isGasEngineer
                  }
                >
                  {isLoading ? 'Submitting...' : 'Submit Record'}
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center print-hide">
            <div className="alert alert-success mb-4">
              Gas Safety Record submitted successfully on {new Date().toISOString().split("T")[0]}
            </div>
            {showPdfButton && generatedPdfBlob && (
              <button
                className="btn btn-success"
                onClick={() => savePdfToLocal(generatedPdfBlob, `GasSafetyRecord_${siteSelectedForGlobal?.siteId}_${new Date().toISOString().split('T')[0]}.pdf`)}
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
})(GasSafetyRecord);