// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { useActiveBrand } from "../../branding";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";

const ChangePassword = ({}) => {
  const brand = useActiveBrand();
  const navigate = useNavigate();
  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/login");
  };

  return (
    <Fragment>
      <div className="container-fluid container-fluid-login cafm-auth-page cafm-change-password-page">
        <div className="row">
          <div className="col-md-6 left-panel text-center">
            <img src={brand.loginIllustration} alt="" />
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
                <img src={brand.logo} className="cafm-auth-logo" alt={`${brand.name} logo`} />
              </div>
              <h2 className="mb-2">Change Password</h2>
              <small>
                Change the password for your account.
              </small>
              <div className="form-group mt-2">
                <label htmlFor="password">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="6+ Characters, 1 Capital letter"
                />
              </div>
              <div className="form-group mt-2">
                <label htmlFor="rePassword">Re-enter Password</label>
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
