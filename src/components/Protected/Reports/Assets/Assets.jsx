import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  getSiteAssets,
  getSiteDoorAssets,
  getSitePATAssets,
  getSitePFPAssets,
} from "../../../../store/thunk/site";
import Swal from "sweetalert2";
import AssetChart from "./AssetChart";

const Assets = ({
  siteSelectedForGlobal,
  getSitePFPAssets,
  getSiteDoorAssets,
  getSitePATAssets,
  getSiteAssets,
}) => {
  // tab value
  const [value, setValue] = useState("1");
  const [assets, setAssets] = useState([]);
  const tabChange = (event, newValue) => {
    event?.preventDefault();
    setValue(newValue);
  };
  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getSitePFPAssets(siteSelectedForGlobal?.siteId);
      getSiteDoorAssets(siteSelectedForGlobal?.siteId);
      getSitePATAssets(siteSelectedForGlobal?.siteId);
      // getSiteAssetsData();
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
export default connect(mapStateToProps, {
  getSiteAssets,
  getSitePFPAssets,
  getSiteDoorAssets,
  getSitePATAssets,
})(Assets);
