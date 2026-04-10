import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import images from "../../../assets/images";
import { MdOutlineMenuOpen } from "react-icons/md";
import { MdOutlineMenu } from "react-icons/md";
import AdminTopSearchBar from "../AdminTopSearchBar/AdminTopSearchBar";
import { CiLight } from "react-icons/ci";
import { IoIosNotificationsOutline } from "react-icons/io";
import { FiUser, FiSettings, FiLogOut } from "react-icons/fi";
import { myContext } from "../../../App";
import "./Header.scss";

function Header() {
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const menuRef = useRef(null);

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleProfile = () => {
    setIsProfileMenuOpen(false);
    navigate("/profile");
  };

  const handleSettings = () => {
    setIsProfileMenuOpen(false);
    navigate("/settings");
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    if (context && typeof context.logout === "function") {
      context.logout();
    } else {
      navigate("/login");
    }
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          {/* Logo */}
          <Link to="/" className="logo-link">
            <span className="logo-text">ERP</span>
          </Link>

          {/* Menu Toggle (moved slightly to right) */}
          <button
            className="menu-toggle-btn"
            onClick={() => context.setIsToggleSideBar(!context.isToggleSideBar)}
            title="Hide Menu"
            aria-label="Toggle menu"
          >
            {context.isToggleSideBar ? <MdOutlineMenu /> : <MdOutlineMenuOpen />}
          </button>
        </div>

        {/* Centered Search */}
        <div className="header-center">
          <AdminTopSearchBar />
        </div>

        {/* Header Right - Actions */}
        <div className="header-right">
          <button className="header-icon-btn" aria-label="Toggle theme">
            <CiLight />
          </button>

          <button className="header-icon-btn" aria-label="Notifications">
            <IoIosNotificationsOutline />
          </button>

          {/* Profile Menu */}
          <div className="profile-menu-wrapper" ref={menuRef}>
            <button
              className="profile-btn"
              onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
              title="Profile Menu"
              aria-label="Profile menu"
            >
              <img
                src={profile.avatar || images.userIcon}
                alt="User avatar"
                className="profile-avatar"
              />
              <div className="profile-info">
                <h4 className="profile-name">{profile.name}</h4>
                <p className="profile-role">{profile.role}</p>
              </div>
            </button>

            {/* Dropdown Menu */}
            {isProfileMenuOpen && (
              <div className="profile-dropdown">
                <button className="dropdown-item" onClick={handleProfile}>
                  <FiUser className="dropdown-icon" />
                  <span>Profile</span>
                </button>
                <button className="dropdown-item" onClick={handleSettings}>
                  <FiSettings className="dropdown-icon" />
                  <span>Settings</span>
                </button>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item logout" onClick={handleLogout}>
                  <FiLogOut className="dropdown-icon" />
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
