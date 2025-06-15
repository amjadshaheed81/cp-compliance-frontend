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
import { Autocomplete, TextField, Button } from "@mui/material";
import { formatDate } from "../../../../utils/dateFormat";
import { v4 as uuidv4 } from 'uuid';
import { saveAs } from 'file-saver';
import pdfTemplate from './pdf/MicrowaveOvenCertificate.pdf';

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

const MicroWaveOvenCertificate = ({
  sasToken,
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
  const [PDFLib, setPDFLib] = useState(null);

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
  const [formData, setFormData] = useState({
    address: "",
    assetId: "",
    siteContact: "",
    inspectionDate: new Date().toISOString().split("T")[0],
    siteContactNo: "",
    job: "",
    report: "",
    param1: "", // emission level check
    param2: "", // interlock check
    param3: "", // pass or fail
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
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [showPdfButton, setShowPdfButton] = useState(false);
  const [generatedPdfBlob, setGeneratedPdfBlob] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  const [folderIds, setFolderIds] = useState({
    logBooks: null,
    electricalManagement: null,
    microwaveOvenTesting: null
  });
  
  // Fetch assets when component mounts or when site selection changes
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal.siteId);
    }
  }, [siteSelectedForGlobal, getSiteAssets]);

  const filteredAssets = React.useMemo(() => 
    siteAssets?.filter(asset => {
      return asset.category === "Electrical" && (
        asset.subCategory === "Microwave Oven" ||
        (asset.subCategory === "Small Appliances" && asset.subCategory2 === "Microware")
      );
    }) || [],
    [siteAssets]  // Only re-calculate if siteAssets changes
  );

  const handleAssetSelect = (event, newValue) => {
    setFormData((prev) => ({
      ...prev,
      selectedAsset: newValue,
      assetId: newValue ? newValue.assetId : "",
      ...(newValue && newValue.modelNumber && { param1: newValue.modelNumber }),
      ...(newValue && newValue.serialNumber && { param2: newValue.serialNumber }),
    }));
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
            const electricalManagementFolder = logBooksResponse.document.childFolders.find(
              folder => folder.name.trim() === 'Electrical Management'
            );

            if (electricalManagementFolder) {
              const electricalResponse = await get(
                `/api/document/parent/${electricalManagementFolder.id}/folders?siteId=${siteId}`
              );

              if (electricalResponse?.document?.childFolders) {
                const microwaveOvenFolder = electricalResponse.document.childFolders.find(
                  folder => folder.name.trim() === 'Microwave Oven Testing'
                );

                setFolderIds({
                  logBooks: logBooksFolder.id,
                  electricalManagement: electricalManagementFolder.id,
                  microwaveOvenTesting: microwaveOvenFolder?.id || null
                });

                return microwaveOvenFolder?.id || null;
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

  const uploadPdfToServer = async (pdfBlob, fileName) => {
    try {
      setIsUploading(true);
      
      if (siteSelectedForGlobal?.siteId) {
        await fetchFolderStructure(siteSelectedForGlobal.siteId);
      }
      
      const pdfFile = new File([pdfBlob], fileName, { type: 'application/pdf' });
      
      const formData = new FormData();
      formData.append('files', pdfFile);
      
      const targetFolderId = folderIds.microwaveOvenTesting || folderIds.logBooks;
      
      if (!targetFolderId) {
        throw new Error('Could not determine target folder for PDF upload');
      }
      
      const documentRequestString = {
        folderId: targetFolderId,
        files: [{
          name: fileName.split('.')[0],
          issueDate: new Date().toISOString().replace('T', ' ').split('.')[0],
          expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().replace('T', ' ').split('.')[0],
          note: 'Microwave Oven Testing Certificate',
          fileVersion: 1,
          siteId: siteSelectedForGlobal?.siteId || 0,
          originalFileName: fileName,
          uploaderUserId: loggedInUserData?.id || 0,
          reviewerUserId: loggedInUserData?.id || 0,
          referenceNumber: `MOTC-${new Date().getTime()}`
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
      
      if (responseData.success) {
        toast.success('PDF uploaded successfully to Microwave Oven Testing folder');
        return true;
      } else {
        throw new Error(responseData.message || 'Failed to upload PDF');
      }
    } catch (error) {
      console.error('Error uploading PDF:', error);
      return false;
    } finally {
      setIsUploading(false);
    }
  };

  const generatePdf = async () => {
    console.log(JSON.stringify(formData)+"==================================================================================>>>>>")
    if (!PDFLib) {
      toast.error('PDF library not loaded yet. Please wait and try again.');
      return;
    }
    
    // Check if we have the PDFLib methods we need
    if (!PDFLib.PDFDocument || typeof PDFLib.PDFDocument.load !== 'function') {
      toast.error('PDF library not properly initialized. Please refresh the page.');
      return;
    }

    try {
      setIsGeneratingPDF(true);
      
      // Validate required fields
      const requiredFields = [
        'address', 'siteContact', 'inspectionDate', 'assetId',
        'param1', 'param2', 'param3', 'engineer'
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
      
      // Define font sizes
      const smallFont = 10;
      const mediumFont = 10;
      const largeFont = 10;

      // Helper function to set text field with font size
      const setTextField = (fieldName, value, fontSize = mediumFont) => {
        try {
          const field = form.getTextField(fieldName);
          if (field) {
            // Convert value to string and handle null/undefined
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
      
      // Set address fields with proper formatting
      setTextField('AddressLine1', addressLines[0] || '', mediumFont);
      setTextField('AddressLine2', addressLines[1] || '', 8);
      setTextField('city', addressLines[2] || '', mediumFont);
      setTextField('postalCode', addressLines[3] || '', mediumFont);
      setTextField('country', addressLines[4] || '', mediumFont);
      
      // Set other fields with appropriate font sizes
      setTextField('Date', formatDateString(formData.inspectionDate), mediumFont);
      setTextField('Site Contact', formData.siteContactUser?.name || 'N/A', mediumFont);
      setTextField('SiteContractNo', formData.siteContactNo || 'N/A', mediumFont);
      setTextField('JobNo', formData.job || 'N/A', mediumFont);
      
      // Microwave specific fields - using selectedAsset data
      setTextField('Model_Number', formData.selectedAsset?.model || 'N/A', mediumFont);
      setTextField('Manufacturer', formData.selectedAsset?.manufacturer || 'N/A', mediumFont);
      setTextField('Location', `${formData.selectedAsset?.position} ${formData.selectedAsset?.room} ${formData.selectedAsset?.floor}`  || 'N/A', mediumFont);
      
      // Test results
      setTextField('EmissionLevel', formData.param1 === 'Pass' ? 'Yes' : 'No', mediumFont);
      setTextField('InterlockCheck', formData.param2 === 'Pass' ? 'Yes' : 'No', mediumFont);
      setTextField('PassFail', formData.param3 || '', mediumFont);
      
      // Client and Engineer sections
      setTextField('Clients Name', formData.clientUser?.name || formData.client || '', mediumFont);
      setTextField('Engineers Name', formData.user?.name || '', mediumFont);
      setTextField('Engineers Report', formData.report || 'N/A', smallFont);
      
      // Date checkboxes
      const today = new Date().toISOString().split('T')[0];
      setTextField('on',formData.signedDate);
      setTextField('on_2',formData.signedDate);
      
      form.flatten();
      
      const pdfBytesSaved = await pdfDoc.save();
      const blob = new Blob([pdfBytesSaved], { type: 'application/pdf' });
      setGeneratedPdfBlob(blob);
      
      saveAs(blob, `Microwave_Oven_Certificate_${formData.assetId || 'inspection'}_${new Date().toISOString().split('T')[0]}.pdf`);
      
      setShowPdfButton(true);
      
          // Save to Microwave Oven Testing folder if site is selected
      if (siteSelectedForGlobal?.siteId) {
        try {
          const fileName = `Microwave_Oven_Certificate_${formData.assetId || 'inspection'}_${new Date().toISOString().split('T')[0]}.pdf`;
          await uploadPdfToServer(blob, fileName);
        } catch (uploadError) {
          console.error('Error in upload process:', uploadError);
          // Don't show error here as it's already handled in uploadPdfToServer
        }
      }
      
      toast.success('PDF generated successfully!');
      
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast.error('Failed to generate PDF: ' + (error.message || 'Unknown error'));
    } finally {
      setIsGeneratingPDF(false);
    }
  };

  const isInternalUserTaggedWithSite = true;

  
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
    const initializeData = async () => {
      try {
        if (isInternalUserTaggedWithSite && users.length === 0) {
          await getUsers();
        }
        
        if (siteSelectedForGlobal?.siteId) {
          // Fetch the folder structure when site changes
          await fetchFolderStructure(siteSelectedForGlobal.siteId);
          
          // Also fetch site details and assets
          await Promise.all([
            getSiteAssets(siteSelectedForGlobal.siteId),
            getSiteDetailsById(siteSelectedForGlobal.siteId)
          ]);
          
          // Set initial form data if needed
          const currentSite = sites.find(site => site.siteId === siteSelectedForGlobal.siteId);
          if (currentSite) {
            const addressParts = [
              currentSite.address1,
              currentSite.address2,
              currentSite.city,
              currentSite.area,
              currentSite.postCode,
              currentSite.country,
            ].filter(part => part && part.trim() !== '');
            
            const fullAddress = addressParts.join(', ');
            setFormData(prev => ({
              ...prev,
              address: fullAddress,
              siteContact: currentSite.siteContact?.name || '',
              siteContactNo: currentSite.siteContact?.phone || ''
            }));
          }
        }
      } catch (error) {
        console.error('Error initializing data:', error);
        toast.error('Failed to initialize component data');
      }
    };
    
    initializeData();
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

  // filteredAssets is now defined above with useMemo
  // handleAssetSelect is defined above

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
        param1: formData.param1, // emission level check
        param2: formData.param2, // interlock check
        param3: formData.param3, // pass or fail
      };

      await post("/api/site-check/generic-inspection", dataToSave);
      setIsSubmitted(true);
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
        <h4 className="mb-0">Microwave Oven Test Certificate</h4>
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
                  value={formData.selectedAsset} // Use the stored selectedAsset
                  onChange={handleAssetSelect}
                  noOptionsText={
                    siteAssets === null 
                      ? 'Loading assets...' 
                      : filteredAssets.length === 0 
                        ? 'No Microwave Ovens found. Please add Microwave Oven assets first.'
                        : 'No results found'
                  }
                  loading={siteAssets === null}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Select a Microwave Oven"
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
                      value={formData.selectedAsset?.manufacturer || ''}
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
                      value={formData.selectedAsset?.model || ''}
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
                      value={formData.selectedAsset?.position || ''}
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
                      value={formData.selectedAsset?.floor || ''}
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
                      value={formData.selectedAsset?.room || ''}
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
            <h5 className="mb-0">Engineers Reports</h5>
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
                      Emission Level Check
                    </td>
                    <td
                      style={{
                        textAlign: "center",
                        fontWeight: "bold",
                        width: "400px",
                      }}
                    >
                      Interlock Check
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
                name="signedDate"
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

        {!isSubmitted && (
          <div className="d-flex justify-content-end gap-2 mt-4 print-hide">
            <button
              type="button"
              className="btn btn-outline-secondary"
              onClick={() => window.history.back()}
            >
              Cancel
            </button>

            <button type="submit" className="btn btn-primary">
              Submit Report
            </button>
          </div>
        )}

        {isSubmitted && (
          <div className="row mt-4">
            <div className="col-12 text-center">
              <Button
                variant="contained"
                color="primary"
                onClick={generatePdf}
                disabled={isGeneratingPDF || isUploading}
                className="me-2 print-hide"
              >
                {isGeneratingPDF || isUploading ? (isUploading ? 'Saving...' : 'Generating PDF...') : 'Generate & Save PDF'}
              </Button>
            </div>
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
})(MicroWaveOvenCertificate);
