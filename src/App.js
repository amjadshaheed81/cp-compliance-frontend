import React from "react";
import "./css/bootstrap.css";
import "./App.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { createHashHistory } from "history";
import LoginForm from "./components/Login/LoginForm";
import Dashboard from "./components/Protected/Dashboard";
import AddSite from "./components/Protected/AddSite";
import Sites from "./components/Protected/Sites";
import ForgotPassword from "./components/ForgotPassword/ForgotPassword";
const hashHistory = createHashHistory();

const App = () => {
  return (
    <Provider store={store}>
      <Router history={hashHistory}>
        <div>
          <Routes>
            <Route path="/" element={<LoginForm />} />
            <Route path="/login" element={<LoginForm />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/add-site" element={<AddSite />} />
            <Route path="/sites" element={<Sites />} />
            {/* <PrivateRoute path="/products" component={ProductList} /> */}
          </Routes>
        </div>
      </Router>
    </Provider>
  );
};

export default App;
