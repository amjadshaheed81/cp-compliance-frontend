import React from "react";
import { createRoot } from "react-dom/client"; // Updated import
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { isBrowserSupported } from "./utils/browserCheck";
import UnsupportedBrowserModal from "./UnsupportedBrowserModal";

const Root = () => {
  const [showModal, setShowModal] = React.useState(!isBrowserSupported());

  const handleProceed = () => {
    setShowModal(false);
  };

  return (
    <React.StrictMode>
      {showModal && <UnsupportedBrowserModal onProceed={handleProceed} />}
      <App />
    </React.StrictMode>
  );
};

// Updated according to reactv18.2.0 roots rendering method
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Root />);

reportWebVitals();
