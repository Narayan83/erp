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
      { title: "Product Master", path: "/ProductMaster" },
      { title: "Product Management", path: "/ManageProduct" },
      { title: "Category Management", path: "/ManageCategory" },
      { title: "Subcategory Management", path: "/ManageSubcategory" },
      { title: "Tag Management", path: "/ManageTag" },
      { title: "Store / Unit / Tax / HSN / Size", path: "/ManageUnitStoreTax" },
    ],
  },

  {
    id: 3,
    title: "Users Masters",
    icon: GiRingmaster,
    submenu: [
      { title: "Users Management", path: "/users" },
      { title: "User Address", path: "/address" },
    ],
  },

  {
    id: 8,
    title: "Employee Masters",
    icon: GiRingmaster,
    submenu: [
      { title: "Employee Management", path: "/employeemanagement" },
      { title: "Manage Department Head", path: "/departmentmaster" },
      { title: "Assign Employee to Head", path: "/designation" },
      { title: "Assign User to Employee", path: "/assignusertoemployee" },
    ],
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
      { title: "Terms & Conditions  Management", path: "/Managetandc" },
    ],
  },

  {
    id: 7,
    title: "Admin",
    icon: GiRingmaster,
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
    icon: MdOutlinePhonelinkSetup,
    submenu: [
      { title: "Company/Firm Master", path: "/ManageCompany" },
      { title: "Branch", path: "/ManageBranch" },
      { title: "Bank", path: "/ManageBank" },
      { title: "Series", path: "/ManageSeries" },
    ],
  },

  {
    id: 5,
    title: "Reports",
    icon: MdOutlinePhonelinkSetup,
    submenu: [{ title: "reports", path: "/erpreport" }],
  },
];
