import React, { Fragment, useEffect } from "react";
import { connect } from "react-redux";
import Header from "../../common/Header/Header";
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
        <Header pageContext={{
          parentLabel: "Dashboard",
          parentPath: "/dashboard",
          label: "Home",
          icon: "dashboard",
        }} />
        <div className="container-fluid" style={{backgroundColor:'#F1F5F9'}}>
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
