import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import images from "../../../assets/images";
import Button from "@mui/material/Button";
import { MdOutlineMenuOpen } from "react-icons/md";
import { MdOutlineMenu } from "react-icons/md";
import AdminTopSearchBar from "../AdminTopSearchBar/AdminTopSearchBar";
import { CiLight } from "react-icons/ci";
import { CiDark } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";

// drop down menu

import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Settings from "@mui/icons-material/Settings";
import Logout from "@mui/icons-material/Logout";
import { myContext } from "../../../App";

function Header() {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const context = useContext(myContext);

  return (
    <>
      <header>
        <div className="container-fluid w-100 ">
          <div className="row d-flex align-items-center">
            {/* logo */}
            <div className="col-sm-2 logo-part">
              <Link to={"/"} className="d-flex align-items-center logo">
                {/* <img src={images.logo} alt="" /> */}
                <span className='ml-2'>ERP</span>
              </Link>
            </div>

            {/* Search Box */}
            <div className="col-sm-2 d-flex align-items-center menu-btn-part">
              <Button className="rounded-circle mr-3" onClick={()=>context.setIsToggleSideBar(!context.isToggleSideBar)}>
                {
                  context.isToggleSideBar === false ? <MdOutlineMenuOpen /> : <MdOutlineMenu />
                }
               
              </Button>
              <AdminTopSearchBar />
            </div>

            {/* right buttons */}
            <div className="col-sm-8 d-flex align-items-center justify-content-end gap-2  other-btn-part">
              <Button className="rounded-circle mr-3">
                              <CiLight />
              </Button>
              <Button className="rounded-circle mr-3">
                
                <IoIosNotificationsOutline />
              </Button>
              {/* <Button className='rounded-circle mr-3'> <MdOutlineMenuOpen /> </Button>
                     <Button className='rounded-circle mr-3'> <MdOutlineMenuOpen /> </Button>
                     <Button className='rounded-circle mr-3'> <MdOutlineMenuOpen /> </Button> */}

              <Button
                className="my-account d-flex align-items-center"
                onClick={handleClick}
              >
                <div className="user-image">
                  <span className="rounded-circle">
                    <img src={images.userIcon} alt="" />
                  </span>
                </div>
                <div className="user-info">
                  <h4>Logged In user name</h4>
                  <p>user role</p>
                </div>
              </Button>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                onClick={handleClose}
                slotProps={{
                  paper: {
                    elevation: 0,
                    sx: {
                      overflow: "visible",
                      filter: "drop-shadow(0px 2px 8px rgba(0,0,0,0.32))",
                      mt: 1.5,
                      "& .MuiAvatar-root": {
                        width: 32,
                        height: 32,
                        ml: -0.5,
                        mr: 1,
                      },
                      "&::before": {
                        content: '""',
                        display: "block",
                        position: "absolute",
                        top: 0,
                        right: 14,
                        width: 10,
                        height: 10,
                        bgcolor: "background.paper",
                        transform: "translateY(-50%) rotate(45deg)",
                        zIndex: 0,
                      },
                    },
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem onClick={handleClose}>
                  <Avatar /> Profile
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <Avatar /> My account
                </MenuItem>
                <Divider />
                <MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <PersonAdd fontSize="small" />
                  </ListItemIcon>
                  Add another account
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <MenuItem onClick={handleClose}>
                  <ListItemIcon>
                    <Logout fontSize="small" />
                  </ListItemIcon>
                  Logout
                </MenuItem>
              </Menu>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}

export default Header;
