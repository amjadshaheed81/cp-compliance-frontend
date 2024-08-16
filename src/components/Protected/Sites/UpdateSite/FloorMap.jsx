import React, { useEffect } from "react";
import Tabs from "@mui/material/Tabs";
import Tab from "@mui/material/Tab";
import Box from "@mui/material/Box";
import { useState } from "react";
import TabPanel from "../../../common/TabPanel/TabPanel";

const FloorMap = ({ siteLayout }) => {
  const [tabValue, setTabValue] = useState(null);
  const [positionOption, setPositionOption] = useState([]);
  useEffect(() => {
    const positions = siteLayout?.filter((itm) => itm?.nodeType === "position");
    setPositionOption(positions || []);
  }, [siteLayout]);
  const getParentNodeName = (id) => {
    return positionOption?.filter((itm) => itm?.id === id)?.[0]?.nodeName;
  };
  const handleChange = (event, newValue) => {
    setTabValue(newValue);
  };
  const getTabLabel = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm) => (
      <Tab label={`${getParentNodeName(itm?.parentNode)}: ${itm?.nodeName}`} />
    ));
  };

  const getTabPanel = () => {
    const list = siteLayout?.filter((itm) => itm?.nodeType === "floor");
    return list?.map((itm, newValue) => (
      <TabPanel value={tabValue} index={newValue}>
        {itm?.floorPlanUrl ? (
          <embed src={itm?.floorPlanUrl} width="500px" height="auto"></embed>
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
