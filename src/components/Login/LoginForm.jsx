// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { Box } from "@mui/material";
import { login } from "../../store/thunks";
import "./Login.css";
import logoImage from "../../images/login-left.png";
import logo from "../../images/logo.png";
import { useNavigate } from "react-router-dom";
import { Validation } from "../../Constant/Validation";
import { InputError } from "../common/InputError";
import { useForm } from "react-hook-form";
import { loginUser } from "../../store/thunk/site";
import CircularProgress from "@mui/material/CircularProgress";

const LoginForm = ({ login, loginUser }) => {
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({});
  const goTo = (link) => {
    navigate(link);
  };
  const handleLoginSubmit = (data) => {
    setLoading(true);
    loginUser(data, goTo, setLoading);
  };

  return (
    <Fragment>
      <div className="container-fluid container-fluid-login">
        <div className="row">
          <div className="col-md-6 left-panel text-center">
            <img src={logoImage} alt="login left panel logo" />
          </div>
          <div className="col-md-6 right-panel bg-white">
            <form onSubmit={handleSubmit(handleLoginSubmit)}>
              <div className="text-center mb-4">
                <img src={logo} alt="main cpc portal logo" />
              </div>
              <h2 className="mb-2">
                Sign In to Unite <br />
                Property Management Suite
              </h2>
              <div className="form-group mt-2">
                <label for="email">Email</label>
                <input
                  type="text"
autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
                  className="form-control"
                  id="email"
                  placeholder="Enter your email"
                  {...register("email", {
                    required: {
                      value: true,
                      message: `${Validation.REQUIRED} email.`,
                    },
                    validate: {
                      maxLength: (v) =>
                        v.length <= 50 ||
                        "The email should have at most 50 characters",
                      matchPattern: (v) =>
                        /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(v) ||
                        "Email address must be a valid address",
                    },
                  })}
                />
                {errors?.email && (
                  <InputError
                    message={errors?.email?.message}
                    key={errors?.email?.message}
                  />
                )}
              </div>
              <div className="form-group mt-2">
                <label for="password">Password</label>
                <input
                  type="password"
                  className="form-control"
                  id="password"
                  placeholder="Password"
                  {...register("password", {
                    required: {
                      value: true,
                      message: `${Validation.REQUIRED} password.`,
                    },
                  })}
                />
                {errors?.password && (
                  <InputError
                    message={errors?.password?.message}
                    key={errors?.password?.message}
                  />
                )}
              </div>
              {/* {isLoading && (
                <Box sx={{ display: "flex" }}>
                  <CircularProgress />
                </Box>
              )} */}
              {/* {!isLoading && ( */}
                <div className="form-group mt-2">
                  <button
                    type="submit"
                    className="btn btn-primary rounded w-100 login-submit"
                  >
                    {isLoading ? <CircularProgress sx={{ color: 'white' }}/>  : "Login"}
                  </button>
                </div>
              {/* )} */}

              <div className="mt-2 text-center">
                <p>
                  <small>
                    Forgot Password?{" "}
                    <a
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        navigate("/forgot-password");
                      }}
                    >
                      Click here
                    </a>
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

export default connect(null, { login, loginUser })(LoginForm);
