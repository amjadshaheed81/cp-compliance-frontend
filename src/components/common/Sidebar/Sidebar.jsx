import React, { useState, Fragment } from "react";
import { connect } from "react-redux";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton } from '@mui/material';
import GridViewIcon from '@mui/icons-material/GridView';
import FolderIcon from '@mui/icons-material/Folder';
import BuildIcon from '@mui/icons-material/Build';
import {
  faBars,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { faPenToSquare } from '@fortawesome/free-solid-svg-icons';
import logo from "./../../../images/logo-sign.png";
import userImg from "./../../../images/user-default.png";
import { useNavigate } from "react-router-dom";
import "./Sidebar.css";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleTrigger = () => setIsOpen(!isOpen);

  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  }

  return (
    <div className="App">
      <div className="page">
        <div className={`sidebar ${isOpen ? "sidebar--open" : ""}`}>
          <div className="trigger" onClick={handleTrigger}>
            <FontAwesomeIcon icon={isOpen ? faTimes : faBars} style={{ color: "white", width: "10px" }} />
          </div>
          <ul class="nav flex-column text-center">
            <li style={{ marginBottom: 10, marginTop: 20 }}>
              <img src={logo} height={30} width={30} className="img img-responsive" alt="side logo" />
            </li>
            <li style={{ marginBottom: 10, marginTop: 10 }}>
              <img src={userImg} height={40} width={40} className="img img-responsive" alt="side logo" />
            </li>
            <li class="nav-item">General</li>
            <li class="nav-item">
              <a class="nav-link active" onClick={() => goTo('/dashboard')}>
                <i class="fas fa-home"></i>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <IconButton aria-label="edit note">
                  <FontAwesomeIcon icon={faPenToSquare} style={{ color: "white" }} />
                </IconButton>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
              <GridViewIcon style={{ color: "white" }}/>
              </a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#">
                <i class="fas fa-chart-bar"></i>
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
            <li class="nav-item">
              <a class="nav-link" href="#">
              <FolderIcon style={{ color: "white" }}/>
              </a>
            </li>
            {/* <li class="nav-item">
              <a class="nav-link" href="#">
              <BuildIcon style={{ color: "white" }}/>
              </a>
            </li>  */}
          </ul>
          {/* <div className="sidebar-position">
            <FontAwesomeIcon icon={faUser} />
            <span>Home</span>
          </div>
          <div className="sidebar-position">
            <FontAwesomeIcon icon={faCogs} />
            <span>Menu item 2</span>
          </div>
          <div className="sidebar-position">
            <FontAwesomeIcon icon={faTable} />
            <span>Menu item 3</span>
          </div>

          <div className="sidebar-position">
            <FontAwesomeIcon icon={faList} />
            <span>Position 4</span>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default connect(null, {})(Sidebar);
