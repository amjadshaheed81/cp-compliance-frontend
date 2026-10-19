const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function configureProxy(app) {
  // Local development only: Project Service is retired. The production API
  // Gateway already forwards /api/project/, /api/companies/ and /api/ to Site Service.
  const siteServiceProxy = createProxyMiddleware({
    target: "http://localhost:8080",
    changeOrigin: true,
    secure: false,
  });

  // Keep the same /api prefix and public endpoint paths used in production.
  app.use("/api", siteServiceProxy);
};
