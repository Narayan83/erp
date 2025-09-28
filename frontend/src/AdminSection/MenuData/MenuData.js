// menuData.js
import { GrDashboard } from "react-icons/gr";
import { GiRingmaster } from "react-icons/gi";
import { MdOutlinePhonelinkSetup } from "react-icons/md";
import { SiTemporal } from "react-icons/si";
export const menuItems = [
  {
    id: 0,
    title: "Dashboard",
    path: "/home",
    icon: GrDashboard,
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
    icon: GiRingmaster,
    submenu: [
      // { title: "User/Roles  Master", path: "/registration" },
      // { title: "View User/Customer/supplier", path: "/registration_view" },
      // { title: "Role Creation", path: "/rolecreation" },
      // { title: "Roles View", path: "/rolesview" } ,
      // { title: "Product Master", path: "/product" },
      // { title: "Product Attributes", path: "/pattributes" },
      // { title: "Manage Product", path: "/manage-product" },
      // { title: "Salesman Master", path: "/" },
      // { title: "Tax Master", path: "/" },

      { title: "Category Management", path: "/ManageCategory" },
      { title: "Subcategory Management", path: "/ManageSubcategory" },
      { title: "Product Management", path: "/ManageProduct" },
      { title: "Product Master", path: "/ProductMaster" },
      { title: "Tag Management", path: "/ManageTag" },
      { title: "Store / Unit / Tax / HSN / Size", path: "/ManageUnitStoreTax" },
    ],
  },

  {
    id: 3,
    title: "Users Masters",
    icon: GiRingmaster,
    submenu: [{ title: "Users Management", path: "/users" }],
  },

  {
    id: 6,
    title: "CRM Masters",
    icon: GiRingmaster,
    submenu: [
      { title: "CRM", path: "/crm-master" },
      { title: "Account", path: "/account" },
      { title: "Quotation", path: "/quotation" },
      { title: "Quotation List", path: "/quotation-list" },
    ],
  },

  {
    id: 7,
    title: "CAG Masters",
    icon: GiRingmaster,
    submenu: [
      { title: "Role Creation", path: "/rolecreation" },
      { title: "Existing Roles", path: "/existingroles" },
      { title: "Role Management", path: "/rolemanagement" },
      { title: "Menu Creation", path: "/menucreation" },
      { title: "Existing Menus", path: "/existingmenus" },
      { title: "User Management", path: "/usermanagement" },
      { title: "Audit Logs", path: "/auditlogs" },
    ],
  },

  {
    id: 4,
    title: "Setup",
    icon: MdOutlinePhonelinkSetup,
    submenu: [{ title: "Company/Firm setups", path: "/" }],
  },

  {
    id: 8,
    title: "Branch Master",
    icon: GiRingmaster,
    submenu: [{ title: "Branch Management", path: "/ManageBranch" }],
  },
  {
    id: 5,
    title: "Reports",
    icon: MdOutlinePhonelinkSetup,
    submenu: [{ title: "reports", path: "/" }],
  },
];
