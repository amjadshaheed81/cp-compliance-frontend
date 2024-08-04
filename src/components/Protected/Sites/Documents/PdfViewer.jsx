import React, { useEffect, useState } from "react";
import {
  Button,
  Modal,
  Typography,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import { get } from "../../../../api";
import { toast } from "react-toastify";
import moment from "moment";
import CircularProgress from "@mui/material/CircularProgress";

const PdfViewer = ({ showPdfModal, setShowPdfModal, selectedPdf }) => {
  const [open, setOpen] = useState(showPdfModal);
  const handleOpen = () => setShowPdfModal(true);
  const handleClose = () => setShowPdfModal(false);

  return (
    <>
      <Button onClick={handleOpen}>Version History</Button>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle>File View</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-md-12 text-center">
            <object
              data={selectedPdf}
              type="image/png"
              style={{ width: '100%', height: 'auto' }}
              aria-label="Description"
            ></object>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className="bg-light text-primary">
            Close
          </Button>
          <a
            className="btn btn-primary bg-primary text-light"
            href={selectedPdf}
            download
          >
            Download
          </a>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PdfViewer;
