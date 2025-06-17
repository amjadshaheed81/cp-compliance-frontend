import React, { useState, useEffect } from "react";
import { connect, useSelector } from "react-redux";
import { toast } from "react-toastify";
import { post, get } from "../../../../api";
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

const DisabledWCAlarmCertificate = ({
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
  const [validationErrors, setValidationErrors] = useState({});
  const [PDFLib, setPDFLib] = useState(null);
  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    plantAndEquipment: null,
    miscellaneousService: null,
    disabledWCAlarm: null
  });
  const selectedAsset = siteAssets.find(
    (asset) => asset.assetId === formData.assetId
  );

  const isInternalUserTaggedWithSite =true
    // loggedInUserData?.userType === "Internal" &&
    // loggedInUserData?.taggedSites?.some(
    //   (site) => site.id === siteSelectedForGlobal?.siteId
    // );


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
          param5: mostRecentItem.param5 || prev.param5,
          param6: mostRecentItem.param6 || prev.param6,
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

  useEffect(() => {
    if (isInternalUserTaggedWithSite && users.length === 0) {
      getUsers();
    }
    
    // Fetch folder structure when component mounts
    const fetchFolders = async () => {
      if (siteSelectedForGlobal?.siteId) {
        await fetchFolderStructure(siteSelectedForGlobal.siteId);
      }
    };
    
    fetchFolders();
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (siteSelectedForGlobal?.siteId) {
          await getSiteAssets(siteSelectedForGlobal?.siteId);
          await getSiteDetailsById(siteSelectedForGlobal?.siteId);

          await fetchInspectionData();

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
            ].filter((part) => part);

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

  // Load PDF library when component mounts
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('pdf-lib').then((pdfLib) => {
        setPDFLib(pdfLib);
      }).catch(error => {
        console.error('Failed to load PDF library:', error);
        toast.error('Failed to load PDF functionality. Please refresh the page.');
      });
    }
  }, []);

  // Fetch PDF template from the server
  const fetchPdfTemplate = async () => {
    try {
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

  const generatePdf = async () => {
    if (!PDFLib) {
      toast.error('PDF library not loaded yet. Please wait and try again.');
      return;
    }
    
    if (!PDFLib.PDFDocument || typeof PDFLib.PDFDocument.load !== 'function') {
      toast.error('PDF library not properly initialized. Please refresh the page.');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      // Validate required fields
      const requiredFields = [
        'address', 'siteContact', 'inspectionDate', 'assetId',
        'param1', 'param2', 'param3', 'param4', 'param5', 'param6', 'engineer'
      ];
      
      const errors = {};
      requiredFields.forEach(field => {
        if (!formData[field]) {
          errors[field] = 'This field is required';
        }
      });

      if (Object.keys(errors).length > 0) {
        setValidationErrors(errors);
        toast.error('Please fill in all required fields');
        return;
      }

      setValidationErrors({});
      
      let pdfBytes;
      try {
        pdfBytes = await fetchPdfTemplate();
      } catch (error) {
        console.error('Error loading PDF template:', error);
        toast.error('Failed to load PDF template. Please try again.');
        return;
      }
      
      let pdfDoc;
      try {
        pdfDoc = await PDFLib.PDFDocument.load(pdfBytes);
      } catch (error) {
        console.error('Error loading PDF document:', error);
        toast.error('Failed to process PDF. The template may be corrupted.');
        return;
      }
      
      const form = pdfDoc.getForm();
      const fields = form.getFields();
      
      // Log all field names for debugging
      console.log('PDF Form Fields:');
      fields.forEach(f => console.log(f.getName()));
      
      // Helper function to set text field with font size
      const setTextField = (fieldName, value, fontSize = 10) => {
        try {
          const field = form.getTextField(fieldName);
          if (field) {
            const stringValue = value !== null && value !== undefined ? String(value) : '';
            field.setText(stringValue);
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

      // Format date as dd/mm/yyyy
      const formatDateString = (dateString) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
      };

      // Process address
      const addressLines = (formData.address || '').split(',').map(s => s.trim());
      
      // Set manufacturer, model, and location from selected asset
      setTextField('Manufacturer', formData.selectedAsset?.manufacturer || 'N/A');
      setTextField('Model Number', formData.selectedAsset?.model || 'N/A');
      setTextField('Location', `${formData.selectedAsset?.position || ''} ${formData.selectedAsset?.room || ''} ${formData.selectedAsset?.floor || ''}`.trim() || 'N/A');
      
      // Set client and engineer information
      setTextField('Clients Name', formData.clientUser?.name || formData.client || 'N/A');
      setTextField('Engineers Name', formData.user?.name || 'N/A');
      
      // Set dates
      setTextField('on', formatDateString(formData.signedDate));
      setTextField('on_2', formatDateString(formData.signedDate));
      
      // Set address fields with proper formatting
      setTextField('AddressLine1', addressLines[0] || '');
      setTextField('AddressLine2', addressLines[1] || '');
      setTextField('city', addressLines[2] || '');
      setTextField('postalCode', addressLines[3] || '');
      setTextField('country', addressLines[4] || '');
      
      // Set other fields
      setTextField('Date', formatDateString(formData.inspectionDate));
      setTextField('siteContract', formData.siteContactUser?.name || 'N/A');
      setTextField('contactNo', formData.siteContactNo || 'N/A');
      setTextField('jobNo', formData.job || 'N/A');
      setTextField('EngineerReport', formData.report || 'N/A');
      
      // Set test results
      setTextField('PullSwitchCheck', formData.param1 === 'Pass' ? 'Yes' : 'No');
      setTextField('ResetPointCheck', formData.param2 === 'Pass' ? 'Yes' : 'No');
      setTextField('OverDoorCheck', formData.param3 === 'Pass' ? 'Yes' : 'No');
      setTextField('OverDoorSound', formData.param4 === 'Pass' ? 'Yes' : 'No');
      setTextField('ControlPointCheck', formData.param5 === 'Pass' ? 'Yes' : 'No');
      setTextField('PassFail', formData.param6 || '');
      
      form.flatten();
      
      const pdfBytesSaved = await pdfDoc.save();
      const blob = new Blob([pdfBytesSaved], { type: 'application/pdf' });
      setGeneratedPdfBlob(blob);
      
      // Generate file name with timestamp
      const fileName = `Disabled_WC_Alarm_Certificate_${formData.assetId || 'inspection'}_${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Save to local machine
      saveAs(blob, fileName);
      
      // Upload to server
      await uploadPdfToServer(blob, fileName);
      
      setShowPdfButton(true);
      toast.success('PDF generated and uploaded successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      
    } finally {
      setIsGeneratingPDF(false);
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
            const plantAndEquipmentFolder = logBooksResponse.document.childFolders.find(
              folder => folder.name.trim() === 'Plant and Equipment'
            );

            if (plantAndEquipmentFolder) {
              const plantAndEquipmentResponse = await get(
                `/api/document/parent/${plantAndEquipmentFolder.id}/folders?siteId=${siteId}`
              );

              if (plantAndEquipmentResponse?.document?.childFolders) {
                const miscellaneousFolder = plantAndEquipmentResponse.document.childFolders.find(
                  folder => folder.name.trim() === 'Miscellaneous Service Documents' || 
                           folder.name.trim() === 'Miscellaneous Service'
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

      return null;
    }
  };

  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);
      
      // If we don't have the folder ID, try to create the folder structure
      let targetFolderId = folderIds.disabledWCAlarm;
      if (!targetFolderId && siteSelectedForGlobal?.siteId) {
        targetFolderId = await fetchFolderStructure(siteSelectedForGlobal.siteId);
      }
      
      if (!targetFolderId) {
        // Try to fetch the folder structure one more time
        targetFolderId = await fetchFolderStructure(siteSelectedForGlobal?.siteId);
        
        if (!targetFolderId) {
          throw new Error('Could not find the target folder. Please ensure the folder structure exists: Log Books > Plant and Equipment > Miscellaneous Service > Disabled WC Alarm');
        }
      }
      
      // Create FormData to send the file
      const formData = new FormData();
      const file = new File([pdfBlob], fileName, { type: 'application/pdf' });
      formData.append('files', file);
      
      // Prepare document request string
      const documentRequestString = {
        folderId: targetFolderId,
        files: [{
          name: fileName.split('.')[0],
          issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().replace('T', ' ').split('.')[0],
          note: 'Disabled WC Alarm Certificate',
          fileVersion: 1,
          siteId: siteSelectedForGlobal?.siteId || 0,
          originalFileName: fileName,
          uploaderUserId: loggedInUserData?.id || 0,
          reviewerUserId: loggedInUserData?.id || 0,
          referenceNumber: `DWC-${new Date().getTime()}`
        }]
      };
      
      formData.append('documentRequestString', JSON.stringify(documentRequestString));
      
      const response = await fetch('/api/document/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const responseData = await response.json();
      
      if (response.ok && responseData.success) {
        toast.success('PDF uploaded successfully to Disabled WC Alarm folder');
        return true;
      } else {
        console.error('Upload error response:', responseData);
        throw new Error(responseData.message || 'Failed to upload PDF');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
     
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const filteredAssets =
    siteAssets?.filter(
      (asset) =>
        asset.category === "Electrical" &&
        asset.subCategory === "Distress Alarm" &&
        asset.subCategory2 === "Disabled WC Alarm"
    ) || [];

  const handleAssetSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      assetId: newValue ? newValue.assetId : "",
    }));
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };



  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!formData.assetId) {
        toast.error("Please select an asset first");
        return;
      }

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
        param1: formData.param1, // pull switch check
        param2: formData.param2, // reset point check
        param3: formData.param3, // over door light check
        param4: formData.param4, // over door sounder check
        param5: formData.param5, // control point / intercom check
        param6: formData.param6, // pass/fail check
      };

      const response = await post("/api/site-check/generic-inspection", dataToSave);
      
      // Update form data with the response data to ensure we have the latest data
      if (response) {
        setFormData(prev => ({
          ...prev,
          ...response,
          // Ensure we keep the selected asset
          selectedAsset: prev.selectedAsset
        }));
      }
      
      toast.success("Disabled WC Alarm Test report saved successfully");
      setIsSubmitted(true);
      setSubmissionSuccess(true);
      setShowPdfButton(true);
    } catch (error) {
      toast.error("Failed to save report");
      console.error(error);
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
          value={formData.clientUser || null} // Use the stored clientUser
          onChange={(event, newValue) => {
            setFormData((prev) => ({
              ...prev,
              client: newValue?.id || "",
              clientUser: newValue || null,
            }));
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              required
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
        value={formData.clientUser?.name || ""}
        onChange={(e) => {
          setFormData((prev) => ({
            ...prev,
            client: e.target.value,
            clientNameText: e.target.value,
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
          value={formData.siteContactUser || null} // Use the stored siteContactUser
          onChange={(event, newValue) => {
            setFormData((prev) => ({
              ...prev,
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
        value={formData.siteContactUser?.name || ""}
        onChange={(e) => {
          setFormData((prev) => ({
            ...prev,
            siteContact: e.target.value,
            siteContactName: e.target.value,
          }));
        }}
        required
        disabled={isSubmitted}
      />
    );
  };

  const canEditSubmittedReport = loggedInUserData?.role === "Admin";
  return (
    <div className="container mt-4 mb-5">
      <div className="header text-center bg-light p-4 mb-4 rounded">
        <h4 className="mb-0">Disabled WC Alarm Certificate</h4>
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
                name="date"
                value={formatDate(formData.inspectionDate)}
                onChange={handleInputChange}
                required
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
                disabled={isSubmitted && !canEditSubmittedReport}
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
                disabled={isSubmitted && !canEditSubmittedReport}
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
                disabled={isSubmitted && !canEditSubmittedReport}
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
                  disabled={isSubmitted && !canEditSubmittedReport}
                  options={filteredAssets}
                  getOptionLabel={(option) =>
                    `${option.assetId} - ${option.assetName} (${
                      option.position || "NA"
                    } > ${option.floor || "NA"} > ${option.room || "NA"})`
                  }
                  value={selectedAsset} // Use the computed selectedAsset
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

            {selectedAsset && (
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
                      name="model"
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

        {/*  Engineers Comments Section */}
        <div className="card mb-4">
          <div className="card-header">
            <h5 className="mb-0">Engineers Comments</h5>
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
                disabled={isSubmitted && !canEditSubmittedReport}
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
                      Pull Switch Check
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Reset Point Check
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Over Door Light Check
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
                        disabled={isSubmitted && !canEditSubmittedReport}
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
                        disabled={isSubmitted && !canEditSubmittedReport}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={formData.param3}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param3: e.target.value,
                          })
                        }
                        disabled={isSubmitted && !canEditSubmittedReport}
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
                      Over Door Sounder Check{" "}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Control Point / Intercom Check{" "}
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Pass/Fail
                    </td>
                  </tr>
                  <tr>
                    <td>
                      <select
                        className="form-select"
                        value={formData.param4}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param4: e.target.value,
                          })
                        }
                        disabled={isSubmitted && !canEditSubmittedReport}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={formData.param5}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param5: e.target.value,
                          })
                        }
                        disabled={isSubmitted && !canEditSubmittedReport}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Yes</option>
                        <option value="Fail">No</option>
                      </select>
                    </td>
                    <td>
                      <select
                        className="form-select"
                        value={formData.param6}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            param6: e.target.value,
                          })
                        }
                        disabled={isSubmitted && !canEditSubmittedReport}
                      >
                        <option value="">Select</option>
                        <option value="Pass">Pass</option>
                        <option value="Fail">Fail</option>
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
                value={formatDate(formData.signedDate)}
                onChange={handleInputChange}
                required
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
                disabled={isSubmitted && !canEditSubmittedReport}
              />
            </div>
          </div>
          <div className="col-md-6">
            <div className="mb-3">
              <label className="form-label fw-bold">Engineer's Name</label>
              <input
                type="text"
                className="form-control"
                name="engineerName"
                value={formData.user.name || ""}
                onChange={handleInputChange}
                required
                readOnly
                disabled={isSubmitted && !canEditSubmittedReport}
              />
            </div>
            <div className="mb-3">
              <label className="form-label">Date</label>
              <input
                type="date"
                className="form-control"
                name="engineerDate"
                value={formatDate(formData.signedDate)}
                onChange={handleInputChange}
                required
                disabled={isSubmitted && !canEditSubmittedReport}
                style={{
                  height: "40px",
                  padding: "0 10px",
                  width: "100%",
                }}
              />
            </div>
          </div>
        </div>

        <div className="d-flex justify-content-end gap-2 mt-4 print-hide">
          <button
            type="button"
            className="btn btn-outline-secondary"
            onClick={() => window.history.back()}
          >
            {isSubmitted ? 'Back' : 'Cancel'}
          </button>

          {!isSubmitted ? (
            <button type="submit" className="btn btn-primary">
              Submit Report
            </button>
          ) : (
            <button 
              type="button" 
              className="btn btn-success"
              onClick={generatePdf}
              disabled={isGeneratingPDF}
            >
              {isGeneratingPDF ? 'Generating PDF...' : 'Save and Generate PDF'}
            </button>
          )}
        </div>

        {submissionSuccess && (
          <div className="alert alert-success mt-4 print-hide">
            Report submitted successfully on{" "}
            {new Date().toISOString().split("T")[0]}
          </div>
        )}
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
})(DisabledWCAlarmCertificate);
