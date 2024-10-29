export const getUniqueSitesWithUserCount = (
  users,
  sites,
  area = null,
  allSites = true,
  globalSite
) => {
  const siteUserCount = {};

  // Filter sites by open status and area if provided
  const filteredSites = sites?.filter(
    (site) =>
      site.status === "open" &&
      (!area || site.area === area) &&
      (allSites || site.siteName === globalSite.siteName)
  );

  // Map site names to ensure only counting users for filtered sites
  const filteredSiteNames = filteredSites?.map((site) => site.siteName);

  users.forEach((user) => {
    if (user.taggedSites) {
      user.taggedSites?.forEach((site) => {
        if (filteredSiteNames?.includes(site.name)) {
          // If the site name exists, increment the count; otherwise, initialize it
          if (siteUserCount[site.name]) {
            siteUserCount[site.name]++;
          } else {
            siteUserCount[site.name] = 1;
          }
        }
      });
    }
  });

  // Convert the object to an array of site details
  const result = Object.keys(siteUserCount).map((siteName) => ({
    siteName,
    totalUsers: siteUserCount[siteName],
  }));
  return result;
};
