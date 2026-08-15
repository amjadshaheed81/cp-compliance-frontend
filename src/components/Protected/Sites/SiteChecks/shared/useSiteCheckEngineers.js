import { useEffect, useMemo, useState } from "react";

export const getUserLabel = (user) => user?.name || user?.email || "";

const isActiveUser = (user) =>
  Boolean(user?.id) &&
  (!user?.status || String(user.status).toLowerCase() === "active");

const userBelongsToSite = (user, siteId) => {
  if (!user?.id || !siteId) return false;

  if (Number(user.defaultSiteId) === Number(siteId)) {
    return true;
  }

  return Boolean(
    user.taggedSites?.some(
      (site) => Number(site.id ?? site.siteId) === Number(siteId)
    )
  );
};

const uniqueUsersById = (userList) => {
  const uniqueUsers = new Map();

  userList.filter(Boolean).forEach((user) => {
    if (user?.id && !uniqueUsers.has(String(user.id))) {
      uniqueUsers.set(String(user.id), user);
    }
  });

  return Array.from(uniqueUsers.values());
};

const sortUsersByName = (userList) =>
  [...userList].sort((a, b) =>
    getUserLabel(a).localeCompare(getUserLabel(b), undefined, {
      sensitivity: "base",
    })
  );

/**
 * Pure option-builder used by the hook and unit tests.
 * It intentionally mirrors the approved Air Conditioning behaviour.
 */
export const buildSiteCheckEngineerOptions = ({
  users = [],
  siteId,
  loggedInUserData,
  status,
  selectedEngineerUser,
  leadEngineerId,
}) => {
  const selectableEngineers = sortUsersByName(
    uniqueUsersById([
      ...users.filter(
        (user) =>
          isActiveUser(user) && userBelongsToSite(user, siteId)
      ),
      ...(isActiveUser(loggedInUserData) ? [loggedInUserData] : []),
    ])
  );

  const loggedInEngineerOption = selectableEngineers.find(
    (user) => String(user.id) === String(loggedInUserData?.id)
  );

  const leadEngineerOption = uniqueUsersById([
    ...users,
    ...selectableEngineers,
  ]).find(
    (user) =>
      isActiveUser(user) &&
      String(user.id) === String(leadEngineerId) &&
      String(user.id) !== String(loggedInUserData?.id)
  );

  if (status === "Open") {
    // Required order: logged-in engineer first, Site Check lead engineer
    // second (when different), then the remaining active site engineers
    // alphabetically. uniqueUsersById removes duplicates.
    return uniqueUsersById([
      loggedInEngineerOption,
      leadEngineerOption,
      ...selectableEngineers,
    ]);
  }

  return uniqueUsersById([
    ...(selectedEngineerUser?.id ? [selectedEngineerUser] : []),
    ...selectableEngineers,
  ]);
};

/**
 * Shared engineer-option logic copied from the approved Air Conditioning form.
 *
 * Open Site Check:
 * - Active users assigned to the Site Check site.
 * - Logged-in user remains available as the default engineer.
 * - A same-day temporarily saved engineer remains available.
 *
 * Done Site Check:
 * - The saved engineer remains visible even if no longer active or assigned.
 */
const useSiteCheckEngineers = ({
  users = [],
  getUsers,
  siteId,
  loggedInUserData,
  status,
  selectedEngineerId,
  selectedEngineerUser,
  leadEngineerId,
}) => {
  const [isLoadingEngineers, setIsLoadingEngineers] = useState(false);
  const [engineerLoadError, setEngineerLoadError] = useState("");

  useEffect(() => {
    let isMounted = true;

    if (!siteId || users.length > 0 || typeof getUsers !== "function") {
      return undefined;
    }

    const loadUsers = async () => {
      setIsLoadingEngineers(true);
      setEngineerLoadError("");

      try {
        await getUsers();
      } catch (error) {
        if (isMounted) {
          setEngineerLoadError("Unable to load engineers for this site.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingEngineers(false);
        }
      }
    };

    loadUsers();

    return () => {
      isMounted = false;
    };
  }, [siteId, users.length, getUsers]);

  const engineerOptions = useMemo(
    () =>
      buildSiteCheckEngineerOptions({
        users,
        siteId,
        loggedInUserData,
        status,
        selectedEngineerUser,
        leadEngineerId,
      }),
    [
      users,
      siteId,
      loggedInUserData,
      status,
      selectedEngineerUser,
      leadEngineerId,
    ]
  );

  const selectedEngineer = useMemo(
    () =>
      engineerOptions.find(
        (user) => String(user.id) === String(selectedEngineerId)
      ) || null,
    [engineerOptions, selectedEngineerId]
  );

  return {
    engineerOptions,
    selectedEngineer,
    isLoadingEngineers,
    engineerLoadError,
  };
};

export default useSiteCheckEngineers;
