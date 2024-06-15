import React, { Fragment, useState } from "react";
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

const Assets = () => {
  // tab value
  const [value, setValue] = useState("1");
  const tabChange = (event, newValue) => {
    event?.preventDefault();
    setValue(newValue);
  };
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Asset Register"} page={"Assets"} />

          <Box sx={{ width: "100%", typography: "body1" }}>
            <TabContext value={value}>
              <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
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
              <TabPanel value="2"><Door /></TabPanel>
              <TabPanel value="3"><Pat /></TabPanel>
              <TabPanel value="4"><PassiveFireProtection /></TabPanel>
            </TabContext>
          </Box>
          {/*  */}
          {/*  */}
        </div>
      </div>
    </Fragment>
  );
};
const mapStateToProps = () => ({});
export default connect(mapStateToProps, {})(Assets);
