import React, { useState } from "react";
import { Button, Modal, Typography, Box } from "@mui/material";
import { useForm } from "react-hook-form";
import {
  createDocumentFolder,
  uploadDocumentFile,
} from "../../../../store/thunk/site";
import { connect } from "react-redux";

const CreateFolder = ({
  showFolderModal,
  setShowFolderModal,
  folderId,
  uploadDocumentFile,
}) => {
  console.log("folderId", folderId);
  const handleOpen = () => setShowFolderModal(true);
  const handleClose = () => setShowFolderModal(false);
  const { register, handleSubmit } = useForm({});
  const submitFolder = (data, folderId) => {
    console.log("data", data);
    console.log("folderIdfolderId", folderId);
    createDocumentFolder(data, folderId);
  };
  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: 700,
    height: 400,
    bgcolor: "background.paper",
    border: "2px solid #fff",
    boxShadow: 24,
    p: 4,
  };

  return (
    <>
      <Button onClick={handleOpen}>Create New Folder</Button>
      <Modal
        open={showFolderModal}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Box sx={style}>
          <Typography id="modal-modal-title" variant="h6" component="h2">
            Create New Folder
          </Typography>
          <form className="row" onSubmit={handleSubmit(submitFolder)}>
            <div className="col-md-8">
              <label htmlFor="folder" name="folder">
                Folder
              </label>
              <input
                type="text"
                name="folderName"
                className="form-control"
                {...register("folderName")}
              />
              <div>
                <button className="btn btn-primary float-end mt-5">Save</button>
              </div>
            </div>
          </form>
        </Box>
      </Modal>
    </>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.success,
  error: state.site.error,
});
export default connect(mapStateToProps, {
  uploadDocumentFile,
})(CreateFolder);
