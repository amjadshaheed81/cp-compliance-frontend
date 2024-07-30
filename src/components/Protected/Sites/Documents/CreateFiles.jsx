import React, { useEffect, useState } from "react";
import { Button, Modal, Typography, Box, Grid } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useForm } from "react-hook-form";
import { uploadDocumentFile } from "../../../../store/thunk/site";
import { connect } from "react-redux";

import TextField from "@mui/material/TextField";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import CircularProgress from "@mui/material/CircularProgress";
import DialogTitle from "@mui/material/DialogTitle";
import { post, put, uploadPhoto } from "../../../../api";
import { toast } from "react-toastify";
import moment from "moment";
import { InputError } from "../../../common/InputError";

const CreateFiles = ({
  showModal,
  setShowModal,
  folderId,
  folderData,
  refresh,
  siteSelectedForGlobal,
  isStatutory,
  uploaderUserId,
  reviewerUserId,
  loggedInUserData,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({});
  useEffect(() => {
    console.log("folderData", folderData);
  }, []);
  const submitFile = async (data, fileUpload) => {
    const reqData = {
      files: fileUpload,
      documentRequestString: {
        ...data,
      },
    };
    delete reqData.documentRequestString.files[0].fileUpload;
    reqData.documentRequestString.files[0].issueDate = data?.files[0].issueDate
    reqData.documentRequestString.files[0].expiryDate = data?.files[0].expiryDate
    reqData.documentRequestString.files[0].uploaderUserId =
      uploaderUserId || "";
    reqData.documentRequestString.files[0].reviewerUserId =
      uploaderUserId || "";
    reqData.documentRequestString.files[0].referenceNumber =
      data.files[0].note || "";
    const url = `/api/document/files/upload`;
    const formData = new FormData();
    formData.append("files", reqData.files);
    formData.append(
      "documentRequestString",
      JSON.stringify(reqData.documentRequestString)
    );
    const res = await uploadPhoto(url, formData);
    setIsLoading(false);
    toast.success("File uploaded successfully");
    handleClose();
    refresh();
  };

  const setExpiry = (e) => {
    setExpiryDate(e.target.value);
  };

  const setIssue = (e) => {
    setIssueDate(e.target.value);
    const date = moment(e.target.value).add(1, "years").format("YYYY-MM-DD");
    setExpiryDate(date);
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

  const handleFileChange = (e) => {
    setFileName(e?.target?.files?.[0]?.name);
  };

  const checkAndAddExpiryCalenderEvent = async (data) => {
    console.log("expiryDate", data);
    const body = {
      siteId: siteSelectedForGlobal?.siteId,
      startDate: moment(data.expiryDate),
      endDate: moment(data.expiryDate),
      shortText: "Document Expiring : " + data.name,
      eventType: "DOCUMENT_EXPIRY",
      userId: loggedInUserData?.id,
    };
    await put("/api/user/calendar", body);
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
          component: "form",
          onSubmit: handleSubmit(async (formData) => {
            console.log("formData", formData);
            try {
              setIsLoading(true);
              const data = {
                folderId: folderData?.id,
                files: [
                  {
                    ...formData,
                    name: formData?.fileUpload?.[0]?.name,
                    fileVersion: folderData?.fileVersion
                      ? Number(folderData?.fileVersion) + 1
                      : 1,
                    siteId: siteSelectedForGlobal?.siteId,
                    issueDate: `${formData?.issueDate} 10:00:00`,
                    expiryDate: `${formData?.expiryDate} 10:00:00`,
                  },
                ],
              };
              data.files[0].name = formData.fileUpload[0].name;
              await submitFile(data, formData.fileUpload[0]);
              checkAndAddExpiryCalenderEvent(data.files[0]);
              setIsLoading(false);
            } catch (e) {
              toast.error(
                "Something went wrong while adding new file. Please try again!!"
              );
              setIsLoading(false);
            }
          }),
        }}
      >
        <DialogTitle>Upload New Files</DialogTitle>
        <DialogContent dividers>
          <Grid container>
            <Grid sm={8}>
              <Grid container>
                <Grid sm={6}>
                  <div style={{ margin: "10px" }}>
                    {isStatutory ? (
                      <label htmlFor="folder">Requirement</label>
                    ) : (
                      <label htmlFor="folder">Folder</label>
                    )}
                    <input
                      type="text"
                      disabled
                      value={
                        folderData?.folderName
                          ? folderData?.folderName
                          : folderData?.name
                      }
                      className="form-control"
                      {...register("folderName")}
                    />
                  </div>
                </Grid>
                <Grid sm={6}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="fileName">File Name</label>
                    <input
                      type="text"
                      value={folderData?.folderName ? folderData?.name : ""}
                      disabled
                      className="form-control"
                      {...register("name")}
                    />
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="version">Version</label>
                    <input
                      type="text"
                      disabled
                      value={
                        folderData?.fileVersion
                          ? Number(folderData?.fileVersion) + 1
                          : 1
                      }
                      className="form-control"
                      {...register("version")}
                    />
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="issueDate">Issue Date</label>
                    <input
                      type="date"
                      className="form-control"
                      {...register("issueDate")}
                      onChange={(e) => {
                        e?.preventDefault();
                        setValue("issueDate", e?.target?.value);
                        setValue(
                          "expiryDate",
                          moment(new Date(e?.target?.value))
                            .add(1, "years")
                            .format("YYYY-MM-DD")
                        );
                      }}
                    />
                  </div>
                </Grid>
                <Grid sm={4}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="expiryDate">Expiry Date</label>
                    <input
                      type="date"
                      className="form-control"
                      {...register("expiryDate")}
                    />
                  </div>
                </Grid>
                <Grid sm={12}>
                  <div style={{ margin: "10px" }}>
                    <input
                      type={isStatutory ? "input" : "textarea"}
                      name="note"
                      placeholder={
                        isStatutory ? "Reference Number" : "Enter notes..."
                      }
                      className="form-control w-75"
                      {...register("note")}
                    />
                  </div>
                </Grid>
              </Grid>
            </Grid>
            <Grid sm={4}>
              <div style={{ backgroundColor: "#f1f5f9", margin: "10px" }}>
                <div className="uploadPhotoButton">
                  <FileUploadOutlinedIcon
                    style={{
                      color: "blue",
                      fontSize: "50px",
                      marginLeft: "4rem",
                    }}
                  />
                  <label htmlFor="fileUpload">Upload New Version</label>
                  <input
                    type="file"
                    name="fileUpload"
                    className="form-control"
                    {...register("fileUpload", {
                      required: "A file is required",
                    })}
                  />
                  {errors.fileUpload && (
                    <InputError
                      message={errors?.fileUpload?.message}
                      key={errors?.fileUpload?.message}
                    />
                  )}
                  <span>or drag and drop</span>
                  <p>SVG, PNG, JPG or GIF</p>
                  <p>(max 1 MB)</p>
                </div>
              </div>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          {isLoading && (
            <Box sx={{ display: "flex" }}>
              <CircularProgress />
            </Box>
          )}
          {!isLoading && (
            <>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit">Save</Button>
            </>
          )}
        </DialogActions>
      </Dialog>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  success: state.site.success,
  error: state.site.error,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
  uploadDocumentFile,
})(CreateFiles);
