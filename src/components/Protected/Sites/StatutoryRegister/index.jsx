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

const StatutoryRegister = ({ siteSelectedForGlobal }) => {
    let chipColor;
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [statutory, setStatutory] = useState([]);
    const [folder, setFolder] = useState({});
    let dutiesIdentified = 0; let dutiesMet = 0;let dutiesNotMet;
    const getDutiesIdentified = (item, dutieMet) => {
        console.log('item', item);
        let obj = {};
        for(let i=0;i<item.length;i++){
            
            if((item[i].status === 'Passed' || item[i].status === 'Open') && item[i].required === true){
                dutiesIdentified++;
            }
            if((item[i].files !== null && item[i].status === 'Passed' && dutieMet===true)){
                dutiesMet++;
            }
        }
        
        obj.dutiesIdentified = dutiesIdentified;
        obj.dutiesMet = dutiesMet;
        obj.dutiesNotMet = dutiesIdentified-dutiesMet;
        console.log('obj', obj);
        return obj;
    }
    const getStatutory = async (siteId) => {
        setIsLoading(true);
        const getStatutoryDocuments = await get(`/api/document/${siteId}/statutoryRegister`);
        setStatutory(getStatutoryDocuments);
        
        chipColor = statutory.filter((item) => {
            return item.status === "Passed";
        })
        setIsLoading(false);
    }
   
    const getChipStatus = (item) => {
        return item.status === 'Passed' ? 'Passed'  : 'Open'
    }
    console.log('chip color', chipColor);
    console.log('statutory', statutory);
    useEffect(() => {
        if (siteSelectedForGlobal?.siteId) {
            getStatutory(siteSelectedForGlobal?.siteId);
            // getChipStatus();
        } else {
            Swal.fire({
                icon: "error",
                title: "Oops...",
                text: "Please select site from site search and try again.",
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [siteSelectedForGlobal?.siteId]);
    const handleCheckboxField = async (e,item) => {
        // setFolder(item);
        const folderId = item.id;
        const formData = {
            required: e.target.checked,
            status: ((e.target.checked === true && item.files !== null) ? "Passed" : "Open"),
        };
        const url = `/api/document/folder/${folderId}/manage`;
        const res = await put(url, formData);
        if (res?.status === 200) {
        }
    }
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
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>{getDutiesIdentified(statutory).dutiesIdentified}</p>
                                </div>
                                <div className="col">
                                    <DescriptionIcon style={{ color: "green", fontSize: "2rem" }} />,
                                    <span>Duties Met</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>{getDutiesIdentified(statutory, true).dutiesMet}</p>
                                </div>
                                <div className="col">
                                    <DescriptionIcon style={{ color: "yellow", fontSize: "2rem" }} />,
                                    <span>Duties Not Met</span>
                                    <p class="fw-bold fs-3" style={{ marginLeft: "2.5rem" }}>{getDutiesIdentified(statutory).dutiesNotMet}</p>
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
                                {!isLoading && statutory.length === 0 && (
                                    <tr>
                                        <td colSpan={4} align="center">No result found!!</td>
                                    </tr>
                                )}
                                {statutory?.map((item) => {

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
                                                    <button className="btn btn-primary mt-3">View Evidence</button>
                                                </div>
                                            </th>
                                            <th scope="col">
                                                <input type="checkbox" onChange={(e) => { handleCheckboxField(e, item) }} />
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
                                                        {item.files?.map((itm) => {
                                                            return (
                                                                <tr>
                                                                    <th scope="col">{itm.name}</th>
                                                                    <th scope="col">{itm.fileVersion}</th>
                                                                    <th scope="col">{itm.uploadDate}</th>
                                                                    <th scope="col">{itm.expiryDate}</th>
                                                                    <th scope="col">{itm.uploaderUserName}</th>
                                                                    <th scope="col">{itm.uploaderUserId}</th>
                                                                </tr>
                                                            )

                                                        })}

                                                        <tr>
                                                            <td colspan="6"><div className='upload-file'>
                                                                <label id="upload-file" class="text-decoration-underline" onClick={() => { setFolder(item);setShowModal(true); }}
                                                                    style={{ color: "384bd3", cursor: "pointer" }}>Upload New File</label>
                                                            </div></td>
                                                        </tr>
                                                    </tbody></table>
                                            </th>
                                            <th scope="col">
                                            <ChipComponent status={getChipStatus(item)} />
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
                            refresh={() => { getStatutory(siteSelectedForGlobal?.siteId); }}
                        />
                    )}
                </div>
            </div>
        </>
    )
}

const mapStateToProps = (state) => ({
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
})(StatutoryRegister);