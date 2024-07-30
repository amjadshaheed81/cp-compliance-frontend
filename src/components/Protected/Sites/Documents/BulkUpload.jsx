import React, { useEffect, useState } from "react";
import {
  Button,
  Box,
  DialogActions,
  DialogContent,
  DialogTitle,
  Dialog,
} from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useForm } from "react-hook-form";
import CircularProgress from "@mui/material/CircularProgress";
import moment from "moment";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { uploadPhoto } from "../../../../api";

const BulkUpload = ({
  bulkUploadModal,
  setBulkUploadModal,
  folder,
  siteSelectedForGlobal,
  loggedInUserData,
  uploadPhoto,
}) => {
  const handleOpen = () => setBulkUploadModal(true);
  const handleClose = () => setBulkUploadModal(false);
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState([]);
  useEffect(() => {
    console.log("folder", folder);
    setFiles(folder?.files || []);
  }, [folder]);
  const { register, handleSubmit } = useForm({});
  const submitBulkUpload = async (formData) => {
    setIsLoading(true);
    const filesToUpload = [];
    for (const iterator of formData?.bulkUpload) {
      filesToUpload.push({
        ...iterator,
        fileVersion: 1,
        siteId: siteSelectedForGlobal?.siteId,
        uploaderUserId: loggedInUserData?.id,
        issueDate: `${moment(new Date()).format("YYYY-MM-DD")} 10:00:00`,
        expiryDate: `${moment(new Date())
          .add(1, "years")
          .format("YYYY-MM-DD")} 10:00:00`,
      });
    }
    const {bulkUpload, ...filesData } = formData?.bulkUpload;
    const data = {
      files: filesData,
      documentRequestString: {
        folderId: folder?.id,
        files: filesToUpload,
      },
    };
    const url = `/api/document/files/upload`;
    const formDataPayload = new FormData();
    formDataPayload.append("files", data.files);
    formDataPayload.append(
      "documentRequestString",
      JSON.stringify(data.documentRequestString)
    );
    try {
      const res = await uploadPhoto(url, formDataPayload);
      setIsLoading(false);
      toast.success("Files uploaded successfully");
      handleClose();
    } catch (e) {
      setIsLoading(false);
      toast.error("Something went wrong while uploading files.");
    }
  };
  return (
    <>
      <Dialog
        open={bulkUploadModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          component: "form",
          onSubmit: handleSubmit(submitBulkUpload),
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
                      multiple
                      accept="image/*, application/pdf"
                      id="bulkUpload"
                    />
                    <label
                      htmlFor="bulkUpload"
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
                <table className="table f-11">
                  <thead className="table-dark">
                    <tr>
                      <th scope="col">Folder</th>
                      <th scope="col">File Name</th>
                      <th scope="col">Issue Date</th>
                      <th scope="col">Expiry Date</th>
                      <th scope="col">Version</th>
                    </tr>
                  </thead>
                  <tbody>
                    {files?.length === 0 && (
                      <tr>
                        <td colSpan={5}>No Files Found!!</td>
                      </tr>
                    )}
                    {files?.map((file) => (
                      <tr>
                        <div>
                          <i
                            style={{ color: "#384BD3" }}
                            className="fas fa-folder fa-2x"
                          ></i>
                          <span className="p-3">{file?.folderName}</span>
                        </div>
                        <td>{file?.name}</td>
                        <td>{moment(file?.issueDate).format("DD-MM-YYYY")}</td>
                        <td>{moment(file?.expiryDate).format("DD-MM-YYYY")}</td>
                        <td>{file?.fileVersion}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </form>
          )}
        </DialogContent>
        {!isLoading && (
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button className="bg-primary text-light" type="submit">
              Save
            </Button>
          </DialogActions>
        )}
      </Dialog>
    </>
  );
};

const mapStateToProps = (state) => ({
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, { uploadPhoto })(BulkUpload);
