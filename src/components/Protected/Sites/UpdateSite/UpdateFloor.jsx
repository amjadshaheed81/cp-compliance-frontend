import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import { setLoader, uploadFloorPlan } from "./../../../../store/thunk/site";
import { toast } from "react-toastify";
import PdfViewer from "../Documents/PdfViewer";

const UpdateFloor = ({
  siteLayout,
  uploadFloorPlan,
  updateSite,
  setLoader,
}) => {
  const { register, getValues } = useForm({});
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [positionOption, setPositionOption] = useState([]);
  useEffect(() => {
    const positions = siteLayout?.filter((itm) => itm?.nodeType === "position");
    setPositionOption(positions || []);
  }, [siteLayout]);
  const getParentNodeName = (id) => {
    return siteLayout?.filter((itm) => itm?.id === id)?.[0]?.nodeName;
  };

  const sendFloorPlan = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    let form_data = new FormData();
    const files = [];
    const data = [];
    let isValidForm = true;

    list.forEach((itm) => {
      const file = getValues(`floorImage-${itm?.id}`);
      if (file?.length) {
        const fileType = file[0].type;
        const validTypes = ["image/jpeg", "image/jpg", "image/png"];
        
        if (validTypes.includes(fileType)) {
          files.push(file[0]);
          data.push({
            nodeId: itm?.id,
            fileName: file[0].name,
          });
        } else {
          toast.warn(`Unsupported file type: ${fileType}. Only JPG, JPEG, and PNG are allowed.`);
          isValidForm = false;
        }
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
  const getFloorPlanInputs = () => {
    console.log("siteLayout", siteLayout);
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm) => (
      <tr key="FloorName">
        <td>
          {getParentNodeName(itm?.parentNode)}: {itm?.nodeName}
        </td>
        <td>
          <input
            {...register(`floorImage-${itm?.id}`)}
            className="form-control"
            type="file"
            name={`floorImage-${itm?.id}`}
            accept="image/*, application/pdf"
            id={`floorImage-${itm?.id}`}
          />
        </td>
        <td>
          {itm?.floorPlanUrl ? (
            <button
              style={{
                border: "none",
                cursor: "pointer",
                color: "blue",
                marginTop: "2px",
              }}
              onClick={(e) => {
                console.log("itm", itm);
                e?.preventDefault();
                setShowPdfModal(true);
                setSelectedPdf(itm?.floorPlanUrl);
              }}
            >
             {itm?.fileName ?  itm?.fileName : `${itm?.nodeName}.png`}
            </button>
          ) : null}
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
          <button className="btn btn-primary" onClick={() => sendFloorPlan()}>
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
});
export default connect(mapStateToProps, { uploadFloorPlan, setLoader })(
  UpdateFloor
);
