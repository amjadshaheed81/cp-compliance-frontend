import * as React from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useState } from "react";
import TabPanel from "../../../common/TabPanel/TabPanel";

const FloorMap = ({ siteLayout }) => {
  const [tabValue, setTabValue] = useState(null);
  const handleChange = (event, newValue) => {
    console.log("newValue", newValue);
    setTabValue(newValue);
  };
  const getTabLabel = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm) => <Tab label={itm?.nodeName} />);
  };

  const getTabPanel = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm, newValue) => (
      <TabPanel value={tabValue} index={newValue}>
        {itm?.floorPlanUrl ? (
          <embed  src={itm?.floorPlanUrl} width="auto" height="auto"></embed >
        ) : (
          "Floor plan file is not available."
        )}
      </TabPanel>
    ));
  };
  return (
    <div>
      <h5 className="pt-5 text-start">Floor Map</h5>
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
          value={tabValue}
          onChange={handleChange}
          aria-label="Vertical tabs example"
          sx={{ borderRight: 1, borderColor: "divider" }}
        >
          {getTabLabel()}
        </Tabs>
        {getTabPanel()}
      </Box>
    </div>
  );
};
export default FloorMap;
