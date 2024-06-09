import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import RestorePageIcon from "@mui/icons-material/RestorePage";
import {
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  deleteFile,
} from "../../../../store/thunk/site";
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import CreateFiles from "./CreateFiles";
import BulkUpload from "./BulkUpload";
import VersionHistory from "./VersionHistory";
import CreateFolder from "./CreateFolder";

const SubFolder = ({
  deleteFile,
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  subfolderFiles,
}) => {
  const [searchParams] = useSearchParams();
  const folderId = searchParams.get("id");
  const [showModal, setShowModal] = useState(false);
  const [showFolderModal, setShowFolderModal] = useState(false);
  const navigate = useNavigate();
  const [bulkUploadModal, setBulkUploadModal] = useState(false);
  const [versionHistory, setVersionHistory] = useState(false);
  useEffect(() => {
    getSubFilesAndFolder(folderId);
  }, []);
  return (
    <div>
      <Header />
      <SidebarNew />
      <div
        className="container-fluid"
        style={{ paddingLeft: "5rem", paddingRight: "2rem" }}
      >
        <BreadCrumHeader header={"Document Management"} page={"Documents"} />
        <div className="float-end w-25" style={{ position: "relative" }}>
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
            style={{ textAlign: "center" }}
            className="form-control m-2"
            id="search"
            name="search"
            placeholder="Search for Document"
            // onChange={searchDocument}
          />
        </div>
        <div className="table-responsive">
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
                {" "}
                <div>
                  <i
                    style={{ color: "#384BD3" }}
                    className="fas fa-folder fa-2x"
                  ></i>
                  <span className="p-3">{subfolderFiles?.document?.name}</span>
                </div>
                <td>--</td>
                <td>--</td>
                <td>--</td>
                <td>--</td>
                <td>
                  <CreateNewFolderIcon
                    onClick={() => setShowFolderModal(true)}
                    style={{ color: "384bd3", cursor: "pointer" }}
                  />
                  {showFolderModal && (
                    <CreateFolder
                      showFolderModal={showFolderModal}
                      setShowFolderModal={setShowFolderModal}
                    />
                  )}
                  <NoteAddIcon
                    onClick={() => setShowModal(true)}
                    style={{ color: "384bd3", cursor: "pointer" }}
                  />
                  {showModal && (
                    <CreateFiles
                      showModal={showModal}
                      setShowModal={setShowModal}
                    />
                  )}
                  <ContentCopyIcon
                    onClick={() => setBulkUploadModal(true)}
                    style={{ color: "384bd3", cursor: "pointer" }}
                  />
                  {bulkUploadModal && (
                    <BulkUpload
                      bulkUploadModal={bulkUploadModal}
                      setBulkUploadModal={setBulkUploadModal}
                    />
                  )}
                </td>
              </tr>

              {subfolderFiles?.document?.childFolders?.map((folder) => {
                return (
                  <>
                    <tr>
                      <div>
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-folder fa-2x"
                        ></i>
                        <span className="p-3">{folder?.name}</span>
                      </div>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>
                        <CreateNewFolderIcon
                          onClick={() => setShowFolderModal(true)}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        {showFolderModal && (
                          <CreateFolder
                            showFolderModal={showFolderModal}
                            setShowFolderModal={setShowFolderModal}
                            folderId={folder.id}
                          />
                        )}
                        <NoteAddIcon
                          onClick={() => setShowModal(true)}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        {showModal && (
                          <CreateFiles
                            showModal={showModal}
                            setShowModal={setShowModal}
                            folderId={folder.id}
                          />
                        )}
                        <ContentCopyIcon
                          onClick={() => setBulkUploadModal(true)}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        {bulkUploadModal && (
                          <BulkUpload
                            bulkUploadModal={bulkUploadModal}
                            setBulkUploadModal={setBulkUploadModal}
                            folder={folder}
                          />
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
                      <div>
                        <i
                          style={{ color: "#384BD3" }}
                          className="fas fa-file fa-2x"
                        ></i>
                        <span className="p-3">{file?.name}</span>
                      </div>
                      <td>{file?.uploaderUserName}</td>
                      <td>{file?.issueDate}</td>
                      <td>{file?.expiryDate}</td>
                      <td>{file?.source}</td>
                      <td>
                        <ReplyIcon
                          onClick={() => navigate("/documents")}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        <RestorePageIcon
                          onClick={() => setShowModal(true)}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        {showModal && (
                          <CreateFiles
                            showModal={showModal}
                            setShowModal={setShowModal}
                          />
                        )}
                        <HistoryIcon
                          onClick={() => setVersionHistory(true)}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        {versionHistory && (
                          <VersionHistory
                            versionHistory={versionHistory}
                            setVersionHistory={setVersionHistory}
                            fileId={file?.id}
                          />
                        )}
                        <DeleteIcon
                          onClick={() => deleteFile(file?.id)}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                      </td>
                    </tr>
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  rootFolder: state.site.rootFolder,
  subfolderFiles: state.site.subfolderFiles,
});
export default connect(mapStateToProps, {
  deleteFile,
  getDocumentsRootFolder,
  getSubFilesAndFolder,
})(SubFolder);
