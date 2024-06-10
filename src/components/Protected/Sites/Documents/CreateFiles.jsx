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

const CreateFiles = ({
  showModal,
  setShowModal,
  folderId,
  folderData,
  refresh
}) => {
  // const [showModal, setShowModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  const { register, handleSubmit } = useForm({});
  const submitFile = async (data, fileUpload) => {
    
    const reqData = {
      files: fileUpload,
      documentRequestString: {
        ...data
      },
    };
    
    delete reqData.documentRequestString.files[0].fileUpload;
    reqData.documentRequestString.files[0].issueDate = reqData.documentRequestString.files[0].issueDate + " 00:00:00";
    reqData.documentRequestString.files[0].expiryDate = reqData.documentRequestString.files[0].expiryDate + " 00:00:00";
    setIsLoading(true);
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
            const data = {
              folderId: folderData.id,
              files: [
                {
                  ...formJson,
                  fileVersion: 1
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
                <label htmlFor="folder" name="folder">
                  Folder
                </label>
                <input
                  type="text"
                      name="name"
                      disabled
                      value={folderData.name}
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
                  type="date"
                  name="folder"
                  className="form-control"
                  {...register("issueDate")}
                    />
                  </div>
              </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                  <label htmlFor="expiryDate" name="expiryDate">
                Expiry Date
              </label>
                <input
                    type="date"
                  name="expiryDate"
                  className="form-control"
                  {...register("expiryDate")}
                    />
                  </div>
                </Grid>
                <Grid sm={12}>
                  <div style={{ margin: "10px" }}>
                <input
                  type="textarea"
                  name="note"
                  placeholder="Enter notes..."
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
                  />
                  <span>or drag and drop</span>
                  <p>SVG, PNG, JPG or GIF</p>
                  <p>(max 1 MB)</p>
                </div>
              </div>
            </Grid>
          </Grid>
          {/* <div className="col-md-8">
                    <label htmlFor="folder" name="folder">
                      Folder
                    </label>
                    <input
                      type="text"
                      name="folderName"
                      className="form-control"
                      {...register("folderName")}
                    />
                    <div className="d-flex mt-2">
                      <div className="col-md-6" style={{ marginRight: "1rem" }}>
                        <label htmlFor="fileName" name="fileName">
                          File Name
                        </label>
                        <input
                          type="text"
                          name="fileName"
                          className="form-control"
                          {...register("fileName")}
                        />
                      </div>
                      <div className="col-md-6">
                        <label htmlFor="version" name="version">
                          Version
                        </label>
                        <input
                          type="text"
                          name="version"
                          className="form-control"
                          {...register("version")}
                        />
                      </div>
                    </div>
                    <div className="d-flex mt-2">
                      <div className="col-md-4" style={{ marginRight: "1rem" }}>
                        <label htmlFor="issueDate" name="folder">
                          Issue Date
                        </label>
                        <input
                          type="time"
                          name="folder"
                          className="form-control"
                          {...register("issueDate")}
                        />
                      </div>
                      <div className="col-md-4" style={{ marginRight: "1rem" }}>
                        <label htmlFor="expiryDate" name="expiryDate">
                          Expiry Date
                        </label>
                        <input
                          type="time"
                          name="expiryDate"
                          className="form-control"
                          {...register("expiryDate")}
                        />
                      </div>
                      <div className="col-md-4">
                        <label htmlFor="reviewer" name="reviewer">
                          Reviewer
                        </label>
                        <input
                          type="text"
                          name="reviewer"
                          className="form-control w-75"
                          {...register("reviewer")}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div style={{ backgroundColor: "#f1f5f9" }}>
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
                        />
                        <span>or drag and drop</span>
                        <p>SVG, PNG, JPG or GIF</p>
                        <p>(max 1 MB)</p>
                      </div>
                    </div>
                    
                  </div> */}
          
        </DialogContent>
        {/* {!isLoading && */}
          <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="submit">Save</Button>
        </DialogActions>
        {/* } */}
      </Dialog>
    </React.Fragment>
    // <>
    //   <Button onClick={handleOpen}>Upload New Files</Button>
    //   <Modal
    //     open={showModal}
    //     onClose={handleClose}
    //     aria-labelledby="modal-modal-title"
    //     aria-describedby="modal-modal-description"
    //   >
    //     <Box sx={style}>
    //       <Typography id="modal-modal-title" variant="h6" component="h2">
    //         Upload New File
    //       </Typography>
    //       <form className="row" onSubmit={handleSubmit(submitFile)}>
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
    //           <div className="d-flex mt-2">
    //             <div className="col-md-6" style={{ marginRight: "1rem" }}>
    //               <label htmlFor="fileName" name="fileName">
    //                 File Name
    //               </label>
    //               <input
    //                 type="text"
    //                 name="fileName"
    //                 className="form-control"
    //                 {...register("fileName")}
    //               />
    //             </div>
    //             <div className="col-md-6">
    //               <label htmlFor="version" name="version">
    //                 Version
    //               </label>
    //               <input
    //                 type="text"
    //                 name="version"
    //                 className="form-control"
    //                 {...register("version")}
    //               />
    //             </div>
    //           </div>
    //           <div className="d-flex mt-2">
    //             <div className="col-md-4" style={{ marginRight: "1rem" }}>
    //               <label htmlFor="issueDate" name="folder">
    //                 Issue Date
    //               </label>
    //               <input
    //                 type="time"
    //                 name="folder"
    //                 className="form-control"
    //                 {...register("issueDate")}
    //               />
    //             </div>
    //             <div className="col-md-4" style={{ marginRight: "1rem" }}>
    //               <label htmlFor="expiryDate" name="expiryDate">
    //                 Expiry Date
    //               </label>
    //               <input
    //                 type="time"
    //                 name="expiryDate"
    //                 className="form-control"
    //                 {...register("expiryDate")}
    //               />
    //             </div>
    //             <div className="col-md-4">
    //               <label htmlFor="reviewer" name="reviewer">
    //                 Reviewer
    //               </label>
    //               <input
    //                 type="text"
    //                 name="reviewer"
    //                 className="form-control w-75"
    //                 {...register("reviewer")}
    //               />
    //             </div>
    //           </div>
    //         </div>
    //         <div className="col-md-4">
    //           <div style={{ backgroundColor: "#f1f5f9" }}>
    //             <div className="uploadPhotoButton">
    //               <FileUploadOutlinedIcon
    //                 style={{
    //                   color: "blue",
    //                   fontSize: "50px",
    //                   marginLeft: "4rem",
    //                 }}
    //               />
    //               <label htmlFor="fileUpload" name="fileUpload">
    //                 Upload New Version
    //               </label>
    //               <input
    //                 type="file"
    //                 name="fileUpload"
    //                 className="form-control"
    //                 {...register("fileUpload")}
    //               />
    //               <span>or drag and drop</span>
    //               <p>SVG, PNG, JPG or GIF</p>
    //               <p>(max 1 MB)</p>
    //             </div>
    //           </div>
    //           <div>
    //             <button className="btn btn-primary float-end mt-5">Save</button>
    //           </div>
    //           <div>
    //             <button
    //               className="btn btn-primary float-end mt-5"
    //               style={{ marginRight: "1rem" }}
    //             >
    //               Cancel
    //             </button>
    //           </div>
    //         </div>
    //       </form>
    //     </Box>
    //   </Modal>
    // </>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.success,
  error: state.site.error,
});
export default connect(mapStateToProps, {
  uploadDocumentFile,
})(CreateFiles);
