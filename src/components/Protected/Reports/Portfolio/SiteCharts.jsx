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
ChartJS.register(ArcElement, Tooltip, Legend);

const SiteCharts = ({ siteChart }) => {
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
  const getUsers = async () => {
    const url = `/api/user/all`;
    const data = await get(url);
    console.log("data", data);
    setUsers(data?.users);
    setUsersChart(getUniqueSitesWithUserCount(data?.users));
  };
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
        Staff Per Active Site &nbsp;
        <span class="badge bg-light text-primary">
          Total Staff: {users?.length}
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
});
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
})(SiteCharts);
