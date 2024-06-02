import React, { useState } from "react";
import { Button, Modal, Typography, Box } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useForm } from "react-hook-form";
import { uploadDocumentFile } from "../../../../store/thunk/site";
import { connect } from "react-redux";

const CreateFiles = ({ showModal, setShowModal, folderId, uploadDocumentFile }) => {
    // const [showModal, setShowModal] = useState(false);
    console.log('folderId', folderId);
    const [folderName, setFolderName] = useState("");
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setShowModal(true);
    const handleClose = () => setShowModal(false);
    const {
        register,
        handleSubmit,
    } = useForm({});
    const submitFile = (data, folderId) => {
        console.log('data', data);
        console.log('folderIdfolderId', folderId);
        uploadDocumentFile(data, folderId);
    }
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700,
        height: 400,
        bgcolor: 'background.paper',
        border: '2px solid #fff',
        boxShadow: 24,
        p: 4,
    };

    return (
        <>
            <Button onClick={handleOpen}>Upload New Files</Button>
            <Modal
                open={showModal}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Upload New File
                    </Typography>
                    <form class="row" onSubmit={handleSubmit(submitFile)}>
                        <div class="col-md-8">
                            <label htmlFor="folder" name="folder">Folder</label>
                            <input type="text" name="folderName" class="form-control" {...register("folderName")}
                            />
                            <div class="d-flex mt-2">
                                <div class="col-md-6" style={{ marginRight: '1rem' }}>
                                    <label htmlFor="fileName" name="fileName">File Name</label>
                                    <input type="text" name="fileName" class="form-control"
                                        {...register("fileName")}
                                    />
                                </div>
                                <div class="col-md-6">
                                    <label htmlFor="version" name="version">Version</label>
                                    <input type="text" name="version" class="form-control"
                                        {...register("version")}
                                    />
                                </div>
                            </div>
                            <div class="d-flex mt-2">
                                <div class="col-md-4" style={{ marginRight: '1rem' }}>
                                    <label htmlFor="issueDate" name="folder">Issue Date</label>
                                    <input type="time" name="folder" class="form-control"
                                        {...register("issueDate")}
                                    />
                                </div>
                                <div class="col-md-4" style={{ marginRight: '1rem' }}>
                                    <label htmlFor="expiryDate" name="expiryDate">Expiry Date</label>
                                    <input type="time" name="expiryDate" class="form-control"
                                        {...register("expiryDate")}
                                    />
                                </div>
                                <div class="col-md-4">
                                    <label htmlFor="reviewer" name="reviewer">Reviewer</label>
                                    <input type="text" name="reviewer" class="form-control w-75"
                                        {...register("reviewer")}
                                    />
                                </div>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div
                                style={{ backgroundColor: "#f1f5f9" }}
                            >
                                <div className="uploadPhotoButton">
                                    <FileUploadOutlinedIcon
                                        style={{
                                            color: "blue",
                                            fontSize: "50px",
                                            marginLeft: "4rem",
                                        }}
                                    />
                                    <label htmlFor="fileUpload" name="fileUpload">Upload New Version</label>
                                    <input type="file" name="fileUpload" class="form-control" {...register('fileUpload')} />
                                    <span>or drag and drop</span>
                                    <p>SVG, PNG, JPG or GIF</p>
                                    <p>(max 1 MB)</p>
                                </div>
                            </div><div>
                                <button class="btn btn-primary float-end mt-5">Save</button>
                            </div>
                            <div>
                                <button class="btn btn-primary float-end mt-5" style={{ marginRight: '1rem' }}>Cancel</button>
                            </div>
                        </div>
                    </form>
                </Box>
            </Modal>
        </>
    );
};

const mapStateToProps = (state) => ({
    success: state.site.success,
    error: state.site.error,
});
export default connect(mapStateToProps, {
    uploadDocumentFile,
})(CreateFiles);
