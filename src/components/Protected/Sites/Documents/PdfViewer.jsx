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
              <img
                src={selectedPdf}
                className="img img-responsive"
                alt="Description"
              ></img>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className="bg-primary text-light">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PdfViewer;
