import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { get } from "../../../../api";
import { getSites } from "../../../../store/thunk/site";
import TotalAction from "./TotalAction";
import { SiteArea } from "../../../../Constant/SiteArea";
import { showLoader, hideLoader } from "js-loader-fn";

const Actions = ({ siteSelectedForGlobal, loggedInUserData }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [create, setCreate] = useState(false);
  const site = JSON.parse(localStorage.getItem("site"));
  const [actions, setActions] = useState([]);
  const [state, setState] = useState({
    selectedArea: "",
    isIndividual: false,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const getActions = async (isIndividual = false) => {
    setIsLoading(true);
    showLoader({ title: "Please wait. we are fetching action details." });
    let res;
    if (!isIndividual) {
      if (state.selectedArea) {
        res = await get(`/api/site/actions/all?area=${state.selectedArea}`);
      } else {
        res = await get(`/api/site/actions/all`);
      }
    } else {
      res = await get(`api/site/actions/${siteSelectedForGlobal?.siteId}`);
    }

    // Filter actions by createdAt date range
    const filteredActions = res.filter((action) => {
      const createdAtDate = new Date(action.createdAt);
      const start = startDate ? new Date(startDate) : null;
      const end = endDate ? new Date(endDate) : null;
      return (
        (!start || createdAtDate >= start) && (!end || createdAtDate <= end)
      );
    });

    setActions(filteredActions);
    setIsLoading(false);
    hideLoader();
  };

  const handleStartDateChange = (e) => setStartDate(e.target.value);
  const handleEndDateChange = (e) => setEndDate(e.target.value);

  const handleAreaChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      selectedArea: e.target.value,
    }));
  };

  const getActionsByArea = async (area) => {
    showLoader({ title: "Please wait. we are fetching action details." });
    if (area) {
      const res = await get(`/api/site/actions/all?area=${area}`);
      setActions(res);
    } else {
      getActions(state.isIndividual);
    }
    hideLoader();
  };

  const handleAllSitesToggle = () => {
    setState((prevState) => ({
      ...prevState,
      isIndividual: !prevState.isIndividual,
    }));
  };

  useEffect(() => {
    getActions(state.isIndividual);
  }, [state.isIndividual, state.selectedArea, startDate, endDate]);

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
                            disabled={state.isIndividual}
                            onChange={handleAreaChange}
                            value={state.selectedArea}
                          >
                            <option value="">All Sites</option>
                            {SiteArea?.map((itm) => (
                              <option key={itm} value={itm}>
                                {itm}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="col-md-4 col-sm-4 mt-2">
                          <div className="form-check form-switch">
                            <label
                              className="form-check-label"
                              htmlFor="flexSwitchCheckChecked"
                            >
                              {"Individual"}
                            </label>
                            <input
                              className="form-check-input"
                              type="checkbox"
                              id="flexSwitchCheckChecked"
                              checked={state.isIndividual}
                              onChange={handleAllSitesToggle}
                            />
                          </div>
                        </div>
                      </div>
                      <div className="row mt-2" style={{ height: "auto" }}>
                        <p>Select Date Range</p>
                        <div className="col-md-4">
                          <input
                            type="date"
                            className="form-control"
                            value={startDate}
                            onChange={handleStartDateChange}
                            placeholder="Start Date"
                          />
                        </div>
                        <div className="col-md-4">
                          <input
                            type="date"
                            className="form-control"
                            value={endDate}
                            onChange={handleEndDateChange}
                            placeholder="End Date"
                          />
                        </div>
                      </div>
                      <div style={{ height: "300px" }}>
                        <TotalAction data={actions} />
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

export default connect(mapStateToProps, { getSites })(Actions);
