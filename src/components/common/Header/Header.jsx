import "./Header.css";
import React, { useEffect, useState } from "react";
import GridViewIcon from "@mui/icons-material/GridView";
import CloseIcon from "@mui/icons-material/Close";
import { AppBar, Toolbar } from "@mui/material";
import NotificationsNoneIcon from "@mui/icons-material/NotificationsNone";
import LogoutIcon from "@mui/icons-material/Logout";
import { connect } from "react-redux";
import BackDrop from "../Loader/BackDrop";
import { logoutUser, setSideBarView, getSiteAssets} from "../../../store/thunk/site";
import { useNavigate } from "react-router-dom";
import SearchSite from "../../Protected/Dashboard/SearchSite";
import { Popover, List, ListItem, ListItemText } from "@mui/material";
import { get } from "../../../api";
const Header = ({
  siteSelectedForGlobal,
  isLoading,
  logoutUser,
  setSideBarView,
  isSideBarOpen,
  loggedInUserData,
  getSiteAssets
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notification, setNotification] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {

    getNotifications();
    if(siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
    }
    
  }, [siteSelectedForGlobal]);

  const getNotifications = async () => {
    if (loggedInUserData?.id) {
      const actions = await get(
        `/api/user/notification/${loggedInUserData?.id}/site/${siteSelectedForGlobal?.siteId}`
      );
      setNotification(actions?.length > 10 ? actions?.slice(0, 10) : actions);
    }
  };
  const handlePopoverOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handlePopoverClose = () => {
    setAnchorEl(null);
  };
  const open = Boolean(anchorEl);
  const goTo = (link) => {
    navigate(link);
  };
  const logout = () => {
    logoutUser(goTo);
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
          {isSideBarOpen && (
            <div
              className="icon dont-print cursor"
              onClick={() => setSideBarView(false)}
            >
              <CloseIcon className="grid-icon" />
            </div>
          )}
          {!isSideBarOpen && (
            <div
              className="icon dont-print cursor"
              onClick={() => setSideBarView(true)}
            >
              <GridViewIcon className="grid-icon" />
            </div>
          )}

          <div
            className="icon dont-print cursor"
            onMouseEnter={handlePopoverOpen}
            onMouseLeave={handlePopoverClose}
            onClick={() => {
              navigate("/notifications");
            }}
          >
            <NotificationsNoneIcon className="grid-icon" />
          </div>
          <Popover
            id="mouse-over-popover"
            sx={{
              pointerEvents: "none",
            }}
            open={open}
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: "bottom",
              horizontal: "right",
            }}
            transformOrigin={{
              vertical: "top",
              horizontal: "right",
            }}
            onClose={handlePopoverClose}
            disableRestoreFocus
          >
            <List>
              {notification?.length === 0 && (
                <ListItem>
                  <ListItemText primary="No Notification Found!!" />
                </ListItem>
              )}
              {notification?.map((i) => (
                <ListItem>
                  <ListItemText primary={`${i.title} : ${i.body}`} />
                </ListItem>
              ))}
            </List>
          </Popover>
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
  isSideBarOpen: state.site.isSideBarOpen,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, { logoutUser, setSideBarView, getSiteAssets })(Header);
