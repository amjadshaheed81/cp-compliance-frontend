import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { NavLink } from "react-router-dom";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import { useActiveBrand } from "../../../branding";
import HomeIcon from "@mui/icons-material/Home";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GridViewIcon from "@mui/icons-material/GridView";
import SignalCellularAltIcon from "@mui/icons-material/SignalCellularAlt";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import NotificationsIcon from "@mui/icons-material/Notifications";
import ElectricBoltIcon from "@mui/icons-material/ElectricBolt";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import FolderIcon from "@mui/icons-material/Folder";
import FolderSharedIcon from "@mui/icons-material/FolderShared";

import BuildIcon from "@mui/icons-material/Build";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import BeenhereIcon from "@mui/icons-material/Beenhere";
import ChecklistIcon from "@mui/icons-material/Checklist";
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FeaturedPlayListIcon from "@mui/icons-material/FeaturedPlayList";
import DescriptionIcon from '@mui/icons-material/Description';
import { connect } from "react-redux";
import { ROLE } from "../../../Constant/Role";
import { filterMenuItems, filterSiteMenuItems } from "../../../Constant/Menu";
import { setSideBarView, updateSite } from "../../../store/thunk/site";
import CloseIcon from "@mui/icons-material/Close";
import BuildNumber from "../BuildNumber/BuildNumber";
import { isPlatformUser } from "../../../utils/sessionContext";
import { changePlatformCustomer, getPlatformWorkspace, platformWorkspacePathNeedsSite } from "../../../utils/platformWorkspace";
import { combinedMenu } from "../../../Constant/Menu";

const drawerWidth = 220;

const iconComponents = [
  <HomeIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <AccountCircleIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <GridViewIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <SignalCellularAltIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <PeopleAltIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <NotificationsIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <ElectricBoltIcon style={{ color: "var(--brand-sidebar-text)" }} />,
];
const siteIconComponents = [
  <AddIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <BusinessIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <FolderIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <DescriptionIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <BuildIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <BackupTableIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <BeenhereIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <ChecklistIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  // <SearchIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <EnergySavingsLeafIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <CalendarMonthIcon style={{ color: "var(--brand-sidebar-text)" }} />,
];
const adminIconComponents = [
  <AdminPanelSettingsIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <FeaturedPlayListIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <AccountBalanceIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  <FolderSharedIcon style={{ color: "var(--brand-sidebar-text)" }} />,
  
];


const superAdminIconComponents = [
  <AssignmentIndIcon style={{ color: "var(--brand-sidebar-text)" }} />,
];

const openedMixin = (theme) => ({
  width: drawerWidth,
  marginTop: "0px !important",
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: "hidden",
});

const closedMixin = (theme) => ({
  transition: theme.transitions.create("width", {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: "hidden",
  width: `calc(${theme.spacing(1)} + 1px)`,
  [theme.breakpoints.up("sm")]: {
    width: `calc(${theme.spacing(6)} + 1px)`,
  },
});

const DrawerHeader = styled("div")(({ theme }) => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  padding: theme.spacing(0, 1),
  // necessary for content to be below app bar
  ...theme.mixins.toolbar,
}));

const AppBar = styled(MuiAppBar, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(["width", "margin"], {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  ...(open && {
    marginLeft: drawerWidth,
    width: `calc(100% - ${drawerWidth}px)`,
    transition: theme.transitions.create(["width", "margin"], {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
  }),
}));

const Drawer = styled(MuiDrawer, {
  shouldForwardProp: (prop) => prop !== "open",
})(({ theme, open }) => ({
  width: drawerWidth,
  flexShrink: 0,
  whiteSpace: "nowrap",
  boxSizing: "border-box",
  ...(open && {
    ...openedMixin(theme),
    "& .MuiDrawer-paper": openedMixin(theme),
  }),
  ...(!open && {
    ...closedMixin(theme),
    "& .MuiDrawer-paper": closedMixin(theme),
  }),
}));

const menuRoutes = {
  Dashboard: "/dashboard",
  Portfolio: "/sites",
  Users: "/user-management",
  Notifications: "/notifications",
  Actions: "/actions",
  "Create Site": "/add-site",
  "Site Documents": "/documents",
  "Statutory Register": "/statutory-register",
  "Site Assets": "/assets",
  "Site Contracts": "/site-contracts",
  "Pre-Action": "/pre-actions",
  "Site Checks": "/site-checks",
  "Energy Cost": "/energy-cost",
  "Site Calendar": "/site-calendar",
  Categories: "/admin/categories",
  Dropdowns: "/admin/dropdowns",
  Company: "/admin/company",
  Folders: "/admin/folders",
  "Edit Profile": "/edit-profile",
  Reports: "/reports",
  "Onboard Client": "/onboard-client",
  "Client List": "/platform",
};

const getMenuRoute = (text, siteId) => {
  if (text === "Site Details") {
    return `/update-site?siteId=${siteId ?? ""}&isViewMode=edit`;
  }

  return menuRoutes[text] || "/dashboard";
};

const SidebarNew = ({ updateSite, loggedInUserData, setSideBarView, isSideBarOpen, siteSelectedForGlobal, workspaceAvailable }) => {
  const theme = useTheme();
  const brand = useActiveBrand();
  const platform = isPlatformUser(loggedInUserData);
  const workspace = getPlatformWorkspace();
  const hasWorkspace = !platform || (workspaceAvailable ?? Boolean(workspace));
  // Platform site identity comes only from the verified selected workspace.
  const currentSite = platform ? (hasWorkspace ? workspace?.selectedSite : null) : siteSelectedForGlobal;
  const role = platform ? ROLE.ADMIN : loggedInUserData?.role;
  // Platform administrators manage every module for the selected client.
  // Until its first site exists, keep client administration and Create Site available.
  const platformMenu = platform && hasWorkspace ? combinedMenu.filter((item) =>
    workspace?.selectedSite || !platformWorkspacePathNeedsSite(getMenuRoute(item.label).split("?")[0])
  ) : [];
  const generalMenu = !hasWorkspace ? [] : platform
    ? platformMenu.filter((item) => item.type === "General").map((item) => item.label)
    : filterMenuItems(role);
  const siteMenu = !hasWorkspace ? [] : platform
    ? platformMenu.filter((item) => item.type === "Site").map((item) => item.label)
    : filterSiteMenuItems(role);

  const handleMenuClick = (text) => {
    if (text === "Client List") {
      changePlatformCustomer();
      return;
    }
    if (text === "Site Details" && currentSite) {
      updateSite({ ...currentSite });
    }
  };
  const sideBarOpenClose = (status) => {
    setSideBarView(status);
  };

  const handleDrawerClose = () => {
    setSideBarView(false);
  };

  return (
    <Box className="cafm-navigation-shell" data-navigation-open={isSideBarOpen ? "true" : "false"} sx={{ display: "flex", marginTop: "0px !important" }}>
      <CssBaseline />
      <Drawer
        sx={{ backgroundColor: "var(--brand-sidebar-background)" }}
        variant="permanent"
        open={isSideBarOpen}
        onMouseEnter={() => sideBarOpenClose(true)}
        onMouseLeave={() => sideBarOpenClose(false)}
        className="sidebar cafm-sidebar"
      >
        <List sx={{ backgroundColor: "var(--brand-sidebar-background)" }}>
          <li className="cafm-sidebar-brand" title={brand.name}>
            <img
              src={isSideBarOpen ? brand.sidebarLogo : brand.icon}
              height={50}
              width={isSideBarOpen ? 170 : 34}
              className="img img-responsive"
              alt={`${brand.name} logo`}
            />
            {isSideBarOpen && <button type="button" aria-label="Collapse navigation" onClick={() => setSideBarView(false)}>
              <CloseIcon />
            </button>}
          </li>
          {isSideBarOpen && (
            <BuildNumber
              label="Build No"
              sx={{
                color: "var(--brand-sidebar-text)",
                backgroundColor: "var(--brand-sidebar-background)",
                padding: "0 0.5rem 0.6rem",
                marginTop: "-0.15rem",
              }}
            />
          )}
          {platform && (
            <ListItem disablePadding sx={{ display: "block" }}>
              <ListItemButton component={NavLink} to="/platform" onClick={() => handleMenuClick("Client List")}
                sx={{ minHeight: 48, justifyContent: isSideBarOpen ? "initial" : "center", px: 2.5,
                  "&.active": { backgroundColor: "rgba(255, 255, 255, 0.16)" } }}>
                <ListItemIcon sx={{ minWidth: 0, mr: isSideBarOpen ? 3 : "auto", justifyContent: "center" }}>
                  <BusinessIcon style={{ color: "var(--brand-sidebar-text)" }} />
                </ListItemIcon>
                <ListItemText primary="Client List" sx={{ opacity: isSideBarOpen ? 1 : 0, color: "var(--brand-sidebar-text)" }} />
              </ListItemButton>
            </ListItem>
          )}
          {generalMenu.length > 0 && <p style={{ color: "var(--brand-sidebar-text)", fontSize: 'smaller' }}>General</p>}
          {generalMenu?.map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                component={NavLink}
                to={getMenuRoute(text, currentSite?.siteId)}
                onClick={() => handleMenuClick(text)}
                sx={{
                  minHeight: 48,
                  justifyContent: isSideBarOpen ? "initial" : "center",
                  px: 2.5,
                  "&.active": {
                    backgroundColor: "rgba(255, 255, 255, 0.16)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSideBarOpen ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  {iconComponents[combinedMenu.filter((item) => item.type === "General").findIndex((item) => item.label === text)]}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={{ opacity: isSideBarOpen ? 1 : 0, color: "var(--brand-sidebar-text)" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {/* <Divider /> */}
        {siteMenu.length > 0 && <p style={{ color: "var(--brand-sidebar-text)", fontSize: "smaller" }} className="cafm-sidebar-section m-0">
          Site {isSideBarOpen ? "Actions": ""}
        </p>}
        <List sx={{ backgroundColor: "var(--brand-sidebar-background)" }}>
          {siteMenu?.map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                component={NavLink}
                to={getMenuRoute(text, currentSite?.siteId)}
                onClick={() => handleMenuClick(text)}
                sx={{
                  minHeight: 48,
                  justifyContent: isSideBarOpen ? "initial" : "center",
                  px: 2.5,
                  "&.active": {
                    backgroundColor: "rgba(255, 255, 255, 0.16)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSideBarOpen ? 3 : "auto",
                    justifyContent: "center",
                  }}
                >
                  {siteIconComponents[combinedMenu.filter((item) => item.type === "Site").findIndex((item) => item.label === text)]}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={{ opacity: isSideBarOpen ? 1 : 0, color: "var(--brand-sidebar-text)" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {hasWorkspace && role === ROLE.ADMIN && (
          <>
            <p style={{ color: "var(--brand-sidebar-text)", fontSize: "smaller" }} className="cafm-sidebar-section m-0">
              Admin
            </p>
            <List sx={{ backgroundColor: "var(--brand-sidebar-background)" }}>
              {["Categories", "Dropdowns", "Company", "Folders"].map((text, index) => (
                <ListItem key={text} disablePadding sx={{ display: "block" }}>
                  <ListItemButton
                    component={NavLink}
                    to={getMenuRoute(text, currentSite?.siteId)}
                    onClick={() => handleMenuClick(text)}
                    sx={{
                      minHeight: 48,
                      justifyContent: isSideBarOpen ? "initial" : "center",
                      px: 2.5,
                      "&.active": {
                        backgroundColor: "rgba(255, 255, 255, 0.16)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: isSideBarOpen ? 3 : "auto",
                        justifyContent: "center",
                      }}
                    >
                      {adminIconComponents[index]}
                    </ListItemIcon>
                    <ListItemText
                      primary={text}
                      sx={{ opacity: isSideBarOpen ? 1 : 0, color: "var(--brand-sidebar-text)" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}

        {(platform || loggedInUserData?.superAdmin === true) && (
          <>
            <p style={{ color: "var(--brand-sidebar-text)", fontSize: "smaller" }} className="cafm-sidebar-section m-0">
              Super Admin
            </p>
            <List sx={{ backgroundColor: "var(--brand-sidebar-background)" }}>
              {["Onboard Client"].map((text, index) => (
                <ListItem key={text} disablePadding sx={{ display: "block" }}>
                  <ListItemButton
                    component={NavLink}
                    to={getMenuRoute(text, currentSite?.siteId)}
                    onClick={() => handleMenuClick(text)}
                    sx={{
                      minHeight: 48,
                      justifyContent: isSideBarOpen ? "initial" : "center",
                      px: 2.5,
                      "&.active": {
                        backgroundColor: "rgba(255, 255, 255, 0.16)",
                      },
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        minWidth: 0,
                        mr: isSideBarOpen ? 3 : "auto",
                        justifyContent: "center",
                      }}
                    >
                      {superAdminIconComponents[index]}
                    </ListItemIcon>
                    <ListItemText
                      primary={text}
                      sx={{ opacity: isSideBarOpen ? 1 : 0, color: "var(--brand-sidebar-text)" }}
                    />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </>
        )}
        {isSideBarOpen && (
          <div className="cafm-sidebar-user" aria-label="Signed in user">
            <strong>{loggedInUserData?.name || "User"}</strong>
            <span>{platform ? "Platform Admin" : loggedInUserData?.role || ""}</span>
          </div>
        )}
      </Drawer>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
  isSideBarOpen: state.site.isSideBarOpen,
});
export default connect(mapStateToProps, { updateSite, setSideBarView })(SidebarNew);
