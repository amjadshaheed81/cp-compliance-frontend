import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import { showLoader, hideLoader } from "js-loader-fn";
import { get } from "../../../../api";
import { SiteArea } from "../../../../Constant/SiteArea";
import { Switch } from "@mui/material";
import DateRangeChart from "./DateRangeChart";
import DateRangeChartQuantity from "./DateRangeChartQuantity";
import CostsBySite from "./CostsBySite";

const NewAssetChart = ({ siteSelectedForGlobal }) => {
  const [chartResponse, setChartResponse] = useState();
  const [state, setState] = useState({
    selectedArea: "",
    isIndividualSite: false,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  useEffect(() => {
    getSiteChartData();
  }, [
    siteSelectedForGlobal,
    startDate,
    endDate,
    state.isIndividualSite,
    state.selectedArea,
  ]);
  const appendParams = (url, params) => {
    const separator = url.includes("?") ? "&" : "?";
    const queryString = Object.keys(params)
      ?.map(
        (key) => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`
      )
      .join("&");

    return url + separator + queryString;
  };
  const getSiteChartData = async () => {
    try {
      showLoader({
        title: "Please wait. We are collecting data for assets...",
      });
      let url = `/api/site/assets/all/v2`;
      let params = {};
      if (state.isIndividualSite) {
        params = { ...params, siteId: siteSelectedForGlobal?.siteId };
      }
      if (!state.isIndividualSite && state.selectedArea) {
        params = { ...params, area: state.selectedArea };
      }
      if (startDate && endDate) {
        params = { ...params, fromDate: startDate, toDate: endDate };
      }
      const newUrl = appendParams(url, params);
      const res = await get(newUrl);
      setChartResponse(res);
      hideLoader();
    } catch (e) {
      hideLoader();
    }
  };

  const handleDateChange = (setter) => (e) => setter(e.target.value);

  const handleChange = (event) => {
    setState((prevState) => ({
      ...prevState,
      isIndividualSite: event.target.checked,
    }));
  };

  return (
    <div className="row pt-4 pb-4">
      <div className="row mb-2">
        <div className="col-md-3 col-sm-4 mt-2">
          <select
            name="area"
            className="form-control form-select"
            id="area"
            disabled={state.isIndividualSite}
            value={state.selectedArea}
            onChange={(e) => {
              // getAllSiteAssetsDataArea(e.target.value);
              setState({ ...state, selectedArea: e.target.value });
            }}
          >
            <option value="">All Sites</option>
            {SiteArea?.map((itm) => (
              <option key={itm} value={itm}>
                {itm}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3 col-sm-4 mt-2">
          <Switch
            checked={state.isIndividualSite}
            onChange={handleChange}
            inputProps={{ "aria-label": "controlled" }}
          />
          <label>Individual Site</label>
        </div>
        <div className="col-md-3 col-sm-4 mt-2">
          <label>Start Date Range</label>
          <input
            type="date"
            className="form-control"
            value={startDate}
            onChange={handleDateChange(setStartDate)}
            placeholder="Start Date"
          />
        </div>
        <div className="col-md-3 col-sm-4 mt-2">
          <label>End Date Range</label>
          <input
            type="date"
            className="form-control"
            value={endDate}
            onChange={handleDateChange(setEndDate)}
            placeholder="End Date"
          />
        </div>
      </div>
      {/* <div className="col-md-6 fs-5 mt-2">
        <div style={{ height: "250px" }}>
          <TotalAssetsPieChart
            general={chartResponse?.genral || 0}
            doors={chartResponse?.door || 0}
            pat={chartResponse?.pat || 0}
            pfp={chartResponse?.pfp || 0}
          />
        </div>
      </div> */}
      <div className="col-md-6 mt-2">
        <div className="col-md-12">
          <DateRangeChart data={chartResponse?.cost} />
        </div>
        <div className="col-md-12">
          <DateRangeChartQuantity data={chartResponse?.quantity} />
        </div>
      </div>
      <div className="col-md-6 mt-4">
        <CostsBySite data={chartResponse?.costSite} />
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,
  sitePATItems: state.site.sitePATItems,
  sitePFPItems: state.site.sitePFPItems,
  siteAssets: state.site.siteAssets,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {})(NewAssetChart);
