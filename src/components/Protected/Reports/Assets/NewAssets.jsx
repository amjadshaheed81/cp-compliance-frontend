import React, { Fragment, useEffect } from "react";
import { connect } from "react-redux";
import Swal from "sweetalert2";
import AssetChart from "./AssetChart";

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
      <AssetChart />
    </Fragment>
  );
};
const mapStateToProps = (state) => ({
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {})(NewAssets);
