import React, { Fragment, useEffect, useRef, useState, useMemo } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { get } from "../../../../api";
import { getSites } from "../../../../store/thunk/site";
import TotalAction from "./TotalAction";
import TotalRequirements from "./TotalRequirements";
import { showLoader, hideLoader } from "js-loader-fn";
import { toast } from "react-toastify";

const StatutoryRegister = ({ siteSelectedForGlobal, loggedInUserData }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [create, setCreate] = useState(false);
    const site = JSON.parse(localStorage.getItem("site"));
    const [filteredSiteChecks, setFilteredSiteChecks] = useState([]);
    const [managerList, setManagerList] = useState([]);
    const [statutory, setStatutory] = useState([]);
    const [allstatutory, setAllStatutory] = useState([]);
    const [requirements, setRequirements] = useState([]);
    const [state, setState] = useState({
        selectedRequirements: "",
    });

    useEffect(() => {
        if (siteSelectedForGlobal?.siteId) {
            getStatutory(siteSelectedForGlobal?.siteId);
            getAllStatutory();
            // getRequirements();
        } else {
            toast.error("Please select site from site search to proceed....");
        }
    }, [siteSelectedForGlobal]);
    const getStatutory = async (siteId) => {
        try {
            setIsLoading(true);
            showLoader({
                title: "Please wait. We are collecting statutory detail...",
            });
            let getStatutoryDocuments = await get(
                `/api/document/${siteId}/statutoryRegister`
            );
            getStatutoryDocuments = getStatutoryDocuments.sort(
                (a, b) => parseInt(a.sortOrder) - parseInt(b.sortOrder)
            );
            setStatutory(getStatutoryDocuments);
            setIsLoading(false);
            hideLoader();
        } catch (e) {
            hideLoader();
            setIsLoading(false);
        }
    };
    const getAllStatutory = async (siteId) => {
        try {
            showLoader({
                title: "Please wait. We are collecting statutory detail...",
            });
            setIsLoading(true);
            const licenseId =
                (site && site.licenseId) || loggedInUserData?.licenseId ||
                siteSelectedForGlobal?.licenseId;
            const getStatutoryDocuments = await get(
                `/api/document/statutoryRegister/all?licenseId=${licenseId}`
            );
            setAllStatutory(getStatutoryDocuments);
            setIsLoading(false);
            hideLoader();
        } catch (e) {
            setIsLoading(false);
            hideLoader();
        }
    };
    // const getRequirements = async () => {
    //   const res = await get(`/api/lov/STATUARY_CATEGORY`);
    //   setRequirements(filterAndRemoveDuplicates(res));
    // };

    const handleRequirementsChange = (e) => {
        setState((prevState) => ({
            ...prevState,
            selectedRequirements: e.target.value,
        }));
        // getActionsByArea(e.target.value);
    };

    const [itemsPerPage] = useState(7);
    const [currentPage, setCurrentPage] = useState(1);
    const indexOfLastPreAction = currentPage * itemsPerPage;
    const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
    const currentSiteChecks = filteredSiteChecks?.slice(
        indexOfFirstPreAction,
        indexOfLastPreAction
    );

    // API now returns data filtered by licenseId, no need for client-side filtering
    // but keep the memoization for consistency and safety
    const filteredAllStatutory = useMemo(() => {
        return allstatutory;
    }, [allstatutory]);

    return (
        <Fragment>
            <div>
                <div>
                    {!create && (
                        <>
                            <div className="">
                                <div className="">
                                    <div className="row" style={{ height: "auto" }}>
                                        <div className="col-md-12 mt-2 mb-4">
                                            <h5>Statutory Register</h5>
                                            <div className="col-md-6">
                                                <label>Select Requirement to check all sites</label>
                                                <select
                                                    name="requirements"
                                                    className="form-control form-select"
                                                    id="requirements"
                                                    onChange={handleRequirementsChange}
                                                    value={state.selectedRequirements}
                                                >
                                                    <option>Select Requirements</option>
                                                    {statutory?.map((itm) => (
                                                        <option>{itm?.requirement}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div style={{ height: "350px" }} className="mt-4">
                                                <TotalRequirements
                                                    requirement={state.selectedRequirements}
                                                    data={filteredAllStatutory}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Fragment>
    );
};

const mapStateToProps = (state) => ({
    sites: state.site.sites,
    siteSelectedForGlobal: state.site.siteSelectedForGlobal,
    loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { getSites })(StatutoryRegister);
