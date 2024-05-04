// components/Login/LoginForm.js
import React, { Fragment } from "react";
import { connect } from "react-redux";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
ChartJS.register(ArcElement, Tooltip, Legend);
export const data = {
  labels: [],
  datasets: [
    {
      data: [19, 3, 5,12],
      backgroundColor: [
        "#FFA70B",
        "#EFC531",
        "#0FCF7E",
        "#E03C3C",
      ],
      borderColor: [
        "#FFA70B",
        "#EFC531",
        "#0FCF7E",
        "#E03C3C",
      ],
      borderWidth: 1,
    },
  ],
};
const DashboardRiskScore = () => {
  return (
    <Fragment>
      <div class="card">
        <div class="card-body p-2" style={{zIndex:"1"}}>
          <div class="d-flex bd-highlight p-0">
            <div class="bd-highlight">
              <h5 class="card-title">Risk Scorecard</h5>
            </div>
            <div class="ms-auto bd-highlight"></div>
          </div>
          <Doughnut data={data} />
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(DashboardRiskScore);
