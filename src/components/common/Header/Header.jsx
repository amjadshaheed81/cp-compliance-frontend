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
import { useLocation, useNavigate } from "react-router-dom";
import PageHeaderTrail from "./PageHeaderTrail";
import { mergePageHeaderContext } from "../../../utils/pageHeaderContext";
import SearchSite from "../../Protected/Dashboard/SearchSite";
import { Popover, List, ListItem, ListItemText } from "@mui/material";
import { get } from "../../../api";
import { isPlatformUser } from "../../../utils/sessionContext";
import { getPlatformDisplayClient, getPlatformWorkspace, WORKSPACE_CHANGED_EVENT } from "../../../utils/platformWorkspace";
const Header = ({
  siteSelectedForGlobal,
  isLoading,
  logoutUser,
  setSideBarView,
  isSideBarOpen,
  loggedInUserData,
  getSiteAssets,
  pageContext,
  platformClient,
  workspaceAvailable,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const [notification, setNotification] = useState([]);
  const navigate = useNavigate();
  const location = useLocation();
  const currentPageContext = mergePageHeaderContext(location.pathname, pageContext);
  const [displayClient, setDisplayClient] = useState(getPlatformDisplayClient);
  const platform = isPlatformUser(loggedInUserData);
  const headerClient = platformClient === undefined ? displayClient : platformClient;
  const canUseSite = !platform || (workspaceAvailable ?? Boolean(getPlatformWorkspace()));

  useEffect(() => {
    const refresh = () => setDisplayClient(getPlatformDisplayClient());
    window.addEventListener(WORKSPACE_CHANGED_EVENT, refresh);
    return () => window.removeEventListener(WORKSPACE_CHANGED_EVENT, refresh);
  }, []);

  useEffect(() => {

    if(canUseSite && siteSelectedForGlobal?.siteId) {
      getSiteAssets(siteSelectedForGlobal?.siteId);
      getNotifications();
    } else {
      setNotification([]);
    }
  }, [siteSelectedForGlobal, canUseSite]);

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
      <Toolbar className="app-header-toolbar">
        {platform && (
          <div className="app-header-client app-header-client--left dont-print" title={headerClient?.companyName || "No client selected"}>
            {headerClient?.companyName || "No client selected"}
          </div>
        )}
        <PageHeaderTrail context={currentPageContext} onNavigate={navigate} />
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
          {canUseSite && <div className="text-dark mt-2">
            <span>
              <SearchSite />
            </span>
          </div>}
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
