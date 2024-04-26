import React from "react";
import "./css/bootstrap.css";
import "./App.css";
import { createHashRouter, RouterProvider } from "react-router-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import { getRoutes } from "./utils/getRoutes";

const router = createHashRouter(getRoutes());
const App = () => {
  return (
    <Provider store={store}>
      <RouterProvider router={router} />
    </Provider>
  );
};

export default App;
