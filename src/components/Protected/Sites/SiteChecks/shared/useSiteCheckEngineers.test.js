import { buildSiteCheckEngineerOptions } from "./useSiteCheckEngineers";

describe("buildSiteCheckEngineerOptions", () => {
  const siteId = 10;
  const loggedInUser = {
    id: 1,
    name: "Logged In Engineer",
    status: "Active",
    taggedSites: [],
  };

  const activeSiteEngineer = {
    id: 2,
    name: "Alex Engineer",
    status: "Active",
    taggedSites: [{ id: siteId }],
  };

  const inactiveSiteEngineer = {
    id: 3,
    name: "Inactive Engineer",
    status: "Inactive",
    taggedSites: [{ id: siteId }],
  };

  const otherSiteEngineer = {
    id: 4,
    name: "Other Site Engineer",
    status: "Active",
    taggedSites: [{ id: 99 }],
  };

  test("Open includes the logged-in user and active users for the Site Check site", () => {
    const result = buildSiteCheckEngineerOptions({
      users: [
        activeSiteEngineer,
        inactiveSiteEngineer,
        otherSiteEngineer,
      ],
      siteId,
      loggedInUserData: loggedInUser,
      status: "Open",
      lastEngineerId: null,
    });

    expect(result.map((user) => user.id)).toEqual([1, 2]);
  });

  test("Open keeps a same-day previously selected engineer near the top", () => {
    const result = buildSiteCheckEngineerOptions({
      users: [activeSiteEngineer],
      siteId,
      loggedInUserData: loggedInUser,
      status: "Open",
      lastEngineerId: activeSiteEngineer.id,
    });

    expect(result.map((user) => user.id)).toEqual([1, 2]);
  });

  test("Done keeps the saved engineer even when inactive", () => {
    const result = buildSiteCheckEngineerOptions({
      users: [activeSiteEngineer, inactiveSiteEngineer],
      siteId,
      loggedInUserData: loggedInUser,
      status: "Done",
      selectedEngineerUser: inactiveSiteEngineer,
    });

    expect(result[0]).toEqual(inactiveSiteEngineer);
    expect(result.map((user) => user.id)).toContain(3);
  });
});
