import { createContext, useEffect, useState } from "react";
import { BrowserRouter, Route, Routes, useLocation, Outlet } from "react-router-dom";
import "./styles/main.scss";
// import HomePage from "./AdminSection/AdminPages/HomePage/HomePage";
 import Header from "./AdminSection/AdminComponents/Header/Header";
 import MainSideBar from "./AdminSection/AdminComponents/MainSideBar/MainSideBar";
// import AddProduct from "./AdminSection/AdminPages/AddProduct/AddProduct";
// import ManageProduct from "./AdminSection/AdminPages/ManageProduct/ManageProduct";
// import LoginPage from "./AdminSection/Login/Login";
// import Registration from "./AdminSection/Login/Registration";

import HomePage from "./AdminSection/AdminPages/HomePage/HomePage";
// import AddProduct from "./Products/AddProduct/AddProduct";
// import ManageProduct from "./Products/ManageProduct/ManageProduct";
import LoginPage from "./AdminSection/AdminPages/Login/Login";
import Registration from "./Roles/Registration/Registration";
import RegistrationView from "./Roles/Registration/RegistrationView";
import NotFoundPage from "./AdminSection/AdminPages/NotFoundPage/NotFoundPage";
import RolesView from "./Roles/RoleCreation/RolesView";
import CategoryPage from "./Products/Category/page/CategoryPage";
import SubcategoryPage from "./Products/Subcategory/page/SubcategoryPage";
import TagPage from "./Products/Tags/page/TagPage";
import UnitStoreTaxMasterPage from "./Products/Unit_Store_Tax/page/UnitStoreTaxMasterPage";
import ProductMultiStepForm from "./Products/ProductManage/Components/ProductMultiStepForm";
import ProductListPage from "./Products/ProductManage/page/product_list_page";
import ProductEditPage from "./Products/ProductManage/page/ProductEditPage";
import ProductVariantManager from "./Products/ProductManage/Components/ProductVariantManager";
import UserFormPage from "./User/page/UserFormPage";
import UserListPage from "./User/page/user_list_page";
import Branch from "./Branch/Branch";
// import ProductAtributesPage from "./Products/ProductAtributesPage/ProductAtributesPage";

import CrmPage from "./CRM/Components/TopMenu/TopMenu";
import AccountPage from "./CRM/Pages/Account/Account";
import Customize from './CRM/Pages/Customize/Customize';
import Report from './CRM/Pages/Reports/Report';
import QuotationNewForm from './CRM/Pages/Quotation/QuotationForm';
// import QuotationList from './CRM/Pages/Quotation/QuotationList';

import QutationList from "./Qutation/QutationList";
import AddQutation from "./Qutation/AddQutation";

import RoleCreation from "./CAG/page/RoleCreation/RoleCreation";
import MenuCreation from "./CAG/page/MenuCreation/MenuCreation";
import RoleManagement from './CAG/page/RoleManagement/RoleManagement';
import ExistingMenus from './CAG/page/ExistingMenus/ExistingMenus';
import UserManagement from './CAG/page/UserManagement/UserManagement';
import ExistingRoles from './CAG/page/ExistingRoles/ExistingRoles';
import AuditLogs from "./CAG/page/AuditLogs/AuditLogs";

const myContext = createContext();

function AppLayout({ children }) {
  const [isToggleSideBar, setIsToggleSideBar] = useState(false);
  const values = {
    isToggleSideBar,
    setIsToggleSideBar,
  };
  useEffect(()=>{
    // alert('I am '+ isToggleSideBar); 
  },[isToggleSideBar]);


  const location = useLocation();
  const noLayoutRoutes = ['/', '/login'];
  const isNoLayout = noLayoutRoutes.includes(location.pathname);

  return (
    <myContext.Provider value={values}>
      {isNoLayout ? (
        children
      ) : (
        <>
          <Header />
          <div className="main d-flex">
            <div className={`main-side-bar-wraper ${isToggleSideBar === true ? 'toggle-menu' : ''}`}>
              <MainSideBar />
            </div>
            <div className={`content ${isToggleSideBar === true ? 'toggle-menu' : ''}`}>
              {children}
            </div>
          </div>
        </>
      )}
    </myContext.Provider>
  );
}

function QuotationLayout() {
  // Render nested routes here
  return <Outlet />;
}

function QuotationTest() {
  return <div style={{padding: 40}}>This is a Quotation Test Page (nested route).</div>;
}

function App() {


 return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          {/* No-layout routes */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/login" element={<LoginPage />} />

          {/* Layout routes */}
          <Route path="/home" element={<HomePage />} />
          {/* <Route path="/product" element={<AddProduct />} />
          <Route path="/manage-product" element={<ManageProduct />} />
          <Route path="/pattributes" element={<ProductAtributesPage />} />
          <Route path="/registration" element={<Registration />} />
          <Route path="/registration/:id" element={<Registration />} />
          <Route path="/registration_view" element={<RegistrationView />} />
          <Route path="/rolecreation" element={<RoleCreation />} />
          <Route path="/rolecreation/:id" element={<RoleCreation />} />
          <Route path="/rolesview" element={<RolesView/>} /> */}
          
          <Route path="/ManageCategory" element={< CategoryPage />} />
          <Route path="/ManageSubcategory" element={< SubcategoryPage /> } />
          <Route path="/ManageTag" element={ < TagPage /> } />
          <Route path="/ManageUnitStoreTax" element={ < UnitStoreTaxMasterPage / > } />
          <Route path="/ManageProduct" element={< ProductMultiStepForm /> } />
          <Route path="/ManageBranch" element={<Branch />} />
          <Route path="/ProductMaster" element={< ProductListPage /> } />
          <Route path="/products/:id/edit" element={<ProductEditPage />} />
          <Route path="/products/:id/variants" element={<ProductVariantManager />} />

           <Route path="/users/add" element={< UserFormPage />} />
          <Route path="/users/:id/edit" element={<UserFormPage />} />
          <Route path="/users" element={< UserListPage />} />

          <Route path="/crm-master" element={<CrmPage />} />
          <Route path="/account" element={<AccountPage />} />
          <Route path="/customize" element={<Customize />} />
          <Route path="/reports" element={<Report />} />
          

           {/* <Route path="/quotation" element={<QuotationNewForm />} /> */}
           <Route path="/quotation" element={<AddQutation />} />

          {/* <Route path="/quotation-list" element={<QuotationList />} /> */}

           <Route path="/quotation-list" element={<QutationList />} />
          
          {/* Quotation nested routes */}
          {/* <Route path="/quotation" element={<QuotationLayout />}>
            <Route index element={<QuotationForm />} />
            <Route path="test" element={<QuotationTest />} />
          </Route> */}

          <Route path="/rolecreation" element={<RoleCreation />} />
          <Route path="/existingroles" element={<ExistingRoles />} />
          <Route path="/rolemanagement" element={<RoleManagement />} />
          <Route path="/menucreation" element={<MenuCreation />} />
          <Route path="/existingmenus" element={<ExistingMenus />} />
          <Route path="/usermanagement" element={<UserManagement />} />
          <Route path="/auditlogs" element={<AuditLogs />} />
          {/* Catch-all */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}

export default App;
export { myContext };