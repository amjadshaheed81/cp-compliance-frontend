import React, { Fragment } from "react";
import { connect } from "react-redux";
import Sidebar from "../../common/Sidebar/Sidebar";
import Header from "../../common/Header/Header";

const Dashboard = () => {
  return (
    <Fragment>
      <Sidebar />
      {/* 
  <!-- Page Content --> */}
      <div class="content">
        <Header />

        <div class="container">
          <h2>Welcome</h2>
          <h5>Smantha</h5>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Dashboard);
