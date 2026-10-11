import React, { useEffect, useState } from "react";
import axios from "axios";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import FullscreenRoundedIcon from "@mui/icons-material/FullscreenRounded";
import VerticalSplitRoundedIcon from "@mui/icons-material/VerticalSplitRounded";
import FactCheckRoundedIcon from "@mui/icons-material/FactCheckRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import DoneRoundedIcon from "@mui/icons-material/DoneRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import { Menu, MenuItem, ListItemIcon, ListItemText } from "@mui/material";
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
  onCopy,
  onMarkDone,
  onDelete,
}) => {
  const [headerActionTarget, setHeaderActionTarget] = useState(null);
  const [actionsMenuAnchor, setActionsMenuAnchor] = useState(null);
  const [liveSiteCheckSummary, setLiveSiteCheckSummary] = useState(siteCheckSummary || null);

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
    setLiveSiteCheckSummary(siteCheckSummary || null);
  }, [checkId, siteCheckSummary]);

  // Do not leave an action menu open when navigating to a different check.
  useEffect(() => {
    setActionsMenuAnchor(null);
  }, [checkId]);

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
  const headerSummary = liveSiteCheckSummary || siteCheckSummary;
  const closeActionsMenu = () => setActionsMenuAnchor(null);
  const runHeaderAction = (handler) => {
    closeActionsMenu();
    if (headerSummary) handler?.(headerSummary);
  };
  const titleParts = [
    headerSummary?.type,
    headerSummary?.subType,
    headerSummary?.category,
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
              {headerSummary?.status && (
                <span
                  className={`site-check-workspace__status site-check-workspace__status--${String(
                    headerSummary.status
                  ).toLowerCase()}`}
                >
                  {headerSummary.status}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="site-check-workspace__actions">
          {/* Keep time-sensitive inspection actions visible in the header. */}
          <div
            ref={setHeaderActionTarget}
            className="site-check-workspace__context-actions"
          />

          <div className="site-check-workspace__grid-actions" aria-label="Inspection actions">
            <button
              type="button"
              className="site-check-workspace__icon-button site-check-workspace__more-button"
              onClick={(event) => setActionsMenuAnchor(event.currentTarget)}
              disabled={!headerSummary}
              title="More inspection actions"
              aria-label="More inspection actions"
              aria-haspopup="menu"
              aria-expanded={Boolean(actionsMenuAnchor)}
              aria-controls={actionsMenuAnchor ? "site-check-workspace-actions-menu" : undefined}
            >
              <MoreVertRoundedIcon fontSize="small" />
            </button>
            <Menu
              id="site-check-workspace-actions-menu"
              anchorEl={actionsMenuAnchor}
              open={Boolean(actionsMenuAnchor)}
              onClose={closeActionsMenu}
              anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
              transformOrigin={{ vertical: "top", horizontal: "right" }}
              MenuListProps={{ "aria-label": "Inspection actions" }}
              PaperProps={{ sx: { minWidth: 195, borderRadius: 2 } }}
              sx={{ zIndex: 1450 }}
            >
              <MenuItem onClick={() => runHeaderAction(onCopy)} disabled={!headerSummary}>
                <ListItemIcon><ContentCopyRoundedIcon fontSize="small" /></ListItemIcon>
                <ListItemText>Copy Site Check</ListItemText>
              </MenuItem>
              {headerSummary?.subType !== "Monthly Audit" && (
                <MenuItem
                  onClick={() => runHeaderAction(onMarkDone)}
                  disabled={!headerSummary || headerSummary.status === "Done"}
                >
                  <ListItemIcon><DoneRoundedIcon fontSize="small" /></ListItemIcon>
                  <ListItemText>Mark Done</ListItemText>
                </MenuItem>
              )}
              <MenuItem onClick={() => runHeaderAction(onDelete)} disabled={!headerSummary}>
                <ListItemIcon><DeleteOutlineRoundedIcon color="error" fontSize="small" /></ListItemIcon>
                <ListItemText>Delete Site Check</ListItemText>
              </MenuItem>
            </Menu>
          </div>

          {/* The view-mode control sits directly beside Close. */}
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
          onSiteCheckUpdated={setLiveSiteCheckSummary}
        />
      </div>
    </section>
  );
};

export default SiteCheckWorkspace;
