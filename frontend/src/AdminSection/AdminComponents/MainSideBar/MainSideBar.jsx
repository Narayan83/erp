// import React, { useContext, useState } from "react";
// import { MdKeyboardArrowRight } from "react-icons/md";
// import { MdKeyboardArrowDown } from "react-icons/md";
// import { Link, NavLink } from "react-router-dom";
// import { menuItems } from "../../MenuData/MenuData";
// import { myContext } from "../../../App";
// import "./MainSideBar.scss";
// const MainSideBar = () => {
//   const [activeTab, setActiveTab] = useState(0);

//   const isOpenSubmenu = (tabIndex) => {
//     // Toggle submenu: close if already open
//     setActiveTab((prev) => (prev === tabIndex ? null : tabIndex));
//   };

//   const context = useContext(myContext) || { isToggleSideBar: false, setIsToggleSideBar: () => {} };

//   return (
//     <nav className="sidebar">
//       <ul className="sidebar-menu">
//         {menuItems.map((item) => {
//           const Icon = item.icon || (() => null);

//           return (
//             <li key={item.id} className="menu-item">
//               {item.submenu ? (
//                 <>
//                   <button
//                     className={`menu-btn ${activeTab === item.id ? "active open" : ""}`}
//                     onClick={() => isOpenSubmenu(item.id)}
//                     aria-expanded={activeTab === item.id}
//                     aria-controls={`submenu-${item.id}`}
//                   >
//                     <span className="menu-icon">
//                       <span className="menu-icon-bg" aria-hidden>
//                         <Icon />
//                       </span>
//                     </span>
//                     <span className="menu-title">{item.title}</span>
//                     <span className="menu-arrow" aria-hidden>
//                       {activeTab === item.id ? (
//                         <MdKeyboardArrowDown />
//                       ) : (
//                         <MdKeyboardArrowRight />
//                       )}
//                     </span>
//                   </button>
//                   <div
//                     className={`submenu-wrapper ${
//                       activeTab === item.id ? "open" : "closed"
//                     }`}
//                   >
//                     <ul className="submenu">
//                       {item.submenu.map((sub, idx) => (
//                         <li key={idx} className="submenu-item">
//                           <NavLink
//                             to={sub.path}
//                             className={({ isActive }) =>
//                               "submenu-link" + (isActive ? " active" : "")
//                             }
//                           >
//                             {sub.title}
//                           </NavLink>
//                         </li>
//                       ))}
//                     </ul>
//                   </div>
//                 </>
//               ) : (
//                 <Link to={item.path} className="menu-link">
//                   <button
//                     className={`menu-btn ${activeTab === item.id ? "active" : ""}`}
//                     onClick={() => setActiveTab(item.id)}
//                     aria-current={activeTab === item.id ? 'page' : undefined}
//                   >
//                     <span className="menu-icon">
//                       <span className="menu-icon-bg" aria-hidden>
//                         <Icon />
//                       </span>
//                     </span>
//                     <span className="menu-title">{item.title}</span>
//                     <span className="menu-arrow" aria-hidden>
//                       <MdKeyboardArrowRight />
//                     </span>
//                   </button>
//                 </Link>
//               )}
//             </li>
//           );
//         })}
//       </ul>
//     </nav>
//   );
// };

// export default MainSideBar;









// menufromdb 


import React, { useContext, useState, useEffect } from "react";
import Button from "@mui/material/Button";
import { MdKeyboardArrowRight, MdKeyboardArrowDown } from "react-icons/md";
import { Link } from "react-router-dom";
import { myContext } from "../../../App";
import { useAuth } from "../../../context/AuthContext";
import { menuItems } from "../../MenuData/MenuData";

// Icons
import { GrDashboard } from "react-icons/gr";
import { GiRingmaster } from "react-icons/gi";
import { MdOutlinePhonelinkSetup } from "react-icons/md";
import { SiTemporal } from "react-icons/si";

// Basic icon mapping based on what was used in MenuData.js
// You can expand this map or implement dynamic lookup if needed.
const ICON_MAP = {
  "GrDashboard": GrDashboard,
  "GiRingmaster": GiRingmaster,
  "MdOutlinePhonelinkSetup": MdOutlinePhonelinkSetup,
  "SiTemporal": SiTemporal,
  // Default fallback
  "default": GiRingmaster
};

const MainSideBar = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [displayMenuItems, setDisplayMenuItems] = useState([]);
  const { menus } = useAuth();

  const isOpenSubmenu = (tabIndex) => {
    // Toggle submenu: close if already open
    setActiveTab((prev) => (prev === tabIndex ? null : tabIndex));
  };

  const context = useContext(myContext) || { isToggleSideBar: false, setIsToggleSideBar: () => { } };

  useEffect(() => {
    if (menus && menus.length > 0) {
      const transformed = menus.map(item => ({
        id: item.id,
        title: item.menu_name,
        path: item.url,
        icon: resolveIcon(item.icon),
        submenu: item.children && item.children.length > 0 ? item.children.map(child => ({
          title: child.menu_name,
          path: child.url,
        })) : null
      }));

      const withManageEmployees = transformed.map((item) => {
        const title = String(item.title || "").toLowerCase();
        const isHrOrEmployeeMenu =
          title.includes("hr") ||
          title.includes("employee");

        if (!isHrOrEmployeeMenu || !Array.isArray(item.submenu)) {
          return item;
        }

        const hasManageEmployees = item.submenu.some(
          (sub) => String(sub.path).toLowerCase() === "/manage-employees"
        );

        if (hasManageEmployees) {
          return item;
        }

        return {
          ...item,
          submenu: [{ title: "Manage Employees", path: "/manage-employees" }, ...item.submenu],
        };
      });
      setDisplayMenuItems(withManageEmployees);
    } else {
      // If no menus from backend, show nothing or just the dashboard if you want a safety net
      // For strict permissions as requested, we show empty list.
      setDisplayMenuItems([]);
    }
  }, [menus]);

  const resolveIcon = (iconName) => {
    if (!iconName) return ICON_MAP["default"];
    if (ICON_MAP[iconName]) return ICON_MAP[iconName];
    return ICON_MAP["default"];
  };

  return (
    <div className="sidebar">
      <ul>
        {displayMenuItems.map((item) => {
          const Icon = item.icon || (() => null);

          return (
            <li key={item.id}>
              {item.submenu ? (
                <>
                  <Button
                    className={`w-100 ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => isOpenSubmenu(item.id)}
                  >
                    <span className="icon">
                      <Icon />
                    </span>
                    {item.title}
                    <span className="arrow-right">
                      {activeTab === item.id ? (
                        <MdKeyboardArrowDown />
                      ) : (
                        <MdKeyboardArrowRight />
                      )}
                    </span>
                  </Button>
                  <div
                    className={`sub-menu-wraper ${activeTab === item.id ? "colapse" : "colapsed"
                      }`}
                  >
                    <ul className="submenu">
                      {item.submenu.map((sub, idx) => (
                        <li key={idx}>
                          <Link to={sub.path}>{sub.title}</Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : (
                <Link to={item.path}>
                  <Button
                    className={`w-100 ${activeTab === item.id ? "active" : ""}`}
                    onClick={() => setActiveTab(item.id)}
                  >
                    <span className="icon">
                      <Icon />
                    </span>
                    {item.title}
                    <span className="arrow-right">
                      <MdKeyboardArrowRight />
                    </span>
                  </Button>
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default MainSideBar;
