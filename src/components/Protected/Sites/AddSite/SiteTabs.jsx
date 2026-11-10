import React, { useEffect } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
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

export default function SiteTabs({ tabs, isCreateSite }) {
  const [value, setValue] = React.useState(0);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };
  return (
    <>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid" style={{ paddingTop: "8px", paddingBottom: "16px" }}>
        <Box sx={{ borderBottom: 1, borderColor: "divider" }}>
          <Tabs
          className="row"
            value={value}
            onChange={handleChange}
            aria-label="basic tabs example"
          >
            {tabs?.map(({ label }, i) => (
              <Tab
                className="col"
                label={label}
                key={i}
                disabled={isCreateSite && (i === 1 || i === 2)}
              />
            ))}
          </Tabs>
        </Box>
        {tabs?.map(({ Component }, i) => (
          <TabPanel value={value} index={i} key={i}>
            {Component}
          </TabPanel>
        ))}
        </div>
      </div>
    </>
  );
}
