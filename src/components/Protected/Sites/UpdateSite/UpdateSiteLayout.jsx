import React, { useEffect, useState } from "react";
import { Button, Modal, Typography, Box, Grid } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useForm } from "react-hook-form";
import {
  deleteSiteNode,
  uploadDocumentFile,
} from "../../../../store/thunk/site";
import { connect } from "react-redux";

import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { del, post, put, uploadPhoto } from "../../../../api";
import { toast } from "react-toastify";
import moment from "moment";
import { InputError } from "../../../common/InputError";
import Swal from "sweetalert2";

const UpdateSiteLayout = ({
  showModal,
  setShowModal,
  refresh,
  selectedNode,
  deleteSiteNode,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  const deleteNode = async () => {
    Swal.fire({
      target: document.getElementById("Modal-container"),
      title: `Do you want to delete ${selectedNode?.nodeName}?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete Node",
      confirmButtonColor: "#da292e",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const url = `/api/site/layout/remove/${selectedNode?.siteId}/${selectedNode?.id}`;
        const res = await deleteSiteNode(url);
        console.log("res");
        if (res === "Success") {
          toast.success("Node successfully deleted.");
          handleClose();
          refresh();
        } else {
          toast.success("Something went wrong while deleting node.");
        }
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({});

  return (
    <React.Fragment>
      <Dialog
        open={showModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        id="Modal-container"
      >
        <DialogTitle>Update {selectedNode?.nodeName} Node</DialogTitle>
        <DialogContent dividers></DialogContent>
        <DialogActions>
          {isLoading && (
            <Box sx={{ display: "flex" }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button
                className="bg-danger text-light"
                type="button"
                onClick={() => deleteNode()}
              >
                Delete
              </Button>
              <Button type="submit" className="bg-primary text-light">
                Update
              </Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({});

export default connect(mapStateToProps, { deleteSiteNode })(UpdateSiteLayout);
