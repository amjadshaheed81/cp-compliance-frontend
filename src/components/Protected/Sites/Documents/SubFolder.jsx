import React, { useState } from 'react'
import { useLocation } from 'react-router-dom';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getDocumentsRootFolder } from '../../../../store/thunk/site';
import { connect } from 'react-redux';
import Header from '../../../common/Header/Header';
import SidebarNew from '../../../common/Sidebar/SidebarNew';
import BreadCrumHeader from '../../../common/BreadCrumHeader/BreadCrumHeader';
import CreateFiles from './CreateFiles';
import BulkUpload from './BulkUpload';

const SubFolder = ({rootFolder, getDocumentsRootFolder}) => {
    let { state } = useLocation();
    const [showModal, setShowModal] = useState(false);
    const [bulkUploadModal, setBulkUploadModal] = useState(false);
    console.log('state', state);
    console.log('root folder', rootFolder);
  return (
    <div>
        <Header />
      <SidebarNew />
      <div
        class="container-fluid"
        style={{ marginLeft: "5rem", paddingRight: "9rem" }}
      >
        <BreadCrumHeader header={"Site Projects"} page={"Documents"} />
        <div class="float-end w-25" style={{ position: "relative" }}>
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
        <table class="table f-11">
                    <thead class="table-dark">
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
                        <div><i style={{color: '#384BD3'}} class="fas fa-folder fa-2x"></i><span class="p-3">Statutory Documents</span></div>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>--</td>
                            <td>
                            <CreateNewFolderIcon onClick={() => setShowModal(true)} style={{color: '384bd3', cursor: 'pointer'}}/>
                            {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal}/>}
                            <NoteAddIcon onClick={() => setShowModal(true)} style={{color: '384bd3', cursor: 'pointer'}}/>
                            {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal}/>}
                            <ContentCopyIcon onClick={() => setBulkUploadModal(true)} style={{color: '384bd3', cursor: 'pointer'}}/>
                            {bulkUploadModal && <BulkUpload bulkUploadModal={bulkUploadModal} setBulkUploadModal={setBulkUploadModal}/>}
                            </td>
                        </tr>
                    </tbody>
                </table>
    </div>
    </div>
  )
}

const mapStateToProps = (state) => ({
    rootFolder: state.site.rootFolder,
  });
  export default connect(mapStateToProps, {
    getDocumentsRootFolder,
  })(SubFolder);