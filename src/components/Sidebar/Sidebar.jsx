import React, { Fragment } from "react";
import { connect } from "react-redux";
import logo from "./../../images/logo-sign.png";
import "./Sidebar.css";
const Sidebar = () => {
  return (
    <Fragment>
      {/* <!-- Sidebar --> */}
      <div class="sidebar">
        <ul class="nav flex-column text-center">
          <li style={{ marginBottom: 20, marginTop: 20}}>
            <img src={logo} height={30} width={30} className="img img-responsive" alt="side logo"/>
          </li>
          <li class="nav-item">General</li>
          <li class="nav-item">
            <a class="nav-link active" href="/dashboard">
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
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-cog"></i>
            </a>
          </li>
          <hr />
          <li class="nav-item">Site</li>
          <li class="nav-item">
            <a class="nav-link" href="/add-site">
              <i class="fas fa-plus"></i>
            </a>
          </li>
        </ul>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Sidebar);
