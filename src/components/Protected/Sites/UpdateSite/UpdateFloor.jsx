import { useForm } from "react-hook-form";
import { connect } from "react-redux";
import { uploadFloorPlan } from "./../../../../store/thunk/site";

const UpdateFloor = ({ siteLayout, uploadFloorPlan, updateSite }) => {
  const { register, getValues } = useForm({});
  const sendFloorPlan = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    let form_data = new FormData();
    const files = [];
    const data = [];
    list.forEach((itm) => {
      const file = getValues(`floorImage-${itm?.id}`);
      if (file?.length) {
        files.push(file?.[0]);
        data.push({
          nodeId: itm?.id,
          fileName: file?.[0].name,
        });
      }
    });
    files.map((file) => {
      form_data.append("files", file, file?.name);
    });
    form_data.append("floorPlans", JSON.stringify(data));
    uploadFloorPlan(form_data, updateSite?.siteId);
  };
  const getFloorPlanInputs = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm) => (
      <tr key="FloorName">
        <td>{itm?.nodeName}</td>
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
        <td>{
        itm?.floorPlanUrl ? <span className="badge bg-light text-primary cursor p-4"><a className="text-white" download href={itm?.floorPlanUrl}>{`${itm?.nodeName}.png`}</a></span> : null}</td>
      </tr>
    ));
  };
  return (
    <div style={{
      display: updateSite?.isViewMode ? "none" : "block",
    }}>
      <h5 className="pt-5 text-start">Update Floor Plan</h5>
      <table style={{ borderCollapse: "separate", borderSpacing: "2rem" }}>
        <thead>
          <tr>
            <td>Floor Name</td>
            <td>Floor Image</td>
          </tr>
        </thead>
        <tbody>{getFloorPlanInputs()}</tbody>
      </table>
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
export default connect(mapStateToProps, { uploadFloorPlan })(UpdateFloor);
