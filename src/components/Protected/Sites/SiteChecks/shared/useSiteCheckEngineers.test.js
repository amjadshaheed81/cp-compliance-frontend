import { buildSiteCheckEngineerOptions } from "./useSiteCheckEngineers";

describe("buildSiteCheckEngineerOptions", () => {
  const siteId = 10;
  const loggedInUser = {
    id: 1,
    name: "Logged In Engineer",
    status: "Active",
    taggedSites: [],
  };

  const leadEngineer = {
    id: 5,
    name: "Zed Lead Engineer",
    status: "Active",
    taggedSites: [{ id: siteId }],
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

  test("Open orders logged-in engineer first, lead engineer second, then remaining site engineers alphabetically", () => {
    const result = buildSiteCheckEngineerOptions({
      users: [leadEngineer, activeSiteEngineer, inactiveSiteEngineer, otherSiteEngineer],
      siteId,
      loggedInUserData: loggedInUser,
      status: "Open",
      leadEngineerId: leadEngineer.id,
    });

    expect(result.map((user) => user.id)).toEqual([1, 5, 2]);
  });

  test("Open does not duplicate the lead when the logged-in engineer is also the lead", () => {
    const result = buildSiteCheckEngineerOptions({
      users: [activeSiteEngineer],
      siteId,
      loggedInUserData: loggedInUser,
      status: "Open",
      leadEngineerId: loggedInUser.id,
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
