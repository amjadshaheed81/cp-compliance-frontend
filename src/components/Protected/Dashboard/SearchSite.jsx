import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import Box from "@mui/material/Box";
import Drawer from "@mui/material/Drawer";
import Button from "@mui/material/Button";
import List from "@mui/material/List";
import Divider from "@mui/material/Divider";
import ListItem from "@mui/material/ListItem";
import ListItemButton from "@mui/material/ListItemButton";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import StarIcon from "@mui/icons-material/Star";
import StarBorderRoundedIcon from "@mui/icons-material/StarBorderRounded";
import { useNavigate } from "react-router-dom";
import { AccountCircle } from "@mui/icons-material";
import { get, put } from "../../../api";
import {
  getSites,
  selectGlobalSite,
  setLoader,
} from "../../../store/thunk/site";
import { ROLE } from "../../../Constant/Role";
import { toast } from "react-toastify";

function SearchSite({
  getSites,
  sites,
  selectGlobalSite,
  setLoader,
  siteSelectedForGlobal,
  loggedInUserData,
}) {
  const [allSites, setSites] = useState([]);
  const [allSites2, setSites2] = useState([]);
  const [error, setError] = useState("");
  const [favorites, setfavorites] = useState([]);
  const [state, setState] = React.useState({
    top: false,
    left: false,
    bottom: false,
    right: false,
  });
  const navigate = useNavigate();
  const goTo = (link) => {
    navigate(link);
  };

  useEffect(() => {
    getSites(loggedInUserData);
  }, []);

  const setfavorite = async (id) => {
    const userData = await get(`/api/user/${loggedInUserData?.id}/details`);
    let favorite = userData?.favorite ? userData?.favorite?.split(",") : [];
    favorite.push(id?.siteId);
    favorite = removeDuplicates(favorite);
    setfavorites(favorite);
    userData.userId = loggedInUserData?.id;
    userData.firstName = userData?.name?.split(" ")?.[0];
    userData.lastName = userData?.name?.split(" ")?.[1];
    userData.favorite = favorite.join(",");
    await put(`/api/user/manage`, userData);
    setSites([]);
    getSites(loggedInUserData);
  };

  const removefavorite = async (id) => {
    const userData = await get(`/api/user/${loggedInUserData?.id}/details`);
    let favorite = userData?.favorite ? userData?.favorite?.split(",") : [];

    const index = favorite.indexOf(String(id?.siteId));
    if (index > -1) {
      favorite.splice(index, 1);
    }
    favorite = removeDuplicates(favorite);
    setfavorites(favorite);
    userData.userId = loggedInUserData?.id;
    userData.firstName = userData?.name?.split(" ")?.[0];
    userData.lastName = userData?.name?.split(" ")?.[1];
    userData.favorite = favorite.join(",");
    await put(`/api/user/manage`, userData);
    setSites([]);
    getSites(loggedInUserData);
  };

  function removeDuplicates(arr) {
    return arr.filter((item, index) => arr.indexOf(item) === index);
  }

  useEffect(() => {
    setSites2(sites || []);
    getFav();
  }, [sites]);

  const getFav = async () => {
    const userData = await get(`/api/user/${loggedInUserData?.id}/details`);
    let favorite = userData?.favorite ? userData?.favorite?.split(",") : [];
    favorite = removeDuplicates(favorite);
    setfavorites(favorite);
  };

  let initialSite = sites?.slice(0, 2);
  const searchSite = async (e) => {
    const value = e?.target?.value;
    const list = sites?.filter(
      (x) =>
        (x?.status === "open" || x?.status === "Open") &&
        String(x?.siteName).toLowerCase().includes(String(value).toLowerCase())
    );
    setSites(list);
    // const url = `/api/site/site/all?q=${value}`;
    // setLoader(true);
    // try {
    //   const response = await get(url);
    //   if (response.includes("Unable to Fetch the Site Search Results")) {
    //     setError("No Sites found. Please check the input");
    //     setSites([]);
    //   } else {
    //     setSites(response);
    //   }
    // } catch (e) {
    //   setError("No Sites found. Please check the input");
    // }
    // setLoader(false);
  };
  const toggleDrawer = (anchor, open) => (event) => {
    if (
      event.type === "keydown" &&
      (event.key === "Tab" || event.key === "Shift")
    ) {
      return;
    }

    setState({ ...state, [anchor]: open });
  };

  const list = (anchor) => (
    <Box
      sx={{ width: anchor === "top" || anchor === "bottom" ? "auto" : 250 }}
      role="presentation"
      //   onClick={toggleDrawer(anchor, false)}
      //   onKeyDown={toggleDrawer(anchor, false)}
    >
      <h4 className="m-2">Sites</h4>
      <div style={{ position: "relative" }}>
        <i
          style={{
            position: "absolute",
            padding: "10px",
            color: "lightgrey",
            paddingLeft: "1.5rem",
          }}
          className="fas fa-search"
        ></i>
        <input
          type="text"
          autoComplete="off"
          readOnly
          onFocus={(e) => e.target.removeAttribute("readonly")}
          style={{ textAlign: "center" }}
          className="form-control m-2"
          id="search"
          name="search"
          placeholder="Search for Site"
          onChange={searchSite}
        />
      </div>
      <div className="ms-auto p-2 bd-highlight">
        <button
          className="btn btn-sm btn-primary text-white w-100"
          onClick={() => goTo("/add-site")}
        >
          <i className="fas fa-plus"></i>&nbsp; Create New Site
        </button>
      </div>
      {/* {error && <p>{error}</p>} */}
      <List>
        {Array.isArray(allSites2) && allSites2
          .filter((s) => favorites.includes(String(s?.siteId)))
          .map((site) => (
              <ListItem key={site?.id} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <StarIcon
                    color="primary"
                    onClick={() => removefavorite(site)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={site?.siteName}
                  onClick={() => {
                    selectGlobalSite(site);
                    try {
                      localStorage.setItem("site", JSON.stringify(site));
                    } catch (e) {
                      // Ignore storage errors (e.g., Safari private mode)
                      // eslint-disable-next-line no-console
                      console.error("Failed to persist selected site", e);
                    }
                    setState({ ...state, [anchor]: false });
                    goTo("/dashboard");
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
        {Array.isArray(allSites) && allSites
          .filter((s) => !favorites.includes(String(s?.siteId)))
          .map((site) => (
              <ListItem key={site?.id} disablePadding>
              <ListItemButton>
                <ListItemIcon>
                  <StarBorderRoundedIcon
                    color="primary"
                    onClick={() => setfavorite(site)}
                  />
                </ListItemIcon>
                <ListItemText
                  primary={site?.siteName}
                  onClick={() => {
                    selectGlobalSite(site);
                    try {
                      localStorage.setItem("site", JSON.stringify(site));
                    } catch (e) {
                      // Ignore storage errors (e.g., Safari private mode)
                      // eslint-disable-next-line no-console
                      console.error("Failed to persist selected site", e);
                    }
                    setState({ ...state, [anchor]: false });
                    goTo("/dashboard");
                  }}
                />
              </ListItemButton>
            </ListItem>
          ))}
      </List>
      {/* <List>
        {allSites?.map((site) => (
          <ListItem key={site?.id} disablePadding>
            <ListItemButton
              onClick={() => {
                selectGlobalSite(site);
              }}
            >
              <ListItemText primary={site?.siteName} />
            </ListItemButton>
          </ListItem>
        ))}
      </List> */}
      <Divider />
    </Box>
  );

  return (
    <div>
      {["right"].map((anchor) => (
        <React.Fragment key={anchor}>
          {siteSelectedForGlobal?.siteImageUrl ? (
            <span onClick={toggleDrawer(anchor, true)} className="cursor">
              <img
                src={siteSelectedForGlobal?.siteImageUrl}
                style={{
                  height: "35px",
                  width: "35px",
                  borderRadius: "50%",
                  aspectRatio: "auto",
                }}
                alt=""
              />
              <span style={{ fontWeight: "normal", marginLeft: "5px" }}>
                {siteSelectedForGlobal?.siteName}
              </span>
            </span>
          ) : (
            <span onClick={toggleDrawer(anchor, true)} className="cursor">
              <AccountCircle style={{ color: "grey" }} />
              <span>{siteSelectedForGlobal?.siteName}</span>
            </span>
          )}
          <Drawer
            anchor={anchor}
            open={state[anchor]}
            onClose={toggleDrawer(anchor, false)}
          >
            {list(anchor)}
          </Drawer>
        </React.Fragment>
      ))}
    </div>
  );
}
const mapStateToProps = (state) => ({
  success: state.site.success,
  error: state.site.error,
  sites: state.site.sites,
  filterSite: state.site.filterSite,
  siteSelectedForGlobal: state.site.siteSelectedForGlobal,
  loggedInUserData: state.site.loggedInUserData,
});
export default connect(mapStateToProps, {
  getSites,
  selectGlobalSite,
  setLoader,
})(SearchSite);
