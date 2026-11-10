import React, { useEffect, useSyncExternalStore } from 'react';
import './css/bootstrap.css';
import './App.css';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { Provider, useDispatch, useSelector } from 'react-redux';
import store from './store/store';
import { getRoutes } from './utils/getRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotAuthorized from './components/NotAuthorized/NotAuthorized';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';
import Notification from './Notification';
import { selectGlobalSite } from './store/thunk/site';
import ClientScopeGate from './components/common/ClientScopeGate/ClientScopeGate';
import { getStoredSessionUser, isPlatformUser, reloadTo, SESSION_CHANGE_KEY } from './utils/sessionContext';
import { invalidatePlatformWorkspace } from './utils/platformWorkspace';

const standalonePaths = new Set(['/', '/login', '/forgot-password', '/change-password', '/platform', '/platform/continue']);
const routesConfig = getRoutes().map((route) => {
  const element = route.allowedRoles
    ? <ProtectedRoute element={route.element} allowedRoles={route.allowedRoles} />
    : route.element;
  return {
    ...route,
    element: standalonePaths.has(route.path) ? element : <ClientScopeGate>{element}</ClientScopeGate>,
  };
});

const router = createHashRouter([
  ...routesConfig,
  { path: "/not-authorized", element: <ClientScopeGate><NotAuthorized /></ClientScopeGate> },
]);

const AppContent = () => {
  const dispatch = useDispatch();
  const user = useSelector((state) => state.site.loggedInUserData);
  const pathname = useSyncExternalStore(router.subscribe, () => router.state.location.pathname);
  const customerSession = Boolean(user?.id) && !isPlatformUser(user) && pathname !== '/platform';

  useEffect(() => {
    if (!customerSession) return;
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
  }, [dispatch, customerSession, user?.id]);

  useEffect(() => {
    const handleSessionChange = (event) => {
      if (event.key !== SESSION_CHANGE_KEY) return;
      invalidatePlatformWorkspace();
      const currentUser = getStoredSessionUser();
      reloadTo(isPlatformUser(currentUser) ? '/platform/continue' : currentUser?.id ? '/dashboard' : '/login');
    };
    window.addEventListener('storage', handleSessionChange);
    return () => window.removeEventListener('storage', handleSessionChange);
  }, []);

  return (
    <>
      {customerSession && <Notification />}
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
