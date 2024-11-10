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
import { post, put, uploadPhoto, uploadNewVersion, get } from "../../../../api";
import { toast } from "react-toastify";
import moment from "moment";
import { InputError } from "../../../common/InputError";
import MandatoryFolders from "../Contracts/MandatoryFolders";

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
  folderfiles,
  setFolder,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [folderName, setFolderName] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [issueDate, setIssueDate] = useState("");
  const [fileName, setFileName] = useState("");
  const [open, setOpen] = React.useState(false);
  const handleOpen = () => setShowModal(true);
  const handleClose = () => setShowModal(false);
  const [selectedMandatoryFolder, setSelectedMandatoryFolder] = useState(
    folderData ? [folderData] : []
  );
  const [selectedMandatoryFile, setSelectedMandatoryFile] = useState([]);
  const [selectedContractors, setSelectedContractors] = useState([]);

  const {
    register,
    handleSubmit,
    getValues,
    setValue,
    formState: { errors },
  } = useForm({});
  useEffect(() => {
    setValue(
      "name",
      selectedMandatoryFolder?.[0]?.folderName
        ? selectedMandatoryFolder?.[0]?.name
        : ""
    );
  }, []);
  const submitFile = async (data, fileUpload, formData) => {
    const fileSizeLimit = 100 * 1024 * 1024;

    if (fileUpload?.size > fileSizeLimit) {
      toast.error("File size cannot exceed 100MB");
      return;
    }
    const existingFile = folderfiles?.filter(
      (f) => f.name === formData.fileUpload[0].name
    );

    const reqData = {
      files: fileUpload,
      documentRequestString: {
        ...data,
      },
    };

    reqData.documentRequestString.files[0].id =
      existingFile?.length > 0 ? existingFile?.[0]?.id : undefined;
    reqData.documentRequestString.files[0].fileVersion =
      existingFile?.length > 0
        ? existingFile?.[0]?.fileVersion + 1
        : reqData.documentRequestString.files[0].fileVersion;

    delete reqData.documentRequestString.files[0].fileUpload;
    reqData.documentRequestString.files[0].issueDate = data?.files[0].issueDate;
    reqData.documentRequestString.files[0].originalFileName =
      formData.fileUpload[0].name;
    reqData.documentRequestString.files[0].expiryDate =
      data?.files[0].expiryDate;
    if (isStatutory) {
      if (selectedMandatoryFile?.length) {
        reqData.documentRequestString.files[0].name =
          selectedMandatoryFile[0].name;
        reqData.documentRequestString.files[0].issueDate =
          selectedMandatoryFile[0].issueDate?.replace("T", " ");
        reqData.documentRequestString.files[0].issueDate =
          selectedMandatoryFile[0].expiryDate?.replace("T", " ");
      }
      reqData.documentRequestString.files[0].statutoryCategoryId =
        selectedMandatoryFolder?.[0]?.id;
    }
    reqData.documentRequestString.files[0].uploaderUserId =
      uploaderUserId || "";
    reqData.documentRequestString.files[0].reviewerUserId =
      uploaderUserId || "";
    reqData.documentRequestString.files[0].referenceNumber =
      data.files[0].note || "";

    const url =
      existingFile?.length > 0
        ? `/api/document/file/newVersion/upload`
        : `/api/document/files/upload`;

    const form_Data = new FormData();
    form_Data.append(
      existingFile?.length > 0 ? "file" : "files",
      reqData.files
    );
    form_Data.append(
      "documentRequestString",
      JSON.stringify(reqData.documentRequestString)
    );
    if (existingFile?.length > 0) {
      await uploadNewVersion(url, form_Data);
    } else {
      await uploadPhoto(url, form_Data);
    }
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

  const checkAndAddExpiryCalenderEvent = async (data, folderId) => {
    const body = {
      siteId: siteSelectedForGlobal?.siteId,
      startDate: moment(data.expiryDate),
      endDate: moment(data.expiryDate),
      shortText: "Document Expiring : " + data.name,
      eventType: "Document Expring",
      userId: loggedInUserData?.id,
      section: `/subfolder/?id=${folderId}`,
    };
    await put("/api/user/calendar", body);
  };

  return (
    <React.Fragment>
      <Button variant="outlined" onClick={handleOpen}>
        Select or Upload New Files
      </Button>
      <Dialog
        open={showModal}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          component: "form",
          onSubmit: handleSubmit(async (formData) => {
            try {
              setIsLoading(true);
              let folderIdForUpload = selectedMandatoryFolder?.[0]?.id;
              const isStautoryFolderSelected = !!(
                !selectedMandatoryFolder?.[0]?.requirement &&
                selectedMandatoryFolder?.[0]?.id &&
                isStatutory
              );
              const isStautoryFileSelected = !!(
                selectedMandatoryFile?.length > 0 && isStatutory
              );
              let fileExtensionValue = "";
              if (isStautoryFolderSelected && !isStautoryFileSelected) {
                const res = await get(
                  `/api/document/parent/${selectedMandatoryFolder?.[0]?.id}/folders`
                );
                const files = res?.document?.files;
                if (files) {
                  const fileIds = files?.map((item) => item.id);
                  const url = `/api/document/tag-file`;
                  const data = {
                    fileIds: fileIds,
                    statutoryCategoryId: folderData?.id,
                  };
                  const res = await put(url, data);
                  if (res?.status === 200) {
                    setIsLoading(false);
                    toast.success("Files tags successfully.");
                    handleClose();
                    refresh();
                  } else {
                    setIsLoading(false);
                    toast.error("Something went wrong while tagging files.");
                    handleClose();
                  }
                } else {
                  setIsLoading(false);
                  toast.warning(
                    "There is no files available in this document to tag."
                  );
                }
                // const
              } else if (isStautoryFileSelected && !isStautoryFolderSelected) {
                const fileId = selectedMandatoryFile[0]?.id;
                const url = `/api/document/tag-file`;
                const data = {
                  fileId: fileId,
                  statutoryCategoryId: folderData?.id,
                };
                const res = await put(url, data);
                if (res?.status === 200) {
                  setIsLoading(false);
                  toast.success("File tag successfully.");
                  handleClose();
                  refresh();
                } else {
                  setIsLoading(false);
                  toast.error("Something went wrong while tagging files.");
                  handleClose();
                }
              } else {
                if (isStatutory) {
                  if (
                    selectedMandatoryFolder?.length === 0 &&
                    selectedMandatoryFile?.length === 0
                  ) {
                    setIsLoading(false);
                    toast.warn(
                      "Please select folder to Upload file in Statuary"
                    );
                    return;
                  } else {
                    if (selectedMandatoryFolder?.length > 0) {
                      folderIdForUpload = selectedMandatoryFolder[0].id;
                    }
                  }
                }
                const data = {
                  folderId: folderIdForUpload,
                  files: [],
                };
                if (isStatutory) {
                  if (selectedMandatoryFile?.length > 0) {
                    // Fetch the file from the provided URL
                    data.folderId = selectedMandatoryFile[0].folderId;
                    const response = await fetch(
                      selectedMandatoryFile[0].fileBlobUrl
                    );

                    // Convert the response to a Blob
                    const fileBlob = await response.blob();
                    fileExtensionValue =
                      selectedMandatoryFile[0]?.name?.split(".")?.[1];
                    // Create a File object from the Blob
                    const file = new File(
                      [fileBlob],
                      selectedMandatoryFile[0].fileName,
                      {
                        type: fileBlob.type,
                      }
                    );

                    // Create a DataTransfer object to manipulate the FileList
                    const dataTransfer = new DataTransfer();

                    // Add existing files from the FileList to the DataTransfer object
                    for (let i = 0; i < formData.fileUpload.length; i++) {
                      dataTransfer.items.add(formData.fileUpload[i]);
                    }

                    // Add the new file
                    dataTransfer.items.add(file);

                    // Assign the new FileList back to formData.fileUpload
                    formData.fileUpload = dataTransfer.files;
                    data.files.push({
                      ...formData,
                      name: formData?.name
                        ? formData?.name
                        : selectedMandatoryFile[0].fileName,
                      fileVersion: selectedMandatoryFolder?.[0]?.fileVersion
                        ? Number(selectedMandatoryFolder?.[0]?.fileVersion) + 1
                        : 1,
                      siteId: siteSelectedForGlobal?.siteId,
                      issueDate: formData?.issueDate
                        ? `${formData?.issueDate} 10:00:00`
                        : "",
                      expiryDate: formData?.expiryDate
                        ? `${formData?.expiryDate} 10:00:00`
                        : "",
                    });
                  } else if (formData?.fileUpload?.length > 0) {
                    data.files.push({
                      ...formData,
                      name: formData?.name,
                      fileVersion: selectedMandatoryFolder?.[0]?.fileVersion
                        ? Number(selectedMandatoryFolder?.[0]?.fileVersion) + 1
                        : 1,
                      siteId: siteSelectedForGlobal?.siteId,
                      issueDate: formData?.issueDate
                        ? `${formData?.issueDate} 10:00:00`
                        : "",
                      expiryDate: formData?.expiryDate
                        ? `${formData?.expiryDate} 10:00:00`
                        : "",
                    });
                  } else {
                    setIsLoading(false);
                    toast.warn(
                      "Please select file from select file or upload new version to proceed."
                    );
                    return;
                  }
                } else {
                  data.files.push({
                    ...formData,
                    name: formData?.name,
                    fileVersion: selectedMandatoryFolder?.[0]?.fileVersion
                      ? Number(selectedMandatoryFolder?.[0]?.fileVersion) + 1
                      : 1,
                    siteId: siteSelectedForGlobal?.siteId,
                    issueDate: formData?.issueDate
                      ? `${formData?.issueDate} 10:00:00`
                      : "",
                    expiryDate: formData?.expiryDate
                      ? `${formData?.expiryDate} 10:00:00`
                      : "",
                  });
                }
                const fileExtension = isStatutory
                  ? fileExtensionValue
                  : formData.fileUpload[0].name?.split(".")?.pop();
                data.files[0].name =
                  formData?.name?.length > 0
                    ? `${formData?.name}.${fileExtension}`
                    : formData.fileUpload[0].name;
                await submitFile(data, formData.fileUpload[0], formData);
                if (!isStatutory) {
                  checkAndAddExpiryCalenderEvent(data.files[0], data.folderId);
                }
                setIsLoading(false);
              }
            } catch (e) {
              toast.error(
                "Something went wrong while adding new file. Please try again!!"
              );
              setIsLoading(false);
            }
          }),
        }}
      >
        <DialogTitle>Select or Upload New Files</DialogTitle>
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
                    {isStatutory ? (
                      <input
                        type="text"
                        disabled
                        value={
                          folderData?.requirement
                            ? folderData?.requirement
                            : folderData?.subType
                        }
                        className="form-control"
                        {...register("folderName")}
                      />
                    ) : (
                      <input
                        type="text"
                        disabled
                        value={
                          selectedMandatoryFolder?.[0]?.folderName
                            ? selectedMandatoryFolder?.[0]?.folderName
                            : selectedMandatoryFolder?.[0]?.name
                        }
                        className="form-control"
                        {...register("folderName")}
                      />
                    )}
                  </div>
                </Grid>
                <Grid sm={6}>
                  <div style={{ margin: "10px" }}>
                    <label htmlFor="fileName">File Name</label>
                    <input
                      type="text"
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
                        selectedMandatoryFolder?.[0]?.fileVersion
                          ? Number(selectedMandatoryFolder?.[0]?.fileVersion) +
                            1
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
                <Grid sm={isStatutory ? 8 : 12}>
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
                {!isStatutory && <Grid sm={6}>
                  <MandatoryFolders
                    isStatutory={isStatutory}
                    isSingleFolderSelect={isStatutory ? false : true}
                    setSelectedMandatoryFolder={setSelectedMandatoryFolder}
                    selectedMandatoryFolder={selectedMandatoryFolder}
                  />
                </Grid>}
              </Grid>
            </Grid>
            <Grid sm={4}>
              <div
                style={{
                  backgroundColor: "#f1f5f9",
                  margin: "10px",
                  display: selectedMandatoryFile?.length > 0 || !!(
                    !selectedMandatoryFolder?.[0]?.requirement &&
                    selectedMandatoryFolder?.[0]?.id &&
                    isStatutory
                  ) ? "none" : "",
                }}
              >
                <div className="uploadPhotoButton">
                  <FileUploadOutlinedIcon
                    style={{
                      color: "blue",
                      fontSize: "50px",
                      marginLeft: "4rem",
                    }}
                  />
                  <label htmlFor="fileUpload">Select New File</label>
                  <input
                    type="file"
                    name="fileUpload"
                    className="form-control"
                    {...register("fileUpload", {
                      required: isStatutory ? false : "A file is required",
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
                  <p>(max 100 MB)</p>
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
