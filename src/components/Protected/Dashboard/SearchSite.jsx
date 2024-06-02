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
import StarOutlineIcon from "@mui/icons-material/StarOutline";
import { useNavigate } from "react-router-dom";
import { get } from "../../../api";
import { getSites, selectGlobalSite } from "../../../store/thunk/site";

function SearchSite({ getSites, sites, selectGlobalSite }) {
  const [allSites, setSites] = useState([]);
  const [error, setError] = useState("");
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
    getSites();
  }, []);
  let initialSite = sites?.slice(0, 5);
  const searchSite = async (e) => {
    const value = e?.target?.value;
    const url = `/api/site/site/all?q=${value}`;
    try {
      const response = await get(url);
      if (response.includes("Unable to Fetch the Site Search Results")) {
        setError("No Sites found. Please check the input");
        setSites([]);
      } else {
        setSites(response);
        initialSite = response?.slice(0, 5);
      }
    } catch (e) {
      setError("No Sites found. Please check the input");
    }
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
          style={{ textAlign: "center" }}
          className="form-control m-2"
          id="search"
          name="search"
          placeholder="Search for Site"
          onChange={searchSite}
        />
      </div>
      <div class="ms-auto p-2 bd-highlight">
        <button
          className="btn btn-sm btn-primary text-white w-100"
          onClick={() => goTo("/add-site")}
        >
          <i className="fas fa-plus"></i>&nbsp; Create New Site
        </button>
      </div>
      {/* {error && <p>{error}</p>} */}
      <List>
        {initialSite?.map((site) => (
          <ListItem key={site?.id} disablePadding>
            <ListItemButton
              onClick={() => {
                selectGlobalSite(site);
              }}
            >
              <ListItemIcon>
                <StarOutlineIcon />
              </ListItemIcon>
              <ListItemText primary={site?.siteName} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <List>
        {allSites?.length === 0 && (
          <p className="p-2">Search result not found!!</p>
        )}
        {allSites?.map((site) => (
          <ListItem key={site?.id} disablePadding>
            <ListItemButton
              onClick={() => {
                selectGlobalSite(site)
              }}
            >
              <ListItemText primary={site?.siteName} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider />
    </Box>
  );

  return (
    <div>
      {["right"].map((anchor) => (
        <React.Fragment key={anchor}>
          <Button
            style={{ backgroundColor: "#384bd3", color: "white" }}
            className="btn float-end m-4"
            onClick={toggleDrawer(anchor, true)}
          >
            Search Site
          </Button>
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
});
export default connect(mapStateToProps, { getSites, selectGlobalSite })(SearchSite);
