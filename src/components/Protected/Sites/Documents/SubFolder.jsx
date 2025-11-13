import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import FolderCopyIcon from "@mui/icons-material/FolderCopy";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import TextSnippetOutlinedIcon from "@mui/icons-material/TextSnippetOutlined";
import FolderOpenIcon from "@mui/icons-material/FolderOpen";
import FolderSharedOutlinedIcon from '@mui/icons-material/FolderSharedOutlined';

import Bookmark from "@mui/icons-material/Bookmark";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import moment from "moment";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import RestorePageIcon from "@mui/icons-material/RestorePage";
import CopyAll from "@mui/icons-material/CopyAll";
import MoveDown from "@mui/icons-material/MoveDown";
import Edit from "@mui/icons-material/Edit";

import Breadcrumbs from "@mui/material/Breadcrumbs";
import Typography from "@mui/material/Typography";
import Link from "@mui/material/Link";
import Stack from "@mui/material/Stack";
import NavigateNextIcon from "@mui/icons-material/NavigateNext";
import {
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  deleteFile,
} from "../../../../store/thunk/site";
import { toast } from "react-toastify";
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import CreateFiles from "./CreateFiles";
import BulkUpload from "./BulkUpload";
import VersionHistory from "./VersionHistory";
import CreateFolder from "./CreateFolder";
import { del, get, put } from "../../../../api";
import Swal from "sweetalert2";
import { Chip, Tooltip } from "@mui/material";
import { isAdminLogin, isManagerAdminLogin } from "../../../../utils/isManagerAdminLogin";
import PdfViewer from "./PdfViewer";
import CopyModal from "./CopyModal";
import MoveModal from "./MoveModal";
import EditDocument from "./EditDocument";
import { blueGrey } from "@mui/material/colors";

const SubFolder = ({
  deleteFile,
  siteSelectedForGlobal,
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  subfolderFiles,
  loggedInUserData,
}) => {
  const [searchParams] = useSearchParams();

  const folderId = searchParams.get("id");
  const [showModal, setShowModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const navigate = useNavigate();
  const [bulkUploadModal, setBulkUploadModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState(false);
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [showEditDocumentModal, setEditDocumentModal] = useState(false);
  const [isVersionModeEdit, setIsVersionModeEdit] = useState(false);
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState("");
  const [folderId2, setFolderId2] = useState();
  const [folder2, setFolder2] = useState();

  const [folderData, setfolder] = useState();
  const [fileId, setFileId] = useState();
  const [previousFolderId, setPreviousFolderId] = useState([]);
  const [tags, settags] = useState({});
  const [tagindex, settagindex] = useState(null);
  const [selectedFileForCopy, setSelectedFileForCopy] = useState();
  const searchDocument = async (e) => {
    const value = e?.target?.value;
    if (value && value.length > 0) {
      const url = `/api/document/file/search?q=${value}&siteId=${siteSelectedForGlobal?.siteId}`;
      try {
        const response = await get(url);
        setFileList(response);
        // if (!response.includes(null)) {
        //     setFileList(response);
        // }
        // else setError("No Sites found. Please check the input");
      } catch (e) {
        setError("No Sites found. Please check the input");
      }
    } else {
      setFileList([]);
    }
  };

  const navigate2 = () => {
    const previos = previousFolderId[previousFolderId?.length - 2];
    if (previos?.isParent === true || !previos) {
      navigate("/documents");
    } else {
      navigateToSubFolder(previos?.id);
    }
  };

  useEffect(() => {
    if (subfolderFiles) {
      updateFolderList();
    }
  }, [subfolderFiles]);

  const updateFolderList = async () => {
    const foldersList = [];
    if (subfolderFiles) {
      foldersList.push({
        id: subfolderFiles?.document?.id,
        name: subfolderFiles?.document?.name,
        isParent: false,
      });
      let parentFolderId = subfolderFiles?.document?.parentFolderId;
      for (let i = 0; i < 10; i = i + 1) {
        if (parentFolderId !== null) {
          const url = `/api/document/parent/${parentFolderId}/folders?siteId=${siteSelectedForGlobal?.siteId}`;
          const response = await get(url);
          parentFolderId = response?.document?.parentFolderId;
          foldersList.push({
            id: response?.document?.id,
            name: response?.document?.name,
            isParent: parentFolderId === null,
            sharedFolder: response?.document?.sharedFolder,
          });
          if (parentFolderId === null) {
            break;
          }
        }
      }
      setPreviousFolderId(foldersList.reverse());
    }
  };

  const addStack = (id, name) => {
    const idx = previousFolderId.findIndex((i) => i.id === id);
    if (idx < 0) {
      previousFolderId.push({ id, name });
      //setPreviousFolderId(previousFolderId);
    }
  };
  const deleteFile2 = async (id) => {
    Swal.fire({
      title: `Do you want to delete file ?`,
      showDenyButton: false,
      showCancelButton: true,
      confirmButtonText: "Delete",
      confirmButtonColor: "#da292e",
    }).then(async (result) => {
      if (result.isConfirmed) {
        await deleteFile(id);
        getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
        toast.success("File deleted succesfully!!");
      } else if (result.isDenied) {
        // Swal.fire("Changes are not saved", "", "info");
      }
    });
  };

  const navigateToSubFolder = (id) => {
    navigate(`/subfolder/?id=${id}`);
  };

  useEffect(() => {
    getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
    if (previousFolderId.length === 0) {
      //setPreviousFolderId([{ id: folderId, name: subfolderFiles?.document?.name }])
    }
  }, [folderId]);
  return (
    <>
      <Header />
      <SidebarNew />
      <div className="container-fluid pad-side">
        {versionHistory && (
          <VersionHistory
            versionHistory={versionHistory}
            isVersionModeEdit={isVersionModeEdit}
            setVersionHistory={setVersionHistory}
            //fileId={file?.id}
            fileId={fileId}
            refresh={() => {
              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
            }}
          />
        )}
        {showPdfModal && (
          <PdfViewer
            showPdfModal={showPdfModal}
            setShowPdfModal={setShowPdfModal}
            selectedPdf={selectedPdf}
          />
        )}
        {showCopyModal && (
          <CopyModal
            showCopyModal={showCopyModal}
            setShowCopyModal={setShowCopyModal}
            selectedFileForCopy={selectedFileForCopy}
            refresh={() => {
              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
            }}
          />
        )}
        {showMoveModal && (
          <MoveModal
            showMoveModal={showMoveModal}
            setShowMoveModal={setShowMoveModal}
            selectedFileForCopy={selectedFileForCopy}
            refresh={() => {
              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
            }}
          />
        )}
        {showEditDocumentModal && (
          <EditDocument
            showEditDocumentModal={showEditDocumentModal}
            setEditDocumentModal={setEditDocumentModal}
            selectedFile={selectedFileForCopy}
            refresh={() => {
              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
            }}
          />
        )}
        {showFolderModal && (
          <CreateFolder
            showFolderModal={showFolderModal}
            setShowFolderModal={setShowFolderModal}
            //folderId={folder.id}
            folderId={folderId2}
            folder2={subfolderFiles?.document}
            refresh={() => {
              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
            }}
          />
        )}
        {showModal && (
          <CreateFiles
            folderfiles={
              subfolderFiles?.document?.files
                ? subfolderFiles?.document?.files
                : []
            }
            showModal={showModal}
            setShowModal={setShowModal}
            folderData={folderData}
            setFolder={setfolder}
            uploaderUserId={loggedInUserData?.id}
            reviewerUserId={loggedInUserData?.id}
            refresh={() => {
              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
            }}
          />
        )}
        {bulkUploadModal && (
          <BulkUpload
            folderfiles={
              subfolderFiles?.document?.files
                ? subfolderFiles?.document?.files
                : []
            }
            bulkUploadModal={bulkUploadModal}
            folder={folderData}
            setBulkUploadModal={setBulkUploadModal}
            refresh={() => {
              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
            }}
          />
        )}
        <BreadCrumHeader header={"Document Management"} page={"Documents"} />
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          <Link
            underline="hover"
            key="1"
            color="inherit"
            href="/"
            onClick={(e) => {
              e.preventDefault();
              navigate("/documents");
            }}
          >
            <i style={{ color: "#384BD3" }} className="fas fa-folder fa-1x"></i>
            &nbsp; Documents
          </Link>
          {previousFolderId?.map((pr) => {
            return (
              <Link
                underline="hover"
                key="1"
                color="inherit"
                href="/"
                onClick={(e) => {
                  e.preventDefault();
                  navigateToSubFolder(pr.id);
                }}
              >
       
                <i
                  style={{ color: "#384BD3" }}
                  className="fas fa-folder fa-1x"
                ></i>
                &nbsp; {pr.name}

              </Link>
            );
          })}
        </Breadcrumbs>
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
            {fileList && (
              <ul
                className="fileSearchResult fileSearchResultSite w-100"
                style={{
                  display: fileList ? "block" : "none",
                }}
              >
                {/* <p>{fileList}</p> */}
                {fileList?.files?.map((itm) => {
                  <p>{itm}</p>;
                  return (
                    <a
                      href={itm.fileBlobUrl}
                      target="_blank"
                      download
                      key={itm?.id}
                      onClick={() => setFileList([])}
                    >
                      <span>
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-1x cursor"
                        ></i>{" "}
                        {itm?.folderName}/<b>{itm?.name}</b>
                      </span>
                    </a>
                  );
                })}
              </ul>
            )}
            {error && <p>{error}</p>}
          </div>
        </div>
        <div className="table-responsive w-100">
          <table className="table f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col">Document Name</th>
                <th scope="col">Uploader</th>
                <th scope="col">Issue Date</th>
                <th scope="col">Expiry Date</th>
                <th scope="col">Source</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ backgroundColor: "#E3E3E3" }}>
                  <div>
                    <i
                      style={{ color: "#384BD3" }}
                      className="fas fa-folder fa-2x"
                    ></i>


                    <span className="p-3">
                      {subfolderFiles?.document?.name}
                    </span>
                  </div>
                </td>

                <td style={{ backgroundColor: "#E3E3E3" }}>--</td>
                <td style={{ backgroundColor: "#E3E3E3" }}>--</td>
                <td style={{ backgroundColor: "#E3E3E3" }}>--</td>
                <td style={{ backgroundColor: "#E3E3E3" }}>--</td>

                <td style={{ backgroundColor: "#E3E3E3" }}>
                  <Tooltip title={`Go Back`} arrow>
                    <ReplyIcon
                      onClick={() => navigate2()}
                      style={{ color: "384bd3", cursor: "pointer" }}
                    />
                  </Tooltip>
                  {isManagerAdminLogin(loggedInUserData) && (
                    <>
                      <Tooltip title={`Create New Foler`} arrow>
                        <CreateNewFolderIcon
                          onClick={() => {
                            setShowFolderModal(true);
                            setFolderId2(folderId);
                          }}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                      </Tooltip>
                      <Tooltip title={`Select or Upload New File`} arrow>
                        <NoteAddIcon
                          onClick={() => {
                            setShowModal(true);
                            setfolder(subfolderFiles?.document);
                          }}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                      </Tooltip>
                      <Tooltip title={`Bulk Upload`} arrow>
                        <FolderCopyIcon
                          onClick={() => {
                            setBulkUploadModal(true);
                            setfolder(subfolderFiles?.document);
                          }}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                      </Tooltip>
                    </>
                  )}
                </td>
              </tr>

              {subfolderFiles?.document?.childFolders?.map((folder, i) => {
                return (
                  <>
                    <tr style={{ backgroundColor: "red" }}>
                      <td>
                        <div>
                          &nbsp; &nbsp;
                          {!folder?.sharedFolder && <FolderOpenIcon
                            style={{ color: "#384BD3" }}
                            onClick={() => {
                              navigateToSubFolder(folder?.id);
                              addStack(folder?.id, folder?.name);
                            }}
                          />}
                          {folder?.sharedFolder && <FolderSharedOutlinedIcon
                          style={{ color: "#384BD3" }}
                          onClick={() => {
                            navigateToSubFolder(folder?.id);
                            addStack(folder?.id, folder?.name);
                          }}
                        />}
                          <span
                            className="p-3 cursor"
                            onClick={() => {
                              navigateToSubFolder(folder?.id);
                              addStack(folder?.id, folder?.name);
                            }}
                          >
                            {folder?.name} <span style={{color: 'blue'}}>(Files : {folder?.fileCount})</span>
                          </span>
                          {/* &nbsp; &nbsp;{tags[i] && <Chip 
                            label={tags[i]}
                            color="primary"
                            //variant="outlined"
                            onDelete={()=> {
                              const tag = {...tags};
                              delete tag[i];
                              settags(tag);
                            }}
                          />}
                          {!tags[i] &&
                          <Tooltip title={`Add tag`} arrow>
                          <Bookmark
                            onClick={() => {
                              settagindex(i);
                            }}
                            style={{ color: "384bd3", cursor: "pointer" }}
                          />
                        </Tooltip>
                          }
                          {tagindex === i && !tags[i] && <input type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")} 
                          placeholder="Add tag"
                          onKeyDown={(e)=>{
                            if (e.key === 'Enter') {
                            const tag = {...tags};
                            tag[i]= e.target.value;
                            settags(tag);
                            settagindex(null);
                            }
                          }}/>} */}
                        </div>
                      </td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>
                        {isManagerAdminLogin(loggedInUserData) && (
                          <>
                            <Tooltip title={`Create New Folder`} arrow>
                              <CreateNewFolderIcon
                                onClick={() => {
                                  setShowFolderModal(true);
                                  setFolderId2(folder?.id);
                                  setFolder2(folder);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>

                            <Tooltip title={`Select or Upload New File`} arrow>
                              <NoteAddIcon
                                onClick={() => {
                                  setShowModal(true);
                                  setfolder(folder);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>

                            <Tooltip title={`Bulk Upload`} arrow>
                              <FolderCopyIcon
                                onClick={() => {
                                  setBulkUploadModal(true);
                                  setfolder(folder);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>
                            {isAdminLogin(loggedInUserData) && (
                              <>
                                <Tooltip title={`Delete Folder`} arrow>
                                  <DeleteIcon
                                    onClick={() => {
                                      Swal.fire({
                                        title: `Do you want to delete ${folder?.name}`,
                                        showDenyButton: false,
                                        showCancelButton: true,
                                        confirmButtonText: "Delete",
                                      }).then(async (result) => {
                                        if (result.isConfirmed) {
                                          try {
                                            const url = `/api/document/folder/${folder?.id}/delete`;
                                            const res = await del(url);
                                            if (res?.status === 200) {
                                              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
                                              toast.success(
                                                `${folder?.name} has been deleted successully`
                                              );
                                            } else {
                                              toast.error(
                                                "Something went wrong while deleting document. Please try again!"
                                              );
                                            }
                                          } catch (e) {
                                            toast.error(
                                              "Something went wrong while deleting document. Please try again!"
                                            );
                                          }
                                        } else if (result.isDenied) {
                                          // Swal.fire("Changes are not saved", "", "info");
                                        }
                                      });
                                    }}
                                    style={{ color: "red", cursor: "pointer" }}
                                  />
                                </Tooltip>
                                <Tooltip title={`Edit Folder Name`} arrow>
                                  <Edit
                                    onClick={() => {
                                      Swal.fire({
                                        title: "Update Folder Name",
                                        input: "text",
                                        inputAttributes: {
                                          autocapitalize: "off",
                                        },
                                        inputValue: folder?.name || "",
                                        showCancelButton: true,
                                        confirmButtonText: "Update",
                                        showLoaderOnConfirm: true,
                                        preConfirm: async (data) => {
                                          if (!data) {
                                            Swal.showValidationMessage(
                                              "Folder name is required"
                                            );
                                            return false; // Prevent further processing if input is empty
                                          }
                                          try {
                                            const url = `/api/document/folder/${folder?.id}/manage`;
                                            const response = await put(url, {
                                              folderName: data,
                                            });
                                            if (response?.status === 200) {
                                              toast.success(
                                                `${folder?.name} has been updated successully`
                                              );
                                              getSubFilesAndFolder(folderId, siteSelectedForGlobal?.siteId);
                                            } else {
                                              toast.error(
                                                "Something went wrong while updating document. Please try again!"
                                              );
                                            }
                                          } catch (error) {
                                            Swal.showValidationMessage(`
                                          Request failed: ${error}
                                        `);
                                          }
                                        },
                                        allowOutsideClick: () =>
                                          !Swal.isLoading(),
                                      });
                                    }}
                                    style={{
                                      color: "384bd3",
                                      cursor: "pointer",
                                    }}
                                  />
                                </Tooltip>
                              </>
                            )}
                          </>
                        )}
                      </td>
                    </tr>
                  </>
                );
              })}
              {subfolderFiles?.document?.files?.map((file) => {
                return (
                  <>
                    <tr>
                      <td>
                        <div>
                          &nbsp;&nbsp;
                          <Tooltip title={file?.note} arrow>
                          <button
                            onClick={(e) => {
                              e?.preventDefault();
                              setShowPdfModal(true);
                              setSelectedPdf(file?.fileBlobUrl);
                            }}
                          >
                            <TextSnippetOutlinedIcon
                              style={{ color: "#384BD3" }}
                            />
                            <span className="p-3 cursor">{file?.name}</span>
                          </button>
                          </Tooltip>
                        </div>
                      </td>
                      <td>{file?.uploaderUserName}</td>
                      <td>
                        {file?.issueDate
                          ? moment(file?.issueDate).format("DD-MM-YYYY")
                          : "--"}
                      </td>
                      <td>
                        {file?.expiryDate
                          ? moment(file?.expiryDate).format("DD-MM-YYYY")
                          : "--"}
                      </td>
                      <td>{file?.source}</td>
                      <td>
                        {isManagerAdminLogin(loggedInUserData) && (
                          <>
                            <Tooltip title={`Replace with new version`} arrow>
                              <RestorePageIcon
                                onClick={() => {
                                  setIsVersionModeEdit(true);
                                  setVersionHistory(true);
                                  setFileId(file?.id);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>
                            <Tooltip title={`Version History`} arrow>
                              <HistoryIcon
                                onClick={() => {
                                  setIsVersionModeEdit(false);
                                  setVersionHistory(true);
                                  setFileId(file?.id);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>
                            <Tooltip title={`Delete File`} arrow>
                              <DeleteIcon
                                onClick={() => deleteFile2(file?.id)}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>
                            <Tooltip title={`Copy`} arrow>
                              <CopyAll
                                onClick={() => {
                                  setShowCopyModal(true);
                                  setSelectedFileForCopy(file);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>
                            <Tooltip title={`Move`} arrow>
                              <MoveDown
                                onClick={() => {
                                  setShowMoveModal(true);
                                  setSelectedFileForCopy(file);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>
                            <Tooltip title={`Edit`} arrow>
                              <Edit
                                onClick={() => {
                                  setEditDocumentModal(true);
                                  setSelectedFileForCopy(file);
                                }}
                                style={{ color: "384bd3", cursor: "pointer" }}
                              />
                            </Tooltip>
                          </>
                        )}
                      </td>
                    </tr>
                  </>
                );
              })}
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
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  deleteFile,
  getDocumentsRootFolder,
  getSubFilesAndFolder,
})(SubFolder);
