// components/Login/LoginForm.js
import React, { Fragment, useState } from "react";
import { connect } from "react-redux";
import { Box } from "@mui/material";
import { login } from "../../store/thunks";
import "./Login.css";
import { Navigate, useNavigate } from "react-router-dom";
import { Validation } from "../../Constant/Validation";
import { InputError } from "../common/InputError";
import { useForm } from "react-hook-form";
import { loginUser } from "../../store/thunk/site";
import CircularProgress from "@mui/material/CircularProgress";
import BuildNumber from "../common/BuildNumber/BuildNumber";
import { isPlatformUser, reloadTo } from "../../utils/sessionContext";
import { useActiveBrand } from "../../branding";

const LoginForm = ({ login, loginUser, loggedInUserData }) => {
  const brand = useActiveBrand();
  const navigate = useNavigate();
  const [isLoading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState("");
  const {
    register,
    formState: { errors },
    handleSubmit,
  } = useForm({});
  const goTo = (link) => {
    navigate(link);
  };
  const handleLoginSubmit = async (data) => {
    if (isLoading) {
      return;
    }

    const payload = {
      ...data,
      email: String(data?.email || "").trim().toLowerCase(),
    };

    setLoginError("");
    setLoading(true);

    try {
      const result = await loginUser(payload);
      if (result?.success) {
        if (result.reload) {
          reloadTo(result.redirectTo);
        } else {
          goTo(result.redirectTo || "/dashboard");
        }
        return;
      }
      setLoginError(result?.message || "Unable to sign in. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (loggedInUserData?.id && isPlatformUser(loggedInUserData) && !isLoading) {
    return <Navigate to="/platform/continue" replace />;
  }

  return (
    <Fragment>
      <div className="container-fluid container-fluid-login cafm-auth-page cafm-login-page">
        <div className="row">
          <div className="col-md-6 left-panel text-center">
            <img src={brand.loginIllustration} alt="" />
          </div>
          <div className="col-md-6 right-panel bg-white">
            <form onSubmit={handleSubmit(handleLoginSubmit)}>
              <div className="text-center mb-4">
                <img src={brand.logo} className="cafm-auth-logo" alt={`${brand.name} logo`} />
              </div>
              <h2 className="mb-2">
                {brand.loginHeading} <br />
                {brand.loginSubtitle}
              </h2>
              <div className="form-group mt-2">
                <label htmlFor="email">Email</label>
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
                <label htmlFor="password">Password</label>
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
                  disabled={isLoading}
                  aria-busy={isLoading}
                >
                  {isLoading ? (
                    <span className="d-flex align-items-center justify-content-center gap-2">
                      <CircularProgress size={20} sx={{ color: "white" }} />
                      Signing in...
                    </span>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
              {/* )} */}

              {loginError && (
                <div className="alert alert-danger mt-2 mb-0" role="alert">
                  {loginError}
                </div>
              )}

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
              <BuildNumber
                sx={{
                  color: "#637381",
                  marginTop: "0.75rem",
                }}
              />
            </form>
          </div>
        </div>
      </div>
    </Fragment>
  );
};

export default connect((state) => ({ loggedInUserData: state.site?.loggedInUserData }), { login, loginUser })(LoginForm);
