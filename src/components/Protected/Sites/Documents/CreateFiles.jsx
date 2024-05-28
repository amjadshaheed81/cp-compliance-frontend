import React, { useState } from "react";
import { Button, Modal, Typography, Box } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

const CreateFiles = ({ currentFolder }) => {
    const [showModal, setShowModal] = useState(false);
    const [folderName, setFolderName] = useState("");
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
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
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                    Upload New File
                    </Typography>
                    <form class="row">
                        <div class="col-md-8">
                            <label htmlFor="folder" name="folder">Folder</label>
                            <input type="text" name="folder" class="form-control" />
                            <div class="d-flex mt-2">
                                <div class="col-md-6" style={{ marginRight: '1rem' }}>
                                    <label htmlFor="fileName" name="fileName">File Name</label>
                                    <input type="text" name="fileName" class="form-control" />
                                </div>
                                <div class="col-md-6">
                                    <label htmlFor="version" name="version">Version</label>
                                    <input type="text" name="version" class="form-control" />
                                </div>
                            </div>
                            <div class="d-flex mt-2">
                                <div class="col-md-4" style={{ marginRight: '1rem' }}>
                                    <label htmlFor="issueDate" name="folder">Issue Date</label>
                                    <input type="time" name="folder" class="form-control" />
                                </div>
                                <div class="col-md-4" style={{ marginRight: '1rem' }}>
                                    <label htmlFor="expiryDate" name="expiryDate">Expiry Date</label>
                                    <input type="time" name="expiryDate" class="form-control" />
                                </div>
                                <div class="col-md-4">
                                    <label htmlFor="reviewer" name="reviewer">Reviewer</label>
                                    <input type="text" name="reviewer" class="form-control w-75" />
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
                                    <input
                                        // {...register("photo")}
                                        className="uploadButton-input"
                                        type="file"
                                        name="siteImage"
                                        accept="image/*, application/pdf"
                                        id="siteImage"
                                    // onChange={handleFileSelect}
                                    />
                                    <label
                                        htmlFor="siteImage"
                                        style={{ color: "blue" }}
                                        class="btn"
                                    >
                                        Click to upload
                                    </label>
                                    <span>or drag and drop</span>
                                    <p>SVG, PNG, JPG or GIF</p>
                                    <p>(max 1 MB)</p>
                                </div>
                            </div><div>
                                <button class="btn btn-primary float-end mt-5">Save</button>
                            </div>
                            <div>
                                <button class="btn btn-primary float-end mt-5" style={{marginRight: '1rem'}}>Cancel</button>
                            </div>
                        </div>
                    </form>
                </Box>
            </Modal>
        </>
    );
};

export default CreateFiles;