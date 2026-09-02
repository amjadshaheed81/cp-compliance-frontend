import React from "react";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";

const SiteCheckBackButton = ({ onClick }) => {
  const handleClick = onClick || (() => window.history.back());

  return (
    <button
      type="button"
      className="btn btn-danger d-inline-flex align-items-center justify-content-center gap-1 px-3 rounded-2 shadow-sm fw-semibold"
      onClick={handleClick}
      aria-label="Go back"
    >
      <ArrowBackRoundedIcon fontSize="small" />
      <span>Back</span>
    </button>
  );
};

export default SiteCheckBackButton;
