import { getPlatformSession, getPlatformWorkspaceContext } from "../api/platform";
import { assertPlatformSession } from "./sessionContext";
import { assertPlatformWorkspace } from "./platformWorkspace";

// Only app/login landing uses this decision. Client List is always an explicit destination.
export async function resolvePlatformEntry({ signal } = {}) {
  const session = assertPlatformSession(await getPlatformSession({ signal }));
  if (session.selectionRequired) return { session, workspace: null, destination: "/platform" };
  const workspace = assertPlatformWorkspace(await getPlatformWorkspaceContext(session.selectedLicenseId, { signal }));
  if (workspace.user.id !== session.user.id || workspace.selectedLicenseId !== session.selectedLicenseId) {
    throw new Error("The client selection changed while opening the workspace. Please retry.");
  }
  return { session, workspace, destination: workspace.sites.length ? "/dashboard" : "/add-site" };
}
