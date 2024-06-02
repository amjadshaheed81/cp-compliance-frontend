
import React, { useEffect, useState } from 'react';
import BreadCrumHeader from "../../../common/BreadCrumHeader/BreadCrumHeader";
import Header from "../../../common/Header/Header";
import SidebarNew from "../../../common/Sidebar/SidebarNew";
import CreateFiles from "./CreateFiles";
import BulkUpload from './BulkUpload';
import VersionHistory from './VersionHistory';
import { connect } from 'react-redux';
import { getDocumentsRootFolder } from '../../../../store/thunk/site';
import SubFolder from './SubFolder';
import { useNavigate } from "react-router-dom";
import { get } from '../../../../api';
import './Documents.css';

const Document = ({ rootFolder, getDocumentsRootFolder }) => {
    const [isCreateFolderModalOpen, setIsCreateFolderModalOpen] = React.useState(false);
    const [fileList, setFileList] = useState([]);
    const [error, setError] = useState("");

    const navigate = useNavigate();
    useEffect(() => {
        getDocumentsRootFolder();
    }, [])
    const navigateToSubFolder = (id) => {
        console.log('target', id);
        navigate(`/subfolder/?id=${id}`);
    }
    const searchDocument = async (e) => {
        const value = e?.target?.value;
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
    }
    return (
        <>
            <Header />
            <SidebarNew />
            {isCreateFolderModalOpen && (
                <CreateFiles setIsCreateFolderModalOpen={setIsCreateFolderModalOpen} />
            )}
            <div class='container-fluid' style={{ paddingLeft: '5rem', paddingRight: '9rem' }}>
                <BreadCrumHeader header={"Document Management"} page={"Documents"} />
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
                        onChange={searchDocument}
                    />
                    {fileList && <ul
                        className="fileSearchResult fileSearchResultSite w-100"
                        style={{
                            display: fileList ? "block" : "none",
                        }}
                    >
                        {/* <p>{fileList}</p> */}
                        {fileList?.files?.map((itm) => {
                            <p>{itm}</p>
                            return (
                                <a
                                href={itm.fileBlobUrl} download
                                    key={itm?.id}
                                >
                                    {itm?.name}
                                </a>
                            )
                        })}
                    </ul>}
                    {error && <p>{error}</p>}
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
                        {rootFolder?.parentFolders?.map((folder, index) => {
                            return (
                                <tr>
                                    <div role="button" tabIndex={0} onClick={() => navigateToSubFolder(folder?.id)}><i style={{ color: '#384BD3' }} class="fas fa-folder fa-2x"></i><span class="p-3">{folder?.name}</span></div>
                                    <td>--</td>
                                    <td>--</td>
                                    <td>--</td>
                                    <td>--</td>
                                    <td>
                                        <span style={{ color: 'gray' }}><i class="fa fa-eye fa-2x" aria-hidden="true" size="md"></i></span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {/* <CreateFiles />
                <BulkUpload />
                <VersionHistory /> */}
            </div>
        </>
    )
}

const mapStateToProps = (state) => ({
    rootFolder: state.site.rootFolder,
});
export default connect(mapStateToProps, {
    getDocumentsRootFolder,
})(Document);
