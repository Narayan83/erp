import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
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
// Avatar removed (not used for Profile menu icon)
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import Typography from "@mui/material/Typography";
import Tooltip from "@mui/material/Tooltip";
import PersonAdd from "@mui/icons-material/PersonAdd";
import Settings from "@mui/icons-material/Settings";
import PowerSettingsNew from "@mui/icons-material/PowerSettingsNew";
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

  const context = useContext(myContext) || { isToggleSideBar: false, setIsToggleSideBar: () => {} };
  const navigate = useNavigate();

  const [profile, setProfile] = useState({ name: "Logged In user name", role: "user role", avatar: null });

  useEffect(() => {
    const load = () => {
      try {
        const stored = localStorage.getItem("userProfile");
        if (stored) {
          const parsed = JSON.parse(stored);
          setProfile({
            name: parsed.name || "Logged In user name",
            role: parsed.role || "user role",
            avatar: parsed.avatar || null,
          });
        }
      } catch (err) {
        // ignore
      }
    };

    load();
    const handler = () => load();
    window.addEventListener("userProfileUpdated", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("userProfileUpdated", handler);
      window.removeEventListener("storage", handler);
    };
  }, []);

  const handleProfile = () => {
    handleClose();
    navigate("/profile");
  };

  const handleSettings = () => {
    handleClose();
    navigate("/settings");
  };

  const handleLogout = () => {
    handleClose();
    if (context && typeof context.logout === "function") {
      context.logout();
    } else {
      // fallback: navigate to login
      navigate("/login");
    }
  };

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
                {context.isToggleSideBar === false ? <MdOutlineMenuOpen /> : <MdOutlineMenu />}
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

              <Button className="my-account d-flex align-items-center" onClick={handleClick}>
                <div className="user-image">
                  <span className="rounded-circle">
                    <img src={profile.avatar || images.userIcon} alt="" style={{ width: 36, height: 36, objectFit: 'cover', borderRadius: '50%' }} />
                  </span>
                </div>
                <div className="user-info">
                  <h4>{profile.name}</h4>
                  <p>{profile.role}</p>
                </div>
              </Button>

              <Menu
                anchorEl={anchorEl}
                id="account-menu"
                open={open}
                onClose={handleClose}
                slotProps={{
                  paper: {
                    elevation: 0,
                    className: "account-menu-paper",
                  },
                }}
                transformOrigin={{ horizontal: "right", vertical: "top" }}
                anchorOrigin={{ horizontal: "right", vertical: "bottom" }}
              >
                <MenuItem onClick={handleProfile}>
                  <ListItemIcon>
                    <PersonAdd fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem onClick={handleSettings}>
                  <ListItemIcon>
                    <Settings fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ListItemIcon>
                    <PowerSettingsNew fontSize="small" />
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
