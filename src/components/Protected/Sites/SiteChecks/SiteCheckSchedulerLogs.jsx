import React, { Fragment, useEffect, useMemo, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import moment from "moment";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
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
import { ROLE } from "../../../../Constant/Role";

const JOB_LABELS = {
  SITE_CHECK_DUE_NOTIFICATION_JOB: "Due Notifications",
  SITE_CHECK_OVERDUE_NOTIFICATION_JOB: "Overdue Notifications",
  SITE_CHECK_EARLY_REOPEN_JOB: "Early Reopen",
  SITE_CHECK_DUE_CYCLE_JOB: "Due Cycle Job",
  SITE_CHECK_AUTO_OPEN: "Site Check Auto Open",
  MONTHLY_AUDIT_DUE_CYCLE: "Monthly Audit Due Cycle",
  SITE_CHECK_DUE_CYCLE: "Site Check Due Cycle",
};

const formatDateTime = (value) => {
  if (!value) return "-";
  const parsed = moment(value);
  return parsed.isValid() ? parsed.format("DD/MM/YYYY HH:mm:ss") : "-";
};

const formatDuration = (startedAt, completedAt) => {
  if (!startedAt || !completedAt) return "-";
  const start = moment(startedAt);
  const end = moment(completedAt);
  if (!start.isValid() || !end.isValid()) return "-";
  const milliseconds = Math.max(0, end.diff(start));
  if (milliseconds < 1000) return `${milliseconds} ms`;
  if (milliseconds < 60000) return `${(milliseconds / 1000).toFixed(2)} s`;
  return `${(milliseconds / 60000).toFixed(2)} min`;
};

const statusClass = (status) => {
  switch (String(status || "").toUpperCase()) {
    case "SUCCESS":
      return "bg-success";
    case "FAILED":
      return "bg-danger";
    case "RUNNING":
      return "bg-warning text-dark";
    default:
      return "bg-secondary";
  }
};

const triggerClass = (triggerType) =>
  String(triggerType || "").toUpperCase() === "MANUAL"
    ? "bg-warning text-dark"
    : "bg-primary";

const prettyJson = (value) => {
  if (!value) return "-";
  try {
    return JSON.stringify(JSON.parse(value), null, 2);
  } catch (error) {
    return value;
  }
};

const SiteCheckSchedulerLogs = ({ loggedInUserData }) => {
  const navigate = useNavigate();
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [jobFilter, setJobFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [triggerFilter, setTriggerFilter] = useState("");
  const [entryFilter, setEntryFilter] = useState("");
  const [searchText, setSearchText] = useState("");
  const [manualSchedulerConfig, setManualSchedulerConfig] = useState(null);
  const [manualSchedulerRunning, setManualSchedulerRunning] = useState(false);

  const isAdmin = loggedInUserData?.role === ROLE.ADMIN;

  const loadLogs = async () => {
    if (!isAdmin) return;
    setIsLoading(true);
    try {
      const data = await get("/api/admin/jobs/scheduler/site-check?limit=200");
      setLogs(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load Site Check scheduler logs", error);
      toast.error("Failed to load Site Check scheduler logs");
    } finally {
      setIsLoading(false);
    }
  };

  const loadManualSchedulerStatus = async () => {
    if (!isAdmin) {
      setManualSchedulerConfig(null);
      return;
    }

    try {
      const status = await get(
        "/api/site-check/admin/scheduler/manual-run/status"
      );
      setManualSchedulerConfig(status);
    } catch (error) {
      // Developer feature may be disabled or unavailable. Keep Run Manual hidden.
      console.debug("Site Check manual scheduler feature is unavailable", error);
      setManualSchedulerConfig(null);
    }
  };

  useEffect(() => {
    loadLogs();
    loadManualSchedulerStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin]);

  const runManualSiteCheckScheduler = async () => {
    const jobs = manualSchedulerConfig?.jobs || [];
    if (!manualSchedulerConfig?.enabled || jobs.length === 0) {
      return;
    }

    const inputOptions = {};
    jobs.forEach((job) => {
      inputOptions[job.key] = `${job.label} (normal time ${job.scheduledTime})`;
    });

    const result = await Swal.fire({
      title: "Developer: Run Site Check Scheduler",
      html:
        "<strong>Admin test/developer feature.</strong><br/>" +
        "This runs the existing GLOBAL Site Check scheduler logic now for all matching sites. " +
        "Notification jobs may send notifications.",
      input: "select",
      inputOptions,
      inputPlaceholder: "Select one scheduler job",
      showCancelButton: true,
      confirmButtonText: "Run Now",
      inputValidator: (value) =>
        !value ? "Please select a scheduler job" : undefined,
    });

    if (!result.isConfirmed || !result.value) {
      return;
    }

    setManualSchedulerRunning(true);
    try {
      const response = await post(
        `/api/site-check/admin/scheduler/manual-run/${result.value}`,
        {}
      );
      toast.success(
        response?.data?.message || "Site Check scheduler job completed"
      );
      await loadLogs();
    } catch (error) {
      const message =
        error?.response?.data || "Failed to run Site Check scheduler job";
      toast.error(
        typeof message === "string"
          ? message
          : "Failed to run Site Check scheduler job"
      );
    } finally {
      setManualSchedulerRunning(false);
    }
  };

  const jobOptions = useMemo(
    () => Array.from(new Set(logs.map((item) => item.jobType).filter(Boolean))).sort(),
    [logs]
  );

  const filteredLogs = useMemo(() => {
    const search = searchText.trim().toLowerCase();

    return logs.filter((item) => {
      if (jobFilter && item.jobType !== jobFilter) return false;
      if (statusFilter && item.status !== statusFilter) return false;
      if (triggerFilter && item.triggerType !== triggerFilter) return false;
      if (entryFilter === "RUN" && item.entityType !== "SCHEDULER_JOB") return false;
      if (entryFilter === "CHECK" && item.entityType === "SCHEDULER_JOB") return false;

      if (!search) return true;

      return [
        item.executionId,
        item.jobType,
        item.jobAction,
        item.status,
        item.triggerType,
        item.siteId,
        item.checkId,
        item.triggeredByUserId,
        item.message,
        item.changeSummary,
        item.errorMessage,
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => String(value).toLowerCase().includes(search));
    });
  }, [logs, jobFilter, statusFilter, triggerFilter, entryFilter, searchText]);

  const runCount = logs.filter((item) => item.entityType === "SCHEDULER_JOB").length;
  const checkCount = logs.length - runCount;
  const failedCount = logs.filter(
    (item) => String(item.status || "").toUpperCase() === "FAILED"
  ).length;

  if (!isAdmin) {
    return (
      <Fragment>
        <SidebarNew />
        <div className="content">
          <Header />
          <div className="container-fluid">
            <BreadCrumHeader header={"Scheduler Logs"} page={"Admin"} />
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
          <BreadCrumHeader header={"Site Check Scheduler Logs"} page={"Admin"} />

          <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mt-2 mb-3">
            <div>
              <h5 className="mb-1">Site Check Scheduler Logs</h5>
              <div className="text-muted small">
                Latest scheduler run logs and per-Site-Check changes from the job execution audit table.
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2">
              <button className="btn btn-light" onClick={() => navigate("/site-checks")}>
                <i className="fas fa-arrow-left me-2"></i>
                Back
              </button>
              {manualSchedulerConfig?.enabled && (
                <button
                  className="btn btn-outline-warning"
                  disabled={manualSchedulerRunning}
                  onClick={runManualSiteCheckScheduler}
                  title="Admin developer/test feature: run one existing Site Check scheduler job now"
                >
                  <i className="fas fa-play me-2"></i>
                  {manualSchedulerRunning ? "Running Scheduler..." : "Run Manual Scheduler"}
                </button>
              )}
              <button className="btn btn-outline-primary" disabled={isLoading} onClick={loadLogs}>
                <i className="fas fa-sync-alt me-2"></i>
                Refresh
              </button>
            </div>
          </div>

          <div className="row g-2 mb-3">
            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-muted small">Loaded Logs</div>
                  <div className="fs-4 fw-bold">{logs.length}</div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-muted small">Scheduler Runs</div>
                  <div className="fs-4 fw-bold">{runCount}</div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-muted small">Site Check Changes</div>
                  <div className="fs-4 fw-bold">{checkCount}</div>
                </div>
              </div>
            </div>
            <div className="col-lg-3 col-md-6">
              <div className="card shadow-sm h-100">
                <div className="card-body py-3">
                  <div className="text-muted small">Failed</div>
                  <div className={`fs-4 fw-bold ${failedCount > 0 ? "text-danger" : "text-success"}`}>
                    {failedCount}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm mb-3">
            <div className="card-body py-3">
              <div className="row g-2">
                <div className="col-xl-3 col-md-6">
                  <select className="form-select" value={jobFilter} onChange={(e) => setJobFilter(e.target.value)}>
                    <option value="">All scheduler jobs</option>
                    {jobOptions.map((job) => (
                      <option key={job} value={job}>
                        {JOB_LABELS[job] || job}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-xl-2 col-md-6">
                  <select className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                    <option value="">All statuses</option>
                    <option value="SUCCESS">Success</option>
                    <option value="FAILED">Failed</option>
                    <option value="RUNNING">Running</option>
                  </select>
                </div>
                <div className="col-xl-2 col-md-6">
                  <select className="form-select" value={triggerFilter} onChange={(e) => setTriggerFilter(e.target.value)}>
                    <option value="">All triggers</option>
                    <option value="SCHEDULED">Scheduled</option>
                    <option value="MANUAL">Manual</option>
                    <option value="RETRY">Retry</option>
                  </select>
                </div>
                <div className="col-xl-2 col-md-6">
                  <select className="form-select" value={entryFilter} onChange={(e) => setEntryFilter(e.target.value)}>
                    <option value="">All entries</option>
                    <option value="RUN">Job runs only</option>
                    <option value="CHECK">Site Check changes</option>
                  </select>
                </div>
                <div className="col-xl-3 col-md-12">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search execution, check, site, message..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="card shadow-sm">
            <div className="card-header bg-white d-flex justify-content-between align-items-center">
              <span className="fw-bold">Execution History</span>
              <span className="badge bg-secondary">{filteredLogs.length}</span>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0 align-middle">
                  <thead className="table-dark">
                    <tr>
                      <th>Started</th>
                      <th>Job</th>
                      <th>Entry</th>
                      <th>Status</th>
                      <th>Trigger</th>
                      <th>Scheduled For</th>
                      <th>Site / Check</th>
                      <th>Duration</th>
                      <th>Result</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoading && (
                      <tr>
                        <td colSpan={10} className="text-center py-4">
                          <CircularProgress size={28} />
                        </td>
                      </tr>
                    )}
                    {!isLoading && filteredLogs.length === 0 && (
                      <tr>
                        <td colSpan={10} className="text-center py-4 text-muted">
                          No scheduler logs match the selected filters.
                        </td>
                      </tr>
                    )}
                    {!isLoading &&
                      filteredLogs.map((item) => (
                        <tr key={item.executionId}>
                          <td className="text-nowrap">{formatDateTime(item.startedAt)}</td>
                          <td style={{ minWidth: "175px" }}>
                            <div className="fw-semibold">{JOB_LABELS[item.jobType] || item.jobType || "-"}</div>
                            <div className="small text-muted">{item.jobAction || "-"}</div>
                          </td>
                          <td>
                            {item.entityType === "SCHEDULER_JOB" ? (
                              <span className="badge bg-dark">Job Run</span>
                            ) : (
                              <span className="badge bg-info text-dark">Site Check</span>
                            )}
                          </td>
                          <td>
                            <span className={`badge ${statusClass(item.status)}`}>{item.status || "-"}</span>
                          </td>
                          <td>
                            <span className={`badge ${triggerClass(item.triggerType)}`}>{item.triggerType || "-"}</span>
                            {item.triggeredByUserId ? (
                              <div className="small text-muted mt-1">User #{item.triggeredByUserId}</div>
                            ) : null}
                          </td>
                          <td className="text-nowrap">{formatDateTime(item.scheduledFor)}</td>
                          <td className="text-nowrap">
                            <div>Site: {item.siteId || "-"}</div>
                            <div>Check: {item.checkId ? `#${item.checkId}` : "-"}</div>
                          </td>
                          <td className="text-nowrap">{formatDuration(item.startedAt, item.completedAt)}</td>
                          <td style={{ minWidth: "280px", maxWidth: "430px" }}>
                            <div>{item.message || "-"}</div>
                            {item.changeSummary ? (
                              <div className="small text-muted mt-1 text-break">{item.changeSummary}</div>
                            ) : null}
                            {item.errorMessage ? (
                              <div className="small text-danger mt-1 text-break">{item.errorMessage}</div>
                            ) : null}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-outline-primary" onClick={() => setSelected(item)}>
                              Details
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={Boolean(selected)} onClose={() => setSelected(null)} maxWidth="lg" fullWidth>
        <DialogTitle>
          Scheduler Log {selected?.executionId ? `#${selected.executionId}` : ""}
        </DialogTitle>
        <DialogContent dividers>
          {selected && (
            <div>
              <div className="row g-3 mb-3">
                <div className="col-md-4"><strong>Job:</strong> {JOB_LABELS[selected.jobType] || selected.jobType || "-"}</div>
                <div className="col-md-4"><strong>Action:</strong> {selected.jobAction || "-"}</div>
                <div className="col-md-4"><strong>Status:</strong> {selected.status || "-"}</div>
                <div className="col-md-4"><strong>Trigger:</strong> {selected.triggerType || "-"}</div>
                <div className="col-md-4"><strong>Triggered By:</strong> {selected.triggeredByUserId || "-"}</div>
                <div className="col-md-4"><strong>Attempt:</strong> {selected.attemptNo || "-"}</div>
                <div className="col-md-4"><strong>Site:</strong> {selected.siteId || "-"}</div>
                <div className="col-md-4"><strong>Site Check:</strong> {selected.checkId ? `#${selected.checkId}` : "-"}</div>
                <div className="col-md-4"><strong>Entity:</strong> {selected.entityType || "-"}</div>
                <div className="col-md-4"><strong>Scheduled:</strong> {formatDateTime(selected.scheduledFor)}</div>
                <div className="col-md-4"><strong>Started:</strong> {formatDateTime(selected.startedAt)}</div>
                <div className="col-md-4"><strong>Completed:</strong> {formatDateTime(selected.completedAt)}</div>
              </div>

              <div className="mb-3">
                <div className="fw-bold mb-1">Message</div>
                <div className="border rounded p-2 bg-light text-break">{selected.message || "-"}</div>
              </div>

              <div className="mb-3">
                <div className="fw-bold mb-1">Change Summary</div>
                <div className="border rounded p-2 bg-light text-break">{selected.changeSummary || "-"}</div>
              </div>

              {selected.reason ? (
                <div className="mb-3">
                  <div className="fw-bold mb-1">Reason</div>
                  <div className="border rounded p-2 bg-light text-break">{selected.reason}</div>
                </div>
              ) : null}

              {selected.errorMessage || selected.errorDetail ? (
                <div className="mb-3">
                  <div className="fw-bold text-danger mb-1">Error</div>
                  <pre className="border rounded p-2 bg-light text-danger text-wrap mb-0" style={{ whiteSpace: "pre-wrap" }}>
                    {selected.errorDetail || selected.errorMessage}
                  </pre>
                </div>
              ) : null}

              <div className="row g-3">
                <div className="col-lg-6">
                  <div className="fw-bold mb-1">Before State</div>
                  <pre className="border rounded p-2 bg-light mb-0" style={{ whiteSpace: "pre-wrap", minHeight: "120px" }}>
                    {prettyJson(selected.beforeState)}
                  </pre>
                </div>
                <div className="col-lg-6">
                  <div className="fw-bold mb-1">After State</div>
                  <pre className="border rounded p-2 bg-light mb-0" style={{ whiteSpace: "pre-wrap", minHeight: "120px" }}>
                    {prettyJson(selected.afterState)}
                  </pre>
                </div>
              </div>

              <div className="mt-3 small text-muted text-break">
                Correlation ID: {selected.correlationId || "-"}
                <br />
                Idempotency Key: {selected.idempotencyKey || "-"}
              </div>
            </div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSelected(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps)(SiteCheckSchedulerLogs);
