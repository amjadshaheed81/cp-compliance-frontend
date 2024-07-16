import { Chip } from "@mui/material";
import React, { Fragment } from "react";

const ChipComponent = ({ status }) => {
  return (
    <Fragment>
      <Chip
        label={status === 'Open' ? 'Open' : status}
        color={
          status === "Active" || status === "Passed"
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
