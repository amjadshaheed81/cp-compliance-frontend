import React, { useEffect } from "react";
import { connect } from "react-redux";
import NotAuthorized from "../../NotAuthorized/NotAuthorized";

const ProtectedRoute = ({ element, allowedRoles, loggedInUserData }) => {
  return allowedRoles.includes(loggedInUserData?.role) ? (
    element
  ) : (
    <NotAuthorized />
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
});

export default connect(mapStateToProps, {})(ProtectedRoute);
