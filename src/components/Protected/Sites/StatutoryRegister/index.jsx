import React, { useEffect, useState } from 'react'
import DescriptionIcon from '@mui/icons-material/Description';
import SidebarNew from '../../../common/Sidebar/SidebarNew';
import Header from '../../../common/Header/Header';
import BreadCrumHeader from '../../../common/BreadCrumHeader/BreadCrumHeader';
import { CSVLink } from 'react-csv';
import { Chip } from '@mui/material';
import CreateFiles from '../Documents/CreateFiles';
import { toast } from 'react-toastify';
import { get, put } from '../../../../api';
import Swal from 'sweetalert2';
import { connect } from 'react-redux';
import ChipComponent from '../../../common/Chips/Chips';
import { getSiteAssets } from '../../../../store/thunk/site';
import { useNavigate } from 'react-router-dom';
import moment from 'moment';
import PdfViewer from '../Documents/PdfViewer';

const StatutoryRegister = ({ loggedInUserData, siteSelectedForGlobal, getSiteAssets, siteAssets }) => {
    let chipColor;
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isChecked, setIsChecked] = useState(true);
    const [showPdfModal, setShowPdfModal] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState("");
    const [statutory, setStatutory] = useState([]);
    const [folder, setFolder] = useState({});
    const navigate = useNavigate();
    let dutiesIdentified = 0; let dutiesMet = 0;
    console.log('logged in', loggedInUserData);
    const getDutiesIdentified = (item) => {
        for (let i = 0; i < item.length; i++) {
            if (item[i].required === true) {
                dutiesIdentified++;
            }
        }
        return dutiesIdentified;
    }

    const getDutiesMet = (item) => {
        for (let i = 0; i < item.length; i++) {
            if ((item[i].files !== null && item[i].status === 'Passed')) {
                dutiesMet++;
            }
        }
        return dutiesMet;
    }
    const getStatutory = async (siteId) => {
        setIsLoading(true);
        let getStatutoryDocuments = await get(`/api/document/${siteId}/statutoryRegister`);
        getStatutoryDocuments = getStatutoryDocuments.sort((a, b) => { return a.id - b.id })
        setStatutory(getStatutoryDocuments);

        chipColor = statutory.filter((item) => {
            return item.status === "Passed";
        })
        setIsLoading(false);
    }

    const getChipStatus = (item) => {
        return item.status === 'Passed' ? 'Passed' : item.status === 'Open' ? 'Open' : '';
    }
    const handleCheckboxField = async (e, item, idx) => {
        setIsChecked(e.target.checked);
        const folderId = item.id;
        const formData = {
            required: e.target.checked,
            status: ((e.target.checked === true && item.files !== null) ? "Passed" : "Open"),
        };
        const url = `/api/document/folder/${folderId}/manage`;
        const res = await put(url, formData);
        if (res?.status === 200) {
            getStatutory(siteSelectedForGlobal?.siteId);
        }
    }
    useEffect(() => {
        if (siteSelectedForGlobal?.siteId) {
            getStatutory(siteSelectedForGlobal?.siteId);
            getSiteAssets(siteSelectedForGlobal?.siteId);
        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please select site from site search and try again.",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteSelectedForGlobal?.siteId]);
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
                                    <DescriptionIcon style={{ color: "blue", fontSize: "2rem" }} />
                                    <span>Duties Identified</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>{getDutiesIdentified(statutory)}</p>
                                </div>
                                <div className="col">
                                    <DescriptionIcon style={{ color: "green", fontSize: "2rem" }} />
                                    <span>Duties Met</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>{getDutiesMet(statutory)}</p>
                                </div>
                                <div className="col">
                                    <DescriptionIcon style={{ color: "yellow", fontSize: "2rem" }} />
                                    <span>Duties Not Met</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>{dutiesIdentified - dutiesMet}</p>
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
                            {showPdfModal && (
                                <PdfViewer
                                    showPdfModal={showPdfModal}
                                    setShowPdfModal={setShowPdfModal}
                                    selectedPdf={selectedPdf}
                                />
                            )}
                            <tbody>
                                {!isLoading && statutory.length === 0 && (
                                    <tr>
                                        <td colSpan={4} align="center">No result found!!</td>
                                    </tr>
                                )}
                                {statutory?.map((item, index) => {

                                    return (
                                        <tr>
                                            <th scope="col">
                                                <span className="text-primary cursor" onClick={() => {

                                                }}>
                                                    {item.id}
                                                </span>
                                            </th>
                                            <th scope="col">{item.name}
                                                <div>
                                                    <a href='/#/site-checks' className="btn btn-primary mt-3 text-bg-primary">View Evidence</a>
                                                </div>
                                            </th>
                                            <th scope="col">
                                                <input type="checkbox" id="chkbox" checked={item.required} onChange={(e) => { handleCheckboxField(e, item, index) }} />
                                            </th>
                                            <th scope="col">
                                                <table className="table" style={{ border: '1px solid #5A6371'}}>
                                                    <thead className="table-active">
                                                        <tr >
                                                            <th scope="col" style={{ backgroundColor: "#7D8793", color: "#FFFFFF" }}>File</th>
                                                            <th scope="col" style={{ backgroundColor: "#7D8793", color: "#FFFFFF" }}>Version</th>
                                                            <th scope="col" style={{ backgroundColor: "#7D8793", color: "#FFFFFF" }}>Date</th>
                                                            <th scope="col" style={{ backgroundColor: "#7D8793", color: "#FFFFFF" }}>Expiry</th>
                                                            <th scope="col" style={{ backgroundColor: "#7D8793", color: "#FFFFFF" }}>Author</th>
                                                            <th scope="col" style={{ backgroundColor: "#7D8793", color: "#FFFFFF" }}>Ref No.</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {item.files?.map((itm, index) => {
                                                            return (
                                                                <tr>
                                                                    <th style={{ backgroundColor: "#DEE3E9", color: "#5A6371" }}>
                                                                    <button style={{ border: 'none', cursor: 'pointer', color: 'blue' }} onClick={(e) => {
                                                                        e?.preventDefault();
                                                                        setShowPdfModal(true);
                                                                        setSelectedPdf(itm?.fileBlobUrl)
                                                                    }}>{itm.name}</button>
                                                                    </th>
                                                                    {/* <th scope="col">{itm.name}</th> */}
                                                                    <th scope="col" style={{ backgroundColor: "#DEE3E9", color: "#5A6371", border: '1px solid #5A6371' }}>{itm.fileVersion}</th>
                                                                    <th scope="col" style={{ backgroundColor: "#DEE3E9", color: "#5A6371", border: '1px solid #5A6371' }}>{itm.issueDate ? moment(itm.issueDate).format("YYYY-MM-DD") : '-'}</th>
                                                                    <th scope="col" style={{ backgroundColor: "#DEE3E9", color: "#5A6371", border: '1px solid #5A6371' }}>{itm.expiryDate ? moment(itm.expiryDate).format("YYYY-MM-DD") : '-'}</th>
                                                                    <th scope="col" style={{ backgroundColor: "#DEE3E9", color: "#5A6371", border: '1px solid #5A6371' }}>{itm.uploaderUserName}</th>
                                                                    <th scope="col" style={{ backgroundColor: "#DEE3E9", color: "#5A6371", border: '1px solid #5A6371' }}>{itm.uploaderUserId}</th>
                                                                    
                                                                </tr>
                                                            )
                                                        })}

                                                        <tr>
                                                            <td colspan="6" style={{ backgroundColor: "#5A6371", color: "#FFFFFF" }} align='center'><div className='upload-file'>
                                                                <label id="upload-file" class="text-decoration-underline" onClick={() => { setFolder(item); setShowModal(true); }}
                                                                    style={{ color: "384bd3", cursor: "pointer" }}>Upload New File</label>
                                                            </div></td>
                                                        </tr>
                                                    </tbody></table>
                                            </th>
                                            <th scope="col">
                                                <ChipComponent status={getChipStatus(item)} isStatutory={true} />
                                            </th>
                                        </tr>
                                    )
                                })}

                            </tbody>
                        </table>
                    </div>
                    {showModal && (
                        <CreateFiles
                            showModal={showModal}
                            setShowModal={setShowModal}
                            isStatutory={true}
                            folderData={folder}
                            uploaderUserId={loggedInUserData?.id}
                            reviewerUserId={loggedInUserData?.id}
                            refresh={() => { getStatutory(siteSelectedForGlobal?.siteId); }}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state) => ({
    loggedInUserData: state.site.loggedInUserData,
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
    siteAssets: state.site.siteAssets,
});
export default connect(mapStateToProps, {
    getSiteAssets,
})(StatutoryRegister);