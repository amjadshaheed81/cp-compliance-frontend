import { useForm } from "react-hook-form";
import { connect } from "react-redux";

const UpdateFloor = ({ siteLayout }) => {
  const { register } = useForm({});
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
