import React, { useEffect, useState } from "react";
import { connect } from "react-redux";
import {
  addUser,
  addUserTagSite,
  getSites,
  setLoggedInUser,
} from "../../../../store/thunk/site";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Pie } from "react-chartjs-2";
import { get } from "../../../../api";
import { getUniqueSitesWithUserCount } from "../../../../utils/getUniqueSitesWithUserCount";
import BarChart from "./BarChart";
import { SiteArea } from "../../../../Constant/SiteArea";
ChartJS.register(ArcElement, Tooltip, Legend);

const SiteCharts = ({
  siteChart,
  sites,
  setSiteChart,
  siteSelectedForGlobal,
}) => {
  const [state, setState] = useState({
    selectedArea: "",
    allSites: true,
  });
  const handleAreaChange = (e) => {
    setState((prevState) => ({
      ...prevState,
      selectedArea: e.target.value,
    }));
  };

  const handleAllSitesToggle = () => {
    setState((prevState) => ({
      ...prevState,
      allSites: !prevState.allSites,
    }));
  };
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
  const [users, setUsers] = useState([]);
  const [userschart, setUsersChart] = useState([]);
  useEffect(() => {
    getUsers();
  }, []);
  const areaOption = sites.filter(
    (obj1, i, arr) => arr.findIndex((obj2) => obj2.area === obj1.area) === i
  );
  const searchSite = (data) => {
    console.log(data);
  };
  const getUsers = async () => {
    const url = `/api/user/all`;
    const data = await get(url);
    console.log("data", data);
    setUsers(data?.users);
    setUsersChart(
      getUniqueSitesWithUserCount(
        data?.users,
        sites,
        state.selectedArea,
        state.allSites,
        siteSelectedForGlobal
      )
    );
  };
  useEffect(() => {
    setUsersChart(
      getUniqueSitesWithUserCount(
        users,
        sites,
        state.selectedArea,
        state.allSites,
        siteSelectedForGlobal
      )
    );
  }, [state.selectedArea, state.allSites]);
  useEffect(() => {
    if (sites) {
      setSiteChart({
        totalSites: sites?.length,
        openSites: sites?.filter(
          (itm) => String(itm.status).toLowerCase() === "open"
        )?.length,
        soldSites: sites?.filter(
          (itm) => String(itm.status).toLowerCase() === "sold"
        )?.length,
        closedSites: sites?.filter(
          (itm) => String(itm.status).toLowerCase() === "closed"
        )?.length,
      });
    }
  }, [sites]);
  useEffect(() => {
    setChartData({
      labels: ["Open", "Closed", "Sold"],
      datasets: [
        {
          data: [
            siteChart?.openSites,
            siteChart?.closedSites,
            siteChart?.soldSites,
          ],
          backgroundColor: ["#3c50e0", "#0a0338", "#6b7c93"],
          borderColor: ["#3c50e0", "#0a0338", "#6b7c93"],
          borderWidth: 1,
        },
      ],
    });
  }, [siteChart]);
  return (
    <div className="row pt-4 pb-4">
      <div className="col-md-4 fs-5">
        Sites By Status{" "}
        <span class="badge bg-light text-primary">
          Total Sites: {siteChart?.totalSites}
        </span>
        <div>
          <Pie
            data={chartData}
            options={{
              plugins: {
                title: {
                  display: false,
                  //   text: "Users Gained between 2016-2020",
                },
              },
            }}
          />
        </div>
      </div>
      <div className="col-md-8 fs-5">
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
              {SiteArea?.map((itm)=> <option value={itm}>{itm}</option>)}
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
        Staff Per Active Site &nbsp;
        <span class="badge bg-light text-primary">
          Total Staff: {state?.allSites ? users?.length : userschart?.[0]?.totalUsers}
        </span>
        <div>
          <BarChart data={userschart} />
        </div>
      </div>
    </div>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
})(SiteCharts);
