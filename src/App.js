import React, { useEffect } from 'react';
import './css/bootstrap.css';
import './App.css';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { Provider, useDispatch } from 'react-redux';
import store from './store/store';
import { getRoutes } from './utils/getRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotAuthorized from './components/NotAuthorized/NotAuthorized';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import Notification from './Notification';
import { selectGlobalSite } from './store/thunk/site';

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

const AppContent = () => {
  const dispatch = useDispatch();

  useEffect(() => {
    try {
      const raw = localStorage.getItem('site');
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && parsed.siteId) {
        dispatch(selectGlobalSite(parsed));
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.error('Failed to hydrate selected site from storage', e);
    }
  }, [dispatch]);

  return (
    <>
      <Notification />
      <RouterProvider router={router} />
      <ToastContainer />
    </>
  );
};

const App = () => (
  <Provider store={store}>
    <AppContent />
  </Provider>
);

export default App;