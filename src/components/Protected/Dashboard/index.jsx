import React, { Fragment } from "react";
import { connect } from "react-redux";
import Sidebar from "../../common/Sidebar/Sidebar";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";

const Dashboard = () => {
  return (
    <Fragment>
      <Sidebar />
      <div class="content">
        <Header />
        <div class="container-fluid">
          <BreadCrumHeader header={"Welcome"} page={"Home"} />
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Dashboard);
