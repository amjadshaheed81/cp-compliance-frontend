/* eslint-disable no-unused-vars */
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { connect } from "react-redux";
import { toast } from "react-toastify";
import Swal from "sweetalert2";
import moment from "moment";

// Components
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import CreateFiles from "./CreateFiles";
import CreateParentFolder from "./CreateParentFolder";
import CreateFolder from "./CreateFolder";
import BulkUpload from "./BulkUpload";
import PdfViewer from "./PdfViewer";
import VersionHistory from "./VersionHistory";
import CopyModal from "./CopyModal";
import MoveModal from "./MoveModal";
import EditDocument from "./EditDocument";

// Icons
import {
  CreateNewFolder as CreateNewFolderIcon,
  FolderCopy as FolderCopyIcon,
  NoteAdd as NoteAddIcon,
  Reply as ReplyIcon,
  CopyAll,
  MoveDown,
  History as HistoryIcon,
  RestorePage as RestorePageIcon,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";

// MUI Components
import { Chip, Tooltip, Button, Breadcrumbs, Link } from "@mui/material";

// Utils & API
import { get, del, put } from "../../../../api";
import {
  isAdminLogin,
  isManagerAdminLogin,
} from "../../../../utils/isManagerAdminLogin";
import {
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  setLoader,
} from "../../../../store/thunk/site";

const AdminParentFolder = ({
  rootFolder,
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  siteSelectedForGlobal,
  loggedInUserData,
  setLoader,
  subfolderFiles,
}) => {
  const navigate = useNavigate();

  // State Management
  const [showRootFolderModal, setShowRootFolderModal] = useState(false);
  const [showSubFolderModal, setShowSubFolderModal] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isVersionModeEdit, setIsVersionModeEdit] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isEditDocumentModalOpen, setIsEditDocumentModalOpen] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState("");
  const [columns, setColumns] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [currentFolder, setCurrentFolder] = useState({
    id: null,
    name: "Root",
    childFolders: [],
    files: [],
  });
  const [currentFolderData, setCurrentFolderData] = useState(null);
  // Helper Functions
  const getFolderEndpoint = (folderId) => {
    if (folderId === "root") {
      return `/api/document/site/${473}/parent/admin-folders`;
    }
    return `/api/document/parent/${folderId}/admin-folders?siteId=${473}`;
  };

  // Initial Load
  useEffect(() => {
    if (473) {
      setLoader(true);
      getDocumentsRootFolder(473, true);
    } else {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "Please select site from site search and try again.",
      });
    }
  }, [siteSelectedForGlobal]);

  // Initialize Columns
  useEffect(() => {
    if (rootFolder?.parentFolders?.length > 0) {
      setColumns([
        {
          id: "root",
          data: rootFolder.parentFolders,
          name: "Root",
          isParent: true,
        },
      ]);
    }
  }, [rootFolder]);

  // Core Folder Navigation
  const handleFolderClick = async (folder, colIndex, isReferesh) => {
    if (isProcessing) return false;

    setIsProcessing(true);
    setLoader(true);

    try {
      const endpoint = getFolderEndpoint(folder.id);
      const response = await get(endpoint);

      await new Promise((resolve) => setTimeout(resolve, 500));

      const newColumns = [...columns.slice(0, colIndex + 1)];
      const folderData = {
        ...response?.document,
        id: folder.id,
        name: folder.name,
        isRoot: folder.id === "root",
      };

      setCurrentFolderData(folderData);
      if (!isReferesh) {
        newColumns.pop();
      }
      newColumns.push({
        id: folder.id,
        data: response?.document?.childFolders || [],
        files: response?.document?.files || [],
        name: response?.document?.name,
        isRoot: folder.id === "root",
      });

      newColumns.forEach((c, i) => {
        if (i < newColumns.length - 1) {
          c.data.forEach((d) => {
            d.selected = newColumns[i + 1].id === d.id;
          });
        }
      });
      console.log("newColumns", newColumns);
      setColumns(newColumns);
      setCurrentFolder(folderData);

      return true;
    } catch (error) {
      console.error("Failed to fetch folder data:", error);
      toast.error("Failed to load folder. Please try again.");
      return false;
    } finally {
      setLoader(false);
      setIsProcessing(false);
    }
  };
  const handleFolderClickSearch = async (folderId, newColumns) => {
    if (isProcessing) return false;

    setIsProcessing(true);
    setLoader(true);

    try {
      const endpoint = getFolderEndpoint(folderId);
      const response = await get(endpoint);
      await new Promise((resolve) => setTimeout(resolve, 500));

      newColumns.push({
        id: folderId,
        data: response?.document?.childFolders || [],
        files: response?.document?.files || [],
        name: response?.document?.name,
        isRoot: folderId === "root",
      });

      return true;
    } catch (error) {
      console.error("Failed to fetch folder data:", error);
      toast.error("Failed to load folder. Please try again.");
      return false;
    } finally {
      setLoader(false);
      setIsProcessing(false);
    }
  };

  // Navigation Functions
  const navigateToParent = async (colIndex) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      if (colIndex === 0) {
        await getDocumentsRootFolder(473);
      } else {
        const newColumns = columns.slice(0, colIndex);
        setColumns(newColumns);

        const parentColumn = newColumns[newColumns.length - 1];
        setCurrentFolder({
          id: parentColumn.id,
          name: parentColumn.name,
          childFolders: parentColumn.data,
          files: parentColumn.files || [],
        });
      }
    } catch (error) {
      console.error("Error navigating to parent:", error);
      toast.error("Failed to navigate. Please try again.");
    } finally {
      setLoader(false);
      setIsProcessing(false);
    }
  };

  // File Operations
  const deleteFileHandler = async (fileId, fileName) => {
    const result = await Swal.fire({
      title: `Delete ${fileName}?`,
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      const url = `/api/document/file/${fileId}/delete`;
      const res = await del(url);

      if (res?.status === 200) {
        const lastColumn = columns[columns.length - 1];
        if (lastColumn) {
          await handleFolderClick(
            { id: lastColumn.id, name: lastColumn.name },
            columns.length - 1
          );
        }
        toast.success(`${fileName} deleted successfully`);
      } else {
        throw new Error("Failed to delete file");
      }
    } catch (error) {
      console.error("Delete file error:", error);
      toast.error("Failed to delete file. Please try again.");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  // Folder Operations
  const deleteFolderHandler = async (folderId, folderName) => {
    const result = await Swal.fire({
      title: `Delete folder "${folderName}"?`,
      text: "All contents will be permanently removed!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      const url = `/api/document/parent-folder/${folderId}/delete`;
      const res = await del(url);

      if (res?.status === 200) {
        const parentColumnIndex = columns.length - 1;
        if (parentColumnIndex >= 0) {
          const parentColumn = columns[parentColumnIndex];
          await handleFolderClick(
            { id: parentColumn.id, name: parentColumn.name },
            parentColumnIndex
          );
        }
        toast.success(`Folder "${folderName}" deleted successfully`);
      } else {
        throw new Error("Failed to delete folder");
      }
    } catch (error) {
      console.error("Delete folder error:", error);
      toast.error("Failed to delete folder. Please try again.");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  const updateFolderName = async (folderId, currentName) => {
    const { value: newName } = await Swal.fire({
      title: "Update Folder Name",
      input: "text",
      inputValue: currentName,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "Folder name cannot be empty!";
        }
      },
    });

    if (newName) {
      setIsProcessing(true);
      setLoader(true);

      try {
        const url = `/api/document/parent-folder/${folderId}/manage`;
        await put(url, { folderName: newName });

        const lastColumn = columns[columns.length - 1];
        if (lastColumn) {
          await handleFolderClick(
            { id: lastColumn.id, name: newName },
            columns.length - 1
          );
        }
        toast.success(`Folder renamed to "${newName}"`);
      } catch (error) {
        console.error("Update folder name error:", error);
        toast.error("Failed to update folder name. Please try again.");
      } finally {
        setIsProcessing(false);
        setLoader(false);
      }
    }
  };

  // Search Functionality
  const searchDocument = async (e) => {
    const value = e?.target?.value;
    if (value?.length > 0) {
      try {
        const url = `/api/document/file/search?q=${value}&siteId=${473}`;
        const response = await get(url);
        setFileList(response);
        setError("");
      } catch (error) {
        setError("No documents found. Please check your search term.");
        setFileList([]);
      }
    } else {
      setFileList([]);
      setError("");
    }
  };

  const openFolder = async (item) => {
    setFileList([]);
    let newColumns = [columns[0]];
    const data = [...item.paths.reverse(), item.folderId];

    for (const folderId of data) {
      await handleFolderClickSearch(folderId, newColumns);
    }
    setCurrentFolderData(newColumns[newColumns.length - 1]);
    newColumns.forEach((col, idx) => {
      if (idx < newColumns.length - 1) {
        col.data.forEach((item) => {
          item.selected = newColumns[idx + 1].id === item.id;
        });
      }
    });

    setColumns(newColumns);
    setCurrentFolder(newColumns[newColumns.length - 1]);
  };

  return (
    <>
      <Header />
      <SidebarNew />

      {/* Modals */}
      {showRootFolderModal && (
        <CreateParentFolder
          showFolderModal={showRootFolderModal}
          setShowFolderModal={setShowRootFolderModal}
          refresh={() => getDocumentsRootFolder(473)}
        />
      )}

      {showSubFolderModal && (
        <CreateFolder
          showFolderModal={showSubFolderModal}
          setShowFolderModal={setShowSubFolderModal}
          folderId={columns[columns.length - 1]?.id}
          //siteId={473}
          folder2={currentFolderData}
          refresh={async () => {
            if (columns.length > 0) {
              const lastColumn = columns[columns.length - 1];
              if (lastColumn) {
                await handleFolderClick(
                  { id: lastColumn.id, name: lastColumn.name },
                  columns.length - 1
                );
              }
            } else {
              setLoader(true);
              getDocumentsRootFolder(473);
            }
          }}
        />
      )}
      {isCreateFileModalOpen && (
        <CreateFiles
          showModal={isCreateFileModalOpen}
          setShowModal={setIsCreateFileModalOpen}
          folderData={currentFolder}
          uploaderUserId={loggedInUserData?.id}
          reviewerUserId={loggedInUserData?.id}
          refresh={async () => {
            await new Promise((resolve) => setTimeout(resolve, 300));
            const lastColumn = columns[columns.length - 1];
            if (lastColumn) {
              await handleFolderClick(
                { id: lastColumn.id, name: lastColumn.name },
                columns.length - 1
              );
            }
          }}
        />
      )}

      {isBulkUploadModalOpen && (
        <BulkUpload
          bulkUploadModal={isBulkUploadModalOpen}
          setBulkUploadModal={setIsBulkUploadModalOpen}
          folder={currentFolder}
          folderfiles={currentFolder.files || []}
          refresh={async () => {
            await new Promise((resolve) => setTimeout(resolve, 500));
            const lastColumn = columns[columns.length - 1];
            if (lastColumn) {
              await handleFolderClick(
                { id: lastColumn.id, name: lastColumn.name },
                columns.length - 1
              );
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
          refresh={async () => {
            const lastColumn = columns[columns.length - 1];
            if (lastColumn) {
              await handleFolderClick(
                { id: lastColumn.id, name: lastColumn.name },
                columns.length - 1
              );
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
          refresh={async () => {
            const lastColumn = columns[columns.length - 1];
            if (lastColumn) {
              await handleFolderClick(
                { id: lastColumn.id, name: lastColumn.name },
                columns.length - 1
              );
            }
          }}
        />
      )}

      {isMoveModalOpen && (
        <MoveModal
          showMoveModal={isMoveModalOpen}
          setShowMoveModal={setIsMoveModalOpen}
          selectedFileForCopy={selectedFile}
          refresh={async () => {
            const lastColumn = columns[columns.length - 1];
            if (lastColumn) {
              await handleFolderClick(
                { id: lastColumn.id, name: lastColumn.name },
                columns.length - 1
              );
            }
          }}
        />
      )}

      {isEditDocumentModalOpen && (
        <EditDocument
          showEditDocumentModal={isEditDocumentModalOpen}
          setEditDocumentModal={setIsEditDocumentModalOpen}
          selectedFile={selectedFile}
          refresh={async () => {
            const lastColumn = columns[columns.length - 1];
            if (lastColumn) {
              await handleFolderClick(
                { id: lastColumn.id, name: lastColumn.name },
                columns.length - 1
              );
            }
          }}
        />
      )}

      <div className="container-fluid pad-side">
        <BreadCrumHeader header={"Shared Folder Management 2"} page={"Folders"} />

        <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />}>
          {columns.map((column, index) => (
            <Link
              key={column.id}
              underline="hover"
              color={index === columns.length - 1 ? "text.primary" : "inherit"}
              onClick={() => navigateToParent(index)}
              sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <i
                className={column.isParent ? "fas fa-home" : "fas fa-folder"}
                style={{ color: "#384BD3", marginRight: "5px" }}
              />
              {column.name}
            </Link>
          ))}
        </Breadcrumbs>

        <div className="row mt-4 mb-4">
          <div className="col-md-6 col-sm-12">
            <div className="position-relative">
              <i className="fas fa-search position-absolute top-50 start-0 translate-middle-y ps-3 text-muted" />
              <input
                type="text"
                className="form-control ps-5"
                placeholder="Search documents..."
                onChange={searchDocument}
              />
              {fileList?.files?.length > 0 && (
                <div className="file-search-results mt-2">
                  {fileList.files.map((file) => (
                    <div
                      key={file.id}
                      className="search-result-item p-2 mb-1 bg-light rounded"
                      onClick={() => openFolder(file)}
                    >
                      <i className="fas fa-folder text-primary me-2" />
                      {file.folderPath}/{file.name}
                    </div>
                  ))}
                </div>
              )}
              {error && <div className="text-danger mt-2">{error}</div>}
            </div>
          </div>

          <div className="col-md-6 col-sm-12 text-end">
            {isManagerAdminLogin(loggedInUserData) && (
              <>
                {isAdminLogin(loggedInUserData) && (
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<CreateNewFolderIcon />}
                    onClick={() => setShowRootFolderModal(true)}
                    className="me-2"
                  >
                    Root Folder
                  </Button>
                )}

                {columns.length > 0 && (
                  <>
                    <Button
                      variant="contained"
                      color="secondary"
                      startIcon={<CreateNewFolderIcon />}
                      onClick={() => setShowSubFolderModal(true)}
                      className="me-2"
                    >
                      Subfolder
                    </Button>

                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<NoteAddIcon />}
                      onClick={() => setIsCreateFileModalOpen(true)}
                      className="me-2"
                    >
                      Upload
                    </Button>

                    <Button
                      variant="outlined"
                      color="primary"
                      startIcon={<FolderCopyIcon />}
                      onClick={() => setIsBulkUploadModalOpen(true)}
                    >
                      Bulk Upload
                    </Button>
                  </>
                )}

                {columns.length > 1 && (
                  <Tooltip title="Go Back">
                    <ReplyIcon
                      className="ms-3 cursor-pointer"
                      style={{ color: "#384BD3" }}
                      onClick={() => navigateToParent(columns.length - 1)}
                    />
                  </Tooltip>
                )}
              </>
            )}
          </div>
        </div>

        <div className="row">
          <div className="col-md-12">
            <div className="finder-container">
              {columns.map((column, colIdx) => (
                <div key={column.id} className="finder-column">
                  <div className="finder-column-header">
                    <i
                      className={
                        column.isParent ? "fas fa-home" : "fas fa-folder-open"
                      }
                      style={{ color: "#384BD3" }}
                    />
                    <span className="ms-2">{column.name}</span>

                    {isAdminLogin(loggedInUserData) && (
                      <div className="finder-column-actions">
                        <Tooltip title="Edit Folder Name">
                          <EditIcon
                            onClick={() =>
                              updateFolderName(column.id, column.name)
                            }
                            className="text-primary"
                          />
                        </Tooltip>
                        <Tooltip title="Delete Folder">
                          <DeleteIcon
                            onClick={() =>
                              deleteFolderHandler(column.id, column.name)
                            }
                            className="text-danger"
                          />
                        </Tooltip>
                      </div>
                    )}
                  </div>

                  {column.data.length > 0 && (
                    <div className="finder-section">
                      <h6 className="finder-section-title">Folders</h6>
                      {column.data.map((folder) => (
                        <div
                          key={folder.id}
                          className={`finder-item ${
                            folder.selected ? "selected" : ""
                          }`}
                          onClick={() => {
                            handleFolderClick(folder, colIdx, true);
                            setCurrentFolderData(folder);
                          }}
                        >
                          <div className="finder-item-icon">
                            <i
                              className="fas fa-folder"
                              style={{ color: "#384BD3", fontSize: "32px" }}
                            />
                            {folder.sharedFolder && (
                              <i className="fas fa-users shared-badge" />
                            )}
                          </div>
                          <div className="finder-item-name">{folder.name}</div>

                          {/* Moved actions here to be always visible */}
                          {isManagerAdminLogin(loggedInUserData) && (
                            <div className="finder-item-actions">
                              <Tooltip title="Edit Folder Name">
                                <EditIcon
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    updateFolderName(folder.id, folder.name);
                                  }}
                                  className="text-primary"
                                />
                              </Tooltip>
                              <Tooltip title="Delete Folder">
                                <DeleteIcon
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFolderHandler(folder.id, folder.name);
                                  }}
                                  className="text-danger"
                                />
                              </Tooltip>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {colIdx === columns.length - 1 &&
                    column.files?.length > 0 && (
                      <div className="finder-section">
                        <h6 className="finder-section-title">Files</h6>
                        {column.files.map((file) => (
                          <div key={file.id} className="finder-item">
                            <i className="fas fa-file-alt finder-file-icon" />
                            <div className="finder-item-name">
                              <a
                                href={file.fileBlobUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => {
                                  if (file.fileBlobUrl.endsWith(".pdf")) {
                                    e.preventDefault();
                                    setSelectedPdf(file.fileBlobUrl);
                                    setIsPdfViewerOpen(true);
                                  }
                                }}
                              >
                                {file.name}
                              </a>
                            </div>

                            {isManagerAdminLogin(loggedInUserData) && (
                              <div className="finder-item-actions">
                                <Tooltip title="Version History">
                                  <HistoryIcon
                                    onClick={() => {
                                      setIsVersionModeEdit(false);
                                      setIsVersionHistoryOpen(true);
                                      setFileId(file.id);
                                    }}
                                  />
                                </Tooltip>

                                <Tooltip title="Replace with new version">
                                  <RestorePageIcon
                                    onClick={() => {
                                      setIsVersionModeEdit(true);
                                      setIsVersionHistoryOpen(true);
                                      setFileId(file.id);
                                    }}
                                  />
                                </Tooltip>

                                <Tooltip title="Copy">
                                  <CopyAll
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setIsCopyModalOpen(true);
                                    }}
                                  />
                                </Tooltip>

                                <Tooltip title="Move">
                                  <MoveDown
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setIsMoveModalOpen(true);
                                    }}
                                  />
                                </Tooltip>

                                <Tooltip title="Edit">
                                  <EditIcon
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setIsEditDocumentModalOpen(true);
                                    }}
                                  />
                                </Tooltip>

                                <Tooltip title="Delete">
                                  <DeleteIcon
                                    onClick={() =>
                                      deleteFileHandler(file.id, file.name)
                                    }
                                  />
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                  {column.data.length === 0 && column.files?.length === 0 && (
                    <div className="finder-empty-state">
                      This folder is empty
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .finder-container {
          display: flex;
          overflow-x: auto;
          background: #f8f8f8;
          border: 1px solid #ddd;
          border-radius: 8px;
          height: 60vh;
          padding: 10px;
        }

        .finder-column {
          min-width: 300px;
          margin-right: 10px;
          background: #fff;
          border-right: 1px solid #eee;
          padding: 15px;
          overflow-y: auto;
        }

        .finder-column-header {
          display: flex;
          align-items: center;
          padding: 8px 0;
          margin-bottom: 10px;
          border-bottom: 1px solid #eee;
          font-weight: 600;
        }

        .finder-column-actions {
          cursor: pointer;
          margin-left: auto;
          display: flex;
          gap: 8px;
        }

        .finder-section {
          margin-bottom: 15px;
        }

        .finder-section-title {
          color: #6c757d;
          font-size: 0.8rem;
          margin-bottom: 8px;
          text-transform: uppercase;
        }

        .finder-item {
          display: flex;
          align-items: center;
          padding: 10px 8px;
          border-radius: 4px;
          margin-bottom: 5px;
          cursor: pointer;
          transition: background-color 0.2s;
          min-height: 40px;
        }

        .finder-item:hover {
          background-color: #f1f1f1;
        }

        .finder-item.selected {
          background-color: #fff3cd;
        }

        .finder-item-icon {
          position: relative;
          margin-right: 10px;
          width: 24px;
          height: 24px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .shared-badge {
          position: absolute;
          bottom: 3px;
          right: 3px;
          color: white;
          background: #384bd3;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 12px;
        }

        .finder-item-name {
          flex-grow: 1;
          display: flex;
          align-items: center;
        }

        .finder-item-actions {
          display: flex;
          gap: 8px;
          opacity: 0;
          transition: opacity 0.2s;
        }

        .finder-item:hover .finder-item-actions {
          opacity: 1;
        }

        .finder-empty-state {
          color: #6c757d;
          font-style: italic;
          padding: 10px 0;
          text-align: center;
        }

        .file-search-results {
          position: absolute;
          width: 100%;
          z-index: 1000;
          max-height: 300px;
          overflow-y: auto;
          border: 1px solid #ddd;
          border-radius: 4px;
          background: white;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .search-result-item {
          cursor: pointer;
          transition: background-color 0.2s;
        }

        .search-result-item:hover {
          background-color: #f8f9fa;
        }
      `}</style>
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
