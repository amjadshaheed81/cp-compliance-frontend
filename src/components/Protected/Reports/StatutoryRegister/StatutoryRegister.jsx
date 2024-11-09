import React, { Fragment, useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { get } from "../../../../api";
import { getSites } from "../../../../store/thunk/site";
import TotalAction from "./TotalAction";
import TotalRequirements from "./TotalRequirements";

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
    getStatutory(siteSelectedForGlobal?.siteId);
    getAllStatutory();
    getRequirements();
  }, []);
  const getStatutory = async (siteId) => {
    setIsLoading(true);
    let getStatutoryDocuments = await get(
      `/api/document/${siteId}/statutoryRegister`
    );
    getStatutoryDocuments = getStatutoryDocuments.sort(
      (a, b) => parseInt(a.sortOrder) - parseInt(b.sortOrder)
    );
    setStatutory(getStatutoryDocuments);
    setIsLoading(false);
  };
  const getAllStatutory = async (siteId) => {
    setIsLoading(true);
    const getStatutoryDocuments = await get(
      `/api/document/statutoryRegister/all`
    );
    setAllStatutory(getStatutoryDocuments);
    setIsLoading(false);
  };
  const getRequirements = async () => {
    const res = await get(
      `/api/lov/STATUARY_CATEGORY`
    );
    setRequirements(res?.filter(itm => itm.attribite2));
  };

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
  const currentSiteChecks = filteredSiteChecks.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );

  return (
    <Fragment>
      <div>
        <div>
          {!create && (
            <>
              <div className="">
                <div className="">
                  <div className="row" style={{ height: "auto" }}>
                    <div className="col-md-6 mt-2 mb-4">
                      <h5>Statutory Register</h5>
                      <p>Individual Site</p>
                      <TotalAction
                        data={statutory}
                      />
                    </div>
                    <div className="col-md-6 mt-2 mb-4">
                      <div>
                        <label>Select Requirement</label>
                        <select
                        name="requirements"
                        className="form-control form-select"
                        id="requirements"
                        onChange={handleRequirementsChange}
                        value={state.selectedRequirements}>
                          <option>Select Requirements</option>
                          {requirements?.map(itm => (<option>{itm?.attribite2}</option>))}
                        </select>
                      </div>
                      {/* <TotalRequirements
                        requirement={state.selectedRequirements}
                        data={allstatutory}
                      /> */}
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
