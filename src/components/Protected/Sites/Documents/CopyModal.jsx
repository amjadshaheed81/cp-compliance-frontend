import React, { useState } from "react";
import {
  Button,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CopyFolder from "./Folder/CopyFolder";

const CopyModal = ({
  showCopyModal,
  setShowCopyModal,
  selectedFileForCopy,
  refresh,
}) => {
  const [open, setOpen] = useState(showCopyModal);
  const [extension, setExtension] = useState("");
  const handleOpen = () => setShowCopyModal(true);
  const handleClose = () => {
    setShowCopyModal(false);
    refresh();
  };
  console.log("selectedFileForCopy", selectedFileForCopy);
  return (
    <>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle>Select folder where you want to copy file</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-md-12">
              <CopyFolder selectedFileForCopy={selectedFileForCopy} handleClose={handleClose}/>
            </div>
          </div>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} className="bg-light text-primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default CopyModal;
