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
          <nav aria-label="breadcrumb pt-1">
            <ol className="breadcrumb">
              <li className="breadcrumb-item pt-0">
                <a href="/#/dashboard">Dashboard</a>
              </li>
              <li className="breadcrumb-item active pt-0" aria-current="page">
                {page}
              </li>
            </ol>
          </nav>
        </div>
      </div>
    </Fragment>
  );
};
export default BreadCrumHeader;
