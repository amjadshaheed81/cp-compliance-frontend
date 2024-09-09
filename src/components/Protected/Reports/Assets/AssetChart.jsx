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
// import BarChart from "./BarChart";
ChartJS.register(ArcElement, Tooltip, Legend);

const AssetChart = ({ assetChart, sitePATItems, sitePFPItems, siteAssets }) => {
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
  useEffect(() => {
    
  }, []);
  useEffect(() => {
    setChartData({
      labels: ["Others", "PFS Items", "PAT Items"],
      datasets: [
        {
          data: [
            (siteAssets?.length - sitePFPItems?.length - sitePATItems?.length),
            sitePFPItems?.length,
            sitePATItems?.length,
          ],
          backgroundColor: ["#3c50e0", "#0a0338", "#6b7c93"],
          borderColor: ["#3c50e0", "#0a0338", "#6b7c93"],
          borderWidth: 1,
        },
      ],
    });
  }, [assetChart]);
  return (
    <div className="row pt-4 pb-4">
      <div className="col-md-4 fs-5">
        Asset Type{" "}
        <span class="badge bg-light text-primary">
          Total Assets: {assetChart?.totalAssets}
        </span>
        <div>
          <Pie
            data={chartData}
            options={{
              plugins: {
                title: {
                  display: false,
                },
              },
            }}
          />
        </div>
      </div>
      <div className="col-md-8 fs-5">
        PAT Result &nbsp;
        <span class="badge bg-light text-primary">
          Total PATs: {sitePATItems?.length}
        </span>
        <div>
          <BarChart data={sitePATItems} />
        </div>
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
});
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
})(AssetChart);
