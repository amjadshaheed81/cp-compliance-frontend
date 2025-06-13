import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
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

// Import the PDF file directly
import pdfTemplate from './pdf/ExternalLightingCertificate.pdf';

// Dynamically import pdf-lib to avoid SSR issues
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
  });

  const sites = useSelector((state) => state.site.sites);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    electricalManagement: null,
    externalLighting: null
  });

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
        }));
      }
    } catch (error) {
      console.error("Error fetching inspection data:", error);
      toast.error("Failed to load inspection data");
    }
  };

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
    if (isInternalUserTaggedWithSite && users.length === 0) {
      getUsers();
    }
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (siteSelectedForGlobal?.siteId) {
          await getSiteAssets(siteSelectedForGlobal?.siteId);
          await getSiteDetailsById(siteSelectedForGlobal?.siteId);
          
          // Fetch the folder structure when site changes
          await fetchFolderStructure(siteSelectedForGlobal.siteId);

          await fetchInspectionData();

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

  // Helper function to upload PDF to the server
  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);
      
      const savedLocally = await savePdfToLocal(pdfBlob, fileName);
      if (!savedLocally) {
        throw new Error('Failed to save PDF locally');
      }
      
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('files', pdfFile);
      
      // Use the externalLighting folder ID if available, otherwise fall back to Log Books
      const targetFolderId = folderIds.externalLighting || folderIds.logBooks;
      
      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }
      
      const documentRequestString = {
        folderId: targetFolderId,
        files: [{
          name: fileName.split('.')[0],
          issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().replace('T', ' ').split('.')[0],
          note: 'External Lightning Certificate',
          fileVersion: 1,
          siteId: siteSelectedForGlobal?.siteId || 0,
          originalFileName: fileName,
          uploaderUserId: loggedInUserData?.id || 0,
          reviewerUserId: loggedInUserData?.id || 0,
          referenceNumber: `ELC-${new Date().getTime()}`
        }]
      };
      
      // 5. Add metadata as a JSON string
      formData.append('documentRequestString', JSON.stringify(documentRequestString));
      
      // 6. Make the API call
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
        toast.success('PDF uploaded successfully!');
        return true;
      } else {
        throw new Error('Upload failed: No response data');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      toast.error('Failed to upload PDF: ' + (error.response?.data?.message || error.message));
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  // Function to save PDF to public folder (for development)
  const savePdfToPublic = async (pdfBlob, fileName) => {
    try {
      // In a real app, you would save to a server-side endpoint
      // For client-side only, we'll just download it
      saveAs(pdfBlob, fileName);
      return true;
    } catch (error) {
      console.error('Error saving PDF:', error);
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
      
      const fileName = `ExternalLightningReport_${formData.job || 'report'}_${new Date().toISOString().split('T')[0]}_${uuidv4().substring(0, 8)}.pdf`;
      
      setGeneratedPdfBlob(blob);
      
      const savedToPublic = await savePdfToPublic(blob, fileName);
      
      // Upload to server if requested
      let uploadedToServer = false;
      if (uploadToServer && savedToPublic) {
        uploadedToServer = await uploadPdfToServer(blob, fileName);
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
    setIsLoading(true);
    try {
      const dataToSave = {
        ...formData,
        assetId: formData.assetId,
        siteId: siteSelectedForGlobal?.siteId,
        checkId,
        subType,
        inspectionDate: formData.inspectionDate || new Date().toISOString(),
        job: formData.job,
        engineer: loggedInUserData?.id,
        signedDate: formData.signedDate || new Date().toISOString(),
        submittedDate: new Date().toISOString(),
        report: formData.report,
        param1: formData.param1, // jobComplete
        param2: formData.param2, // partsRequired
        param3: formData.param3, // walkTestComplete
        param4: formData.param4, // pirsCleaned
        param1Remark: formData.param1Remark, // walkTestRemarks
        param2Remark: formData.param2Remark, // pirsCleanedRemarks
        param3Remark: formData.param3Remark, // remoteSignallingRemarks
      };

      await post("/api/site-check/generic-inspection", dataToSave);
      toast.success("External lightning report saved successfully");
      setIsSubmitted(true);
      setSubmissionSuccess(true);
      setShowPdfButton(true); // Show the PDF button after successful submission
    } catch (error) {
      toast.error("Failed to save report");
      console.error(error);
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
      <div className="header text-center bg-light p-4 mb-4 rounded">
        <h4 className="mb-0">External Lighting Service Report</h4>
      </div>

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
                        className="form-select"
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
                        className="form-select"
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
                        className="form-select"
                        value={formData.param3}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param3: e.target.value,
                          })
                        }
                        disabled={isSubmitted}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                  </tr>
                  <tr>
                    <td style={{ textAlign: "center", fontWeight: "bold" }}>
                      Fittings Operational
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <select
                        className="form-select"
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
                  </tr>
                </tbody>
              </table>
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
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-outline-secondary"
                onClick={() => window.history.back()}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? 'Submitting...' : 'Submit Report'}
              </button>
            </div>
          ) : (
            <div className="text-center">
              <div className="alert alert-success mb-4">
                Report submitted successfully on {new Date().toISOString().split("T")[0]}
              </div>
              <div className="d-flex justify-content-center">
                <button
                  type="button"
                  className="btn btn-primary d-flex align-items-center gap-2"
                  onClick={() => generatePDF(true)}
                  disabled={isGeneratingPDF || isUploading}
                  style={{
                    padding: '8px 20px',
                    fontSize: '1rem',
                    fontWeight: '500',
                    borderRadius: '6px',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-file-earmark-pdf" viewBox="0 0 16 16">
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z"/>
                    <path d="M4.603 14.087a.81.81 0 0 1-.438-.42c-.195-.388.09-.87.36-1.164c.272-.303.592-.458 1.022-.558.43-.1.813-.187 1.09-.214a.6.6 0 0 1 .153.01c.344.038.662.13.93.36c.27.23.4.55.4.91c0 .35-.12.65-.36.85c-.23.2-.55.3-.95.3c-.35 0-.66-.08-.89-.24a1.2 1.2 0 0 1-.5-.82h-.84c.02.3.1.56.23.74c.15.19.35.3.6.3c.14 0 .27-.03.38-.1c.1-.06.15-.16.15-.3c0-.1-.03-.18-.1-.24c-.06-.06-.16-.1-.3-.1c-.1 0-.2 0-.3.02c-.1.02-.19.04-.29.08v-.9c.08-.03.18-.05.3-.06c.12-.01.23-.02.34-.02c.33 0 .6.06.8.18c.2.12.3.3.3.55c0 .16-.04.3-.13.42c-.1.11-.23.2-.4.25c.2.03.36.1.5.22c.14.12.2.29.2.5c0 .23-.07.43-.23.59c-.15.16-.38.24-.7.24c-.32 0-.57-.07-.73-.22c-.16-.15-.25-.35-.27-.6h.82c0 .11.04.2.11.26c.08.06.17.08.26.08c.08 0 .16-.03.2-.08c.04-.06.07-.13.07-.22c0-.2-.1-.3-.3-.3c-.03 0-.07 0-.12.02c-.04 0-.08.01-.12.02h-.15v-.66h.15c.04 0 .08 0 .12.02c.04 0 .08.01.12.02c.05 0 .1 0 .15-.01c.04-.02.08-.03.1-.06c.03-.03.04-.07.04-.12c0-.1-.04-.17-.1-.21c-.06-.04-.15-.06-.28-.06c-.2 0-.35.04-.45.12c-.1.08-.15.2-.15.36h-.81c0-.22.06-.4.18-.54c.12-.14.3-.22.52-.22c.1 0 .2.02.3.06c.1.04.18.1.24.16c.06.06.1.14.13.24c.02.1.04.2.04.31c0 .12-.02.23-.06.33c-.04.1-.1.19-.18.26c-.08.07-.18.13-.3.17c-.12.04-.25.06-.4.06c-.1 0-.2-.01-.3-.03c-.1-.02-.19-.05-.27-.1v.66zM4.5 11.1h.76c.1 0 .2.03.28.07c.1.04.17.1.23.18c.06.07.1.16.13.26c.02.1.04.2.04.31c0 .12-.02.22-.06.32c-.04.1-.1.18-.18.26c-.08.08-.17.14-.28.18c-.1.04-.22.06-.34.06h-.78v-1.34h.02c.02 0 .03 0 .05.01c.02 0 .03 0 .05.01zm.25.66c.08 0 .16-.02.23-.05c.07-.04.13-.09.17-.16c.04-.07.06-.15.06-.24c0-.1-.02-.18-.06-.25c-.04-.07-.1-.12-.17-.16c-.07-.04-.15-.06-.23-.06h-.25v.86h.25z"/>
                  </svg>
                  {isGeneratingPDF ? 'Generating...' : isUploading ? 'Uploading...' : 'Generate & Upload PDF'}
                </button>
              </div>
            </div>
          )}
        </div>
      </form>

      <style>{`
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
