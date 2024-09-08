export const getUniqueSitesWithUserCount = (users) => {
  const siteUserCount = {};

  users.forEach((user) => {
    if (user.taggedSites) {
      user.taggedSites.forEach((site) => {
        // If the site name exists, increment the count; otherwise, initialize it
        if (siteUserCount[site.name]) {
          siteUserCount[site.name]++;
        } else {
          siteUserCount[site.name] = 1;
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
