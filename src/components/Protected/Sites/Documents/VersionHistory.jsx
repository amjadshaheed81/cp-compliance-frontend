import React, { useState } from "react";
import { Button, Modal, Typography, Box } from "@mui/material";
import FileUploadOutlinedIcon from "@mui/icons-material/FileUploadOutlined";

const VersionHistory = ({ currentFolder }) => {
    const [open, setOpen] = React.useState(false);
    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
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

    return (
        <>
            <Button onClick={handleOpen}>Version History</Button>
            <Modal
                open={open}
                onClose={handleClose}
                aria-labelledby="modal-modal-title"
                aria-describedby="modal-modal-description"
            >
                <Box sx={style}>
                    <Typography id="modal-modal-title" variant="h6" component="h2">
                    Version History
                    </Typography>
                    <form class="row">
                        <div class="d-flex">
                            <div>
                            <label htmlFor="folder" name="folder">Folder</label>
                            <input type="text" name="folder" class="form-control" />
                            </div>
                            <div>
                            <label htmlFor="file" name="file">File</label>
                            <input type="text" name="file" class="form-control" />
                            </div>
                            <div>
                            <label htmlFor="fileUpload" name="fileUpload">Upload New Version</label>
                            <input type="file" name="fileUpload" class="form-control" />
                            </div>
                            
                        </div>
                        <table class="f-11">
                    <thead>
                        <tr>
                            <th scope="col">File</th>
                            <th scope="col">Version</th>
                            <th scope="col">Uploaded By</th>
                            <th scope="col">Date</th>
                            <th scope="col">Action</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                        <div><i style={{color: '#384BD3'}} class="fas fa-folder fa-2x"></i><span class="p-3">Statutory Documents</span></div>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>
                            <span style={{color: 'gray'}}><i class="fa fa-eye fa-2x" aria-hidden="true" size="md"></i></span>
                            </td>
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

export default VersionHistory;