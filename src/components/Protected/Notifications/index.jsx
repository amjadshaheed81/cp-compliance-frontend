import React from "react";
import { connect } from "react-redux";
import {
  addUser,
  addUserTagSite,
  getSites,
  setLoggedInUser,
} from "../../../store/thunk/site";
import SidebarNew from "../../common/Sidebar/SidebarNew";
import Header from "../../common/Header/Header";
import BreadCrumHeader from "../../common/BreadCrumHeader/BreadCrumHeader";

const Notifications = ({}) => {
  return (
    <React.Fragment>
      <SidebarNew />
      <div className="content">
        <Header />
        <div className="container-fluid">
          <BreadCrumHeader header={"Notifications"} page={"Notifications"} />
        </div>
      </div>
    </React.Fragment>
  );
};

const mapStateToProps = (state) => ({
  sites: state.site.sites,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  getSites,
  addUser,
  addUserTagSite,
  setLoggedInUser,
})(Notifications);
