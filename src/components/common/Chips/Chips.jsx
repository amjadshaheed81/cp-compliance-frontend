import { Chip } from "@mui/material";
import React, { Fragment } from "react";

const ChipComponent = ({ status }) => {
  return (
    <Fragment>
      <Chip
        label={status}
        color={
          status === "Active"
            ? "success"
            : status === "Terminated"
            ? "error"
            : "warning"
        }
      />
    </Fragment>
  );
};
export default ChipComponent;
