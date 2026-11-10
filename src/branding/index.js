import React from "react";
import { createTheme } from "@mui/material/styles";
import { resolveBrand } from "./registry";
import "./shared.css";
import "./auth.css";

let activeBrand = null;

// A React context lets the logo and login assets update in the same render as
// the selected-client brand, instead of relying on a later global re-render.
export const ActiveBrandContext = React.createContext(null);

export function useActiveBrand() {
  return React.useContext(ActiveBrandContext) || getActiveBrand();
}

export function getActiveBrand() {
  return activeBrand || resolveBrand(
    typeof window === "undefined" ? "" : window.location.hostname,
    process.env.REACT_APP_BRAND
  );
}

function setLink(doc, rel, href, type) {
  let link = doc.head.querySelector(`link[rel="${rel}"]`);
  if (!link) {
    link = doc.createElement("link");
    link.rel = rel;
    doc.head.appendChild(link);
  }
  link.href = href;
  if (type) link.type = type;
}

function setMeta(doc, name, content) {
  let meta = doc.head.querySelector(`meta[name="${name}"]`);
  if (!meta) {
    meta = doc.createElement("meta");
    meta.name = name;
    doc.head.appendChild(meta);
  }
  meta.content = content;
}

function cssValue(doc, name, fallback) {
  return doc?.defaultView?.getComputedStyle(doc.documentElement).getPropertyValue(name).trim() || fallback;
}

/** Apply a brand for display only; client authorization stays on the server. */
export function activateBranding(brand, doc = typeof document === "undefined" ? null : document) {
  if (!brand?.id) throw new Error("Cannot activate an unknown brand.");
  activeBrand = brand;
  if (doc) {
    doc.documentElement.setAttribute("data-brand", activeBrand.id);
    doc.title = activeBrand.title;
    setLink(doc, "icon", activeBrand.icon, activeBrand.iconType);
    setLink(doc, "apple-touch-icon", activeBrand.icon, activeBrand.iconType);
    setMeta(doc, "description", activeBrand.description);
    setMeta(doc, "theme-color", cssValue(doc, "--brand-primary", "#176c9e"));
  }
  return activeBrand;
}

/** Initial anonymous branding is determined by hostname, not stored identity. */
export function initializeBranding({
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
  localBrand = process.env.REACT_APP_BRAND,
  doc = typeof document === "undefined" ? null : document,
} = {}) {
  return activateBranding(resolveBrand(hostname, localBrand), doc);
}

/** Material controls use the same values as the brand CSS and Bootstrap. */
export function createBrandTheme(doc = typeof document === "undefined" ? null : document) {
  return createTheme({
    palette: {
      primary: { main: cssValue(doc, "--brand-primary", "#176c9e"), contrastText: "#ffffff" },
      secondary: { main: cssValue(doc, "--brand-accent", "#137e78"), contrastText: "#ffffff" },
    },
    typography: { fontFamily: "Montserrat, Arial, sans-serif" },
  });
}
