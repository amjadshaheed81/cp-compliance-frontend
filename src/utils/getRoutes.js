import ChangePassword from "../components/ChangePassword/ChangePassword";
import ForgotPassword from "../components/ForgotPassword/ForgotPassword";
import LoginForm from "../components/Login/LoginForm";
import PageNotFound from "../components/PageNotFound/PageNotFound";
import Dashboard from "../components/Protected/Dashboard";
import Sites from "../components/Protected/Sites";
import AddSite from "../components/Protected/Sites/AddSite";
import UpdateSite from "../components/Protected/Sites/UpdateSite";
import Tabs from "../components/Protected/Sites/AddSite/SiteTabs";
import SiteChart from "../components/Protected/Sites/UpdateSite/SiteChart";
import SiteInformation from "../components/Protected/Sites/UpdateSite/SiteInformation";
import Document from "../components/Protected/Sites/Documents";
import Projects from "../components/Protected/Sites/Projects";
import Contracts from "../components/Protected/Sites/Contracts";
import SubFolder from "../components/Protected/Sites/Documents/SubFolder";
import Users from "../components/Protected/Users";
import AdminCategories from "../components/Protected/Admin/AdminCategories";
import AdminCategoriesAdd from "../components/Protected/Admin/AdminCategoriesAdd"
import AdminCategoriesEdit from "../components/Protected/Admin/AdminCategoriesEdit"
import Assets from "../components/Protected/Sites/Assets";
import CreateAsset from "../components/Protected/Sites/Assets/CreateAsset";
import PreActions from "../components/Protected/Sites/PreActions";
import ViewCreatePreActions from "../components/Protected/Sites/PreActions/ViewCreatePreActions";
import SiteChecks from "../components/Protected/Sites/SiteChecks";
import UpdateSiteCheck from "../components/Protected/Sites/SiteChecks/UpdateSiteCheck";
import UpdateAsset from "../components/Protected/Sites/Assets/UpdateAsset";
import ViewEditPreAction from "../components/Protected/Sites/PreActions/ViewEditPreAction";

export const getRoutes = () => {
  const tabs = [
    {
      label: "Basic Details",
      Component: <AddSite />,
    },
    {
      label: "Floor Layout & Plan",
      Component: <SiteChart />,
    },
    {
      label: "Site Information",
      Component: <SiteInformation />,
    },
  ];
  const UpdateSiteTabs = [
    {
      label: "Basic Details",
      Component: <UpdateSite />,
    },
    {
      label: "Floor Layout & Plan",
      Component: <SiteChart />,
    },
    {
      label: "Site Information",
      Component: <SiteInformation />,
    },
  ];
  return [
    {
      path: "/",
      element: <LoginForm />,
      errorElement: <PageNotFound />,
    },
    {
      path: "/login",
      element: <LoginForm />,
    },
    {
      path: "/forgot-password",
      element: <ForgotPassword />,
    },
    {
      path: "/change-password",
      element: <ChangePassword />,
    },
    {
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/add-site",
      element: <Tabs tabs={tabs} isCreateSite={true} />,
    },
    {
      path: "/update-site",
      element: <Tabs tabs={UpdateSiteTabs} isCreateSite={false} />,
    },
    {
      path: "/sites",
      element: <Sites />,
    },
    {
      path: "/documents",
      element: <Document />,
    },
    {
      path: "/site-projects",
      element: <Projects />,
    },
    {
      path: "/site-contracts",
      element: <Contracts />,
    },
    {
      path: "/subfolder",
      element: <SubFolder />,
    },
    {
      path: "/user-management",
      element: <Users />,
    },
    {
      path: "/assets",
      element: <Assets />,
    },
    {
      path: "/create-asset",
      element: <CreateAsset />,
    },
    {
      path: "/pre-actions",
      element: <PreActions />,
    },
    {
      path: "/view-update-pre-actions",
      element: <ViewCreatePreActions />,
    },
    {
      path: "/site-checks",
      element: <SiteChecks />,
    },
    {
      path: "/site-checks/:id/update",
      element: <UpdateSiteCheck />,
    },
    {
      path: "/admin/categories",
      element: <AdminCategories />,
    },
    {
      path: "/admin/categories/new",
      element: <AdminCategoriesAdd />,
    },
    {
      path: "/admin/categories/:id/update",
      element: <AdminCategoriesEdit />,
    },
    
    {
      path: "/update-asset",
      element: <UpdateAsset />,
    },
    {
      path: "/pre-action-detail",
      element: <ViewEditPreAction />,
    },
  ];
};
