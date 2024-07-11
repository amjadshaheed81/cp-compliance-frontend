import "./Header.css";
import React, { useState } from "react";
import GridViewIcon from "@mui/icons-material/GridView";
import { AppBar, Toolbar } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import { connect } from "react-redux";
import BackDrop from "../Loader/BackDrop";
import { logoutUser } from "../../../store/thunk/site";
import { useNavigate } from "react-router-dom";
import SearchSite from "../../Protected/Dashboard/SearchSite";

const Header = ({ siteSelectedForGlobal, isLoading, logoutUser }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };
  const logout = () => {
    logoutUser(goTo);
  };
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <AppBar
      position="static"
      style={{
        backgroundColor: "white",
        top: "0",
        left: "70px",
        zIndex: "-1",
        marginTop: "0px !important",
      }}
    >
      <BackDrop isLoading={isLoading} />
      <Toolbar>
        <div style={{ flexGrow: 1 }}></div>
        {/* Empty div to push user icon to right */}
        <div className="nav-icon">
          <div className="icon dont-print">
            <GridViewIcon className="grid-icon" />
          </div>
          <div className="icon dont-print">
            <NotificationsNoneIcon className="grid-icon" />
          </div>
          <div className="icon cursor dont-print" onClick={() => logout()}>
            <LogoutIcon className="grid-icon" />
          </div>
          <div className="text-dark mt-2">
            <span>
              <SearchSite />
            </span>
          </div>
        </div>
      </Toolbar>
    </AppBar>
  );
};
const mapStateToProps = (state) => ({
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  isLoading: state.site.isLoading,
});
export default connect(mapStateToProps, { logoutUser })(Header);
