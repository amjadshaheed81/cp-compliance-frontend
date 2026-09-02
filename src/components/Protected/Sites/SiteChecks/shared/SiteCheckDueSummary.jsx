import React from "react";
import {
  calculateSiteCheckDueDate,
  formatSiteCheckDisplayDate,
} from "../../../../../utils/siteCheckRecurrence";

const SiteCheckDueSummary = ({ inspectionDate, repeatFrequency }) => {
  const frequency = repeatFrequency || "None";
  const nextDueDate =
    frequency !== "None"
      ? calculateSiteCheckDueDate(inspectionDate, frequency)
      : null;

  return (
    <div className="mt-3" style={{ minWidth: "280px" }}>
      <div className="d-flex align-items-center justify-content-between mb-2">
        <span className="fw-bold me-3">Frequency</span>
        <span
          className="form-control text-end"
          style={{ backgroundColor: "#f8f9fa", maxWidth: "165px" }}
        >
          {frequency}
        </span>
      </div>
      <div className="d-flex align-items-center justify-content-between">
        <span className="fw-bold me-3">Next Due Date</span>
        <span
          className="form-control text-end"
          style={{ backgroundColor: "#f8f9fa", maxWidth: "165px" }}
        >
          {nextDueDate ? formatSiteCheckDisplayDate(nextDueDate) : ""}
        </span>
      </div>
    </div>
  );
};

export default SiteCheckDueSummary;
