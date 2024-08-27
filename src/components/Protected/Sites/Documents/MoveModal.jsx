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
import MoveFolder from "./Folder/MoveFolder";

const MoveModal = ({
  showMoveModal,
  setShowMoveModal,
  selectedFileForCopy,
}) => {
  const [open, setOpen] = useState(showMoveModal);
  const [extension, setExtension] = useState("");
  const handleOpen = () => setShowMoveModal(true);
  const handleClose = () => setShowMoveModal(false);
  return (
    <>
      <Dialog open={open} maxWidth="lg" fullWidth onClose={handleClose}>
        <DialogTitle>Select folder where you want to move file</DialogTitle>
        <DialogContent>
          <div className="row">
            <div className="col-md-12">
              <MoveFolder selectedFileForCopy={selectedFileForCopy} handleClose={handleClose}/>
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

export default MoveModal;
