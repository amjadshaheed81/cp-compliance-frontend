import React, { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { toast } from "react-toastify";
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";

import Header from "../../../common/Header/Header";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { get, post } from "../../../../api";
import { calculateSiteCheckDueDate } from "../../../../utils/siteCheckRecurrence";
import { ROLE } from "../../../../Constant/Role";
import { getMonthlyAuditContext, monthlyAuditError } from "./shared/monthlyAuditWorkflow";

const problemLabels = {
  DUE_DATE_MISMATCH: "Due date mismatch",
  MISSING_DUE_DATE: "Missing due date",
  MISSING_START_DATE: "Missing start date",
  OVERDUE_BUT_DONE: "Overdue but still Done",
  MISSED_REOPEN: "Missed reopen window",
  UNSUPPORTED_FREQUENCY: "Unsupported frequency",
  FREQUENCY_FORMAT_MISMATCH: "Frequency format mismatch",
};

const actionLabels = {
  CORRECT_DUE_DATE: "Correct Due Date",
  REOPEN_EARLY: "Reopen Now",
  OPEN_MISSED_CYCLE: "Open Missed Cycle",
  REVIEW_ONLY: "Review Required",
};

const dateOnly = (value) => {
  if (!value) return "";
  return String(value).substring(0, 10);
};

const displayDate = (value) => {
  if (!value) return "-";
  const parsed = moment(dateOnly(value), "YYYY-MM-DD", true);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY") : "-";
};

const SiteCheckHealth = ({ siteSelectedForGlobal, loggedInUserData }) => {
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [cycleStartDate, setCycleStartDate] = useState("");
  const [reason, setReason] = useState("");
  const [pendingAction, setPendingAction] = useState(null);
  const [monthlyReview, setMonthlyReview] = useState(null);
  const [loadingMonthlyReview, setLoadingMonthlyReview] = useState(false);
  const reviewSequence = useRef(0);
  const recoveryRunning = useRef(false);

  const siteId = siteSelectedForGlobal?.siteId;
  const siteName = siteSelectedForGlobal?.siteName || "Selected Site";
  const isAdmin = loggedInUserData?.role === ROLE.ADMIN;
  const isMonthly = (item) => item?.type === "Audit" && item?.subType === "Monthly Audit";
  const selectedMonthly = isMonthly(selected);
  const monthlyOpenAction = selectedMonthly && ["REOPEN_EARLY", "OPEN_MISSED_CYCLE"].includes(selected?.recommendedAction);

  const loadHealth = async () => {
    if (!siteId || !isAdmin) return;
    setIsLoading(true);
    try {
      const data = await get(`/api/site-check/site/${siteId}/health`);
      const doneIssues = Array.isArray(data)
        ? data.filter((item) => String(item?.status || "").toLowerCase() === "done")
        : [];
      setIssues(doneIssues);
    } catch (error) {
      console.error("Failed to load Site Check health data", error);
      toast.error("Failed to load Site Check health data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadHealth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [siteId, isAdmin]);

  const openReview = async (item) => {
    const sequence = ++reviewSequence.current;
    setPendingAction(null);
    setSelected(item);
    setMonthlyReview(null);
    setLoadingMonthlyReview(false);
    setCycleStartDate(
      item?.suggestedCycleStartDate ||
        dateOnly(item?.expectedDueDate) ||
        dateOnly(item?.dueDate) ||
        dateOnly(item?.startDate) ||
        moment().format("YYYY-MM-DD")
    );
    setReason("");
    if (isMonthly(item) && ["REOPEN_EARLY", "OPEN_MISSED_CYCLE"].includes(item.recommendedAction)) {
      setLoadingMonthlyReview(true);
      try {
        const context = await getMonthlyAuditContext(item.checkId);
        if (sequence === reviewSequence.current) setMonthlyReview(context);
      } catch (error) {
        toast.error(monthlyAuditError(error, "The Monthly Audit could not be checked. Close and reopen this review."));
      } finally {
        if (sequence === reviewSequence.current) setLoadingMonthlyReview(false);
      }
    }
  };

  const nextDuePreview = useMemo(() => {
    if (!selected || !cycleStartDate) return null;
    if (String(selected.type || "").toLowerCase() === "inspection") {
      return cycleStartDate;
    }
    return calculateSiteCheckDueDate(
      cycleStartDate,
      selected.canonicalFrequency || selected.repeatFrequency
    );
  }, [selected, cycleStartDate]);

  const requestRecovery = (action) => {
    if (!selected) return;
    if (selectedMonthly && (!monthlyOpenAction || !monthlyReview?.canOpenEarly || !monthlyReview?.periodToken)) return;

    if (!selectedMonthly && action === "OPEN_MISSED_CYCLE" && !cycleStartDate) {
      toast.error("Cycle Start Date is required");
      return;
    }

    setPendingAction(action);
  };

  const runRecovery = async () => {
    if (!selected || !pendingAction || recoveryRunning.current) return;
    if (selectedMonthly && (!monthlyReview?.canOpenEarly || !monthlyReview?.periodToken)) return;

    const action = pendingAction;
    recoveryRunning.current = true;
    setIsRunning(true);
    try {
      const response = await post(`/api/site-check/recovery/${selected.checkId}`, {
        action,
        cycleStartDate: !selectedMonthly && action === "OPEN_MISSED_CYCLE" ? cycleStartDate : null,
        reason,
        ...(selectedMonthly ? { periodToken: monthlyReview.periodToken } : {}),
      });
      toast.success(response?.data?.message || "Site Check recovery completed");
      setPendingAction(null);
      setSelected(null);
      await loadHealth();
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.response?.data ||
        "Site Check recovery failed";
      toast.error(typeof message === "string" ? message : "Site Check recovery failed");
    } finally {
      recoveryRunning.current = false;
      setIsRunning(false);
    }
  };

  const closeReview = () => {
    if (isRunning) return;
    reviewSequence.current += 1;
    setPendingAction(null);
    setSelected(null);
    setMonthlyReview(null);
    setLoadingMonthlyReview(false);
  };

  const renderAction = () => {
    if (!selected) return null;
    if (selectedMonthly) {
      if (!monthlyOpenAction) return (
        <div className="alert alert-secondary mb-0">
          Monthly Audit dates are recorded from the actual Inspection Date when submitted. Open the audit to review its saved dates and History.
        </div>
      );
      if (loadingMonthlyReview) return <div className="alert alert-info mb-0">Checking this audit and its saved History…</div>;
      if (!monthlyReview?.canOpenEarly) return (
        <div className="alert alert-warning mb-0">
          The next Monthly Audit cannot open from this review. Open the audit and confirm its completed report and saved data in History first.
        </div>
      );
      return (
        <div className="alert alert-warning mb-0">
          <div className="fw-bold mb-2">Open next Monthly Audit</div>
          <div>{monthlyReview.nextCarryForwardEnabled
            ? "Previous answers will be copied for review. Previous photos remain in History."
            : "The next audit will start with blank answers."}</div>
          <div className="small mt-2">Saved History, PDFs and outstanding Actions remain available. The next due date will be calculated from the actual Inspection Date when the new audit is submitted.</div>
        </div>
      );
    }

    switch (selected.recommendedAction) {
      case "CORRECT_DUE_DATE":
        return (
          <div className="alert alert-warning mb-0">
            <div className="fw-bold mb-2">Recommended action: Correct Due Date</div>
            <div>
              Stored Due: <strong>{displayDate(selected.dueDate)}</strong>
            </div>
            <div>
              Expected Due: <strong>{displayDate(selected.expectedDueDate)}</strong>
            </div>
            <div className="small mt-2">
              This correction uses the stored Start Date and Repeat Frequency. Inspection records are deliberately excluded from this calculation.
            </div>
          </div>
        );
      case "REOPEN_EARLY":
        return (
          <div className="alert alert-warning mb-0">
            <div className="fw-bold mb-2">Recommended action: Reopen Now</div>
            <div>
              Expected reopen date: <strong>{displayDate(selected.expectedReopenDate)}</strong>
            </div>
            <div className="small mt-2">
              This mirrors the current early-reopen scheduler: status and closed audit/assessment responses are reopened, while Start Date and Due Date remain unchanged.
            </div>
          </div>
        );
      case "OPEN_MISSED_CYCLE":
        return (
          <div className="alert alert-warning mb-0">
            <div className="fw-bold mb-2">Recommended action: Open Missed Cycle</div>
            <label htmlFor="cycleStartDate" className="form-label">
              Cycle Start Date
            </label>
            <input
              id="cycleStartDate"
              type="date"
              className="form-control"
              value={cycleStartDate}
              max={moment().format("YYYY-MM-DD")}
              onChange={(e) => setCycleStartDate(e.target.value)}
            />
            <div className="mt-2">
              {String(selected.type || "").toLowerCase() === "inspection" ? (
                <span className="small">
                  Inspection: the Due Date stays on the selected cycle date until the inspection is submitted; the form then calculates the next due date from the actual Inspection Date.
                </span>
              ) : (
                <span>
                  Calculated Next Due: <strong>{displayDate(nextDuePreview)}</strong>
                </span>
              )}
            </div>
          </div>
        );
      default:
        return (
          <div className="alert alert-secondary mb-0">
            This record needs review before an automated recovery action can be run safely.
          </div>
        );
    }
  };

  if (!isAdmin) {
    return (
      <Fragment>
        <SidebarNew />
        <div className="content">
          <Header />
          <div className="container-fluid">
            <BreadCrumHeader header={"Site Check Health"} page={"Admin"} />
            <div className="alert alert-danger mt-3">Admin access is required.</div>
            <button className="btn btn-secondary" onClick={() => navigate("/site-checks")}>
              Back to Site Checks
            </button>
          </div>
        </div>
      </Fragment>
    );
  }

  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Site Check Health"} page={siteName} />

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 mb-3">
            <div>
              <h5 className="mb-1">{siteName}</h5>
              <div className="text-muted small">
                Only repeating Done Site Checks at this selected site with a potential date/scheduler problem are shown.
              </div>
            </div>
            <div className="d-flex gap-2">
              <button className="btn btn-light" onClick={() => navigate("/site-checks")}>
                <i className="fas fa-arrow-left me-2"></i>
                Back
              </button>
              <button className="btn btn-outline-primary" disabled={isLoading || !siteId} onClick={loadHealth}>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </button>
            </div>
          </div>

          {!siteId && (
            <div className="alert alert-warning">Please select a site before opening Site Check Health.</div>
          )}

          {siteId && (
            <div className="card shadow-sm">
              <div className="card-header bg-white d-flex justify-content-between align-items-center">
                <span className="fw-bold">Potential Problems</span>
                <span className="badge bg-danger">{issues.length}</span>
              </div>
              <div className="card-body p-0">
                <div className="table-responsive">
                  <table className="table table-hover mb-0 align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>Check</th>
                        <th>Type</th>
                        <th>Status</th>
                        <th>Start</th>
                        <th>Frequency</th>
                        <th>Stored Due</th>
                        <th>Expected Due</th>
                        <th>Problem</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {isLoading && (
                        <tr>
                          <td colSpan={9} className="text-center py-4">
                            <CircularProgress size={28} />
                          </td>
                        </tr>
                      )}
                      {!isLoading && issues.length === 0 && (
                        <tr>
                          <td colSpan={9} className="text-center py-4 text-success">
                            No potential Site Check recurrence/reopen problems were detected for this site.
                          </td>
                        </tr>
                      )}
                      {!isLoading &&
                        issues.map((item) => (
                          <tr key={item.checkId}>
                            <td>#{item.checkId}</td>
                            <td>
                              <div>{item.type || "-"}</div>
                              <div className="small text-muted">{item.subType || item.category || ""}</div>
                            </td>
                            <td>
                              <span className={`badge ${item.status === "Open" ? "bg-success" : "bg-secondary"}`}>
                                {item.status || "-"}
                              </span>
                            </td>
                            <td>{displayDate(item.startDate)}</td>
                            <td>{item.repeatFrequency || "-"}</td>
                            <td>{displayDate(item.dueDate)}</td>
                            <td>{displayDate(item.expectedDueDate)}</td>
                            <td style={{ minWidth: "220px" }}>
                              {(item.problems || []).map((problem) => (
                                <span key={problem} className="badge bg-warning text-dark me-1 mb-1">
                                  {problemLabels[problem] || problem}
                                </span>
                              ))}
                            </td>
                            <td>
                              <button className="btn btn-sm btn-outline-primary" onClick={() => openReview(item)}>
                                Review
                              </button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <Dialog open={Boolean(selected)} onClose={closeReview} maxWidth="md" fullWidth>
        <DialogTitle>Site Check Recovery {selected ? `#${selected.checkId}` : ""}</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <div>
              <div className="row g-3 mb-3">
                <div className="col-md-6">
                  <div className="small text-muted">Site</div>
                  <div className="fw-bold">{siteName}</div>
                </div>
                <div className="col-md-6">
                  <div className="small text-muted">Type</div>
                  <div className="fw-bold">
                    {selected.type || "-"} {selected.subType ? `- ${selected.subType}` : ""}
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="small text-muted">Status</div>
                  <div>{selected.status || "-"}</div>
                </div>
                <div className="col-md-3">
                  <div className="small text-muted">Start Date</div>
                  <div>{displayDate(selected.startDate)}</div>
                </div>
                <div className="col-md-3">
                  <div className="small text-muted">Stored Due</div>
                  <div>{displayDate(selected.dueDate)}</div>
                </div>
                <div className="col-md-3">
                  <div className="small text-muted">Frequency</div>
                  <div>{selected.repeatFrequency || "-"}</div>
                </div>
              </div>

              <div className="mb-3">
                <div className="small text-muted">Detected problem</div>
                <div>{selected.problemSummary || "-"}</div>
              </div>

              {renderAction()}

              <div className="mt-3">
                <label htmlFor="recoveryReason" className="form-label">
                  Recovery Note
                </label>
                <textarea
                  id="recoveryReason"
                  className="form-control"
                  rows={2}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Optional note for this manual recovery"
                />
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={isRunning} onClick={closeReview}>
            Cancel
          </Button>
          {selected?.recommendedAction && selected.recommendedAction !== "REVIEW_ONLY" && (!selectedMonthly || monthlyOpenAction) && (
            <Button
              variant="contained"
              color="primary"
              disabled={isRunning || loadingMonthlyReview || (selectedMonthly && !monthlyReview?.canOpenEarly)}
              onClick={() => requestRecovery(selected.recommendedAction)}
            >
              {isRunning ? "Running..." : actionLabels[selected.recommendedAction] || "Run Recovery"}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(pendingAction)}
        onClose={() => !isRunning && setPendingAction(null)}
        maxWidth="sm"
        fullWidth
        sx={{ zIndex: (theme) => theme.zIndex.modal + 10 }}
      >
        <DialogTitle>{actionLabels[pendingAction] || "Confirm Recovery"}</DialogTitle>
        <DialogContent dividers>
          {selected && (
            <div>
              <div className="mb-2">
                Site: <strong>{siteName}</strong>
              </div>
              <div className="mb-2">
                Site Check: <strong>#{selected.checkId}</strong>
              </div>
              {!selectedMonthly && pendingAction === "OPEN_MISSED_CYCLE" ? (
                <div>
                  Cycle Start Date: <strong>{displayDate(cycleStartDate)}</strong>
                </div>
              ) : (
                <div>{selected.problemSummary || "Please confirm this recovery action."}</div>
              )}
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button disabled={isRunning} onClick={() => setPendingAction(null)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            color="warning"
            disabled={isRunning || (selectedMonthly && !monthlyReview?.canOpenEarly)}
            onClick={runRecovery}
          >
            {isRunning ? "Running..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps)(SiteCheckHealth);
