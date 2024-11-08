import React, { Fragment, useEffect, useRef, useState } from "react";
import { connect } from "react-redux";
import { useNavigate } from "react-router-dom";
import { get } from "../../../../api";
import { getSites } from "../../../../store/thunk/site";
import TotalAction from "./TotalAction";
import { SiteArea } from "../../../../Constant/SiteArea";

const Actions = ({ siteSelectedForGlobal, loggedInUserData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [create, setCreate] = useState(false);
  const site = JSON.parse(localStorage.getItem("site"));
  const [filteredSiteChecks, setFilteredSiteChecks] = useState([]);
  const [managerList, setManagerList] = useState([]);
  const [actions, setActions] = useState([]);
  const [state, setState] = useState({
    selectedArea: "",
    allSites: true,
  });

  const getActions = async (allSites = false) => {
    setIsLoading(true);
    if (allSites) {
      const res = await get(`/api/site/actions/all`);
      setActions(res);
    } else {
      const res = await get(
        `api/site/actions/${siteSelectedForGlobal?.siteId}`
      );
      setActions(res);
    }
    setIsLoading(false);
  };

  const [itemsPerPage] = useState(7);
  const [currentPage, setCurrentPage] = useState(1);
  const indexOfLastPreAction = currentPage * itemsPerPage;
  const indexOfFirstPreAction = indexOfLastPreAction - itemsPerPage;
  const currentSiteChecks = filteredSiteChecks.slice(
    indexOfFirstPreAction,
    indexOfLastPreAction
  );
  const handleAreaChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      selectedArea: e.target.value,
    }));
    getActionsByArea(e.target.value);
  };
  const getActionsByArea = async (area) => {
    if (area) {
      const res = await get(`/api/site/actions/all?area=${area}`);
      setActions(res);
    } else {
      getActions(state.allSites);
    }
  };
  const handleAllSitesToggle = () => {
    setState((prevState) => ({
      ...prevState,
      allSites: !prevState.allSites,
    }));
  };
  useEffect(() => {
    getActions(state.allSites);
  }, [state.allSites]);
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
                      <h5>Actions</h5>
                      <div className="row" style={{ height: "auto" }}>
                        <div className="col-md-4 col-sm-4 mt-2">
                          <select
                            name="area"
                            className="form-control form-select"
                            id="area"
                            onChange={handleAreaChange}
                            value={state.selectedArea}
                          >
                            <option value="">Area</option>
                            {SiteArea?.map((itm) => (
                              <option value={itm}>{itm}</option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4 col-sm-4 mt-2">
                          <div className="form-check form-switch">
                            <label
                              className="form-check-label"
                              htmlFor="flexSwitchCheckChecked"
                            >
                              {state.allSites ? "All Sites" : "Individual"}
                            </label>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="flexSwitchCheckChecked"
                              checked={state.allSites}
                              onChange={handleAllSitesToggle}
                            />
                          </div>
                        </div>
                      </div>
                      <TotalAction data={actions} />
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
export default connect(mapStateToProps, { getSites })(Actions);
