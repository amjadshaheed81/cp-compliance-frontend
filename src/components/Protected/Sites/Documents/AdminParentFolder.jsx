import React, { useEffect, useState } from "react";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import { toast } from "react-toastify";
import CreateFiles from "./CreateFiles";
import CreateParentFolder from "./CreateParentFolder";
import CreateFolder from "./CreateFolder";
import BulkUpload from "./BulkUpload";
import {
  CreateNewFolder as CreateNewFolderIcon,
  FolderCopy as FolderCopyIcon,
  NoteAdd as NoteAddIcon,
  TextSnippetOutlined as TextSnippetOutlinedIcon,
  Reply as ReplyIcon,
  CopyAll,
  MoveDown,
  History as HistoryIcon,
  RestorePage as RestorePageIcon,
} from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { Chip, Tooltip, Button } from "@mui/material";
import {
  isAdminLogin,
  isManagerAdminLogin,
} from "../../../../utils/isManagerAdminLogin";
import { useNavigate } from "react-router-dom";
import { get, del, put } from "../../../../api";
import "./Documents.css";
import Swal from "sweetalert2";
import { connect } from "react-redux";
import {
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  setLoader,
} from "../../../../store/thunk/site";
import PdfViewer from "./PdfViewer";
import VersionHistory from "./VersionHistory";
import CopyModal from "./CopyModal";
import MoveModal from "./MoveModal";
import EditDocument from "./EditDocument";
import moment from "moment";

const AdminParentFolder = ({
  rootFolder,
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  siteSelectedForGlobal,
  loggedInUserData,
  setLoader,
  subfolderFiles,
}) => {
  const [showFolderModal, setShowFolderModal] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isVersionModeEdit, setIsVersionModeEdit] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isEditDocumentModalOpen, setIsEditDocumentModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [currentFolder, setCurrentFolder] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (siteSelectedForGlobal?.siteId) {
      setLoader(true);
      getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
  }, [siteSelectedForGlobal]);

  const handleFolderClick = async (folder) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      const response = await getSubFilesAndFolder(
        folder.id,
        siteSelectedForGlobal?.siteId
      );
      setCurrentFolder({
        ...folder,
        childFolders: response?.document?.childFolders || [],
        files: response?.document?.files || [],
      });
    } catch (error) {
      toast.error("Failed to load folder contents");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  const navigateToParent = () => {
    setCurrentFolder(null);
  };

  const deleteFileHandler = async (fileId, fileName) => {
    const result = await Swal.fire({
      title: `Do you want to delete ${fileName}?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#da292e",
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      const url = `/api/document/file/${fileId}/delete`;
      const res = await del(url);
      if (res?.status === 200) {
        if (currentFolder) {
          await handleFolderClick(currentFolder);
        } else {
          getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
        }
        toast.success(`${fileName} has been deleted successfully`);
      } else {
        throw new Error("Failed to delete file");
      }
    } catch (e) {
      toast.error("Failed to delete file. Please try again!");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  const deleteFolderHandler = async (folderId, folderName) => {
    const result = await Swal.fire({
      title: `Do you want to delete folder "${folderName}"?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#da292e",
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      const url = `/api/document/parent-folder/${folderId}/delete`;
      const res = await del(url);
      if (res?.status === 200) {
        if (currentFolder) {
          await handleFolderClick(currentFolder);
        } else {
          getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
        }
        toast.success(`${folderName} has been deleted successfully`);
      } else {
        throw new Error("Failed to delete folder");
      }
    } catch (e) {
      toast.error("Failed to delete folder. Please try again!");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  const updateFolderName = async (folderId, currentName) => {
    const { value: newName } = await Swal.fire({
      title: "Update Folder Name",
      input: "text",
      inputAttributes: {
        autocapitalize: "off",
      },
      inputValue: currentName || "",
      showCancelButton: true,
      confirmButtonText: "Update",
      showLoaderOnConfirm: true,
      preConfirm: async (newName) => {
        if (!newName) {
          Swal.showValidationMessage("Folder name is required");
          return false;
        }

        try {
          const url = `/api/document/parent-folder/${folderId}/manage`;
          const response = await put(url, {
            folderName: newName,
          });

          if (response?.status === 200) {
            if (currentFolder) {
              await handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
            return newName;
          } else {
            throw new Error("Failed to update folder name");
          }
        } catch (error) {
          Swal.showValidationMessage(`Request failed: ${error}`);
          return false;
        }
      },
      allowOutsideClick: () => !Swal.isLoading(),
    });

    if (newName) {
      toast.success(`Folder renamed to ${newName}`);
    }
  };

  const searchDocument = async (e) => {
    const value = e?.target?.value;
    if (value && value.length > 0) {
      const url = `/api/document/file/search?q=${value}&siteId=${siteSelectedForGlobal?.siteId}`;
      try {
        const response = await get(url);
        setFileList(response);
        setError("");
      } catch (e) {
        setError("No Documents found. Please check the input");
        setFileList([]);
      }
    } else {
      setFileList([]);
      setError("");
    }
  };

  return (
    <>
      <Header />
      <SidebarNew />

      {/* Modals */}
      {showFolderModal && (
        <CreateParentFolder
          showFolderModal={showFolderModal}
          setShowFolderModal={setShowFolderModal}
          refresh={() => {
            if (currentFolder) {
              handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
          }}
        />
      )}

      {isCreateFileModalOpen && (
        <CreateFiles
          showModal={isCreateFileModalOpen}
          setShowModal={setIsCreateFileModalOpen}
          folderData={currentFolder || { id: null, name: "Root" }}
          uploaderUserId={loggedInUserData?.id}
          reviewerUserId={loggedInUserData?.id}
          refresh={() => {
            if (currentFolder) {
              handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
          }}
        />
      )}

      {isBulkUploadModalOpen && (
        <BulkUpload
          bulkUploadModal={isBulkUploadModalOpen}
          setBulkUploadModal={setIsBulkUploadModalOpen}
          folder={currentFolder || { id: null, name: "Root" }}
          folderfiles={currentFolder?.files || []}
          refresh={() => {
            if (currentFolder) {
              handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
          }}
        />
      )}

      {isVersionHistoryOpen && (
        <VersionHistory
          versionHistory={isVersionHistoryOpen}
          setVersionHistory={setIsVersionHistoryOpen}
          isVersionModeEdit={isVersionModeEdit}
          fileId={fileId}
          refresh={() => {
            if (currentFolder) {
              handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
          }}
        />
      )}

      {isPdfViewerOpen && (
        <PdfViewer
          showPdfModal={isPdfViewerOpen}
          setShowPdfModal={setIsPdfViewerOpen}
          selectedPdf={selectedPdf}
        />
      )}

      {isCopyModalOpen && (
        <CopyModal
          showCopyModal={isCopyModalOpen}
          setShowCopyModal={setIsCopyModalOpen}
          selectedFileForCopy={selectedFile}
          refresh={() => {
            if (currentFolder) {
              handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
          }}
        />
      )}

      {isMoveModalOpen && (
        <MoveModal
          showMoveModal={isMoveModalOpen}
          setShowMoveModal={setIsMoveModalOpen}
          selectedFileForCopy={selectedFile}
          refresh={() => {
            if (currentFolder) {
              handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
          }}
        />
      )}

      {isEditDocumentModalOpen && (
        <EditDocument
          showEditDocumentModal={isEditDocumentModalOpen}
          setEditDocumentModal={setIsEditDocumentModalOpen}
          selectedFile={selectedFile}
          refresh={() => {
            if (currentFolder) {
              handleFolderClick(currentFolder);
            } else {
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
            }
          }}
        />
      )}

      <div className="container-fluid pad-side">
        <BreadCrumHeader
          header={"Shared Folder Management"}
          page={currentFolder ? currentFolder.name : "Folders"}
        />

        {/* Breadcrumb navigation */}
        <div className="d-flex align-items-center mb-3">
          {currentFolder && (
            <Tooltip title="Go Back" arrow>
              <ReplyIcon
                onClick={navigateToParent}
                style={{
                  color: "#384BD3",
                  cursor: "pointer",
                  marginRight: "15px",
                }}
              />
            </Tooltip>
          )}
          <span className="text-muted">
            {currentFolder ? currentFolder.name : "Root Folder"}
          </span>
        </div>

        {/* Search and Action Buttons */}
        <div className="row mt-4 mb-4">
          <div className="col-md-6 col-sm-12">
            <i
              style={{
                position: "absolute",
                color: "lightgrey",
                paddingLeft: "1.5rem",
              }}
              className="fas fa-search p-3"
            ></i>
            <input
              type="text"
              autoComplete="off"
              readOnly
              onFocus={(e) => e.target.removeAttribute("readonly")}
              style={{ textAlign: "justify", paddingLeft: "2rem" }}
              className="form-control m-2"
              id="search"
              name="search"
              placeholder="Search for Document"
              onChange={searchDocument}
              onKeyDown={(event) => {
                if (event.key === "Tab") {
                  setFileList([]);
                }
              }}
            />
            {fileList?.files?.length > 0 && (
              <ul className="fileSearchResult fileSearchResultSite w-100 bg-secondary">
                {fileList?.files?.map((itm) => (
                  <li key={itm.id}>
                    <span className="badge bg-secondary text-start fw-normal">
                      <i
                        style={{ color: "#384BD3" }}
                        className="fas fa-folder fa-1x"
                      ></i>{" "}
                      {itm?.folderName}/<b>{itm?.name}</b>
                    </span>
                  </li>
                ))}
              </ul>
            )}
            {error && <p className="text-danger">{error}</p>}
          </div>

          <div className="col-md-6 col-sm-12 text-end">
            {isManagerAdminLogin(loggedInUserData) && (
              <>
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="btn btn-primary rounded login-submit me-2"
                >
                  Add new Folder <CreateNewFolderIcon />
                </button>

                {currentFolder && (
                  <>
                    <Tooltip title="Create Subfolder" arrow>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => {
                          setIsCreateFolderModalOpen(true);
                        }}
                        className="me-2"
                      >
                        <CreateNewFolderIcon />
                      </Button>
                    </Tooltip>

                    <Tooltip title="Upload File" arrow>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsCreateFileModalOpen(true)}
                        className="me-2"
                      >
                        <NoteAddIcon />
                      </Button>
                    </Tooltip>

                    <Tooltip title="Bulk Upload" arrow>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => setIsBulkUploadModalOpen(true)}
                      >
                        <FolderCopyIcon />
                      </Button>
                    </Tooltip>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Folder and File Listing */}
        <div className="table-responsive w-100">
          <table className="table f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Type</th>
                <th scope="col">Last Modified</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              {/* Parent folders (when not viewing a specific folder) */}
              {!currentFolder &&
                rootFolder?.parentFolders?.map((folder) => (
                  <tr key={folder.id}>
                    <td>
                      <div
                        role="button"
                        tabIndex={0}
                        onClick={() => handleFolderClick(folder)}
                        style={{ cursor: "pointer" }}
                      >
                        <span className="fa-stack fa-2x">
                          <i
                            className={`fas fa-folder fa-stack-2x`}
                            style={{ color: "#384BD3" }}
                          ></i>
                          {folder?.sharedFolder && (
                            <i
                              className="fas fa-users fa-stack-1x"
                              style={{
                                color: "white",
                                fontSize: "0.5em",
                                left: "10px",
                                top: "8px",
                              }}
                            ></i>
                          )}
                        </span>
                        <span className="p-3">{folder?.name}</span>
                        <Chip
                          label={`${folder.fileCount} files`}
                          size="small"
                          className="ms-2"
                        />
                      </div>
                    </td>
                    <td>Folder</td>
                    <td>
                      {folder.updatedAt
                        ? moment(folder.updatedAt).format("MMM DD, YYYY")
                        : "-"}
                    </td>
                    <td>
                      {isManagerAdminLogin(loggedInUserData) && (
                        <>
                          {isAdminLogin(loggedInUserData) && (
                            <>
                              <Tooltip title={`Delete Folder`} arrow>
                                <DeleteIcon
                                  onClick={() =>
                                    deleteFolderHandler(
                                      folder?.id,
                                      folder?.name
                                    )
                                  }
                                  style={{ color: "red", cursor: "pointer" }}
                                  className="me-2"
                                />
                              </Tooltip>
                              <Tooltip title={`Edit Folder Name`} arrow>
                                <EditIcon
                                  onClick={() =>
                                    updateFolderName(folder?.id, folder?.name)
                                  }
                                  style={{
                                    color: "#384BD3",
                                    cursor: "pointer",
                                  }}
                                  className="me-2"
                                />
                              </Tooltip>
                            </>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                ))}

              {/* Child folders (when viewing a specific folder) */}
              {currentFolder?.childFolders?.map((folder) => (
                <tr key={folder.id}>
                  <td>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => handleFolderClick(folder)}
                      style={{ cursor: "pointer" }}
                    >
                      <span className="fa-stack fa-2x">
                        <i
                          className={`fas fa-folder fa-stack-2x`}
                          style={{ color: "#384BD3" }}
                        ></i>
                        {folder?.sharedFolder && (
                          <i
                            className="fas fa-users fa-stack-1x"
                            style={{
                              color: "white",
                              fontSize: "0.5em",
                              left: "10px",
                              top: "8px",
                            }}
                          ></i>
                        )}
                      </span>
                      <span className="p-3">{folder?.name}</span>
                      <Chip
                        label={`${folder.fileCount} files`}
                        size="small"
                        className="ms-2"
                      />
                    </div>
                  </td>
                  <td>Folder</td>
                  <td>
                    {folder.updatedAt
                      ? moment(folder.updatedAt).format("MMM DD, YYYY")
                      : "-"}
                  </td>
                  <td>
                    {isManagerAdminLogin(loggedInUserData) && (
                      <>
                        {isAdminLogin(loggedInUserData) && (
                          <>
                            <Tooltip title={`Delete Folder`} arrow>
                              <DeleteIcon
                                onClick={() =>
                                  deleteFolderHandler(folder?.id, folder?.name)
                                }
                                style={{ color: "red", cursor: "pointer" }}
                                className="me-2"
                              />
                            </Tooltip>
                            <Tooltip title={`Edit Folder Name`} arrow>
                              <EditIcon
                                onClick={() =>
                                  updateFolderName(folder?.id, folder?.name)
                                }
                                style={{
                                  color: "#384BD3",
                                  cursor: "pointer",
                                }}
                                className="me-2"
                              />
                            </Tooltip>
                          </>
                        )}
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {/* Files (when viewing a specific folder) */}
              {currentFolder?.files?.map((file) => (
                <tr key={file.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <i
                        className="fas fa-file-alt fa-lg me-3"
                        style={{ color: "#666" }}
                      ></i>
                      <a
                        href={file.fileBlobUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          textDecoration: "none",
                          color: "#333",
                          cursor: "pointer",
                        }}
                        onClick={(e) => {
                          if (file.fileBlobUrl.endsWith(".pdf")) {
                            e.preventDefault();
                            setSelectedPdf(file.fileBlobUrl);
                            setIsPdfViewerOpen(true);
                          }
                        }}
                      >
                        <Tooltip title={file?.note} arrow>
                          {file.name}
                        </Tooltip>
                      </a>
                    </div>
                  </td>
                  <td>
                    {file.fileType || file.name.split(".").pop().toUpperCase()}
                  </td>
                  <td>
                    {file.updatedAt
                      ? moment(file.updatedAt).format("MMM DD, YYYY")
                      : "-"}
                  </td>
                  <td>
                    {isManagerAdminLogin(loggedInUserData) && (
                      <div className="d-flex">
                        <Tooltip title="Version History" arrow>
                          <HistoryIcon
                            onClick={() => {
                              setIsVersionModeEdit(false);
                              setIsVersionHistoryOpen(true);
                              setFileId(file.id);
                            }}
                            style={{
                              color: "#384BD3",
                              cursor: "pointer",
                              marginRight: "10px",
                            }}
                          />
                        </Tooltip>

                        <Tooltip title="Replace with new version" arrow>
                          <RestorePageIcon
                            onClick={() => {
                              setIsVersionModeEdit(true);
                              setIsVersionHistoryOpen(true);
                              setFileId(file.id);
                            }}
                            style={{
                              color: "#384BD3",
                              cursor: "pointer",
                              marginRight: "10px",
                            }}
                          />
                        </Tooltip>

                        <Tooltip title="Copy" arrow>
                          <CopyAll
                            onClick={() => {
                              setSelectedFile(file);
                              setIsCopyModalOpen(true);
                            }}
                            style={{
                              color: "#384BD3",
                              cursor: "pointer",
                              marginRight: "10px",
                            }}
                          />
                        </Tooltip>

                        <Tooltip title="Move" arrow>
                          <MoveDown
                            onClick={() => {
                              setSelectedFile(file);
                              setIsMoveModalOpen(true);
                            }}
                            style={{
                              color: "#384BD3",
                              cursor: "pointer",
                              marginRight: "10px",
                            }}
                          />
                        </Tooltip>

                        <Tooltip title="Edit" arrow>
                          <EditIcon
                            onClick={() => {
                              setSelectedFile(file);
                              setIsEditDocumentModalOpen(true);
                            }}
                            style={{
                              color: "#384BD3",
                              cursor: "pointer",
                              marginRight: "10px",
                            }}
                          />
                        </Tooltip>

                        <Tooltip title="Delete" arrow>
                          <DeleteIcon
                            onClick={() =>
                              deleteFileHandler(file.id, file.name)
                            }
                            style={{
                              color: "#da292e",
                              cursor: "pointer",
                            }}
                          />
                        </Tooltip>
                      </div>
                    )}
                  </td>
                </tr>
              ))}

              {/* Empty state */}
              {((!currentFolder && rootFolder?.parentFolders?.length === 0) ||
                (currentFolder &&
                  currentFolder.childFolders?.length === 0 &&
                  currentFolder.files?.length === 0)) && (
                <tr>
                  <td colSpan="4" className="text-center text-muted py-4">
                    This folder is empty
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  subfolderFiles: state.site.subfolderFiles,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  setLoader,
})(AdminParentFolder);
