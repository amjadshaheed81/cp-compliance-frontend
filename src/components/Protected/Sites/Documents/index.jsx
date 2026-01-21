import React, { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  CreateNewFolder as CreateNewFolderIcon,
  FolderCopy as FolderCopyIcon,
  NoteAdd as NoteAddIcon,
  TextSnippetOutlined as TextSnippetOutlinedIcon,
  FolderOpen as FolderOpenIcon,
  Bookmark,
  ContentCopy as ContentCopyIcon,
  Reply as ReplyIcon,
  Delete as DeleteIcon,
  History as HistoryIcon,
  RestorePage as RestorePageIcon,
  CopyAll,
  MoveDown,
  Edit,
  NavigateNext as NavigateNextIcon,
} from "@mui/icons-material";
import moment from "moment";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import { Tooltip, Chip } from "@mui/material";
import { toast } from "react-toastify";
import Swal from "sweetalert2";

import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import CreateFiles from "./CreateFiles";
import BulkUpload from "./BulkUpload";
import VersionHistory from "./VersionHistory";
import CreateFolder from "./CreateFolder";
import PdfViewer from "./PdfViewer";
import CopyModal from "./CopyModal";
import MoveModal from "./MoveModal";
import EditDocument from "./EditDocument";
import { connect } from "react-redux";
import {
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  deleteFile,
  setLoader,
} from "../../../../store/thunk/site";
import { get, del, put } from "../../../../api";
import {
  isAdminLogin,
  isManagerAdminLogin,
} from "../../../../utils/isManagerAdminLogin";

const Document = ({
  rootFolder,
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  deleteFile,
  siteSelectedForGlobal,
  loggedInUserData,
  setLoader,
  subfolderFiles,
}) => {

  const [searchParams] = useSearchParams();
  const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = useState(false);
  const [isCreateFileModalOpen, setIsCreateFileModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [isVersionHistoryOpen, setIsVersionHistoryOpen] = useState(false);
  const [isVersionModeEdit, setIsVersionModeEdit] = useState(false);
  const [isPdfViewerOpen, setIsPdfViewerOpen] = useState(false);
  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);
  const [isMoveModalOpen, setIsMoveModalOpen] = useState(false);
  const [isEditDocumentModalOpen, setIsEditDocumentModalOpen] = useState(false);
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState("");
  const [columns, setColumns] = useState([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileId, setFileId] = useState(null);
  const [currentFolder, setCurrentFolder] = useState({
    id: null,
    name: "Root",
    childFolders: [],
    files: [],
  });
  const [currentFolderData, setCurrentFolderData] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchValue, setSearchValue] = useState(""); // Add state for search value

  // Helper functions for endpoints
  const getFolderEndpoint = (folderId) => {
    if (folderId === "root") {
      return `/api/document/site/${siteSelectedForGlobal?.siteId}/parent/folders`;
    }
    return `/api/document/parent/${folderId}/folders?siteId=${siteSelectedForGlobal?.siteId}`;
  };

  // Initial root folder load
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

  // Load root folders into first column
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
      // Set initial currentFolder for root
      setCurrentFolder({
        id: "root",
        name: "Root",
        childFolders: rootFolder.parentFolders,
        files: [],
      });
    }
  }, [rootFolder]);

  // Handle folder click with proper sequencing
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
          c.data.forEach(d => {
            d.selected = newColumns[i + 1].id === d.id;
          })
        }

      })
      console.log('newColumns', newColumns)
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

  const navigateToParent = async (colIndex) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      if (colIndex === 0) {
        // Refresh root folder using root endpoint
        await getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
        setCurrentFolder({
          id: "root",
          name: "Root",
          childFolders: rootFolder?.parentFolders || [],
          files: [],
        });
      } else {
        // Slice columns up to the clicked column
        const newColumns = columns.slice(0, colIndex);
        setColumns(newColumns);

        // Wait for state update
        await new Promise((resolve) => setTimeout(resolve, 100));

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

  const navigateToParent2 = async (colIndex) => {
    if (isProcessing) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      if (colIndex === 0) {
        // Refresh root folder using root endpoint
        await getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
        setCurrentFolder({
          id: "root",
          name: "Root",
          childFolders: rootFolder?.parentFolders || [],
          files: [],
        });
      } else {
        const newColumns = [];
        columns.forEach((c, i) => {
          if (i <= colIndex) {
            newColumns.push(c);
          }
        })
        setColumns(newColumns);

        // Wait for state update
        await new Promise((resolve) => setTimeout(resolve, 100));

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

  const searchDocument = async (e) => {
    const value = e?.target?.value;
    setSearchValue(value); // Update search value state

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

  // Add clear search function
  const clearSearch = () => {
    setSearchValue("");
    setFileList([]);
    setError("");
  };

  // Enhanced deleteFileHandler with proper sequencing
  const deleteFileHandler = async (fileId) => {
    if (isProcessing) return;

    const result = await Swal.fire({
      title: `Do you want to delete this file?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#da292e",
    });

    if (!result.isConfirmed) return;

    setIsProcessing(true);
    setLoader(true);

    try {
      // 1. Wait for backend to process deletion
      await deleteFile(fileId);

      // 2. Refresh current folder data using appropriate endpoint
      const lastColumn = columns[columns.length - 1];
      if (lastColumn) {
        await handleFolderClick(
          { id: lastColumn.id, name: lastColumn.name },
          columns.length - 1
        );
      }

      toast.success("File deleted successfully!");
    } catch (error) {
      console.error("Delete file error:", error);
      toast.error("Failed to delete file. Please try again.");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  const openFolder = async (item) => {
    setFileList([]);
    let newColumns = []
    newColumns.push(columns[0]);
    const data = item.paths.reverse();
    data.push(item.folderId)
    for (const i of data) {
      await handleFolderClickSearch(i, newColumns);
    }
    setCurrentFolderData(newColumns[newColumns.length - 1]);
    newColumns.forEach((c, i) => {
      if (i < newColumns.length - 1) {
        c.data.forEach(d => {
          d.selected = newColumns[i + 1].id === d.id;
        })
      }

    })
    setColumns(newColumns);
    setCurrentFolder(newColumns[newColumns.length - 1]);
  }

  // Enhanced deleteFolderHandler with proper sequencing
  const deleteFolderHandler = async (folderId, folderName) => {
    if (isProcessing) return;

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
      const url = `/api/document/folder/${folderId}/delete`;
      const res = await del(url);

      if (res?.status === 200) {
        // Wait for backend to complete processing
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refresh parent folder using appropriate endpoint
        const parentColumnIndex = columns.length - 1;
        if (parentColumnIndex >= 0) {
          const parentColumn = columns[parentColumnIndex];
          await handleFolderClick(
            { id: parentColumn.id, name: parentColumn.name },
            parentColumnIndex
          );
        } else {
          // If it was a root folder, refresh root using root endpoint
          // await getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
        }

        toast.success(`${folderName} has been deleted successfully`);
      } else {
        throw new Error("Failed to delete folder");
      }
    } catch (e) {
      console.error("Delete folder error:", e);
      toast.error("Failed to delete folder. Please try again!");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  // Enhanced updateFolderName with proper sequencing
  const updateFolderName = async (folderId, currentName) => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
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
            const url = `/api/document/folder/${folderId}/manage`;
            const response = await put(url, {
              folderName: newName,
            });

            if (response?.status !== 200) {
              throw new Error("Failed to update folder name");
            }

            return newName;
          } catch (error) {
            Swal.showValidationMessage(`Request failed: ${error}`);
            return false;
          }
        },
        allowOutsideClick: () => !Swal.isLoading(),
      });

      if (newName) {
        setLoader(true);

        // Wait for backend to process the update
        await new Promise((resolve) => setTimeout(resolve, 500));

        // Refresh current folder to show updated name using appropriate endpoint
        const lastColumn = columns[columns.length - 1];
        if (lastColumn) {
          await handleFolderClick(
            { id: lastColumn.id, name: newName },
            columns.length - 1
          );
        }

        toast.success(`Folder renamed to ${newName}`);
      }
    } catch (error) {
      console.error("Update folder name error:", error);
      toast.error("Failed to update folder name. Please try again!");
    } finally {
      setIsProcessing(false);
      setLoader(false);
    }
  };

  return (
    <>
      <Header />
      <SidebarNew />

      {/* All Modals */}
      {isCreateFolderModalOpen && (
        <CreateFolder
          showFolderModal={isCreateFolderModalOpen}
          setShowFolderModal={setIsCreateFolderModalOpen}
          folderId={columns.length > 0 ? columns[columns.length - 1]?.id : null}
          folder2={currentFolderData}
          siteId={siteSelectedForGlobal?.siteId}
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
              getDocumentsRootFolder(siteSelectedForGlobal?.siteId);
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
        <BreadCrumHeader header={"Document Management"} page={"Documents"} />

        {/* Breadcrumbs */}
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {columns.map((column, index) => (
            <Link
              key={column.id}
              underline="hover"
              color={index === columns.length - 1 ? "text.primary" : "inherit"}
              onClick={() => navigateToParent2(index)}
              sx={{ cursor: "pointer", display: "flex", alignItems: "center" }}
            >
              <i
                className={column.isParent ? "fas fa-home" : "fas fa-folder"}
                style={{ color: "#384BD3", marginRight: "5px" }}
              ></i>
              {column.name}
            </Link>
          ))}
        </Breadcrumbs>

        <div className="row mt-4 mb-4">
          <div className="col-md-6 col-sm-12 position-relative">
            <div className="d-flex align-items-center">
              <div className="position-relative flex-grow-1">
                <i
                  style={{
                    position: "absolute",
                    color: "lightgrey",
                    paddingLeft: "1.5rem",
                    zIndex: 10,
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
                  value={searchValue} // Bind value to state
                  onChange={searchDocument}
                  onKeyDown={(event) => {
                    if (event.key === "Tab") {
                      setFileList([]);
                    }
                  }}
                />
                {searchValue && (
                  <Tooltip title="Clear search" arrow>
                    <button
                      type="button"
                      onClick={clearSearch}
                      style={{
                        position: "absolute",
                        right: "16px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        cursor: "pointer",
                        zIndex: 10,
                        backgroundColor: "#ffffff",
                        border: "1px solid #d82727ff",
                        color: "#d82727ff",
                        padding: "2px 8px",
                        borderRadius: "999px",
                        fontSize: "0.7rem",
                        fontWeight: 600,
                        lineHeight: 1.2,
                        boxShadow: "0 1px 3px rgba(0, 0, 0, 0.12)",
                      }}
                    >
                      Click to Clear
                    </button>
                  </Tooltip>
                )}
              </div>
            </div>
            {fileList?.files?.length > 0 && (
              <ul className="fileSearchResult fileSearchResultSite w-100 bg-secondary" style={{ background: 'yellow' }}>
                {fileList?.files?.map((itm) => (

                  <span className="badge bg-secondary text-start fw-normal" onClick={() => openFolder(itm)}>
                    <i
                      style={{ color: "#384BD3" }}
                      className="fas fa-folder fa-1x"
                    ></i>{" "}
                    {itm?.folderName}/<b>{itm?.name}</b>
                  </span>

                ))}
              </ul>
            )}
            {error && <p className="text-danger">{error}</p>}
          </div>

          {/* Action Buttons */}
          {columns.length > 1 && !isManagerAdminLogin(loggedInUserData) && (
            <div className="col-md-6 col-sm-12 text-end">
              <Tooltip title="Go Back" arrow>
                <ReplyIcon
                  onClick={() => navigateToParent(columns.length - 1)}
                  style={{
                    color: "#384BD3",
                    cursor: "pointer",
                    marginRight: "15px",
                  }}
                />
              </Tooltip> </div>
          )}
          {columns.length > 1 && isManagerAdminLogin(loggedInUserData) && (
            <div className="col-md-6 col-sm-12 text-end">
              <Tooltip title="Go Back" arrow>
                <ReplyIcon
                  onClick={() => navigateToParent(columns.length - 1)}
                  style={{
                    color: "#384BD3",
                    cursor: "pointer",
                    marginRight: "15px",
                  }}
                />
              </Tooltip>

              <Tooltip title="Create New Folder" arrow>
                <CreateNewFolderIcon
                  onClick={() => {
                    setIsCreateFolderModalOpen(true);
                    if (columns.length > 0) {
                      const lastColumn = columns[columns.length - 1];
                      setCurrentFolderData({
                        id: lastColumn.id,
                        name: lastColumn.name,
                        ...currentFolderData,
                      });
                    }
                  }}
                  style={{
                    color: "#384BD3",
                    cursor: "pointer",
                    marginRight: "15px",
                  }}
                />
              </Tooltip>

              <Tooltip title="Upload New File" arrow>
                <NoteAddIcon
                  onClick={() => setIsCreateFileModalOpen(true)}
                  style={{
                    color: "#384BD3",
                    cursor: "pointer",
                    marginRight: "15px",
                  }}
                />
              </Tooltip>

              <Tooltip title="Bulk Upload" arrow>
                <FolderCopyIcon
                  onClick={() => setIsBulkUploadModalOpen(true)}
                  style={{ color: "#384BD3", cursor: "pointer" }}
                />
              </Tooltip>
            </div>
          )}
        </div>

        {/* Finder-Style Column View */}
        <div className="row">
          <div className="col-md-12">
            <div
              className="finder-container"
              style={{
                display: "flex",
                overflowX: "auto",
                background: "#f8f8f8",
                border: "1px solid #ddd",
                borderRadius: "8px",
                height: "60vh",
                padding: "10px",
              }}
            >
              {columns.map((column, colIdx) => (
                <div
                  key={column.id}
                  className="finder-column"
                  style={{
                    minWidth: "300px",
                    marginRight: "10px",
                    background: "#fff",
                    borderRight: "1px solid #ccc",
                    padding: "10px",
                    overflowY: "auto",
                  }}
                >
                  <h6 className="mb-3 d-flex align-items-center">
                    <i
                      className={
                        column.isParent
                          ? "fas fa-home me-2"
                          : "fas fa-folder-open me-2"
                      }
                      style={{ color: "#384BD3" }}
                    ></i>
                    {column.name}
                    {colIdx === columns.length - 1 &&
                      column.id !== "root" &&
                      isAdminLogin(loggedInUserData) && (
                        <Tooltip title="Edit Folder Name" arrow>
                          <Edit
                            onClick={() =>
                              updateFolderName(column.id, column.name)
                            }
                            style={{
                              color: "#384BD3",
                              cursor: "pointer",
                              marginLeft: "10px",
                              fontSize: "18px",
                            }}
                          />
                        </Tooltip>
                      )}
                  </h6>

                  {/* Folders List */}
                  {column.data.length > 0 && (
                    <div className="mb-3">
                      <h6 className="text-muted small mb-2">Folders</h6>
                      {column.data.map((folder) => (
                        <div
                          key={folder.id}
                          className={`finder-item d-flex justify-content-between align-items-center ${folder?.selected ? 'bg-warning' : folder.fileCount === 0 ? 'bg-light' : 'bg-white'} ${folder.fileCount === 0 ? 'text-muted' : ''}`}
                          role="button"
                          onClick={() => {
                            handleFolderClick(folder, colIdx, true);
                            setCurrentFolderData(folder);
                          }}
                          style={{
                            padding: "8px",
                            cursor: "pointer",
                            borderRadius: "4px",
                            marginBottom: "5px",
                            backgroundColor: "#f8f9fa",
                          }}
                        >
                          <div className="d-flex align-items-center">
                            {/* <i
                              className="fas fa-folder fa-lg"
                              style={{ color: "#384BD3", marginRight: "10px" }}
                            ></i> */}
                            <span className="fa-stack fa-1x">
                              <i
                                className={`fas fa-folder fa-stack-1x`}
                                style={{ color: "#384BD3" }}
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
                            <span>
                              {folder.name}
                              {/* <span className="ms-2 badge bg-secondary">
                                {folder.fileCount}
                              </span> */}
                            </span>
                          </div>

                          {isAdminLogin(loggedInUserData) &&
                            column.id !== "root" && folder.siteId > 0 && (
                              <Tooltip title="Delete Folder" arrow>
                                <DeleteIcon
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    deleteFolderHandler(folder.id, folder.name);
                                  }}
                                  style={{
                                    color: "#da292e",
                                    cursor: "pointer",
                                    fontSize: "18px",
                                  }}
                                />
                              </Tooltip>
                            )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Files List (only in the last column) */}
                  {colIdx === columns.length - 1 &&
                    column.files?.length > 0 && (
                      <div className="mt-3">
                        <h6 className="text-muted small mb-2">Files</h6>
                      {column.files.sort((a, b) => a.name.toLowerCase().localeCompare(b.name.toLowerCase())).map((file) => (
                          <div
                            key={file.id}
                            className="finder-item d-flex justify-content-between align-items-center bg-white"
                            style={{
                              padding: "8px",
                              borderRadius: "4px",
                              marginBottom: "5px",
                              backgroundColor: "#f8f9fa",
                            }}
                          >
                            <div className="d-flex align-items-center">
                              <i
                                className="fas fa-file-alt fa-lg"
                                style={{ color: "#666", marginRight: "10px" }}
                              ></i>
                              <a
                              href="#"
                                style={{
                                  textDecoration: "none",
                                  color: "#333",
                                  cursor: "pointer",
                                }}
                              onClick={(e) => {
                                e.preventDefault();
                                // Use the same logic as version history eye icon
                                const fileExtension = file.name.split('.').pop().toLowerCase();
                                const supportedExtensions = ['pdf', 'jpg', 'jpeg', 'png', 'dwg'];

                                if (supportedExtensions.includes(fileExtension)) {
                                    setSelectedPdf(file.fileBlobUrl);
                                    setIsPdfViewerOpen(true);
                                  } else {
                                    // For unsupported file types, fall back to direct download
                                    const link = document.createElement("a");
                                    link.href = file.fileBlobUrl;
                                    link.download = file.name;
                                    link.click();
                                  }
                                }}
                              >
                                <Tooltip title={file?.note} arrow>
                                  {file.name}
                                </Tooltip>
                              </a>
                            </div>

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
                                      fontSize: "18px",
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
                                      fontSize: "18px",
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
                                      fontSize: "18px",
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
                                      fontSize: "18px",
                                    }}
                                  />
                                </Tooltip>

                                <Tooltip title="Edit" arrow>
                                  <Edit
                                    onClick={() => {
                                      setSelectedFile(file);
                                      setIsEditDocumentModalOpen(true);
                                    }}
                                    style={{
                                      color: "#384BD3",
                                      cursor: "pointer",
                                      marginRight: "10px",
                                      fontSize: "18px",
                                    }}
                                  />
                                </Tooltip>

                                <Tooltip title="Delete" arrow>
                                  <DeleteIcon
                                    onClick={() => deleteFileHandler(file.id)}
                                    style={{
                                      color: "#da292e",
                                      cursor: "pointer",
                                      fontSize: "18px",
                                    }}
                                  />
                                </Tooltip>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  {/* Empty state */}
                  {column.data.length === 0 && column.files?.length === 0 && (
                    <p className="text-muted">This folder is empty</p>
                  )}
                </div>
              ))}
            </div>
          </div>
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
  deleteFile,
  setLoader,
})(Document);