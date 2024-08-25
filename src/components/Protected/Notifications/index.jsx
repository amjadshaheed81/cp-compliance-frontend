import React from "react";
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
import NotificationsIcon from "@mui/icons-material/Notifications";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import MessageSharp from "@mui/icons-material/MessageSharp";

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

const Notifications = ({}) => {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <React.Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Notifications"} page={"Notifications"} />
          <Box
            sx={{
              flexGrow: 1,
              bgcolor: "background.paper",
              display: "flex",
              height: 224,
            }}
          >
            <Tabs
              orientation="vertical"
              variant="scrollable"
              value={value}
              onChange={handleChange}
              aria-label="Vertical tabs example"
              sx={{ borderRight: 1, borderColor: "divider" }}
            >
              <Tab
                icon={<NotificationsIcon />}
                label="All Notifications"
                {...a11yProps(0)}
              />
              <Tab
                icon={<ElectricBoltIcon />}
                label="For Actions"
                {...a11yProps(1)}
              />
              <Tab
                icon={<MessageSharp />}
                label="For Information"
                {...a11yProps(2)}
              />
            </Tabs>
            <TabPanel value={value} index={0}>
              <div className="row">
                <div className="col-md-12">All Notifications</div>
              </div>
            </TabPanel>
            <TabPanel value={value} index={1}>
              For Actions
            </TabPanel>
            <TabPanel value={value} index={2}>
              For Information
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
})(Notifications);
