import React, { useState } from "react";
import { Button, Modal, Typography, Box, Grid } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useForm } from "react-hook-form";
import { uploadDocumentFile } from "../../../../store/thunk/site";
import { connect } from "react-redux";


import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import CircularProgress from '@mui/material/CircularProgress';
import DialogTitle from '@mui/material/DialogTitle';
import { post, uploadPhoto } from "../../../../api";
import { toast } from 'react-toastify';
import moment from "moment";

const CreateFiles = ({
  showModal,
  setShowModal,
  folderId,
  folderData,
  refresh,
  siteSelectedForGlobal,
  isStatutory
}) => {
  // const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  const { register, handleSubmit, getValues } = useForm({});
  const submitFile = async (data, fileUpload) => {
    
    const reqData = {
      files: fileUpload,
      documentRequestString: {
        ...data
      },
    };
    
    delete reqData.documentRequestString.files[0].fileUpload;
    reqData.documentRequestString.files[0].issueDate = issueDate + " 00:00:00";
    reqData.documentRequestString.files[0].expiryDate = expiryDate + " 00:00:00";
    const url = `/api/document/files/upload`;
    const formData = new FormData();
    formData.append("files", reqData.files);
    formData.append("documentRequestString", JSON.stringify(reqData.documentRequestString));

    const res = await uploadPhoto(url, formData);
    //uploadDocumentFile(data, folderId);
    setIsLoading(false);
    toast.success("File uploaded successfully")
    handleClose();
    refresh();
    
  };
  
  
  const setExpiry = (e) => {
    setExpiryDate(e.target.value)
  }
  const setIssue = (e) => {
    console.log(e.target.value);
    setIssueDate(e.target.value)
    const date = moment(e.target.value).add(1, 'years').format('YYYY-MM-DD');
    setExpiryDate(date)
  }

  
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

  const handleFileChange = (e) => {
    console.log("input1Value", e.target.files[0].name)
    setFileName(e?.target?.files?.[0]?.name)
    
    // Update input2 value based on input1 value
    // Assuming you want to set input2 to the same value as input1
    // You can modify this logic as per your requirement
    //setValue('input2', input1Value);
  }

  return (
    <React.Fragment>
      <Button variant="outlined" onClick={handleOpen}>
        Upload New Files
      </Button>
      <Dialog
        open={showModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          component: 'form',
          onSubmit: (event) => {
            event.preventDefault();
            const formData = new FormData(event.currentTarget);
            const formJson = Object.fromEntries((formData).entries());
            console.log('formJson', formJson);
            delete formJson.folder;
            const data = {
              folderId: folderData?.id,
              files: [
                {
                  ...formJson,
                  fileVersion: 1,
                  siteId: siteSelectedForGlobal?.siteId
                }
              ]
            }
            data.files[0].name = formJson.fileUpload.name;
            submitFile(data, formJson.fileUpload)
            //handleClose();
          },
        }}
      >
        <DialogTitle>Upload New Files</DialogTitle>
        <DialogContent dividers>
          {isLoading && <Box sx={{ display: 'flex' }}>
            <CircularProgress />
          </Box>}
          <Grid container>

            <Grid sm={8}>
              <Grid container>
                <Grid sm={6}>
                  <div style={{margin: "10px"}}>
                {isStatutory ?<label htmlFor="folder" name="folder">
                  Requirement
                </label> : <label htmlFor="folder" name="folder">
                  Folder
                </label> }
                <input
                  type="text"
                      name="name"
                      disabled
                      value={folderData?.name}
                  className="form-control"
                  {...register("folderName")}
                    />
                  </div>
              </Grid>
                <Grid sm={6}>
                  <div style={{ margin: "10px" }}>
                <label htmlFor="fileName" name="fileName">
                  File Name
                </label>
                <input
                  type="text"
                      name="name"
                      disabled
                      value={fileName?.split(".")[0]}
                  className="form-control"
                      {...register("name")}
                    />
                  </div>
              </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                  <label htmlFor="version" name="version">

                Version
              </label>
                <input
                      type="text"
                      disabled
                      value="1"
                  name="version"
                  className="form-control"
                  {...register("version")}
                    />
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                <label htmlFor="issueDate" name="folder">
                  Issue Date
                </label>
                    <input
                      value={issueDate}
                  type="date"
                  name="folder"
                  className="form-control"
                      onChange={setIssue}
                    />
                  </div>
              </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                  <label htmlFor="expiryDate" name="expiryDate">
                Expiry Date
              </label>
                    <input
                      value={expiryDate}
                    type="date"
                  name="expiryDate"
                  className="form-control"
                  onChange={setExpiry}
                    />
                  </div>
                </Grid>
                <Grid sm={12}>
                  <div style={{ margin: "10px" }}>
                <input
                  type={isStatutory ? "input" : "textarea" }
                  name="note"
                  placeholder={isStatutory ? "Reference Number" : "Enter notes..." }
                  className="form-control w-75"
                  {...register("note")}
                    />
                  </div>
                </Grid>
              </Grid>
            </Grid>
            <Grid sm={4}>
              <div style={{ backgroundColor: "#f1f5f9", margin:'10px' }}>
                <div className="uploadPhotoButton">
                  <FileUploadOutlinedIcon
                    style={{
                      color: "blue",
                      fontSize: "50px",
                      marginLeft: "4rem",
                    }}
                  />
                  <label htmlFor="fileUpload" name="fileUpload">
                    Upload New Version
                  </label>
                  <input
                    type="file"
                    name="fileUpload"
                    className="form-control"
                    {...register("fileUpload")}
                    onChange={handleFileChange}
                  />
                  <span>or drag and drop</span>
                  <p>SVG, PNG, JPG or GIF</p>
                  <p>(max 1 MB)</p>
                </div>
              </div>
            </Grid>
          </Grid>
          
        </DialogContent>
          <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
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
})(CreateFiles);
