import React from 'react';
import './css/bootstrap.css';
import './App.css';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import { getRoutes } from './utils/getRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotAuthorized from './components/NotAuthorized/NotAuthorized';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';

const routesConfig = getRoutes().map((route) => {
  if (route.allowedRoles) {
    return {
      ...route,
      element: (
        <ProtectedRoute
          element={route.element}
          allowedRoles={route.allowedRoles}
        />
      ),
    };
  }
  return route;
});

const router = createHashRouter([
  ...routesConfig,
  { path: "/not-authorized", element: <NotAuthorized /> },
]);

const App = () => {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
      <ToastContainer />
    </Provider>
  );
};

export default App;