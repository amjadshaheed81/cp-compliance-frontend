"use strict";
// Read npm lockfile v3 with Node rather than Windows PowerShell 5.1 ConvertFrom-Json,
// which rejects the legal empty-string key under "packages".
const fs = require("fs");
const path = require("path");

const root = process.argv[2];
if (!root) {
  console.error("Usage: node Check-Frontend-State.cjs <frontend-root>");
  process.exit(2);
}

try {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const lock = JSON.parse(fs.readFileSync(path.join(root, "package-lock.json"), "utf8"));
  const values = [
    pkg.name,
    pkg.dependencies && pkg.dependencies.axios,
    lock.packages && lock.packages["node_modules/axios"] && lock.packages["node_modules/axios"].version,
  ];
  if (values.some((value) => typeof value !== "string" || value.includes("\n"))) {
    throw new Error("Missing or invalid package name / Axios version fields");
  }
  process.stdout.write(values.join("\n") + "\n");
} catch (error) {
  console.error("Cannot inspect package.json and package-lock.json:", error.message);
  process.exit(1);
}
