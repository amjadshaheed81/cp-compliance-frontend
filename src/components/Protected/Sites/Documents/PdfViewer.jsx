import React, { useEffect, useState } from "react";
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import FileViewer from "./FileViewer";

const PdfViewer = ({ showPdfModal, setShowPdfModal, selectedPdf }) => {
  const [open, setOpen] = useState(showPdfModal);
  const [extension, setExtension] = useState("");

  const handleClose = () => setShowPdfModal(false);

  const downloadFile = (event, fileName) => {
    event.preventDefault();
    const link = document.createElement("a");
    link.href = selectedPdf;
    link.download = `${fileName}${extension}`;
    link.click();
  };

  useEffect(() => {
    if (selectedPdf) {
      try {
        // Try to extract extension safely, ignoring URL params
        const cleanUrl = selectedPdf.split("?")[0];
        const ext = cleanUrl.split(".").pop().toLowerCase();
        setExtension(`.${ext}`);
      } catch {
        setExtension("");
      }
    }
  }, [selectedPdf]);

  const renderViewer = () => {
    if ([".pdf", ".jpg", ".jpeg", ".png"].includes(extension)) {
      return <FileViewer fileUrl={selectedPdf} />;
    }

    if (extension === ".dwg") {
      return (
        <iframe
          src={`https://sharecad.org/cadframe/load?url=${encodeURIComponent(
            selectedPdf
          )}`}
          width="100%"
          height="600px"
          title="DWG Viewer"
          frameBorder="0"
          allowFullScreen
          style={{ border: "none" }}
        ></iframe>
      );
    }

    return (
      <p className="text-center text-danger">
        Unsupported file type: <b>{extension || "Unknown"}</b>
      </p>
    );
  };

  return (
    <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
      <DialogTitle>File View</DialogTitle>
      <DialogContent>
        <div className="row">
          <div className="col-md-12 text-center">{renderViewer()}</div>
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
  );
};

export default PdfViewer;
