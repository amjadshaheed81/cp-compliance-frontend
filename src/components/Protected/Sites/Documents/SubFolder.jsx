import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import CreateNewFolderIcon from "@mui/icons-material/CreateNewFolder";
import FolderCopyIcon from '@mui/icons-material/FolderCopy';
import NoteAddIcon from "@mui/icons-material/NoteAdd";
import TextSnippetOutlinedIcon from '@mui/icons-material/TextSnippetOutlined';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import moment from "moment";
import ReplyIcon from "@mui/icons-material/Reply";
import DeleteIcon from "@mui/icons-material/Delete";
import HistoryIcon from "@mui/icons-material/History";
import RestorePageIcon from "@mui/icons-material/RestorePage";

import Breadcrumbs from '@mui/material/Breadcrumbs';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import {
  getDocumentsRootFolder,
  getSubFilesAndFolder,
  deleteFile,
} from "../../../../store/thunk/site";
import { toast } from 'react-toastify';
import { connect } from "react-redux";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import CreateFiles from "./CreateFiles";
import BulkUpload from "./BulkUpload";
import VersionHistory from "./VersionHistory";
import CreateFolder from "./CreateFolder";
import { get } from "../../../../api";

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
  const [fileList, setFileList] = useState([]);
  const [error, setError] = useState("");
  const [folderId2, setFolderId2] = useState();
  const [folderData, setfolder] = useState();
  const [fileId, setFileId] = useState();
  const [previousFolderId, setPreviousFolderId] = useState([]);
  const searchDocument = async (e) => {
    const value = e?.target?.value;
    if (value && value.length > 0) {


      const url = `/api/document/file/search?q=${value}`;
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
    const previos = previousFolderId[previousFolderId.length - 2];
    if (previos.isParent === true) {
      navigate("/documents");
    } else {
      navigateToSubFolder(previos.id);
    }
    
   
  }

  useEffect( () => {
    if (subfolderFiles) {
      updateFolderList()
    }
  }, [subfolderFiles])

  const updateFolderList = async () => {
    const foldersList = [];
    if (subfolderFiles) {
      foldersList.push({ id: subfolderFiles.document.id, name: subfolderFiles.document.name, isParent: false });
      let parentFolderId = subfolderFiles.document.parentFolderId;
      for (let i = 0; i < 10; i=i+1) {
        if (parentFolderId !== null) {
          const url = `/api/document/parent/${parentFolderId}/folders`;
          const response = await get(url);
          parentFolderId = response.document.parentFolderId
          foldersList.push({ id: response.document.id, name: response.document.name, isParent: parentFolderId === null});
          if (parentFolderId === null) {
            break;
          }
          }
      }
      setPreviousFolderId(foldersList.reverse());
    }
  }

  const addStack = (id, name) => {
    const idx = previousFolderId.findIndex(i => i.id === id);
    if (idx < 0) {
      previousFolderId.push({ id, name });
      //setPreviousFolderId(previousFolderId);
     
    }
  }
  const deleteFile2 = async (id) => {
    deleteFile(id);
    getSubFilesAndFolder(folderId);
    toast.warn("File deleted");

  }

  const navigateToSubFolder = (id) => {
    console.log("target", id);
    navigate(`/subfolder/?id=${id}`);
  };

  

  useEffect(() => {
    getSubFilesAndFolder(folderId);
    if (previousFolderId.length === 0) {
      //setPreviousFolderId([{ id: folderId, name: subfolderFiles?.document?.name }])
    }
  }, [folderId]);
  return (
    <>
      <Header />
      <SidebarNew />
      <div
        className="container-fluid"
        style={{ paddingLeft: "5rem"}}
      >
        {versionHistory && (
          <VersionHistory
            versionHistory={versionHistory}
            setVersionHistory={setVersionHistory}
            //fileId={file?.id}
            fileId={fileId}
          />
        )}
        {showFolderModal && (
          <CreateFolder
            showFolderModal={showFolderModal}
            setShowFolderModal={setShowFolderModal}
            //folderId={folder.id}
            folderId={folderId2}
            refresh={() => { getSubFilesAndFolder(folderId); }}
          />
        )}
        {showModal && (
          <CreateFiles
            showModal={showModal}
            setShowModal={setShowModal}
            folderData={folderData}
            refresh={() => { getSubFilesAndFolder(folderId); }}
          />
        )}
        {bulkUploadModal && (
          <BulkUpload
            bulkUploadModal={bulkUploadModal}
            setBulkUploadModal={setBulkUploadModal}
          />
        )}
        <BreadCrumHeader header={"Document Management"} page={"Documents"} />
        <Breadcrumbs
          separator={<NavigateNextIcon fontSize="small" />}
          aria-label="breadcrumb"
        >
          {previousFolderId.map(pr => {
            return (<Link underline="hover" key="1" color="inherit" href="/" onClick={(e) => { e.preventDefault(); navigateToSubFolder(pr.id)}}>
              <i
                style={{ color: "#384BD3" }}
                className="fas fa-folder fa-1x"
              ></i>&nbsp; {pr.name}
            </Link>)
          })}
        </Breadcrumbs>
        <div className="float-end w-25" style={{ position: "relative", paddingBottom: '10px' }}>
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
            onChange={searchDocument}
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
                  <a href={itm.fileBlobUrl} download key={itm?.id}>
                    <span><i
                      style={{ color: "#384BD3" }}
                      className="fas fa-folder fa-1x"
                    ></i> {itm?.folderName}/<b>{itm?.name}</b></span>
                  </a>
                );
              })}
            </ul>
          )}
          {error && <p>{error}</p>}
        </div>
        <div className="table-responsive w-100">
          <table className="table f-11">
            <thead className="table-dark">
              <tr>
                <th scope="col" >Document Name</th>
                <th scope="col">Uploader</th>
                <th scope="col">Issue Date</th>
                <th scope="col">Expiry Date</th>
                <th scope="col">Source</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr >
                
                <td style={{ backgroundColor: '#E3E3E3' }}>
                <div>
                  <i
                    style={{ color: "#384BD3" }}
                    className="fas fa-folder fa-2x"
                  ></i>
                  
                  <span className="p-3">{subfolderFiles?.document?.name}</span>
                  </div>
                  </td>
               
                <td style={{ backgroundColor: '#E3E3E3' }}>--</td>
                <td style={{ backgroundColor: '#E3E3E3' }}>--</td>
                <td style={{ backgroundColor: '#E3E3E3' }}>--</td>
                <td style={{ backgroundColor: '#E3E3E3' }}>--</td>
                
                <td style={{ backgroundColor: '#E3E3E3' }}>
                  <ReplyIcon
                    onClick={() => navigate2()}
                    style={{ color: "384bd3", cursor: "pointer" }}
                  />
                  <CreateNewFolderIcon
                    onClick={() => { setShowFolderModal(true); setFolderId2(folderId) }}
                    style={{ color: "384bd3", cursor: "pointer" }}
                  />
                  
                  <NoteAddIcon
                    onClick={() => { setShowModal(true); setfolder(subfolderFiles?.document)}}
                    style={{ color: "384bd3", cursor: "pointer" }}
                  />
                  
                  <FolderCopyIcon
                    onClick={() => setBulkUploadModal(true)}
                    style={{ color: "384bd3", cursor: "pointer" }}
                  />
                  
                </td>
              </tr>

              {subfolderFiles?.document?.childFolders?.map((folder) => {
                return (
                  <>
                    <tr style={{backgroundColor: 'red'}}>
                      <td >
                        <div onClick={() => { navigateToSubFolder(folder?.id); addStack(folder?.id, folder?.name); }}>
                          &nbsp; &nbsp;
                        
                          <FolderOpenIcon style={{ color: "#384BD3" }} />
                        <span className="p-3">{folder?.name}</span>
                        </div>
                      </td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>--</td>
                      <td>
                        <CreateNewFolderIcon
                          onClick={() => { setShowFolderModal(true); setFolderId2(folder?.id) }}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        
                        <NoteAddIcon
                          onClick={() => { setShowModal(true);  setfolder(folder) }}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        
                        <FolderCopyIcon
                          onClick={() => setBulkUploadModal(true)}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        
                      </td>
                    </tr>
                  </>
                );
              })}
              {subfolderFiles?.document?.files?.map((file) => {
                return (
                  <>
                    <tr>
                      <td > 
                       
                      <div>
                          &nbsp;&nbsp;
                          <TextSnippetOutlinedIcon style={{ color: "#384BD3" }} />
                        <span className="p-3">{file?.name}</span>
                        </div>
                      </td>
                      <td>{file?.uploaderUserName}</td>
                      <td>{moment(file?.issueDate).format('DD-MM-YYYY')}</td>
                      <td>{moment(file?.expiryDate).format('DD-MM-YYYY')}</td>
                      <td>{file?.source}</td>
                      <td>
                        {/* <ReplyIcon
                          onClick={() => navigate("/documents")}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        /> */}
                        <RestorePageIcon
                          onClick={() => { setShowModal(true); setfolder(file)}}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        
                        <HistoryIcon
                          onClick={() => { setVersionHistory(true); setFileId(file?.id) }}
                          style={{ color: "384bd3", cursor: "pointer" }}
                        />
                        
                        <DeleteIcon
                          onClick={() => deleteFile2(file?.id)}
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
    </>
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
