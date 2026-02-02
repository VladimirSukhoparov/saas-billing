/**
 * Создание Express-приложения (без listen).
 * Используется и локально (server.ts), и на Vercel (api/index.ts).
 * Swagger UI подключается с CDN — на Vercel статика из swagger-ui-express не раздаётся корректно.
 */

import express from "express";
import { swaggerDocument } from "./swagger.js";
import { paymentsRouter } from "./payments.js";
import { errorHandler } from "./errors.js";

export const app = express();

app.use(express.json());

// OpenAPI-спека в JSON (для Swagger UI)
app.get("/api-docs/openapi.json", (_req, res) => {
  res.json(swaggerDocument);
});

// Swagger UI: HTML с загрузкой скриптов с CDN (работает на Vercel serverless)
const swaggerHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Swagger UI</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js" crossorigin></script>
  <script>
    window.onload = function() {
      window.ui = SwaggerUIBundle({
        url: "./openapi.json",
        dom_id: "#swagger-ui",
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "StandaloneLayout"
      });
    };
  </script>
</body>
</html>
`;

app.get(["/api-docs", "/api-docs/"], (_req, res) => {
  res.type("html").send(swaggerHtml);
});

app.use("/api/v1", paymentsRouter);
app.use(errorHandler);
