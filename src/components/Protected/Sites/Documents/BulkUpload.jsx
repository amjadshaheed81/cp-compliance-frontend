import React, { useEffect, useState } from "react";
import {
    Button,
    Box,
    DialogActions,
    DialogContent,
    DialogTitle,
    Dialog,
    Chip,
    Typography,
} from "@mui/material";
import { CloudUpload, Close, Folder } from "@mui/icons-material";
import { useForm } from "react-hook-form";
import moment from "moment";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import { uploadPhoto, uploadNewVersion, get } from "../../../../api";
import MandatoryFolders from "../Contracts/MandatoryFolders";

const BulkUpload = ({
                        bulkUploadModal,
                        setBulkUploadModal,
                        folder,
                        siteSelectedForGlobal,
                        loggedInUserData,
                        refresh,
                        folderfiles
                    }) => {
    const handleClose = () => setBulkUploadModal(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedMandatoryFolder, setSelectedMandatoryFolder] = useState([folder] || []);
    const [files, setFiles] = useState([]);
    const [issueDate, setIssueDate] = useState("");
    const [expiryDate, setExpiryDate] = useState("");

    useEffect(() => {
        setFiles(folder?.files || []);
    }, [folder]);

    useEffect(() => {
        if (selectedMandatoryFolder?.length > 0) {
            getFiles();
        }
    }, [selectedMandatoryFolder]);

    const getFiles = async () => {
        const url = `/api/document/parent/${selectedMandatoryFolder[0].id}/folders?siteId=${siteSelectedForGlobal?.siteId}`;
        const res = await get(url);
        setFiles(res?.document?.files || []);
    };

    const { register, handleSubmit, watch, reset } = useForm({});
    const values = watch() || {};

    const submitBulkUpload = async (formData) => {
        if (!formData?.bulkUpload || formData.bulkUpload.length === 0) {
            toast.error("Please select files to upload");
            return;
        }

        setIsLoading(true);

        for (const iterator of formData.bulkUpload) {
            const existingFile = folderfiles.filter(f => f.name === iterator?.name);

            const fileData = {
                ...iterator,
                name: iterator?.name,
                id: existingFile?.length > 0 ? existingFile?.[0]?.id : undefined,
                originalFileName: iterator?.name,
                fileVersion: existingFile?.length > 0 ? existingFile?.[0]?.fileVersion + 1 : 1,
                siteId: siteSelectedForGlobal?.siteId,
                uploaderUserId: loggedInUserData?.id,
                reviewerUserId: loggedInUserData?.id,
                uploadDate: `${moment(new Date()).format("YYYY-MM-DD")} 10:00:00`,
            };

            if (issueDate) fileData.issueDate = issueDate;
            if (expiryDate) fileData.expiryDate = expiryDate;

            const data = {
                files: iterator,
                documentRequestString: {
                    folderId: selectedMandatoryFolder?.[0]?.id,
                    files: [fileData],
                },
            };

            const url = existingFile?.length > 0 ? `/api/document/file/newVersion/upload` : `/api/document/files/upload`;
            const formDataPayload = new FormData();
            formDataPayload.append(existingFile?.length > 0 ? "file" : "files", data.files);
            formDataPayload.append("documentRequestString", JSON.stringify(data.documentRequestString));

            try {
                if (existingFile?.length > 0) {
                    await uploadNewVersion(url, formDataPayload);
                } else {
                    await uploadPhoto(url, formDataPayload);
                }
            } catch (error) {
                toast.error(`Failed to upload ${iterator?.name}`);
            }
        }

        setIsLoading(false);
        toast.success("Files uploaded successfully");
        handleClose();
        refresh();
        reset();
    };

    return (
        <Dialog
            open={bulkUploadModal}
            onClose={handleClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                component: "form",
                onSubmit: handleSubmit(submitBulkUpload),
                sx: { borderRadius: 1 }
            }}
        >
            <DialogTitle sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Upload Files</Typography>
                <Button onClick={handleClose} size="small" sx={{ minWidth: 'auto' }}>
                    <Close />
                </Button>
            </DialogTitle>

            <DialogContent sx={{ p: 2 }}>
                {/* Upload Zone */}
                <Box
                    sx={{
                        border: '1px dashed #ccc',
                        borderRadius: 1,
                        p: 3,
                        textAlign: 'center',
                        mb: 2,
                        cursor: 'pointer',
                        '&:hover': { borderColor: '#666' }
                    }}
                    onClick={() => document.getElementById('bulkUpload').click()}
                >
                    <input
                        {...register("bulkUpload")}
                        type="file"
                        name="bulkUpload"
                        multiple
                        accept="image/*, application/pdf"
                        id="bulkUpload"
                        style={{ display: 'none' }}
                    />
                    <CloudUpload sx={{ fontSize: 40, color: '#666', mb: 1 }} />
                    <Typography variant="body1" gutterBottom>
                        Drop files or click to upload
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                        PDF, PNG, JPG, GIF • Max 100MB
                    </Typography>
                </Box>

                {/* Selected Files */}
                {values?.bulkUpload?.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                            Selected: {values.bulkUpload.length} file(s)
                        </Typography>
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                            {Array.from(values.bulkUpload).map((file, index) => (
                                <Chip key={index} label={file.name} size="small" />
                            ))}
                        </Box>
                    </Box>
                )}

                {/* Folder Selection */}
                <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Folder fontSize="small" />
                        Folder
                    </Typography>
                    <MandatoryFolders
                        isStatutory={false}
                        isSingleFolderSelect={true}
                        setFiles={setFiles}
                        setSelectedMandatoryFolder={setSelectedMandatoryFolder}
                        selectedMandatoryFolder={selectedMandatoryFolder}
                    />
                </Box>

                {/* Dates */}
                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" gutterBottom>
                            Issue Date
                        </Typography>
                        <input
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                fontSize: '14px'
                            }}
                        />
                    </Box>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="body2" gutterBottom>
                            Expiry Date
                        </Typography>
                        <input
                            type="date"
                            value={expiryDate}
                            onChange={(e) => setExpiryDate(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '6px 8px',
                                border: '1px solid #ddd',
                                borderRadius: 4,
                                fontSize: '14px'
                            }}
                        />
                    </Box>
                </Box>

                {/* Existing Files */}
                {files.length > 0 && (
                    <Box>
                        <Typography variant="body2" gutterBottom>
                            Existing files: {files.length}
                        </Typography>
                        <Box sx={{ maxHeight: 120, overflow: 'auto', border: '1px solid #eee', borderRadius: 1, p: 1 }}>
                            {files.map((file) => (
                                <Box key={file.id} sx={{ display: 'flex', justifyContent: 'space-between', py: 0.5, fontSize: '12px' }}>
                                    <span>{file.name}</span>
                                    <span>v{file.fileVersion}</span>
                                </Box>
                            ))}
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ p: 2 }}>
                <Button onClick={handleClose}>Cancel</Button>
                <Button
                    type="submit"
                    variant="contained"
                    disabled={!values?.bulkUpload || values.bulkUpload.length === 0 || isLoading}
                >
                    {isLoading ? 'Uploading...' : 'Upload'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

const mapStateToProps = (state) => ({
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
    loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {})(BulkUpload);