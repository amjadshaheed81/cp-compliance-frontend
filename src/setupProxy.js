const { createProxyMiddleware } = require("http-proxy-middleware");

module.exports = function configureProxy(app) {
  const projectServiceProxy = createProxyMiddleware({
    target: "http://localhost:8084",
    changeOrigin: true,
    secure: false,
  });

  // These paths belong to project-service.
  app.use("/api/project", projectServiceProxy);
  app.use("/api/companies", projectServiceProxy);
  app.use("/api/v1/project", projectServiceProxy);

  // All remaining API paths belong to site-service.
  app.use(
    "/api",
    createProxyMiddleware({
      target: "http://localhost:8080",
      changeOrigin: true,
      secure: false,
    })
  );
};