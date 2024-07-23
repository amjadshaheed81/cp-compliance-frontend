import React, { useState } from "react";
import { Button, Modal, Typography, Box } from "@mui/material";
import { useForm, ErrorMessage } from "react-hook-form";
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import CircularProgress from '@mui/material/CircularProgress';
import DialogTitle from '@mui/material/DialogTitle';
import { toast } from 'react-toastify';
import { post } from '../../../../api'
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
  refresh,
  siteSelectedForGlobal
}) => {
  const handleOpen = () => setShowFolderModal(true);
  const handleClose = () => setShowFolderModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm();

  const submitFolder = async (data) => {
    if(data.parentFolderId === '1'){
      data.isStatutory = true;
    }
    setIsLoading(true);
    await post("/api/document/folder", data);
    //createDocumentFolder(data, folderId);
    setIsLoading(false);
    handleClose();
    refresh();
    toast.success("Folder added successfully");
  };

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: 500,
    bgcolor: 'background.paper',
    boxShadow: 24,
    p: 4,
  };

  return (
    <React.Fragment>
      <Button variant="outlined" onClick={handleOpen}>
        Create New Folder
      </Button>
      <Dialog
        open={showFolderModal}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: handleSubmit((data) => {
            data.parentFolderId = folderId;
            data.siteId = siteSelectedForGlobal?.siteId;
            submitFolder(data);
          }),
        }}
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent dividers>
          {isLoading && <Box sx={{ display: 'flex' }}>
            <CircularProgress />
          </Box>}
          {!isLoading && (
            <Box component="div">
              <TextField
                fullWidth
                label="Folder Name"
                variant="outlined"
                {...register("folderName", {
                  required: "Please enter folder name.",
                  minLength: {
                    value: 3,
                    message: "Folder name should be at least 3 characters."
                  }
                })}
                error={!!errors.folderName}
                helperText={errors.folderName ? errors.folderName.message : ''}
              />
            </Box>
          )}
        </DialogContent>
        {!isLoading && (
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogActions>
        )}
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.success,
  error: state.site.error,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  uploadDocumentFile,
})(CreateFolder);