import React, { useId } from "react";
import { Dialog, DialogActions, DialogContent, DialogTitle } from "@mui/material";
import moment from "moment";

/** Shared presentation only. Each form retains its own opening rules and API. */
const SiteCheckEarlyOpenDialog = ({
    open,
    title = "Open Inspection Early",
    frequency,
    currentDueDate,
    opening = false,
    confirmDisabled = false,
    confirmLabel = "Open Inspection",
    onClose,
    onConfirm,
    children,
}) => {
    const titleId = useId();

    return (
        <Dialog
            open={open}
            onClose={() => !opening && onClose()}
            aria-labelledby={titleId}
            maxWidth="sm"
            fullWidth
        >
            <DialogTitle id={titleId}>{title}</DialogTitle>
            <DialogContent>
                <div className="mb-2">
                    <strong>Frequency:</strong>{" "}
                    {frequency || "Not available"}
                </div>
                <div className="mb-3">
                    <strong>Current Due Date:</strong>{" "}
                    {currentDueDate
                        ? moment(currentDueDate).format("DD-MM-YYYY")
                        : "Not available"}
                </div>
                {children}
            </DialogContent>
            <DialogActions>
                <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={onClose}
                    disabled={opening}
                >
                    Cancel
                </button>
                <button
                    type="button"
                    className="btn btn-primary"
                    onClick={onConfirm}
                    disabled={opening || confirmDisabled}
                >
                    {opening ? "Opening..." : confirmLabel}
                </button>
            </DialogActions>
        </Dialog>
    );
};

export default SiteCheckEarlyOpenDialog;
