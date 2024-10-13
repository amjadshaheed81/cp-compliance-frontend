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

  const options = {
    plugins: {
      legend: {
        display: true,
      },
    },
  };

  const centerTextPlugin = {
    id: 'centerText',
    beforeDraw: function(chart) {
      const { width, height } = chart;
      const ctx = chart.ctx;
      ctx.restore();
      const total = chart.data.datasets[0].data.reduce((sum, value) => sum + value, 0);
      ctx.font = 'bold 30px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      const totalText = total.toString();
      const x = width / 2;
      const y = height / 2 - 10;
      ctx.fillText(totalText, x, y);
      ctx.font = 'bold 20px Arial';
      ctx.textBaseline = 'top';
      const labelText = 'Actions';
      const labelY = height / 2 + 10;
      ctx.fillText(labelText, x, labelY);
  
      ctx.save();
    }
  };

  useEffect(()=>{
    getSiteChecks();
  },[siteSelectedForGlobal?.siteSelectedForGlobal?.siteId])

const getSiteChecks = async () => {
  if(siteSelectedForGlobal?.siteSelectedForGlobal?.siteId) {
    let siteChecks = await get("/api/site/actions/" + siteSelectedForGlobal?.siteSelectedForGlobal?.siteId);
    siteChecks = siteChecks.filter(s=> s.status !== "Completed");
    const body = [];
    body.push(siteChecks.filter(i => i.riskScore > 16).length);
    body.push(siteChecks.filter(i => i.riskScore > 9 && i.riskScore < 17).length);
    body.push(siteChecks.filter(i => i.riskScore > 4 && i.riskScore < 10).length);
    body.push(siteChecks.filter(i => i.riskScore <= 4).length);
    
    const data = {
      labels: ["Very High", "High", "Medium","Low" ],
      datasets: [
        {
          data:body,
          backgroundColor: [
            "#E03C3C",
            "#FFA70B",
            "#EFC531",
            "#0FCF7E",
           
          ],
          borderColor: [
            "#E03C3C",
            "#FFA70B",
            "#EFC531",
            "#0FCF7E",
            
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
              <h5 className="card-title">Risk Scorecard - {siteSelectedForGlobal?.siteSelectedForGlobal?.siteName}</h5>
            </div>
            <div className="ms-auto bd-highlight"></div>
          </div>
          <Doughnut data={siteChecks} options={options} plugins={[centerTextPlugin]}/>
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
