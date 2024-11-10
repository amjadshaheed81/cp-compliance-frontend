import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  addUser,
  addUserTagSite,
  getSites,
  setLoggedInUser,
  setSiteAssets,
} from "../../../../store/thunk/site";
import { showLoader, hideLoader } from "js-loader-fn";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { get } from "../../../../api";
import { SiteArea } from "../../../../Constant/SiteArea";
import { Switch } from "@mui/material";
import BarChart from "./BarChart";
import DateRangeChart from "./DateRangeChart";
import AssetsByCost from "./AssetsByCost";
import { toast } from "react-toastify";

ChartJS.register(ArcElement, Tooltip, Legend);

const AssetChart = ({
  sitePATItems,
  sitePFPItems,
  siteAssets,
  siteSelectedForGlobal,
}) => {
  const [dateRangeData, setDateRange] = useState([]);
  const [state, setState] = useState({
    selectedArea: "",
    allSites: true,
  });
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [chartData, setChartData] = useState({
    labels: [],
    datasets: [
      {
        data: [1, 1, 3],
        backgroundColor: ["#3c50e0", "#0a0338", "#6b7c93"],
        borderColor: ["#3c50e0", "#0a0338", "#6b7c93"],
        borderWidth: 1,
      },
    ],
  });

  useEffect(() => {
    if (state.allSites) {
      if (state.selectedArea) {
        getAllSiteAssetsDataArea(state.selectedArea);
      } else {
        getAllSiteAssetsData();
      }
    } else {
      getSiteAssetsData();
    }
  }, [siteSelectedForGlobal, startDate, endDate]);

  const getSiteAssetsData = async () => {
    const res = await fetchAndMergeAssets();
    const filteredData = filterDataByDateRange(res);
    setDateRange(filteredData);
  };

  const fetchAndMergeAssets = async () => {
    showLoader({ title: "Please wait. We are collecting data for assets..." });
    const siteId = siteSelectedForGlobal?.siteId;
    const urls = [
      `/api/site/${siteId}/assets`,
      `/api/site/${siteId}/assets?pfpItem=true`,
      `/api/site/${siteId}/assets?doorItem=true`,
      `/api/site/${siteId}/assets?patItem=true`,
    ];
    try {
      const responses = await Promise.all(urls.map((url) => get(url)));
      const mergedAssets = responses.flatMap(
        (response) => response?.assets || []
      );
      hideLoader();
      return mergedAssets;
    } catch (error) {
      hideLoader();
      console.error("Error fetching assets:", error);
      return [];
    }
  };

  const filterDataByDateRange = (data) => {
    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;
    return data.filter((item) => {
      const purchaseDate = new Date(item.purchaseDate);
      return (!start || purchaseDate >= start) && (!end || purchaseDate <= end);
    });
  };

  const handleDateChange = (setter) => (e) => setter(e.target.value);

  const handleChange = (event) => {
    setState((prevState) => ({
      ...prevState,
      allSites: event.target.checked,
    }));
    event.target.checked ? getSiteAssetsData() : getAllSiteAssetsData();
  };

  const getAllSiteAssetsData = async () => {
    showLoader({ title: "Please wait. We are collecting data for assets..." });
    try {
      const res = await get(`/api/site/assets/all`);
      const filteredData = filterDataByDateRange(res?.assets || []);
      setDateRange(filteredData);
      setSiteAssets(res?.assets || []);
      hideLoader();
    } catch (e) {
      hideLoader();
      toast.error("Something went wrong while fetching all assets data.");
    }
  };

  const getAllSiteAssetsDataArea = async (area) => {
    showLoader({ title: "Please wait. We are collecting data for assets..." });
    try {
      const res = await get(`/api/site/assets/all?area=${area}`);
      const filteredData = filterDataByDateRange(res?.assets || []);
      setDateRange(filteredData);
      setSiteAssets(res?.assets || []);
      hideLoader();
    } catch (e) {
      hideLoader();
      toast.error("Something went wrong while fetching all assets data.");
    }
  };

  return (
    <div className="row pt-4 pb-4">
      <div className="row mb-2">
        <div className="col-md-3 col-sm-4 mt-2">
          <select
            name="area"
            className="form-control form-select"
            id="area"
            value={state.selectedArea}
            onChange={(e) => {
              getAllSiteAssetsDataArea(e.target.value);
              setState({ ...state, selectedArea: e.target.value });
            }}
          >
            <option value="">Area</option>
            {SiteArea?.map((itm) => (
              <option key={itm} value={itm}>
                {itm}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-3 col-sm-4 mt-2">
          <label>All</label>
          <Switch
            checked={state.allSites}
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
      <div className="col-md-6 fs-5">
        Asset Type{" "}
        <span className="badge bg-light text-primary">
          Total Assets: {siteAssets?.length}
        </span>
        <div>
          <Pie
            data={chartData}
            options={{
              plugins: {
                title: { display: false },
              },
            }}
          />
        </div>
      </div>
      <div className="col-md-6">
        {dateRangeData?.length > 0 && <DateRangeChart data={dateRangeData} />}
      </div>
      <div className="col-md-6 fs-5">
        PAT Result &nbsp;
        <span className="badge bg-light text-primary">
          Total PATs: {sitePATItems?.length}
        </span>
        <div>
          <BarChart data={sitePATItems} />
        </div>
      </div>
      <div className="col-md-6">
        {dateRangeData?.length > 0 && (
          <AssetsByCost
            data={dateRangeData}
            viewBy={state?.selectedArea ? "region" : "building"}
            area={state?.selectedArea}
          />
        )}
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
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
  setSiteAssets,
})(AssetChart);
