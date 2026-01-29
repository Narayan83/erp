import React, { useContext, useState } from "react";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Link, NavLink } from "react-router-dom";
import { menuItems } from "../../MenuData/MenuData";
import { myContext } from "../../../App";
import "./MainSideBar.scss";
const MainSideBar = () => {
  const [activeTab, setActiveTab] = useState(0);

  const isOpenSubmenu = (tabIndex) => {
    // Toggle submenu: close if already open
    setActiveTab((prev) => (prev === tabIndex ? null : tabIndex));
  };

  const context = useContext(myContext) || { isToggleSideBar: false, setIsToggleSideBar: () => {} };

  return (
    <nav className="sidebar">
      <ul className="sidebar-menu">
        {menuItems.map((item) => {
          const Icon = item.icon || (() => null);

          return (
            <li key={item.id} className="menu-item">
              {item.submenu ? (
                <>
                  <button
                    className={`menu-btn ${activeTab === item.id ? "active open" : ""}`}
                    onClick={() => isOpenSubmenu(item.id)}
                    aria-expanded={activeTab === item.id}
                    aria-controls={`submenu-${item.id}`}
                  >
                    <span className="menu-icon">
                      <span className="menu-icon-bg" aria-hidden>
                        <Icon />
                      </span>
                    </span>
                    <span className="menu-title">{item.title}</span>
                    <span className="menu-arrow" aria-hidden>
                      {activeTab === item.id ? (
                        <MdKeyboardArrowDown />
                      ) : (
                        <MdKeyboardArrowRight />
                      )}
                    </span>
                  </button>
                  <div
                    className={`submenu-wrapper ${
                      activeTab === item.id ? "open" : "closed"
                    }`}
                  >
                    <ul className="submenu">
                      {item.submenu.map((sub, idx) => (
                        <li key={idx} className="submenu-item">
                          <NavLink
                            to={sub.path}
                            className={({ isActive }) =>
                              "submenu-link" + (isActive ? " active" : "")
                            }
                          >
                            {sub.title}
                          </NavLink>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <Link to={item.path} className="menu-link">
                  <button
                    className={`menu-btn ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                    aria-current={activeTab === item.id ? 'page' : undefined}
                  >
                    <span className="menu-icon">
                      <span className="menu-icon-bg" aria-hidden>
                        <Icon />
                      </span>
                    </span>
                    <span className="menu-title">{item.title}</span>
                    <span className="menu-arrow" aria-hidden>
                      <MdKeyboardArrowRight />
                    </span>
                  </button>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default MainSideBar;
