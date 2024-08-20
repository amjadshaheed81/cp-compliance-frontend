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
import FileViewer from "./FileViewer";

const PdfViewer = ({ showPdfModal, setShowPdfModal, selectedPdf }) => {
  const [open, setOpen] = useState(showPdfModal);
  const [extension, setExtension] = useState("");
  const handleOpen = () => setShowPdfModal(true);
  const handleClose = () => setShowPdfModal(false);
  const downloadFile = (event, fileName) => {
    event.preventDefault();
    if (extension === ".pdf") {
      fetch(selectedPdf).then((response) => {
        response.blob().then((blob) => {
          // Creating new object of PDF file
          const fileURL = window.URL.createObjectURL(blob);

          // Setting various property values
          let alink = document.createElement("a");
          alink.href = fileURL;
          alink.download = `${fileName}${extension}`;
          alink.click();
        });
      });
    } else {
      const link = document.createElement("a");
      link.href = selectedPdf;
      link.download = `${fileName}${extension}`;
      link.click();
    }
  };
  useEffect(() => {
    if (selectedPdf.includes("pdf")) {
      setExtension(".pdf");
    }
    if (selectedPdf.includes("jpg")) {
      setExtension(".jpg");
    }
    if (selectedPdf.includes("jpeg")) {
      setExtension(".jpeg");
    }
    if (selectedPdf.includes("png")) {
      setExtension(".png");
    }
  }, []);
  return (
    <>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle>File View</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-md-12 text-center">
              <FileViewer fileUrl={selectedPdf} />
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className="bg-light text-primary">
            Close
          </Button>
          <a
            className="btn btn-primary bg-primary text-light"
            onClick={(event) => downloadFile(event, "file-viewer")}
          >
            Download
          </a>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default PdfViewer;
