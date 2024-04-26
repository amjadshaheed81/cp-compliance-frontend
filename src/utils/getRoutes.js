import ForgotPassword from "../components/ForgotPassword/ForgotPassword";
import LoginForm from "../components/Login/LoginForm";
import PageNotFound from "../components/PageNotFound/PageNotFound";
import AddSite from "../components/Protected/AddSite";
import Dashboard from "../components/Protected/Dashboard";
import Sites from "../components/Protected/Sites";

export const getRoutes = () => {
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
      path: "/dashboard",
      element: <Dashboard />,
    },
    {
      path: "/add-site",
      element: <AddSite />,
    },
    {
      path: "/sites",
      element: <Sites />,
    },
  ];
};
