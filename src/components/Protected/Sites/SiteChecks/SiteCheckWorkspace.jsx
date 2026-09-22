import React, { useEffect, useState } from "react";
import axios from "axios";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import VerticalSplitRoundedIcon from "@mui/icons-material/VerticalSplitRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import UpdateSiteCheck from "./UpdateSiteCheck";
import { toast } from "react-toastify";
import {
  API_REQUEST_FAILED_EVENT,
  notifyApiRequestFailed,
  notifySiteCheckDataChanged,
} from "../../../../api";
import "./SiteCheckWorkspace.css";

const SiteCheckWorkspace = ({
  checkId,
  siteCheckSummary,
  displayMode = "full",
  onModeChange,
  onClose,
}) => {
  const [headerActionTarget, setHeaderActionTarget] = useState(null);

  useEffect(() => {
    const interceptorId = axios.interceptors.response.use(
      (response) => {
        const method = String(response?.config?.method || "").toUpperCase();
        if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
          notifySiteCheckDataChanged(response?.config?.url, method);
        }
        return response;
      },
      (error) => {
        notifyApiRequestFailed(error);
        return Promise.reject(error);
      }
    );

    return () => axios.interceptors.response.eject(interceptorId);
  }, []);

  useEffect(() => {
    let lastFailureSignature = "";
    let lastFailureAt = 0;

    const handleApiFailure = (event) => {
      const detail = event?.detail || {};
      if (Number(detail.status) < 500) return;

      const path = String(detail.path || detail.url || "unknown endpoint");
      const method = String(detail.method || "GET").toUpperCase();
      const signature = `${detail.status}:${method}:${path}`;
      const now = Date.now();

      // Multiple components can report the same failed request. Keep the
      // diagnostic useful without flooding the user with duplicate toasts.
      if (signature === lastFailureSignature && now - lastFailureAt < 2500) {
        return;
      }

      lastFailureSignature = signature;
      lastFailureAt = now;
      console.error("[Site Check Workspace API Failure]", detail);
      toast.error(
        `Site Check request failed (${detail.status}): ${method} ${path}`
      );
    };

    window.addEventListener(API_REQUEST_FAILED_EVENT, handleApiFailure);
    return () =>
      window.removeEventListener(API_REQUEST_FAILED_EVENT, handleApiFailure);
  }, []);

  if (!checkId) return null;

  const isFullScreen = displayMode !== "half";
  const toggleDisplayMode = () => {
    const nextMode = isFullScreen ? "half" : "full";
    onModeChange?.(nextMode);
  };
  const titleParts = [
    siteCheckSummary?.type,
    siteCheckSummary?.subType,
    siteCheckSummary?.category,
  ].filter(Boolean);

  return (
    <section
      className={`site-check-workspace ${
        isFullScreen
          ? "site-check-workspace--full"
          : "site-check-workspace--half"
      }`}
      aria-label="Site Check inspection workspace"
    >
      <header className="site-check-workspace__header print-hide">
        <div className="site-check-workspace__identity">
          <div className="site-check-workspace__brand-icon" aria-hidden="true">
            <FactCheckRoundedIcon fontSize="small" />
          </div>
          <div className="site-check-workspace__heading">
            <div className="site-check-workspace__title">
              {titleParts.length > 0
                ? titleParts.join(" · ")
                : `Inspection #${checkId}`}
            </div>
            <div className="site-check-workspace__meta">
              <span className="site-check-workspace__check-pill">Check #{checkId}</span>
              {siteCheckSummary?.status && (
                <span
                  className={`site-check-workspace__status site-check-workspace__status--${String(
                    siteCheckSummary.status
                  ).toLowerCase()}`}
                >
                  {siteCheckSummary.status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="site-check-workspace__actions">
          <div
            ref={setHeaderActionTarget}
            className="site-check-workspace__context-actions"
          />

          <button
            type="button"
            className="site-check-workspace__icon-button site-check-workspace__mode-button"
            onClick={toggleDisplayMode}
            title={isFullScreen ? "Show split view" : "Show full view"}
            aria-label={isFullScreen ? "Show split view" : "Show full view"}
          >
            {isFullScreen ? (
              <VerticalSplitRoundedIcon fontSize="small" />
            ) : (
              <FullscreenRoundedIcon fontSize="small" />
            )}
          </button>

          <button
            type="button"
            className="site-check-workspace__icon-button site-check-workspace__close-button"
            onClick={onClose}
            title="Close inspection"
            aria-label="Close inspection"
          >
            <CloseRoundedIcon fontSize="small" />
          </button>
        </div>
      </header>

      <div className="site-check-workspace__body">
        <UpdateSiteCheck
          key={`site-check-detail-${checkId}`}
          embedded
          checkIdOverride={checkId}
          onRequestClose={onClose}
          workspaceHeaderActionTarget={headerActionTarget}
        />
      </div>
    </section>
  );
};

export default SiteCheckWorkspace;
