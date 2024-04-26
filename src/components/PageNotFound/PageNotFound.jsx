// components/Login/LoginForm.js
import React, { Fragment } from "react";
import { connect } from "react-redux";
import "./../Login/Login.css";
import logoImage from "../../images/login-left.png";
const PageNotFound = () => {
  return (
    <Fragment>
      <div className="container-fluid container-fluid-login">
        <div className="row">
          <div className="col-md-6 left-panel text-center">
            <img src={logoImage} alt="login left panel logo" />
          </div>
          <div className="col-md-6 right-panel">
            <h1>Page Not Found!!</h1>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(PageNotFound);
