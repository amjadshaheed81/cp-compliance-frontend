import React, { useState } from "react";
import { Button, Modal, Typography, Box } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";
import { useForm } from "react-hook-form";

const BulkUpload = ({ bulkUploadModal, setBulkUploadModal, folder }) => {
    const handleOpen = () => setBulkUploadModal(true);
    const handleClose = () => setBulkUploadModal(false);
    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 700,
        height: 500,
        bgcolor: 'background.paper',
        border: '2px solid #fff',
        boxShadow: 24,
        p: 4,
    };
    const {
        register,
        handleSubmit,
      } = useForm({});
      const handleFileSelect = async (event) => {
        console.log('event', event);
      };

    return (
        <>
            <Button onClick={handleOpen}>Bulk Upload</Button>
            <Modal
                open={bulkUploadModal}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                        Bulk Upload Files
                    </Typography>
                    <form class="row">
                        <div class="col-md-6 h-50">
                            <label htmlFor="folder" name="folder">Folder</label>
                            <input type="text" name="folder" class="form-control" value={folder} />
                        </div>
                        <div class="col-md-6 h-50">
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
                                        class="btn"
                                    >
                                        Click to upload
                                    </label>
                                    <span>or drag and drop</span>
                                    <p>SVG, PNG, JPG or GIF</p>
                                    <p>(max 1 MB each)</p>
                                </div>
                            </div>
                        </div>
                        <table class="f-11">
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
                        <div><i style={{color: '#384BD3'}} class="fas fa-folder fa-2x"></i><span class="p-3">Statutory Documents</span></div>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                        </tr>
                    </tbody>
                </table>
                <div class="d-flex d-flex flex-lg-row-reverse">
                <div>
                                <button class="btn btn-primary float-end">Save</button>
                            </div>
                            <div>
                                <button class="btn btn-primary float-end" style={{marginRight: '1rem'}}>Cancel</button>
                            </div>
                </div>
                    </form>
                </Box>
            </Modal>
        </>
    );
};

export default BulkUpload;