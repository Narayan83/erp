// menuData.js
import {
  FiHome,
  FiBox,
  FiUsers,
  FiUserCheck,
  FiBriefcase,
  FiSettings,
  FiTool,
  FiFileText,
} from "react-icons/fi";
export const menuItems = [
  {
    id: 0,
    title: "Dashboard",
    path: "/home",
    icon: FiHome,
  },
  // {
  //   id: 1,
  //   title: "Product",
  //   icon: SiTemporal,
  //   submenu: [
  //     { title: "Categories", path: "/" },
  //     { title: "Manage Categories", path: "/" },
  //     { title: "Add Product", path: "/product" },
  //     { title: "Manage Product", path: "/manage-product" },
  //     { title: "Login Page", path: "/login" },
  //     { title: "User/Customer/supplier", path: "/registration" },
  //     { title: "View User/Customer/supplier", path: "/registration_view" },
  //     { title: "Role Creation", path: "/rolecreation" },
  //     { title: "Roles View", path: "/rolesview" }
  //   ],
  // },
  {
    id: 2,
    title: "Product Masters",
    icon: FiBox,
    submenu: [{ title: "Product Management", path: "/ProductMaster" }],
  },

  {
    id: 3,
    title: "Users Masters",
    icon: FiUsers,
    submenu: [{ title: "Users Management", path: "/users" }],
  },

  {
    id: 8,
    title: "Employee Masters",
    icon: FiUserCheck,
    submenu: [
      { title: "Employee Management", path: "/employeemanagement" },
      { title: "Deparments", path: "/departmentmaster" },
      { title: "Designations", path: "/designation" },
      { title: "Organization Units", path: "/orgunits" },
      { title: "Employee Hierarchy", path: "/empHierarchy" },
    ],
  },

  {
    id: 6,
    title: "CRM Masters",
    icon: FiBriefcase,
    submenu: [
      { title: "CRM", path: "/crm-master" },
      { title: "Account", path: "/account" },
      { title: "Manage QTN", path: "/quotation-list" },
    ],
  },

  {
    id: 7,
    title: "Admin",
    icon: FiSettings,
    submenu: [
      { title: "Role Creation", path: "/rolecreation" },
      // "Role Management" here links to the list of existing roles
      { title: "Role Management", path: "/existingroles" },
      // "Role Mapping" is the role->menu mapping UI
      { title: "Role Mapping", path: "/rolemanagement" },
      { title: "Menu Creation", path: "/menucreation" },
      // Menu Management route (list of menus)
      { title: "Menu Management", path: "/existingmenus" },
      // User Mapping route (user to role mapping)
      { title: "User Mapping", path: "/usermanagement" },
      { title: "Audit Logs", path: "/auditlogs" },
    ],
  },

  {
    id: 4,
    title: "Setup",
    icon: FiTool,
    submenu: [],
  },

  {
    id: 5,
    title: "Reports",
    icon: FiFileText,
    submenu: [{ title: "reports", path: "/erpreport" }],
  },
];
