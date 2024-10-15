// components/Login/LoginForm.js
import React, { Fragment, useEffect, useState } from "react";
import { connect } from "react-redux";
import { login } from "../../store/thunks";
import logoImage from "../../images/login-left.png";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";
import "./ForgotPassword.css";
import { post } from "../../api";
import { toast } from "react-toastify";

const ForgotPassword = ({ login }) => {
  const [email, setEmail] = useState();
  const [password, setPassword] = useState();
  const [otpSend, setotpSend] = useState(false);
  const [otp, setotp] = useState();
  const navigate = useNavigate();

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handlePasswordChange = (e) => {
    setPassword(e.target.value);
  };

  const handleOtoChange = (e) => {
    setotp(e.target.value);
  };

  useEffect(()=>{
    setotpSend(false);
  },[])
  const handleSubmit = (e) => {
    e.preventDefault();
  
    const body = {email,otp,password};
    post("/api/user/reset-password", body).then(res => {
      setotpSend(true);
      if(otp) {
        setotp();
        setPassword();
        setEmail();
        setotpSend(false);
        navigate("/login");
        toast.success("Password changed successfully!");
      }
    }).catch(err =>{
      setotp();
      toast.error(err?.response?.data?.message);
      return;
    })
   
     
  };

  return (
    <Fragment>
      <div className="container-fluid container-fluid-login">
        <div className="row">
          <div className="col-md-6 left-panel text-center">
            <img src={logoImage} alt="login left panel logo" />
          </div>
          <div className="col-md-6 right-panel bg-white">
            <button className="btn btn-small btn-default back-btn"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
            >Back</button>
            <form onSubmit={handleSubmit}>
              <div className="text-center mb-4">
                <img src={logo} alt="main cpc portal logo" />
              </div>
              <h2 className="mb-2">Reset Password</h2>
              <small>
                {otpSend ? "Verify security code" : "Enter your email address to recieve a password reset link."}
              </small>
              <div className="form-group mt-2">
              {!otpSend &&<label for="email">Email</label>}
                {!otpSend && <input
                  type="text"
                  className="form-control"
                  id="email"
                  value={email}
                  placeholder="Enter your email"
                  onChange={handleEmailChange}
                />}

{otpSend && <input
                  type="password"
                  className="form-control"
                  id="email"
                  value={password}
                  placeholder="Enter new password"
                  onChange={handlePasswordChange}
                />}
                {otpSend && <input
                  type="text"
                  className="form-control"
                  id="otp"
                  value={otp}
                  placeholder="Enter otp"
                  onChange={handleOtoChange}
                />}
              </div>
              <div className="form-group mt-2">
                <button
                  type="submit"
                  className="btn btn-primary rounded w-100 login-submit"
                >
                  {otpSend ? "Submit" : "Send Password Rest Link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, { login })(ForgotPassword);
