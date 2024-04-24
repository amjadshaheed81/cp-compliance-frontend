import "./Header.css";
import React, { Fragment } from "react";
import { connect } from "react-redux";

const Header = () => {
  return (
    <Fragment>
      <nav class="navbar navbar-expand-lg border">
        <div class="container-fluid">
          <button
            class="navbar-toggler"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#navbarColor01"
            aria-controls="navbarColor01"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse" id="navbarColor01">
            <ul class="navbar-nav me-auto">&nbsp;</ul>
            <ul className="nav flex-row d-flex header-nav">
              <li class="nav-item">
                <a class="nav-link active" href="#">
                  <i class="fas fa-th-large"></i>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" href="#">
                  <i class="fas fa fa-bell" aria-hidden="true"></i>
                </a>
              </li>
              <li class="nav-item">
                <a class="nav-link active" href="#">
                  <i class="fas fa-sign-out-alt"></i>
                </a>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    </Fragment>
  );
};

export default connect(null, {})(Header);
