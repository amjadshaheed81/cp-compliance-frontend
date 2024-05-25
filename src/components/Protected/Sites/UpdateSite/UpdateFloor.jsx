import { connect } from "react-redux";

const UpdateFloor = ({ siteLayout }) => {
  const getFloorPlanInputs = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm) => (
      <tr key="FloorName">
        <td>{itm?.nodeName}</td>
        <td>
          <input
            // {...register("siteImage")}
            className="form-control"
            type="file"
            name="siteImage"
            accept="image/*, application/pdf"
            id="siteImage"
            // onChange={handleFileSelect}
          />
        </td>
        <td></td>
      </tr>
    ));
  };
  return (
    <div>
      <h5 class="pt-5 text-start">Update Floor Plan</h5>
      <table style={{ borderCollapse: "separate", borderSpacing: "2rem" }}>
        <thead>
          <tr>
            <td>Floor Name</td>
            <td>Floor Image</td>
          </tr>
        </thead>
        <tbody>{getFloorPlanInputs()}</tbody>
      </table>
    </div>
  );
};
const mapStateToProps = (state) => ({
  error: state.site.siteLayoutFailure,
  updateSite: state.site.updateSite,
  siteLayout: state.site.siteLayout,
});
export default connect(mapStateToProps, {})(UpdateFloor);
