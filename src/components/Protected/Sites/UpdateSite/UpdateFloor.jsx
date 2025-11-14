import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import { getSiteDetailsById, setLoader, uploadFloorPlan } from "./../../../../store/thunk/site";
import { toast } from "react-toastify";
import PdfViewer from "../Documents/PdfViewer";
import { isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import Swal from "sweetalert2";
import { del } from "../../../../api";

const UpdateFloor = ({
  siteLayout,
  uploadFloorPlan,
  updateSite,
  setLoader,
  loggedInUserData,
  getSiteDetailsById,
}) => {
  const { register, getValues, setValue } = useForm({});
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [positionOption, setPositionOption] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState({});
  
  useEffect(() => {
    const positions = siteLayout?.filter((itm) => itm?.nodeType === "position");
    setPositionOption(positions || []);
    
    // Initialize uploadedFiles state with existing floor plan data
    const filesObj = {};
    siteLayout?.filter(itm => itm?.nodeType === "floor")?.forEach(floor => {
      if (floor.floorPlanUrl) {
        filesObj[floor.id] = { 
          url: floor.floorPlanUrl, 
          name: floor.fileName || `${floor.nodeName}.png` 
        };
      }
    });
    setUploadedFiles(filesObj);
  }, [siteLayout]);
  
  // Handle successful uploads - only reset the file input elements
  useEffect(() => {
    // Reset just the file input elements after successful upload
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = "";
    });
    
    // Update the uploadedFiles state to reflect server data
    // but don't clear the displayed filenames
    const updatedFiles = {};
    Object.entries(uploadedFiles).forEach(([floorId, fileInfo]) => {
      // Keep existing URL and name for previously uploaded files
      if (fileInfo.url) {
        updatedFiles[floorId] = {
          url: fileInfo.url,
          name: fileInfo.name
        };
      }
    });
    
    // Add any newly uploaded files from the server
    siteLayout?.filter(itm => itm?.nodeType === "floor")?.forEach(floor => {
      if (floor.floorPlanUrl && (!updatedFiles[floor.id] || updatedFiles[floor.id].url !== floor.floorPlanUrl)) {
        updatedFiles[floor.id] = { 
          url: floor.floorPlanUrl, 
          name: floor.fileName || `${floor.nodeName}.png` 
        };
      }
    });
    
    setUploadedFiles(updatedFiles);
  }, [siteLayout?.filter(itm => itm?.nodeType === "floor")?.map(f => f.floorPlanUrl).join(',')]);
  
  const getParentNodeName = (id) => {
    return siteLayout?.filter((itm) => itm?.id === id)?.[0]?.nodeName;
  };

  const handleFileChange = (floorId, e) => {
    const file = e.target.files[0];
    if (file) {
      const fileType = file.type;
      const validTypes = ["image/jpeg", "image/jpg", "image/png"];
      
      if (validTypes.includes(fileType)) {
        // Store file information in the state
        // Preserve any existing url if there was a previously uploaded file
        const existingData = uploadedFiles[floorId] || {};
        setUploadedFiles({
          ...uploadedFiles,
          [floorId]: { 
            ...existingData,
            file,
            name: file.name, 
            displayUrl: URL.createObjectURL(file),
            // Track that this is a new file to be uploaded
            isNewFile: true
          }
        });
      } else {
        toast.warn(`Unsupported file type: ${fileType}. Only JPG, JPEG, and PNG are allowed.`);
        // Clear the file input
        e.target.value = "";
      }
    }
  };

  const sendFloorPlan = () => {
    let form_data = new FormData();
    const files = [];
    const data = [];
    let isValidForm = true;

    // Only use files that are marked as new (not previously uploaded)
    Object.entries(uploadedFiles).forEach(([floorId, fileInfo]) => {
      if (fileInfo.file && fileInfo.isNewFile) {
        files.push(fileInfo.file);
        data.push({
          nodeId: floorId,
          fileName: fileInfo.name,
        });
      }
    });
    
    if(isValidForm) {
      if (files.length > 0) {
        files.forEach((file) => {
          form_data.append("files", file, file.name);
        });
        form_data.append("floorPlans", JSON.stringify(data));
        
        setLoader(true);
        uploadFloorPlan(form_data, updateSite?.siteId);
      } else {
        toast.warn("Please select at least one valid floor plan file to proceed.");
      }
    }
  };
  
  const deleteFloorPlan = async (floorId) => {
    try {
      Swal.fire({
        title: `Do you want to delete floor plan?`,
        showDenyButton: false,
        showCancelButton: true,
        confirmButtonText: "Delete",
      }).then(async (result) => {
        if (result.isConfirmed) {
          try {
            const url = "/api/site/deletefloorplanimages";
            const payload = {
              nodeIds: [floorId]
            };
            await del(url, payload);
            toast.success(`Floor plan image has been deleted successfully.`);
            
            // Update local state
            const newUploadedFiles = {...uploadedFiles};
            delete newUploadedFiles[floorId];
            setUploadedFiles(newUploadedFiles);
            
            // Refresh data from server
            getSiteDetailsById(updateSite?.siteId, false);
          } catch(e) {
            toast.error(`Something went wrong while deleting floor plan image. Please try again!!`);
          }
        }
      });
    } catch(e) {
      console.error(e);
    }
  };
  
  const getFloorPlanInputs = () => {
    const orderMap = {
      Basement: 1,
      "Ground Floor": 2,
      "1st Floor": 3,
      "2nd Floor": 4,
      "3rd Floor": 5,
      "4th Floor": 6,
      "5th Floor": 7,
      "6th Floor": 8,
      "7th Floor": 9,
      "8th Floor": 10,
      "9th Floor": 11,
      "10th Floor": 12,
      "Vertical": 13,
    };
  
    const list = siteLayout
      ?.filter((itm) => itm?.nodeType === "floor")
      .sort((a, b) => {
        const aOrder = orderMap[a.nodeName] || Number.MAX_SAFE_INTEGER; // Default to a high value for "rest"
        const bOrder = orderMap[b.nodeName] || Number.MAX_SAFE_INTEGER;
        return aOrder - bOrder;
      });
  
    return list?.map((itm) => (
      <tr key={itm?.id}>
        <td>
          {getParentNodeName(itm?.parentNode)}: {itm?.nodeName}
        </td>
        <td>
          <div className="d-flex align-items-center gap-3">
            <div className="file-input-container" style={{ maxWidth: "400px" }}>
              <input
                className="form-control"
                type="file"
                name={`floorImage-${itm?.id}`}
                accept="image/*, application/pdf"
                id={`floorImage-${itm?.id}`}
                onChange={(e) => handleFileChange(itm?.id, e)}
              />
            </div>
            
            {uploadedFiles[itm?.id]?.name && (
              <div style={{ display: "flex", alignItems: "center", marginLeft: "20px" }}>
                <button
                  className="btn text-primary px-3 py-1"
                  style={{
                    border: "none",
                    cursor: "pointer",
                    backgroundColor: "#f8f9fa",
                    borderRadius: "4px",
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    if (uploadedFiles[itm?.id]?.url) {
                      setShowPdfModal(true);
                      setSelectedPdf(uploadedFiles[itm?.id].url);
                    }
                  }}
                >
                  {uploadedFiles[itm?.id].name}
                </button>
                <button
                  className="btn btn-danger px-3 py-1 ms-2"
                  onClick={(e) => {
                    e.preventDefault();
                    deleteFloorPlan(itm?.id);
                  }}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        </td>
      </tr>
    ));
  };
  
  return (
    <div
      style={{
        display: updateSite?.isViewMode ? "none" : "block",
      }}
    >
      {showPdfModal && (
        <PdfViewer
          showPdfModal={showPdfModal}
          setShowPdfModal={setShowPdfModal}
          selectedPdf={selectedPdf}
        />
      )}
      <h5 className="pt-5 text-start">Update Floor Plan</h5>
      <div className="table-responsive">
        <table
          style={{
            borderCollapse: "separate",
            borderSpacing: "2rem",
            textAlign: "justify",
          }}
        >
          <thead>
            <tr>
              <th>Floor Name</th>
              <th>Floor Image</th>
            </tr>
          </thead>
          <tbody>{getFloorPlanInputs()}</tbody>
        </table>
      </div>
      <div className="row">
        <div className="col-md-3">
          <button disabled={!isManagerAdminLogin(loggedInUserData)} className="btn btn-primary" onClick={() => sendFloorPlan()}>
            Upload All
          </button>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  error: state.site.siteLayoutFailure,
  updateSite: state.site.updateSite,
  siteLayout: state.site.siteLayout,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { uploadFloorPlan, setLoader, getSiteDetailsById })(
  UpdateFloor
);
