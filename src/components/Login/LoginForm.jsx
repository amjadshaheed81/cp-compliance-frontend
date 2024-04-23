// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { login } from "../../store/thunks";
import "./Login.css";
import logoImage from "../../images/login-left.png";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";

const LoginForm = ({ login }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    navigate("/dashboard");
    // login('email, password);
  };

  return (
    <Fragment>
      <div className="container-fluid container-fluid-login">
        <div className="row">
          <div className="col-md-6 left-panel text-center">
            <img src={logoImage} alt="login left panel logo" />
          </div>
          <div className="col-md-6 right-panel">
            <form onSubmit={handleSubmit}>
              <div className="text-center mb-4">
                <img src={logo} alt="main cpc portal logo" />
              </div>
              <h2 className="mb-2 login-title">
                Sign In to Unite Property Management Suite
              </h2>
              <div className="form-group mt-2">
                <label for="email">Email</label>
                <input
                  type="text"
                  className="form-control"
                  id="email"
                  value={email}
                  placeholder="Enter your email"
                  onChange={handleEmailChange}
                />
              </div>
              <div className="form-group mt-2">
                <label for="password">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="Password"
                  value={password}
                  onChange={handlePasswordChange}
                />
              </div>
              <div className="form-group mt-2">
                <button
                  type="submit"
                  className="btn btn-primary rounded w-100 login-submit"
                >
                  Login
                </button>
              </div>
              <div className="mt-2 text-center">
                <p>
                  <small>
                    Forgot Password? <a href="#">Click here</a>
                  </small>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, { login })(LoginForm);
