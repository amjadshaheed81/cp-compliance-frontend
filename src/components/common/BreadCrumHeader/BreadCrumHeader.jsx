import React from "react";
import "./BreadCrumHeader.css";

/**
 * Legacy print-only page title. The onscreen route breadcrumb is now rendered
 * centrally in the compact Header; do not duplicate it in the page body.
 * Folder-navigation trails and in-form certificate headings are separate.
 */
const BreadCrumHeader = ({ header, chipLabel }) => (
  header ? (
    <div className="cafm-print-page-title">
      <h4>{header}</h4>
      {chipLabel && <span className="cafm-print-page-status">{chipLabel}</span>}
    </div>
  ) : null
);

export default BreadCrumHeader;
