import React, { Fragment } from "react";
import { connect } from "react-redux";
import logo from "./../../../images/logo-sign.png";
import userImg from "./../../../images/user-default.png";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  }
  return (
    <Fragment>
      {/* <!-- Sidebar --> */}
      <div class="sidebar">
        <ul class="nav flex-column text-center">
          <li style={{ marginBottom: 10, marginTop: 20}}>
            <img src={logo} height={30} width={30} className="img img-responsive" alt="side logo"/>
          </li>
          <li style={{ marginBottom: 10, marginTop: 10}}>
            <img src={userImg} height={40} width={40} className="img img-responsive" alt="side logo"/>
          </li>
          <li class="nav-item">General</li>
          <li class="nav-item">
            <a class="nav-link active" onClick={() => goTo('/dashboard')}>
              <i class="fas fa-home"></i>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-pencil-ruler"></i>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-chart-bar"></i>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-th-large"></i>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-user"></i>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-solid fa-bell"></i>
            </a>
          </li>
          <hr />
          <li class="nav-item">Site</li>
          <li class="nav-item">
            <a class="nav-link" onClick={() => goTo('/add-site')}>
              <i class="fas fa-plus"></i>
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" onClick={() => goTo('/sites')}>
              <i class="fas fa-solid fa-list"></i>
            </a>
          </li>
        </ul>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Sidebar);
