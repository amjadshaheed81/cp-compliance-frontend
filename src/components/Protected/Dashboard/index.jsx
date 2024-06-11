import React, { Fragment } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import DashboardActions from "./DashboardActions";
import "./Dashboard.css";
import DashboardNotification from "./DashboardNotification";
import DashboardTender from "./DashboardTender";
import DashboardActiveProjects from "./DashboardActiveProjects";
import DashboardEventCalendar from "./DashboardEventCalendar";
import DashboardRiskScore from "./DashboardRiskScore";
import SearchSite from "./SearchSite";
import SidebarNew from "../../common/Sidebar/SidebarNew";

const Dashboard = () => {
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <SearchSite />
        <div className="container-fluid">
          <BreadCrumHeader header={"Welcome"} page={"Home"} />
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <p className="display-8">Samantha Joe</p>
            </div>
            <div className="ms-auto bd-highlight">
              <div className="form-check form-switch">
                <label className="form-check-label" for="flexSwitchCheckChecked">
                  All Sites
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="flexSwitchCheckChecked"
                  checked
                />
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col">
              <DashboardRiskScore />
            </div>
            <div className="col">
              <DashboardEventCalendar />
            </div>
            <div className="col">
              <DashboardActiveProjects />
            </div>
          </div>
          <div className="row mt-4">
            <div className="col">
              <DashboardActions />
            </div>
            <div className="col">
              <DashboardNotification />
            </div>
            <div className="col">
              <DashboardTender />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Dashboard);
