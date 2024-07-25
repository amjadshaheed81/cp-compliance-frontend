import React, { useState } from "react";
import { Button, Box, DialogActions, DialogContent, DialogTitle, Dialog } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useForm } from "react-hook-form";
import CircularProgress from '@mui/material/CircularProgress';

const BulkUpload = ({ bulkUploadModal, setBulkUploadModal, folder }) => {
  const handleOpen = () => setBulkUploadModal(true);
  const handleClose = () => setBulkUploadModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const { register, handleSubmit } = useForm({});
  const handleFileSelect = async (event) => {
    console.log("event", event);
  };
  console.log("folder", folder);
  return (
    <>
      <Dialog
        open={bulkUploadModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          component: "form",
          onSubmit: handleSubmit((data) => {
            console.log(data);
          }),
        }}
      >
        <DialogTitle>Bulk Upload Files</DialogTitle>
        <DialogContent dividers>
          {isLoading && (
            <Box sx={{ display: "flex" }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <form className="row">
              <div className="col-md-6 h-50">
                <label htmlFor="folder" name="folder">
                  Folder
                </label>
                <input
                  type="text"
                  name="folder"
                  disabled
                  className="form-control"
                  value={folder?.name}
                />
              </div>
              <div className="col-md-6 h-50">
                <div style={{ backgroundColor: "#f1f5f9" }}>
                  <div className="uploadPhotoButton">
                    <FileUploadOutlinedIcon
                      style={{
                        color: "blue",
                        fontSize: "50px",
                        marginLeft: "4rem",
                      }}
                    />
                    <input
                      {...register("bulkUpload")}
                      className="uploadButton-input"
                      type="file"
                      name="bulkUpload"
                      accept="image/*, application/pdf"
                      id="bulkUpload"
                      onChange={handleFileSelect}
                    />
                    <label
                      htmlFor="siteImage"
                      style={{ color: "blue" }}
                      className="btn"
                    >
                      Click to upload
                    </label>
                    <span>or drag and drop</span>
                    <p>SVG, PNG, JPG or GIF</p>
                    <p>(max 1 MB each)</p>
                  </div>
                </div>
              </div>
              <div className="table-responsive">
                <table className="f-11">
                  <thead>
                    <tr>
                      <th scope="col">File</th>
                      <th scope="col">File Name</th>
                      <th scope="col">Issue Date</th>
                      <th scope="col">Expiry Date</th>
                      <th scope="col">Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <div>
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-2x"
                        ></i>
                        <span className="p-3">Statutory Documents</span>
                      </div>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </form>
          )}
        </DialogContent>
        {!isLoading && (
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit">Save</Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

export default BulkUpload;
