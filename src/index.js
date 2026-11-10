import React from "react";
import { createRoot } from "react-dom/client"; // Updated import
import "./index.css";
import App from "./App";
import reportWebVitals from "./reportWebVitals";
import { isBrowserSupported } from "./utils/browserCheck";
import UnsupportedBrowserModal from "./UnsupportedBrowserModal";
import { logBuildInfo } from "./utils/buildInfo";
import { ThemeProvider } from "@mui/material/styles";
import {
  ActiveBrandContext, activateBranding, createBrandTheme,
  getActiveBrand, initializeBranding,
} from "./branding";
import { BRANDS, resolveWorkspaceBrand } from "./branding/registry";
import store from "./store/store";
import { getPlatformWorkspace, WORKSPACE_CHANGED_EVENT } from "./utils/platformWorkspace";

initializeBranding();
logBuildInfo();

// Subscribe to authenticated identity changes and validated client selection.
// Reading only the stable brand ID avoids React update loops on unrelated Redux
// actions (site grids, notifications, etc.). No branding is fetched from the API.
function currentBrandId() {
  const user = store.getState()?.site?.loggedInUserData;
  const workspace = getPlatformWorkspace();
  // Never use a prior account's in-memory customer selection.
  const verifiedClientId = workspace?.user?.id === user?.id ? workspace?.selectedLicenseId : null;
  return resolveWorkspaceBrand(
    user,
    verifiedClientId,
    window.location.hostname,
    process.env.REACT_APP_BRAND
  ).id;
}

function subscribeBrand(callback) {
  const unsubscribeStore = store.subscribe(callback);
  window.addEventListener(WORKSPACE_CHANGED_EVENT, callback);
  return () => {
    unsubscribeStore();
    window.removeEventListener(WORKSPACE_CHANGED_EVENT, callback);
  };
}

const Root = () => {
  const [showModal, setShowModal] = React.useState(!isBrowserSupported());
  const brandId = React.useSyncExternalStore(subscribeBrand, currentBrandId, currentBrandId);
  const brand = BRANDS[brandId] || getActiveBrand();
  const [brandTheme, setBrandTheme] = React.useState(() => createBrandTheme());

  // The CSS variables and Material UI palette must switch together. A layout
  // effect updates the document before paint, then rebuilds the MUI theme using
  // the newly active brand's CSS variables.
  React.useLayoutEffect(() => {
    if (getActiveBrand().id === brand.id) return;
    activateBranding(brand);
    setBrandTheme(createBrandTheme());
  }, [brand]);

  const handleProceed = () => {
    setShowModal(false);
  };

  return (
    <React.StrictMode>
      <ActiveBrandContext.Provider value={brand}>
        <ThemeProvider theme={brandTheme}>
          {showModal && <UnsupportedBrowserModal onProceed={handleProceed} />}
          <App />
        </ThemeProvider>
      </ActiveBrandContext.Provider>
    </React.StrictMode>
  );
};

// Updated according to reactv18.2.0 roots rendering method
const container = document.getElementById("root");
const root = createRoot(container);
root.render(<Root />);

reportWebVitals();
