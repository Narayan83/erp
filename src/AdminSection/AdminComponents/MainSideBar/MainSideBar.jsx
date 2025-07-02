import React, { useContext, useState } from "react";
import Button from "@mui/material/Button";
import { GrDashboard } from "react-icons/gr";
import { MdKeyboardArrowRight } from "react-icons/md";
import { MdKeyboardArrowDown } from "react-icons/md";
import { Link } from "react-router-dom";
import { menuItems } from "../../MenuData/MenuData";
import { myContext } from "../../../App";
const MainSideBar = () => {
  const [activeTab, setActiveTab] = useState(0);

  const isOpenSubmenu = (tabIndex) => {
    // Toggle submenu: close if already open
    setActiveTab((prev) => (prev === tabIndex ? null : tabIndex));
  };

   const context = useContext(myContext);
  
  return (
    <div className="sidebar">
      <ul>
        {/* <li>
          <Link to={"/"}>
            <Button className={`w-100 ${activeTab === 0 ? "active" : ""} `}>
              <span className="icon">
                <GrDashboard />
              </span>
              Dashboard
              <span className="arrow-right">
                <MdKeyboardArrowRight />
              </span>
            </Button>
          </Link>
        </li>

        <li>
          <Button
            className={`w-100 ${activeTab === 1 ? "active" : ""} `}
             onClick={() => isOpenSubmenu(1)}
           
          >
            <span className="icon">
              <GrDashboard />
            </span>
            Product
            <span className="arrow-right">
               {activeTab === 1 ? <MdKeyboardArrowDown /> : <MdKeyboardArrowRight />}
            </span>
          </Button>
          <div
            className={`sub-menu-wraper ${
              activeTab === 1 ? "colapse" : "colapsed"
            }`}
          >
            <ul className="submenu">
              <li>
                <Link to={"/"}>Add Product</Link>
              </li>
              <li>
                <Link to={"/"}>Manage Product</Link>
              </li>
              <li>
                <Link to={"/"}>Update Product</Link>
              </li>
              <li>
                <Link to={"/"}>Remove Product</Link>
              </li>
            </ul>
          </div>
        </li> */}

        {menuItems.map((item) => {
          const Icon = item.icon; 

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
                    className={`sub-menu-wraper ${
                      activeTab === item.id ? "colapse" : "colapsed"
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
