import React from 'react';
import './css/bootstrap.css';
import './App.css';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Provider } from 'react-redux';
import store from './store/store';
import { getRoutes } from './utils/getRoutes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import NotAuthorized from './components/NotAuthorized/NotAuthorized';
import ProtectedRoute from './components/common/ProtectedRoute/ProtectedRoute';

const App = () => {
  const routes = getRoutes();

  return (
    <Provider store={store}>
      <Router>
        <Routes>
          {routes.map((route, index) => {
            if (route.allowedRoles) {
              return (
                <Route
                  key={index}
                  path={route.path}
                  element={
                    <ProtectedRoute
                      element={route.element}
                      allowedRoles={route.allowedRoles}
                    />
                  }
                  errorElement={route.errorElement}
                />
              );
            }
            return (
              <Route
                key={index}
                path={route.path}
                element={route.element}
                errorElement={route.errorElement}
              />
            );
          })}
          <Route path="/not-authorized" element={<NotAuthorized />} />
        </Routes>
      </Router>
      <ToastContainer />
    </Provider>
  );
};

export default App;