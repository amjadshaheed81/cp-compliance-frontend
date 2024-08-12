import React, { Fragment } from "react";
import "./BreadCrumHeader.css";
import { Chip } from "@mui/material";

const BreadCrumHeader = ({ header, page, style, chipColor, chipLabel }) => {
  return (
    <Fragment>
      <div className="d-flex bd-highlight ">
        <div className="pt-2 bd-highlight" style={{display: 'flex'}}>
          <h4 style={style}>{header}
            
          </h4>
          {chipLabel && <Chip
            color={chipColor}
            label={chipLabel}
            style={{ marginLeft: '10px' }}
          />}
        </div>
        <div className="ms-auto p-2 bd-highlight dont-print">
          <span><a href="/#/dashboard">Dashboard</a> / {page}</span>
        </div>
      </div>
    </Fragment>
  );
};
export default BreadCrumHeader;
