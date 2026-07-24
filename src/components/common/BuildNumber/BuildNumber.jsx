import React from "react";
import Box from "@mui/material/Box";
import {
  getBuildInfo,
  getBuildTooltip,
  isBuildNumberVisible,
} from "../../../utils/buildInfo";

const BuildNumber = ({ sx = {} }) => {
  if (!isBuildNumberVisible()) {
    return null;
  }

  const buildInfo = getBuildInfo();

  return (
    <Box
      component="div"
      title={getBuildTooltip()}
      data-testid="application-build-number"
      sx={{
        fontSize: "0.72rem",
        lineHeight: 1.4,
        opacity: 0.72,
        textAlign: "center",
        userSelect: "text",
        ...sx,
      }}
    >
      Build {buildInfo.buildNumber}
    </Box>
  );
};

export default BuildNumber;
