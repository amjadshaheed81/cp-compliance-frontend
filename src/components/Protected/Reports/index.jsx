import React, { useState } from "react";
import { connect } from "react-redux";
import {
  addUser,
  addUserTagSite,
  getSites,
  setLoggedInUser,
} from "../../../store/thunk/site";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import PropTypes from "prop-types";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Typography from "@mui/material/Typography";
import Box from "@mui/material/Box";
import SiteCharts from "./Portfolio/SiteCharts";
import Assets from "./Assets/Assets";
import AssetChart from "./Assets/AssetChart";
import Contracts from "./Contracts/Contracts";
import SiteChecks from "./SiteChecks/SiteChecks";
import EnergyCost from "./EnergyCost/EnergyCost";
import EnergyConsumption from "./EnergyConsumption/EnergyCost";
import StatutoryRegister from "./StatutoryRegister/StatutoryRegister";
import Actions from "./Actions/Actions";
import BasicReports from "./BasicReports/BasicReports";
import NewAssets from "./Assets/NewAssets";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          <Typography>{children}</Typography>
        </Box>
      )}
    </div>
  );
}

TabPanel.propTypes = {
  children: PropTypes.node,
  index: PropTypes.number.isRequired,
  value: PropTypes.number.isRequired,
};

function a11yProps(index) {
  return {
    id: `vertical-tab-${index}`,
    "aria-controls": `vertical-tabpanel-${index}`,
  };
}

const Reports = ({}) => {
  const [value, setValue] = useState(0);
  const [siteChart, setSiteChart] = useState({
    totalSites: 0,
    openSites: 0,
    soldSites: 0,
    closedSites: 0,
  });
  const [assetChart, setAssetChart] = useState({
    totalAssets: 0,
    patAssets: 0,
    psfAssets: 0,
    otherAssets: 0,
  });

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <React.Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Reports"} page={"Reports"} />
          <Box>
            <Tabs
              variant="scrollable"
              value={value}
              onChange={handleChange}
              aria-label="Vertical tabs example"
              sx={{ borderRight: 1, borderColor: "divider" }}
            >
              <Tab label="Portfolio Report" {...a11yProps(0)} />
              <Tab label="Asset Report" {...a11yProps(1)} />
              <Tab label="New Asset Report" {...a11yProps(3)} />
              <Tab label="Contract Report" {...a11yProps(2)} />
              {/* <Tab label="Worksheet" {...a11yProps(3)} /> */}
              <Tab label="Energy Report" {...a11yProps(4)} />
              {/* <Tab label="Site Checks" {...a11yProps(5)} /> */}
              <Tab label="Statutory Register" {...a11yProps(5)} />
              <Tab label="Actions" {...a11yProps(6)} />
              <Tab label="Basic Reports" {...a11yProps(7)} />
              <Tab label="Energy Consumption" {...a11yProps(8)} />
            </Tabs>
            <TabPanel value={value} index={0}>
              <SiteCharts siteChart={siteChart} setSiteChart={setSiteChart} />
            </TabPanel>
            <TabPanel value={value} index={1}>
              <div className="row">
                <Assets />
              </div>
            </TabPanel>
            <TabPanel value={value} index={2}>
              <div className="row">
                <NewAssets />
              </div>
            </TabPanel>
            <TabPanel value={value} index={3}>
              <div className="row">
                <Contracts />
              </div>
            </TabPanel>
            <TabPanel value={value} index={4}>
              <div className="row">
                <EnergyCost />
              </div>
            </TabPanel>
            {/* <TabPanel value={value} index={4}>
              <div className="row">
                <SiteChecks />
              </div>
            </TabPanel> */}
            <TabPanel value={value} index={5}>
              <div className="row">
                <StatutoryRegister />
              </div>
            </TabPanel>
            <TabPanel value={value} index={6}>
              <div className="row">
                <Actions />
              </div>
            </TabPanel>
            <TabPanel value={value} index={7}>
              <div className="row">
                <BasicReports />
              </div>
            </TabPanel>
            <TabPanel value={value} index={8}>
              <div className="row">
                <EnergyConsumption />
              </div>
            </TabPanel>
          </Box>
        </div>
      </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
})(Reports);
