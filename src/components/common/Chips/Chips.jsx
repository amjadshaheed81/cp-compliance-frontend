import { Chip } from "@mui/material";
import React, { Fragment } from "react";

const ChipComponent = ({ status, isStatutory }) => {
  return (
    <Fragment>
      {status && (
        <Chip
          label={
            isStatutory
              ? status === "Open"
                ? "Open"
                : status === "Passed"
                ? "Passed"
                : ""
              : status
          }
          color={
            status === "Active" || status === "Passed"
              ? "success"
              : status === "Terminated"
              ? "error"
              : "warning"
          }
        />
      )}
    </Fragment>
  );
};
export default ChipComponent;
