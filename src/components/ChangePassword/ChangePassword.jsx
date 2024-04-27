// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import logoImage from "../../images/login-left.png";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";

const ChangePassword = ({}) => {
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <Fragment>
      <div className="container-fluid container-fluid-login">
        <div className="row">
          <div className="col-md-6 left-panel text-center">
            <img src={logoImage} alt="login left panel logo" />
          </div>
          <div className="col-md-6 right-panel bg-white">
            <button
              className="btn btn-small btn-default back-btn"
              onClick={(e) => {
                e.preventDefault();
                navigate("/login");
              }}
            >
              Back
            </button>
            <form onSubmit={handleSubmit}>
              <div className="text-center mb-4">
                <img src={logo} alt="main cpc portal logo" />
              </div>
              <h2 className="mb-2">Change Password</h2>
              <small>
                Change the password for your account ending with
                xxxx06@gmail.com
              </small>
              <div className="form-group mt-2">
                <label for="email">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="6+ Characters, 1 Capital letter"
                />
              </div>
              <div className="form-group mt-2">
                <label for="email">Re-enter Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="rePassword"
                  placeholder="6+ Characters, 1 Capital letter"
                />
              </div>
              <div className="form-group mt-2">
                <button
                  type="submit"
                  className="btn btn-primary rounded w-100 login-submit"
                >
                  Send New Password
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(ChangePassword);
