import React, { Fragment } from "react";
import { connect } from "react-redux";
import "./Dashboard.css";
import Header from "../../Header/Header";

const Dashboard = () => {
  return (
    <Fragment>
      {/* <!-- Sidebar --> */}
      <div class="sidebar">
        <ul class="nav flex-column">
          <li class="nav-item">
            <a class="nav-link active" href="#">
              <i class="fas fa-tachometer-alt"></i> Dashboard
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-users"></i> Users
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-chart-bar"></i> Analytics
            </a>
          </li>
          <li class="nav-item">
            <a class="nav-link" href="#">
              <i class="fas fa-cog"></i> Settings
            </a>
          </li>
        </ul>
      </div>
      {/* 
  <!-- Page Content --> */}
      <div class="content">
        <Header />

        <div class="container">
          <h2>Content Area</h2>
          <p>Welcome to the admin dashboard. This is the main content area.</p>
        </div>
      </div>
    </Fragment>
  );
};

export default connect(null, {})(Dashboard);
