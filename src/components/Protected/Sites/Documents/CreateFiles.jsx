import React, { useEffect, useState } from "react";
import { Button, Modal, Typography, Box, Grid, Paper, InputAdornment } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
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
    const [fileSize, setFileSize] = useState("");
    const [open, setOpen] = React.useState(false);
    const [dragOver, setDragOver] = useState(false);
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
        watch,
        formState: { errors },
    } = useForm({});

    const fileUploadWatch = watch("fileUpload");

    useEffect(() => {
        if (fileUploadWatch?.[0]) {
            const file = fileUploadWatch[0];
            setFileName(file.name);
            setFileSize(formatFileSize(file.size));
        }
    }, [fileUploadWatch]);

    useEffect(() => {
        setValue(
            "name",
            selectedMandatoryFolder?.[0]?.folderName
                ? selectedMandatoryFolder?.[0]?.name
                : ""
        );
    }, []);

    const formatFileSize = (bytes) => {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
    };

    // Helper function to format dates for API
    const formatDateForAPI = (dateString, defaultTime = "10:00:00") => {
        if (!dateString) return "";
        // If date already has time (ISO format), convert it
        if (dateString.includes('T')) {
            return moment(dateString).format("YYYY-MM-DD HH:mm:ss");
        }
        // If it's already in the correct format, return as-is
        if (dateString.includes(' ')) {
            return dateString;
        }
        // If just date (YYYY-MM-DD), add default time
        return `${dateString} ${defaultTime}`;
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        setDragOver(true);
    };

    const handleDragLeave = (e) => {
        e.preventDefault();
        setDragOver(false);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setDragOver(false);

        const files = e.dataTransfer.files;
        if (files.length > 0) {
            const file = files[0];
            const fileSizeLimit = 100 * 1024 * 1024;

            if (file.size > fileSizeLimit) {
                toast.error("File size cannot exceed 100MB");
                return;
            }

            const dataTransfer = new DataTransfer();
            dataTransfer.items.add(file);

            // Create a fake event to set the file input
            const input = document.querySelector('input[name="fileUpload"]');
            if (input) {
                input.files = dataTransfer.files;
                const event = new Event('change', { bubbles: true });
                input.dispatchEvent(event);
            }
        }
    };

    const submitFile = async (data, fileUpload, formData) => {
        const fileSizeLimit = 100 * 1024 * 1024;

        if (fileUpload?.size > fileSizeLimit) {
            toast.error("File size cannot exceed 100MB");
            return;
        }
        const originalFileName = formData.fileUpload[0].name;
        const fileNameParts = originalFileName.split('.');
        const fileExtension = fileNameParts.pop().toLowerCase();
        const normalizedFileName = fileNameParts.join('.') + '.' + fileExtension;
        const existingFile = folderfiles?.filter(
            (f) => f.name.toLowerCase() === normalizedFileName.toLowerCase()
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
                    selectedMandatoryFile[0].issueDate?.replace("T", " ") || "";
                reqData.documentRequestString.files[0].expiryDate =  // Fixed: changed from issueDate to expiryDate
                    selectedMandatoryFile[0].expiryDate?.replace("T", " ") || "";
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

    const checkAndAddExpiryCalenderEvent = async (data, folderId) => {
        try {
            // Parse the date if it's in "YYYY-MM-DD HH:mm:ss" format
            let expiryDateForCalendar = data.expiryDate;

            // If date is in "YYYY-MM-DD HH:mm:ss" format, convert to ISO for moment
            if (expiryDateForCalendar && expiryDateForCalendar.includes(' ')) {
                expiryDateForCalendar = expiryDateForCalendar.replace(' ', 'T');
            }

            const body = {
                siteId: siteSelectedForGlobal?.siteId,
                startDate: expiryDateForCalendar ?
                    moment(expiryDateForCalendar).format("YYYY-MM-DDTHH:mm:ss") : null,
                endDate: expiryDateForCalendar ?
                    moment(expiryDateForCalendar).format("YYYY-MM-DDTHH:mm:ss") : null,
                shortText: "Document Expiring: " + (data.name || "Unnamed Document"),
                eventType: "Document Expiring",
                userId: loggedInUserData?.id,
                section: `/subfolder/?id=${folderId}`,
            };

            const response = await put("/api/user/calendar", body);
            if (response?.status === 200) {
                toast.success("Calendar event created successfully");
            }
        } catch (error) {
            console.error("Failed to create calendar event:", error);
            toast.warning("File uploaded but calendar event creation failed");
        }
    };

    return (
        <React.Fragment>
            <Button variant="outlined" onClick={handleOpen} startIcon={<FileUploadOutlinedIcon />}>
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
                                    `/api/document/parent/${selectedMandatoryFolder?.[0]?.id}/folders?siteId=${siteSelectedForGlobal?.siteId}`
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
                                        toast.success("Files tagged successfully.");
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
                                        "There are no files available in this document to tag."
                                    );
                                }
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
                                    toast.success("File tagged successfully.");
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
                                            "Please select folder to upload file in Statutory"
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
                                        // Handle mandatory file selection
                                        data.folderId = selectedMandatoryFile[0].folderId;
                                        const response = await fetch(
                                            selectedMandatoryFile[0].fileBlobUrl
                                        );
                                        const fileBlob = await response.blob();
                                        fileExtensionValue =
                                            selectedMandatoryFile[0]?.name?.split(".")?.[1];
                                        const file = new File(
                                            [fileBlob],
                                            selectedMandatoryFile[0].fileName,
                                            {
                                                type: fileBlob.type,
                                            }
                                        );
                                        const dataTransfer = new DataTransfer();
                                        for (let i = 0; i < formData.fileUpload?.length || 0; i++) {
                                            dataTransfer.items.add(formData.fileUpload[i]);
                                        }
                                        dataTransfer.items.add(file);
                                        formData.fileUpload = dataTransfer.files;

                                        data.files.push({
                                            ...formData,
                                            name: formData?.name || selectedMandatoryFile[0].fileName,
                                            fileVersion: selectedMandatoryFolder?.[0]?.fileVersion
                                                ? Number(selectedMandatoryFolder?.[0]?.fileVersion) + 1
                                                : 1,
                                            siteId: siteSelectedForGlobal?.siteId,
                                            issueDate: formatDateForAPI(formData?.issueDate),
                                            expiryDate: formatDateForAPI(formData?.expiryDate),
                                        });
                                    } else if (formData?.fileUpload?.length > 0) {
                                        data.files.push({
                                            ...formData,
                                            name: formData?.name,
                                            fileVersion: selectedMandatoryFolder?.[0]?.fileVersion
                                                ? Number(selectedMandatoryFolder?.[0]?.fileVersion) + 1
                                                : 1,
                                            siteId: siteSelectedForGlobal?.siteId,
                                            issueDate: formatDateForAPI(formData?.issueDate),
                                            expiryDate: formatDateForAPI(formData?.expiryDate),
                                        });
                                    } else {
                                        setIsLoading(false);
                                        toast.warn(
                                            "Please select file from select file or upload new version to proceed."
                                        );
                                        return;
                                    }
                                } else {
                                    // Non-statutory upload
                                    if (!formData?.fileUpload?.[0]) {
                                        setIsLoading(false);
                                        toast.error("Please select a file to upload");
                                        return;
                                    }

                                    data.files.push({
                                        ...formData,
                                        name: formData?.name,
                                        fileVersion: selectedMandatoryFolder?.[0]?.fileVersion
                                            ? Number(selectedMandatoryFolder?.[0]?.fileVersion) + 1
                                            : 1,
                                        siteId: siteSelectedForGlobal?.siteId,
                                        issueDate: formatDateForAPI(formData?.issueDate),
                                        expiryDate: formatDateForAPI(formData?.expiryDate),
                                    });
                                }

                                const fileExtension = isStatutory
                                    ? fileExtensionValue
                                    : formData.fileUpload[0].name?.split(".")?.pop()?.toLowerCase();
                                const originalFileName = formData.fileUpload[0].name;
                                const lastDotIndex = originalFileName.lastIndexOf('.');
                                const fileNameWithoutExt = lastDotIndex >= 0
                                    ? originalFileName.substring(0, lastDotIndex)
                                    : originalFileName;

                                data.files[0].name =
                                    formData?.name?.length > 0
                                        ? `${formData?.name}.${fileExtension}`
                                        : `${fileNameWithoutExt}.${fileExtension}`;

                                await submitFile(data, formData.fileUpload[0], formData);

                                if (!isStatutory && data.files[0].expiryDate) {
                                    await checkAndAddExpiryCalenderEvent(data.files[0], data.folderId);
                                }

                                setIsLoading(false);
                            }
                        } catch (e) {
                            console.error("Upload error:", e);
                            toast.error(
                                "Something went wrong while adding new file. Please try again!!"
                            );
                            setIsLoading(false);
                        }
                    }),
                }}
            >
                <DialogTitle sx={{ borderBottom: 1, borderColor: 'divider', pb: 2 }}>
                    Select or Upload New Files
                </DialogTitle>
                <DialogContent dividers sx={{ pt: 3 }}>
                    <Grid container spacing={3}>
                        <Grid item xs={12} md={8}>
                            <Grid container spacing={2}>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label={isStatutory ? "Requirement" : "Folder"}
                                        fullWidth
                                        disabled
                                        value={
                                            isStatutory
                                                ? folderData?.requirement || folderData?.subType || ""
                                                : selectedMandatoryFolder?.[0]?.folderName ||
                                                selectedMandatoryFolder?.[0]?.name || ""
                                        }
                                        variant="outlined"
                                        size="small"
                                        {...register("folderName")}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={6}>
                                    <TextField
                                        label="File Name"
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        {...register("name")}
                                        helperText="Leave empty to use original file name"
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Version"
                                        fullWidth
                                        disabled
                                        value={
                                            selectedMandatoryFolder?.[0]?.fileVersion
                                                ? Number(selectedMandatoryFolder?.[0]?.fileVersion) + 1
                                                : 1
                                        }
                                        variant="outlined"
                                        size="small"
                                        {...register("version")}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Issue Date"
                                        type="date"
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        {...register("issueDate", {
                                            onChange: (e) => {
                                                if (e.target.value) {
                                                    setValue("issueDate", e.target.value);
                                                    const expiryDate = moment(e.target.value)
                                                        .add(1, 'years')
                                                        .format('YYYY-MM-DD');
                                                    setValue("expiryDate", expiryDate);
                                                }
                                            }
                                        })}
                                    />
                                </Grid>
                                <Grid item xs={12} sm={4}>
                                    <TextField
                                        label="Expiry Date"
                                        type="date"
                                        fullWidth
                                        variant="outlined"
                                        size="small"
                                        InputLabelProps={{ shrink: true }}
                                        {...register("expiryDate")}
                                    />
                                </Grid>
                                <Grid item xs={12}>
                                    <TextField
                                        label={isStatutory ? "Reference Number" : "Notes"}
                                        fullWidth
                                        multiline={!isStatutory}
                                        rows={isStatutory ? 1 : 3}
                                        variant="outlined"
                                        size="small"
                                        placeholder={isStatutory ? "Enter reference number..." : "Enter notes..."}
                                        {...register("note")}
                                    />
                                </Grid>
                                {!isStatutory && (
                                    <Grid item xs={12}>
                                        <MandatoryFolders
                                            isStatutory={isStatutory}
                                            isSingleFolderSelect={isStatutory ? false : true}
                                            setSelectedMandatoryFolder={setSelectedMandatoryFolder}
                                            selectedMandatoryFolder={selectedMandatoryFolder}
                                        />
                                    </Grid>
                                )}
                            </Grid>
                        </Grid>

                        <Grid item xs={12} md={4}>
                            <Paper
                                elevation={0}
                                sx={{
                                    p: 3,
                                    border: '2px dashed',
                                    borderColor: dragOver ? 'primary.main' : 'grey.300',
                                    backgroundColor: dragOver ? 'action.hover' : 'grey.50',
                                    textAlign: 'center',
                                    cursor: 'pointer',
                                    height: '100%',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    justifyContent: 'center',
                                    alignItems: 'center',
                                    transition: 'all 0.2s',
                                }}
                                onDragOver={handleDragOver}
                                onDragLeave={handleDragLeave}
                                onDrop={handleDrop}
                                onClick={() => document.querySelector('input[name="fileUpload"]')?.click()}
                            >
                                <CloudUploadIcon
                                    sx={{
                                        fontSize: 48,
                                        color: 'primary.main',
                                        mb: 2
                                    }}
                                />

                                <Typography variant="h6" gutterBottom>
                                    Drag & Drop or Click to Upload
                                </Typography>

                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                    Supports all file types
                                </Typography>

                                <Typography variant="caption" color="text.secondary" gutterBottom>
                                    Maximum file size: 100MB
                                </Typography>

                                <input
                                    type="file"
                                    name="fileUpload"
                                    id="fileUpload"
                                    style={{ display: 'none' }}
                                    {...register("fileUpload", {
                                        required: !isStatutory || (!selectedMandatoryFile?.length && !selectedMandatoryFolder?.[0]?.requirement),
                                    })}
                                />

                                {fileName && (
                                    <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, width: '100%' }}>
                                        <Typography variant="body2" noWrap>
                                            📎 {fileName}
                                        </Typography>
                                        {fileSize && (
                                            <Typography variant="caption" color="text.secondary">
                                                Size: {fileSize}
                                            </Typography>
                                        )}
                                    </Box>
                                )}

                                {errors.fileUpload && (
                                    <Typography color="error" variant="caption" sx={{ mt: 1 }}>
                                        {errors.fileUpload.message}
                                    </Typography>
                                )}

                                <Button
                                    variant="contained"
                                    component="span"
                                    startIcon={<FileUploadOutlinedIcon />}
                                    sx={{ mt: 2 }}
                                >
                                    Browse Files
                                </Button>
                            </Paper>
                        </Grid>
                    </Grid>
                </DialogContent>
                <DialogActions sx={{ px: 3, py: 2, borderTop: 1, borderColor: 'divider' }}>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center' }}>
                        {isLoading && (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CircularProgress size={20} />
                                <Typography variant="body2" color="text.secondary">
                                    Uploading...
                                </Typography>
                            </Box>
                        )}
                    </Box>
                    <Button onClick={handleClose} disabled={isLoading}>
                        Cancel
                    </Button>
                    <Button
                        type="submit"
                        variant="contained"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Uploading...' : 'Upload File'}
                    </Button>
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