// components/Login/LoginForm.js
import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import moment from "moment";
import {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
} from "../../../store/thunk/contracts";
import { get } from "../../../api";
ChartJS.register(ArcElement, Tooltip, Legend);

const DashboardRiskScore = (siteSelectedForGlobal) => {
  const [siteChecks, setSiteChecks] = useState({
    labels: [],
    datasets: [
      {
        data: [0, 0, 0,0],
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
  });

  useEffect(()=>{
    getSiteChecks();
  },[])

const getSiteChecks = async () => {
  if(siteSelectedForGlobal?.siteSelectedForGlobal?.siteId) {
    const siteChecks = await get("/api/site-check/site/" + siteSelectedForGlobal?.siteSelectedForGlobal?.siteId);
  
    const body = [];
    body.push(siteChecks.map(i => Number(i.riskScoreRed??0)).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
    body.push(siteChecks.map(i =>  Number(i.riskScoreAmber??0)).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
    body.push(siteChecks.map(i =>  Number(i.riskScoreYellow??0)).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
    body.push(siteChecks.map(i =>  Number(i.riskScoreGreen??0)).reduce((accumulator, currentValue) => accumulator + currentValue, 0));
    const data = {
      labels: [],
      datasets: [
        {
          data:body,
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
  setSiteChecks(data);

}
  
}
  return (
    <Fragment>
      <div className="card">
        <div className="card-body p-2" style={{zIndex:"1"}}>
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <h5 className="card-title">Risk Scorecard</h5>
            </div>
            <div className="ms-auto bd-highlight"></div>
          </div>
          <Doughnut data={siteChecks} />
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});
export default connect(mapStateToProps, {
  getSiteContracts,
  getSiteContractDetails,
  updateContractDetail,
  setLoader,
})(DashboardRiskScore);
