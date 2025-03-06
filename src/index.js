import React from "react";
import ReactDOM from "react-dom";
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { isBrowserSupported } from "./utils/browserCheck";

if (!isBrowserSupported()) {
  window.location.href = "/unsupportedBrowser.html";
} else {
  ReactDOM.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
    document.getElementById("root")
  );
}

reportWebVitals();
