const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function configureProxy(app) {
  const projectServiceProxy = createProxyMiddleware({
    target: "http://localhost:8084",
    changeOrigin: true,
    secure: false,
  });

  const siteServiceProxy = createProxyMiddleware({
    target: "http://localhost:8080",
    changeOrigin: true,
    secure: false,
  });

  // Phase 1 LOCAL DEVELOPMENT test only:
  // Read the company list from site-service without changing React components.
  // All other company endpoints continue to use project-service.
  app.use((req, res, next) => {
    if (req.method === "GET" && req.path === "/api/companies/all") {
      return siteServiceProxy(req, res, next);
    }
    return next();
  });

  // These paths belong to project-service.
  app.use("/api/project", projectServiceProxy);
  app.use("/api/companies", projectServiceProxy);
  app.use("/api/v1/project", projectServiceProxy);

  // All remaining API paths belong to site-service.
  app.use("/api", siteServiceProxy);
};