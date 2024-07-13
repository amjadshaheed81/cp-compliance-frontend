import React, { useState } from 'react'
import DescriptionIcon from '@mui/icons-material/Description';
import SidebarNew from '../../../common/Sidebar/SidebarNew';
import Header from '../../../common/Header/Header';
import BreadCrumHeader from '../../../common/BreadCrumHeader/BreadCrumHeader';
import { CSVLink } from 'react-csv';
import { Chip } from '@mui/material';
import CreateFiles from '../Documents/CreateFiles';

const StatutoryRegister = () => {
    const [showModal, setShowModal] = useState(false);

    return (
        <>
            <SidebarNew />

            <div className="content">
                <Header />
                <div className="container-fluid">
                    <BreadCrumHeader header={"Statutory Register"} page={"Statutory Register"} />
                    <div class="card card-body">
                        <div className="pt-2 bd-highlight ">
                            <div className="row" style={{ height: "auto" }}>
                                <div className="col">
                                    <DescriptionIcon style={{ color: "blue", fontSize: "2rem" }} />,
                                    <span>Duties Identified</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>5</p>
                                </div>
                                <div className="col">
                                    <DescriptionIcon style={{ color: "green", fontSize: "2rem" }} />,
                                    <span>Duties Met</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>2</p>
                                </div>
                                <div className="col">
                                    <DescriptionIcon style={{ color: "yellow", fontSize: "2rem" }} />,
                                    <span>Duties Not Met</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>1</p>
                                </div>
                                <div className="col">
                                    <CSVLink
                                        filename={"statutory-documents"}
                                        className="btn btn-light bg-white text-primary"
                                        data=""
                                    >
                                        <i className="fas fa-download"></i>&nbsp;Export
                                    </CSVLink>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="col-md-12 pt-4 table-responsive">
                        <table className="table">
                            <thead className="table-dark">
                                <tr>
                                    <th scope="col">Id</th>
                                    <th scope="col">Requirement</th>
                                    <th scope="col">Required</th>
                                    <th scope="col">Document</th>
                                    <th scope="col">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="col">
                                        <span className="text-primary cursor" onClick={() => {

                                        }}>
                                            1.1
                                        </span>
                                    </th>
                                    <th scope="col">(Asbestos) Management Survey
                                        (Type 2)
                                        <div>
                                            <button className="btn btn-primary mt-3">View Evidence</button>
                                        </div>
                                    </th>
                                    <th scope="col">
                                        <input type="checkbox" />
                                    </th>
                                    <th scope="col">
                                        <table className="table">
                                            <thead className="table-active">
                                                <tr>
                                                    <th scope="col">File</th>
                                                    <th scope="col">Version</th>
                                                    <th scope="col">Date</th>
                                                    <th scope="col">Expiry</th>
                                                    <th scope="col">Author</th>
                                                    <th scope="col">Ref No.</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                <tr>
                                                    <th scope="col">File</th>
                                                    <th scope="col">1</th>
                                                    <th scope="col">dd/mm/yyyy</th>
                                                    <th scope="col">dd/mm/yyyy</th>
                                                    <th scope="col">Bond</th>
                                                    <th scope="col">007</th>
                                                </tr>
                                                <tr>
                                                    <td colspan="6"><div className='upload-file'>
                                                        <label id="upload-file" class="text-decoration-underline" onClick={() => { setShowModal(true);}}
                    style={{ color: "384bd3", cursor: "pointer" }}>Upload New File</label>
                                                    </div></td>
                                                </tr>
                                            </tbody></table>
                                    </th>
                                    <th scope="col">
                                        <Chip
                                            color={"success"}
                                            label={"passed"}
                                            style={{ marginLeft: '10px' }}
                                        />
                                    </th>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    {showModal && (
          <CreateFiles
            showModal={showModal}
            setShowModal={setShowModal}
            // folderData={folderData}
            // refresh={() => { getSubFilesAndFolder(folderId); }}
          />
        )}
                </div>
            </div>
        </>
    )
}

export default StatutoryRegister;