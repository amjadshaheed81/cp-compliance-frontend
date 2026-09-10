import React, { useEffect, useState } from "react";
import CircularProgress from "@mui/material/CircularProgress";
import moment from "moment";
import { get } from "../../../../api";

const formatDate = (value, includeTime = false) => {
    if (!value) return "--";
    const parsed = moment(value);
    if (!parsed.isValid()) return "--";
    return parsed.format(includeTime ? "DD/MM/YYYY HH:mm" : "DD/MM/YYYY");
};

const sourceLabel = (source) => {
    switch (source) {
        case "LIVE_SUBMISSION":
            return "Submitted Site Check";
        case "LEGACY_SITE_DOCUMENT":
            return "Existing Site Document";
        case "LEGACY_MONTHLY_AUDIT_PDF_RECORD":
            return "Existing Monthly Audit PDF";
        default:
            return source || "History";
    }
};

const SiteCheckHistory = ({ checkId }) => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let cancelled = false;

        const loadHistory = async () => {
            setLoading(true);
            setError("");
            try {
                const response = await get(`/api/site-check/${checkId}/history`);
                if (!cancelled) {
                    setHistory(Array.isArray(response) ? response : []);
                }
            } catch (e) {
                if (!cancelled) {
                    const message =
                        e?.response?.data?.message ||
                        e?.response?.data ||
                        "Unable to load Site Check history.";
                    setError(typeof message === "string" ? message : "Unable to load Site Check history.");
                    setHistory([]);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        if (checkId) {
            loadHistory();
        } else {
            setHistory([]);
            setLoading(false);
        }

        return () => {
            cancelled = true;
        };
    }, [checkId]);

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center py-5">
                <CircularProgress size={32} />
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger mb-0" role="alert">
                {error}
            </div>
        );
    }

    if (history.length === 0) {
        return (
            <div className="alert alert-light border mb-0" role="status">
                No verified submission history has been recorded for this Site Check yet.
            </div>
        );
    }

    return (
        <div className="table-responsive">
            <table className="table table-striped table-hover align-middle mb-0">
                <thead className="table-dark">
                    <tr>
                        <th>Recorded</th>
                        <th>Inspection / Period</th>
                        <th>Engineer / Submitted By</th>
                        <th>Frequency / Next Due</th>
                        <th>Source</th>
                        <th>PDF</th>
                    </tr>
                </thead>
                <tbody>
                    {history.map((item, index) => {
                        const key =
                            item.historyId ||
                            item.sourceReference ||
                            `${item.source || "history"}-${item.pdfFileId || "no-file"}-${item.pdfFileVersion || index}`;
                        return (
                            <tr key={key}>
                                <td>
                                    <div>{formatDate(item.submittedAt, true)}</div>
                                    {item.siteCheckDueDateBefore && (
                                        <small className="text-muted d-block">
                                            Stored due before submission: {formatDate(item.siteCheckDueDateBefore)}
                                        </small>
                                    )}
                                </td>
                                <td>
                                    {item.inspectionDate ? (
                                        <div>Inspection: {formatDate(item.inspectionDate)}</div>
                                    ) : item.periodStartDate || item.periodEndDate ? (
                                        <>
                                            <div>From: {formatDate(item.periodStartDate)}</div>
                                            <div>To: {formatDate(item.periodEndDate)}</div>
                                        </>
                                    ) : (
                                        <span>--</span>
                                    )}
                                    {item.documentIssueDate && (
                                        <small className="text-muted d-block">
                                            Document issue: {formatDate(item.documentIssueDate)}
                                        </small>
                                    )}
                                </td>
                                <td>
                                    <div>{item.engineerName || "--"}</div>
                                    {item.submittedByName && (
                                        <small className="text-muted d-block">
                                            Submitted by: {item.submittedByName}
                                        </small>
                                    )}
                                </td>
                                <td>
                                    <div>{item.repeatFrequency || "--"}</div>
                                    {item.nextDueDate && (
                                        <small className="text-muted d-block">
                                            Next due: {formatDate(item.nextDueDate)}
                                        </small>
                                    )}
                                    {!item.nextDueDate && item.documentExpiryDate && (
                                        <small className="text-muted d-block">
                                            Document expiry: {formatDate(item.documentExpiryDate)}
                                        </small>
                                    )}
                                </td>
                                <td>
                                    <div>{sourceLabel(item.source)}</div>
                                    {item.legacy && (
                                        <small className="text-muted d-block">Legacy evidence</small>
                                    )}
                                </td>
                                <td>
                                    {item.pdfUrl ? (
                                        <>
                                            <button
                                                type="button"
                                                className="btn btn-sm btn-outline-primary"
                                                onClick={() => window.open(item.pdfUrl, "_blank", "noopener,noreferrer")}
                                            >
                                                View PDF
                                            </button>
                                            {item.pdfFileVersion && (
                                                <small className="text-muted d-block mt-1">
                                                    Version {item.pdfFileVersion}
                                                </small>
                                            )}
                                        </>
                                    ) : item.pdfStatus === "STORED" ? (
                                        <span className="text-muted">PDF stored; link temporarily unavailable</span>
                                    ) : (
                                        <span className="text-muted">No PDF linked</span>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
};

export default SiteCheckHistory;
