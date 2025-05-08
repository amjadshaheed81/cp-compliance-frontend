import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import Tab from "@mui/material/Tab";
import TabContext from "@mui/lab/TabContext";
import TabList from "@mui/lab/TabList";
import TabPanel from "@mui/lab/TabPanel";
import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import Summary from "./Summary";
import Door from "./Door";
import Pat from "./Pat";
import PassiveFireProtection from "./PassiveFireProtection";
import {
  getSiteAssets,
  getSiteDoorAssets,
  getSitePATAssets,
  getSitePFPAssets,
} from "../../../../store/thunk/site";
import Swal from "sweetalert2";

const Assets = ({
  siteSelectedForGlobal,
  getSiteAssets,
  getSitePFPAssets,
  getSiteDoorAssets,
  getSitePATAssets,
}) => {
  // tab value
  const [value, setValue] = useState("1");
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
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
  }, []);
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Asset Register"} page={"Assets"} />

          <Box sx={{ width: "100%", typography: "body1" }}>
            <TabContext value={value}>
              <Box
                sx={{
                  "& .MuiTabs-flexContainer": {
                    flexWrap: "wrap",
                  },
                }}
              >
                <TabList onChange={tabChange} aria-label="lab API tabs example">
                  <Tab label="Summary" value="1" />
                  <Tab label="Doors" value="2" />
                  <Tab label="PAT" value="3" />
                  <Tab label="Passive Fire Protection" value="4" />
                </TabList>
              </Box>
              <TabPanel value="1">
                <Summary />
              </TabPanel>
              <TabPanel value="2">
                <Door />
              </TabPanel>
              <TabPanel value="3">
                <Pat />
              </TabPanel>
              <TabPanel value="4">
                <PassiveFireProtection />
              </TabPanel>
            </TabContext>
          </Box>
          {/*  */}
          {/*  */}
        </div>
      </div>
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
