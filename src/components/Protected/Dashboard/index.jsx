import React, { Fragment, useEffect } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";
import DashboardActions from "./DashboardActions";
import "./Dashboard.css";
import DashboardNotification from "./DashboardNotification";
import DashboardTender from "./DashboardTender";
import DashboardActiveProjects from "./DashboardActiveProjects";
import DashboardEventCalendar from "./DashboardEventCalendar";
import DashboardEventCalendarSite from "./DashboardEventCalendarSite";
import DashboardRiskScore from "./DashboardRiskScore";
import SearchSite from "./SearchSite";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import { selectGlobalSite } from "../../../store/thunk/site";

const Dashboard = ({
  loggedInUserData,
  selectGlobalSite,
  siteSelectedForGlobal,
}) => {
  useEffect(() => {
    console.log('loggedInUserData',loggedInUserData)
    if (loggedInUserData) {
      if (!siteSelectedForGlobal?.siteId) {
        selectGlobalSite({
          siteName: loggedInUserData?.taggedSites?.[0]?.name || '',
          siteId: loggedInUserData?.taggedSites?.[0]?.id || '',
          siteImageUrl : loggedInUserData?.taggedSites?.[0]?.siteImageUrl  || '',
        });
        localStorage.setItem("site", JSON.stringify({
          siteName: loggedInUserData?.taggedSites?.[0]?.name || '',
          siteId: loggedInUserData?.taggedSites?.[0]?.id || '',
          siteImageUrl : loggedInUserData?.taggedSites?.[0]?.siteImageUrl  || '',
        }));
      }
    }
  }, [loggedInUserData]);
  return (
    <Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid" style={{backgroundColor:'#F1F5F9'}}>
          <BreadCrumHeader header={"Welcome"} page={"Home"} />
          <div className="d-flex bd-highlight p-0">
            <div className="bd-highlight">
              <b><p className="display-8">{loggedInUserData?.name??"User"}</p></b>
            </div>
            {/* <div className="ms-auto bd-highlight">
              <div className="form-check form-switch">
                <label
                  className="form-check-label"
                  for="flexSwitchCheckChecked"
                >
                  All Sites
                </label>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="flexSwitchCheckChecked"
                  checked
                />
              </div>
            </div> */}
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
              <DashboardEventCalendarSite />
            </div>
            {/* <div className="col">
              <DashboardTender />
            </div> */}
          </div>
        </div>
      </div>
    </Fragment>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
});

export default connect(mapStateToProps, { selectGlobalSite })(Dashboard);
