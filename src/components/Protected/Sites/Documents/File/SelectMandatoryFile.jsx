import React, { Fragment, useEffect, useState } from "react";
import {
    Box,
    Button,
    Chip,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
} from "@mui/material";
import { connect } from "react-redux";
import { getDocumentsRootFolder } from "../../../../../store/thunk/site";
import { toast } from "react-toastify";
import { get } from "../../../../../api";

const MandatoryFile = ({
                           getDocumentsRootFolder,
                           rootFolder,
                           selectedMandatoryFile,
                           setSelectedMandatoryFile,
                           siteSelectedForGlobal,
                           isStatutory,
                       }) => {
    const [openFolder, setFolderOpen] = useState(false);
    const [filteredFolders, setFilteredFolders] = useState([]);
    const [files, setFiles] = useState([]);
    useEffect(() => {
        setFilteredFolders(rootFolder?.parentFolders || []);
    }, [rootFolder]);
    useEffect(() => {
        getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
    }, [getDocumentsRootFolder, siteSelectedForGlobal]);

    const handleFolderOpen = (e) => {
        e?.preventDefault();
        setFolderOpen((prev) => !prev);
    };

    const handleFolderClose = () => {
        setFolderOpen(false);
        setFilteredFolders(rootFolder?.parentFolders || []);
        setFiles([]);
    };

    const handleRemoveFolder = (id) => {
        setSelectedMandatoryFile((prev) =>
            prev.filter((folder) => folder.id !== id)
        );
    };

    const handleAddFolder = (folder) => {
        if (isStatutory) {
            if (selectedMandatoryFile?.length > 0) {
                toast.warn("You can select only one file to upload file for statutory.")
            } else {
                setSelectedMandatoryFile([
                    ...selectedMandatoryFile,
                    folder,
                ]);
            }
        } else {
            const isFolderAlreadySelected = selectedMandatoryFile?.filter(itm => itm?.id === folder?.id);
            if (isFolderAlreadySelected?.length > 0) {
                toast.warn(`${folder?.name} is already selected`);
            } else {
                setSelectedMandatoryFile((prev) => [...prev, folder]);
            }
        }
    };

    const checkSubFolder = async (folderId) => {
        const res = await get(`/api/document/parent/${folderId}/folders?siteId=${siteSelectedForGlobal?.siteId}`);
        if (res?.document?.files?.length > 0) {
            setFiles(res?.document?.files);
        }
        setFilteredFolders(res?.document?.childFolders || []);
    };

    const goToRootFolder = () => {
        setFilteredFolders(rootFolder?.parentFolders || []);
        setFiles([]);
    }

    // Function to get folder styling based on fileCount
    const getFolderStyles = (folder) => {
        const hasFiles = folder.fileCount > 0;

        return {
            container: {
                cursor: hasFiles ? 'pointer' : 'not-allowed',
                transition: 'background-color 0.2s',
                backgroundColor: hasFiles ? '#ffffff' : '#dadadacd',
                '&:hover': {
                    backgroundColor: hasFiles ? '#f8f9fa' : '#e9ecef'
                }
            },
            text: {
                color: hasFiles ? '#212529' : '#6c757d',
                '&:hover': {
                    color: hasFiles ? '#000000' : '#495057'
                }
            },
            icon: {
                color: hasFiles ? '#1a32e1ff' : 'rgba(76, 89, 202, 0.79)'
            }
        };
    };

    return (
        <>
            <div className="row mb-2" style={{ height: "auto" }}>
                <div className={isStatutory ? "col-md-12 mt-4" : "col-md-3 mt-4"}>
                    <Button
                        className="btn btn-sm btn-light text-primary w-100"
                        onClick={handleFolderOpen}
                        style={{ fontSize: "12px" }}
                    >
                        <i className="fas fa-plus"></i>&nbsp; Tag Existing Document
                    </Button>
                </div>
                <div className="mt-2">
                    {selectedMandatoryFile?.map((folder) => (
                        <Fragment key={folder.id}>
                            <Chip
                                key={folder.id}
                                label={folder?.name}
                                color="primary"
                                onDelete={() => handleRemoveFolder(folder.id)}
                            ></Chip>
                            &nbsp;
                        </Fragment>
                    ))}
                </div>
            </div>
            <Dialog
                open={openFolder}
                onClose={handleFolderClose}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>Select Mandatory File</DialogTitle>
                <DialogContent>
                    <form className="row border-top">
                        <div className="col-md-12 p-2 border-top">
                            <div className="float-end">
                                <Button
                                    type="button"
                                    className="btn btn-light text-primary"
                                    onClick={() => goToRootFolder()}
                                >
                                    <i className="fas fa-home"></i> Root
                                </Button>
                            </div>
                        </div>
                        <div className="table-responsive">
                            <table className="table f-11" style={{ border: "1px solid black" }}>
                                <thead className="table-dark">
                                <tr>
                                    <th scope="col">Folder</th>
                                    <th scope="col">Actions</th>
                                </tr>
                                </thead>
                                <tbody>
                                {filteredFolders?.length === 0 && files?.length === 0 && (
                                    <tr>
                                        <td colSpan={2}>No Sub Folder's Found</td>
                                    </tr>
                                )}
                                {filteredFolders?.map((folder) => {
                                    const styles = getFolderStyles(folder);
                                    const hasFiles = folder.fileCount > 0;

                                    return (
                                        <tr key={folder.id}>
                                            <td colSpan="2" className="p-0">
                                                <div
                                                    className="d-flex align-items-center justify-content-between p-2"
                                                    style={styles.container}
                                                    onClick={() => hasFiles && checkSubFolder(folder.id)}
                                                >
                                                    <div className="d-flex align-items-center">
                              <span className="fa-stack fa-1x me-2" style={{ fontSize: "28px" }}>
                                <i
                                    className="fas fa-folder fa-stack-1x"
                                    style={styles.icon}
                                ></i>
                                  {folder?.sharedFolder && (
                                      <i
                                          className="fas fa-users fa-stack-1x"
                                          style={{
                                              color: "white",
                                              fontSize: "0.4em",
                                              left: "2px",
                                              top: "2px",
                                          }}
                                      ></i>
                                  )}
                              </span>
                                                        <span style={styles.text}>
                                {folder.name}
                              </span>
                                                    </div>
                                                    <div
                                                        className="me-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            if (hasFiles) {
                                                                handleAddFolder(folder);
                                                            }
                                                        }}
                                                    >
                                                        <i
                                                            className="fas fa-plus"
                                                            style={styles.icon}
                                                        ></i>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {files?.map((file) => (
                                    <tr key={file.id}>
                                        <td>
                                            <i
                                                style={{ color: "#384BD3" }}
                                                className="fas fa-file fa-2x"
                                            ></i>
                                            &nbsp;
                                            {file.name}
                                        </td>
                                        <td>
                        <span
                            className="text-primary cursor"
                            onClick={() => handleAddFolder(file)}
                        >
                          <i className="fas fa-plus" size="sm"></i>
                        </span>
                                        </td>
                                    </tr>
                                ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-3">
                            {selectedMandatoryFile?.map((folder) => (
                                <span key={folder.id}>
                  <Chip
                      key={folder.id}
                      label={folder?.name}
                      color="primary"
                      onDelete={() => handleRemoveFolder(folder.id)}
                  ></Chip>
                                    &nbsp;
                </span>
                            ))}
                        </div>
                    </form>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleFolderClose} className="bg-light text-primary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

const mapStateToProps = (state) => ({
    rootFolder: state.site.rootFolder,
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps, { getDocumentsRootFolder })(
    MandatoryFile
);