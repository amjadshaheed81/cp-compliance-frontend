import React, { Fragment, useEffect } from "react";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import NewAssetChart from "./NewAssetChart";

const NewAssets = ({ siteSelectedForGlobal }) => {
  // tab value
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
  }, [siteSelectedForGlobal]);

  return (
    <Fragment>
      <NewAssetChart />
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {})(NewAssets);
