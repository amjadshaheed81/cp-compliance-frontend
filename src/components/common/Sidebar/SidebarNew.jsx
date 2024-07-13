import * as React from "react";
import { styled, useTheme } from "@mui/material/styles";
import { useNavigate } from "react-router-dom";
import Box from "@mui/material/Box";
import MuiDrawer from "@mui/material/Drawer";
import MuiAppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import List from "@mui/material/List";
import CssBaseline from "@mui/material/CssBaseline";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import unite from "./../../../images/unite.png";
import userImg from "./../../../images/user-default.png";
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
import BuildIcon from "@mui/icons-material/Build";
import BackupTableIcon from "@mui/icons-material/BackupTable";
import BeenhereIcon from "@mui/icons-material/Beenhere";
import ChecklistIcon from "@mui/icons-material/Checklist";
import SearchIcon from "@mui/icons-material/Search";
import EnergySavingsLeafIcon from "@mui/icons-material/EnergySavingsLeaf";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import FeaturedPlayListIcon from "@mui/icons-material/FeaturedPlayList";
import { connect } from "react-redux";
import { ROLE } from "../../../Constant/Role";
import { toast } from "react-toastify";
import { GeneralMenu, SiteMenu, filterMenuItems, filterSiteMenuItems } from "../../../Constant/Menu";
import { setSideBarView } from "../../../store/thunk/site";
import CloseIcon from "@mui/icons-material/Close";

const drawerWidth = 240;

const iconComponents = [
  <HomeIcon style={{ color: "white" }} />,
  <AccountCircleIcon style={{ color: "white" }} />,
  <GridViewIcon style={{ color: "white" }} />,
  <SignalCellularAltIcon style={{ color: "white" }} />,
  <PeopleAltIcon style={{ color: "white" }} />,
  <NotificationsIcon style={{ color: "white" }} />,
  <ElectricBoltIcon style={{ color: "white" }} />,
];
const siteIconComponents = [
  <AddIcon style={{ color: "white" }} />,
  <BusinessIcon style={{ color: "white" }} />,
  <FolderIcon style={{ color: "white" }} />,
  <BuildIcon style={{ color: "white" }} />,
  <BackupTableIcon style={{ color: "white" }} />,
  <BeenhereIcon style={{ color: "white" }} />,
  <ChecklistIcon style={{ color: "white" }} />,
  <SearchIcon style={{ color: "white" }} />,
  <EnergySavingsLeafIcon style={{ color: "white" }} />,
  <CalendarMonthIcon style={{ color: "white" }} />,
];
const adminIconComponents = [
  <AdminPanelSettingsIcon style={{ color: "white" }} />,
  <FeaturedPlayListIcon style={{ color: "white" }} />,
];

const openedMixin = (theme) => ({
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

const SidebarNew = ({ loggedInUserData, setSideBarView, isSideBarOpen }) => {
  const theme = useTheme();
  const navigate = useNavigate();
  const goTo = (text) => {
    switch (text) {
      case "Dashboard":
        navigate("/dashboard");
        break;
      case "Edit Profile":
        navigate("/dashboard");
        break;
      case "Portfolio":
        navigate("/sites");
        break;
      case "Reports":
        navigate("/sites");
        break;
      case "Users":
        navigate("/user-management");
        break;
      case "Notifications":
        navigate("/sites");
        break;
      case "Actions":
        navigate("/sites");
        break;
      case "Create Site":
        navigate("/add-site");
        break;
      case "Site Details":
        navigate("/sites");
        break;
      case "Site Documents":
        navigate("/documents");
        break;
      case "Site Assets":
        navigate("/assets");
        break;
      case "Site Contracts":
        navigate("/site-contracts");
        break;
      case "Pre-Action":
        navigate("/pre-actions");
        break;
      case "Site Checks":
        navigate("/site-checks");
        break;
      case "Energy Cost":
        navigate("/sites");
        break;
      case "Site Calendar":
        navigate("/site-calendar");
        break;
      case "Categories":
        navigate("/admin/categories");
        break;
      case "Dropdowns":
        navigate("/admin/dropdowns");
        break;
      default:
        navigate("/dashboard");
    }
  };
  const sideBarOpenClose = (status) => {
    setSideBarView(status);
  };

  const handleDrawerClose = () => {
    setSideBarView(false);
  };

  return (
    <Box sx={{ display: "flex", marginTop: "0px !important" }}>
      <CssBaseline />
      <Drawer
        sx={{ backgroundColor: "black !important" }}
        variant="permanent"
        open={isSideBarOpen}
        onMouseEnter={() => sideBarOpenClose(true)}
        onMouseLeave={() => sideBarOpenClose(false)}
        className="sidebar"
      >
        
        <List sx={{ backgroundColor: "black" }}>
          <li style={{ textAlign: "center" }}>
            <img
              src={unite}
              height={50}
              width={140}
              className="img img-responsive"
              alt="side logo"
            />
            <CloseIcon className="grid-icon" onClick={() => setSideBarView(false)}/>
          </li>
          <li className="m-0">
            <img
              src={userImg}
              height={40}
              width={40}
              className="img img-responsive"
              alt="side logo"
            />
            <span className="text-white p-2 fs-5">
              {loggedInUserData?.name}
            </span>
            <p className="text-white ps-5 fs-6">{loggedInUserData?.role}</p>
          </li>
          <p style={{ color: "grey" }}>Genral</p>
          {GeneralMenu?.map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: isSideBarOpen ? "initial" : "center",
                  px: 2.5,
                }}
                onClick={() => goTo(text)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSideBarOpen ? 3 : "auto",
                    justifyContent: "center",
                  }}
                  onClick={() => goTo(text)}
                >
                  {iconComponents[index]}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={{ opacity: isSideBarOpen ? 1 : 0, color: "white" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        {/* <Divider /> */}
        <p style={{ color: "grey" }} className="bg-black m-0">
          Site Actions
        </p>
        <List sx={{ backgroundColor: "black" }}>
          {SiteMenu?.map((text, index) => (
            <ListItem key={text} disablePadding sx={{ display: "block" }}>
              <ListItemButton
                sx={{
                  minHeight: 48,
                  justifyContent: isSideBarOpen ? "initial" : "center",
                  px: 2.5,
                }}
                onClick={() => goTo(text)}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 0,
                    mr: isSideBarOpen ? 3 : "auto",
                    justifyContent: "center",
                  }}
                  onClick={() => goTo(text)}
                >
                  {siteIconComponents[index]}
                </ListItemIcon>
                <ListItemText
                  primary={text}
                  sx={{ opacity: isSideBarOpen ? 1 : 0, color: "white" }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <>
          <p style={{ color: "grey" }} className="bg-black m-0">
            Admin
          </p>
          <List sx={{ backgroundColor: "black" }}>
            {["Categories", "Dropdowns"].map((text, index) => (
              <ListItem key={text} disablePadding sx={{ display: "block" }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: isSideBarOpen ? "initial" : "center",
                    px: 2.5,
                  }}
                  onClick={() => goTo(text)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: isSideBarOpen ? 3 : "auto",
                      justifyContent: "center",
                    }}
                    onClick={() => goTo(text)}
                  >
                    {adminIconComponents[index]}
                  </ListItemIcon>
                  <ListItemText
                    primary={text}
                    sx={{ opacity: isSideBarOpen ? 1 : 0, color: "white" }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </>
      </Drawer>
    </Box>
  );
};

const mapStateToProps = (state) => ({
  loggedInUserData: state.site.loggedInUserData,
  isSideBarOpen: state.site.isSideBarOpen,
});
export default connect(mapStateToProps, { setSideBarView })(SidebarNew);
