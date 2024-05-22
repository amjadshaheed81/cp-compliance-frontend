import React, { Fragment } from "react";
import "./BreadCrumHeader.css";

const BreadCrumHeader = ({ header, page, style }) => {
  return (
    <Fragment>
      <div class="d-flex bd-highlight">
        <div class="pt-2 bd-highlight">
          <h4 style={style}>{header}</h4>
        </div>
        <div class="ms-auto p-2 bd-highlight">
          <nav aria-label="breadcrumb pt-1">
            <ol class="breadcrumb">
              <li class="breadcrumb-item pt-0">
                <a href="/#/dashboard">Dashboard</a>
              </li>
              <li class="breadcrumb-item active pt-0" aria-current="page">
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
