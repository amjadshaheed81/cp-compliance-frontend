import React, { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import NoteAddIcon from '@mui/icons-material/NoteAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { getDocumentsRootFolder, getSubFilesAndFolder } from '../../../../store/thunk/site';
import { connect } from 'react-redux';
import Header from '../../../common/Header/Header';
import SidebarNew from '../../../common/Sidebar/SidebarNew';
import BreadCrumHeader from '../../../common/BreadCrumHeader/BreadCrumHeader';
import CreateFiles from './CreateFiles';
import BulkUpload from './BulkUpload';

const SubFolder = ({ rootFolder, getDocumentsRootFolder, getSubFilesAndFolder, subfolderFiles }) => {
    const [searchParams] = useSearchParams();
    const folderId = searchParams.get("id");
    const [showModal, setShowModal] = useState(false);
    const [bulkUploadModal, setBulkUploadModal] = useState(false);
    useEffect(() => {
        getSubFilesAndFolder(folderId);
    }, [])
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
                    <tr> <div><i style={{ color: '#384BD3' }} class="fas fa-folder fa-2x"></i><span class="p-3">{subfolderFiles?.document?.name}</span></div><td>--</td><td>--</td><td>--</td><td>--</td><td>
                                    <CreateNewFolderIcon onClick={() => setShowModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal} />}
                                    <NoteAddIcon onClick={() => setShowModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal} />}
                                    <ContentCopyIcon onClick={() => setBulkUploadModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {bulkUploadModal && <BulkUpload bulkUploadModal={bulkUploadModal} setBulkUploadModal={setBulkUploadModal} />}
                                </td>
                    </tr>

                        {subfolderFiles?.document?.childFolders?.map((folder) => {
                            return (

                                <><tr><div><i style={{ color: '#384BD3' }} class="fas fa-folder fa-2x"></i><span class="p-3">{folder?.name}</span></div><td>--</td><td>--</td><td>--</td><td>--</td><td>
                                    <CreateNewFolderIcon onClick={() => setShowModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal} />}
                                    <NoteAddIcon onClick={() => setShowModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal} />}
                                    <ContentCopyIcon onClick={() => setBulkUploadModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {bulkUploadModal && <BulkUpload bulkUploadModal={bulkUploadModal} setBulkUploadModal={setBulkUploadModal} />}
                                </td>
                                </tr>
                                </>

                            )
                        })}
                        {subfolderFiles?.document?.files?.map((file) => {
                            return (

                                <><tr><div><i style={{ color: '#384BD3' }} class="fas fa-file fa-2x"></i><span class="p-3">{file?.name}</span></div>
                                <td>{file?.uploaderUserName}</td>
                                <td>{file?.issueDate}</td>
                                <td>{file?.expiryDate}</td>
                                <td>{file?.source}</td>
                                <td>
                                    <CreateNewFolderIcon onClick={() => setShowModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal} />}
                                    <NoteAddIcon onClick={() => setShowModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {showModal && <CreateFiles showModal={showModal} setShowModal={setShowModal} />}
                                    <ContentCopyIcon onClick={() => setBulkUploadModal(true)} style={{ color: '384bd3', cursor: 'pointer' }} />
                                    {bulkUploadModal && <BulkUpload bulkUploadModal={bulkUploadModal} setBulkUploadModal={setBulkUploadModal} />}
                                </td>
                                </tr>
                                </>

                            )
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const mapStateToProps = (state) => ({
    rootFolder: state.site.rootFolder,
    subfolderFiles: state.site.subfolderFiles,
});
export default connect(mapStateToProps, {
    getDocumentsRootFolder,
    getSubFilesAndFolder,
})(SubFolder);