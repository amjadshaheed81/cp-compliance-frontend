import buildInfo from "../generated/buildInfo.json";

const getRuntimeConfig = () => {
  if (typeof window === "undefined") {
    return {};
  }

  return window.__CP_COMPLIANCE_CONFIG__ || {};
};

export const isBuildNumberVisible = () =>
  getRuntimeConfig().showBuildNumber !== false;

export const getBuildInfo = () => buildInfo;

export const getBuildTooltip = () =>
  [
    `Build ${buildInfo.buildNumber}`,
    `${buildInfo.framework} ${buildInfo.frameworkVersion}`,
    `Environment: ${buildInfo.environment}`,
  ].join(" | ");

export const logBuildInfo = () => {
  // This is intentionally independent of showBuildNumber so support can
  // always identify the running build from the browser console.
  // eslint-disable-next-line no-console
  console.info(
    `[CP Compliance] Build ${buildInfo.buildNumber} | ` +
      `${buildInfo.framework} ${buildInfo.frameworkVersion} | ` +
      `${buildInfo.environment}`
  );
};
