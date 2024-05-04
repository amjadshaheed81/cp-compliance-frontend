import "./Header.css";
import React, { useState, Fragment } from "react";
import GridViewIcon from '@mui/icons-material/GridView';
import { AppBar, Toolbar, IconButton, Menu, MenuItem } from '@mui/material';
import { AccountCircle, ArrowDropDown } from '@mui/icons-material';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import LogoutIcon from '@mui/icons-material/Logout';
import { connect } from "react-redux";

const Header = () => {
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };
  return (
    <AppBar position="static" style={{ backgroundColor: 'white', top: '0', left: '70px', zIndex: '-1' }}>
      <Toolbar>
        <div style={{ flexGrow: 1 }}></div>{/* Empty div to push user icon to right */}
        <div class="nav-icon">
        <div className='icon'>
          <GridViewIcon className="grid-icon" />
        </div>
        <div className='icon'>
          <NotificationsNoneIcon className="grid-icon" />
        </div>
        <div className='icon'>
          <LogoutIcon className="grid-icon" />
        </div>
        <div>
        <IconButton
          size="large"
          aria-label="account of current user"
          aria-controls="menu-appbar"
          aria-haspopup="true"
          onClick={handleMenu}
          color="inherit"
          style={{marginRight:'40px'}}
        >
          <AccountCircle style={{ color: 'grey' }} />
          <ArrowDropDown className="grid-icon" />
        </IconButton>
        <Menu
          id="menu-appbar"
          anchorEl={anchorEl}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          keepMounted
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
          open={Boolean(anchorEl)}
          onClose={handleClose}
        >
          <MenuItem onClick={handleClose}>Profile</MenuItem>
          <MenuItem onClick={handleClose}>My account</MenuItem>
          <MenuItem onClick={handleClose}>Logout</MenuItem>
        </Menu>
        </div>
        </div>
      </Toolbar>
    </AppBar>
  );
};

export default connect(null, {})(Header);
