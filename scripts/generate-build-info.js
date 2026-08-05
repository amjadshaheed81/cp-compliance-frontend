#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const rootDir = path.resolve(__dirname, "..");
const packagePath = path.join(rootDir, "package.json");
const versionPath = path.join(rootDir, "build-version.json");
const generatedDir = path.join(rootDir, "src", "generated");
const publicDir = path.join(rootDir, "public");
const generatedBuildInfoPath = path.join(generatedDir, "buildInfo.json");
const publicBuildInfoPath = path.join(publicDir, "build-info.json");

const args = new Set(process.argv.slice(2));
const shouldIncrement = args.has("--increment");
const externalBuildRaw = process.env.CAFM_BUILD_NUMBER;
const environmentArg = process.argv.find((arg) =>
  arg.startsWith("--environment=")
);
const environment = environmentArg
  ? environmentArg.split("=")[1]
  : process.env.NODE_ENV || "development";

const readJson = (filePath) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Unable to read ${filePath}: ${error.message}`);
  }
};

const writeJson = (filePath, value) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const normaliseVersion = (version) =>
  String(version || "0.0.0").replace(/^[^0-9]*/, "");

const packageJson = readJson(packagePath);
const versionState = readJson(versionPath);

const reactVersion = normaliseVersion(packageJson.dependencies?.react);
const reactMajor = Number.parseInt(reactVersion.split(".")[0], 10);
const applicationMajor = Number.parseInt(versionState.applicationMajor, 10);
let build = Number.parseInt(versionState.build, 10);
const hasExternalBuild =
  externalBuildRaw !== undefined && String(externalBuildRaw).trim() !== "";
const externalBuild = hasExternalBuild
  ? Number.parseInt(String(externalBuildRaw).trim(), 10)
  : null;

if (!Number.isInteger(reactMajor) || reactMajor < 1) {
  throw new Error(`Invalid React version in package.json: ${reactVersion}`);
}
if (!Number.isInteger(applicationMajor) || applicationMajor < 1) {
  throw new Error("build-version.json applicationMajor must be a positive integer.");
}
if (!Number.isInteger(build) || build < 0) {
  throw new Error("build-version.json build must be zero or a positive integer.");
}

if (hasExternalBuild) {
  if (!Number.isInteger(externalBuild) || externalBuild < 0) {
    throw new Error(
      "CAFM_BUILD_NUMBER must be zero or a positive integer when supplied."
    );
  }
  build = externalBuild;
} else if (shouldIncrement) {
  build += 1;
  writeJson(versionPath, { applicationMajor, build });
}

const year = new Date().getFullYear();
const buildNumber = `${year}.${reactMajor}.${applicationMajor}.${build}`;
const buildInfo = {
  buildNumber,
  year,
  framework: "React",
  frameworkVersion: reactVersion,
  frameworkMajor: reactMajor,
  applicationMajor,
  build,
  environment,
  generatedAtUtc: new Date().toISOString(),
};

writeJson(generatedBuildInfoPath, buildInfo);
writeJson(publicBuildInfoPath, buildInfo);

console.log(`Generated CP Compliance build ${buildNumber} (${environment}).`);
