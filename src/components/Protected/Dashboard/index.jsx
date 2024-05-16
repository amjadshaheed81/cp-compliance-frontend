import React, { Fragment } from "react";
import { connect } from "react-redux";
import Sidebar from "../../common/Sidebar/Sidebar";
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
      {/* <Sidebar /> */}
      <SidebarNew />
      <div class="content">
        <Header />
        <SearchSite />
        <div class="container-fluid">
          <BreadCrumHeader header={"Welcome"} page={"Home"} />
          <div class="d-flex bd-highlight p-0">
            <div class="bd-highlight">
              <p className="display-8">Samantha Joe</p>
            </div>
            <div class="ms-auto bd-highlight">
              <div class="form-check form-switch">
                <label class="form-check-label" for="flexSwitchCheckChecked">
                  All Sites
                </label>
                <input
                  class="form-check-input"
                  type="checkbox"
                  id="flexSwitchCheckChecked"
                  checked
                />
              </div>
            </div>
          </div>
          <div class="row">
            <div class="col">
              <DashboardRiskScore />
            </div>
            <div class="col">
              <DashboardEventCalendar />
            </div>
            <div class="col">
              <DashboardActiveProjects />
            </div>
          </div>
          <div class="row mt-4">
            <div class="col">
              <DashboardActions />
            </div>
            <div class="col">
              <DashboardNotification />
            </div>
            <div class="col">
              <DashboardTender />
            </div>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Dashboard);
