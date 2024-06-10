import React, { useState } from "react";
import { Button, Modal, Typography, Box } from "@mui/material";
import { useForm } from "react-hook-form";
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
  refresh
}) => {
  console.log("folderId", folderId);
  const handleOpen = () => setShowFolderModal(true);
  const handleClose = () => setShowFolderModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm({});
  const submitFolder = async (data, folderId) => {
    setIsLoading(true);
    await post("/api/document/folder", data);
    //createDocumentFolder(data, folderId);
    setIsLoading(false);
    handleClose();
    refresh();
    toast.success("Folder added successfully")
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
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData).entries());
            formJson.parentFolderId = folderId
            submitFolder(formJson)
            console.log(formJson);
            //handleClose();
          },
        }}
      >
        <DialogTitle>Create New Folder</DialogTitle>
        <DialogContent dividers>
          {isLoading && <Box sx={{ display: 'flex' }}>
            <CircularProgress />
          </Box>}
          {!isLoading && <input
            type="text"
            name="folderName"
            className="form-control"
            placeholder="Enter folder name"
            {...register("folderName")}
          />
          }
        </DialogContent>
        {!isLoading && <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
        }
      </Dialog>
    </React.Fragment>
    // <div>
    //   <Button onClick={handleOpen}>Create New Folder</Button>
    //   <Modal
    //     open={showFolderModal}
    //     onClose={handleClose}
    //     aria-labelledby="modal-modal-title"
    //     aria-describedby="modal-modal-description"
    //   >
    //     <Box sx={style}>
    //       <div style={{margin: '30px'}}>
    //       <Typography id="modal-modal-title" variant="h6" component="h2">
    //         Create New Folder
    //       </Typography>
    //         <div className="col-md-8">
    //           <label htmlFor="folder" name="folder">
    //             Folder
    //           </label>
    //           <input
    //             type="text"
    //             name="folderName"
    //             className="form-control"
    //             {...register("folderName")}
    //           />
    //             <button className="btn btn-primary float-end mt-5">Save</button>
    //           </div>
    //       </div>
    //     </Box>
    //   </Modal>
    // </div>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.success,
  error: state.site.error,
});
export default connect(mapStateToProps, {
  uploadDocumentFile,
})(CreateFolder);
