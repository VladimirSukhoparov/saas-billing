/**
 * Создание Express-приложения (без listen).
 * Используется и локально (server.ts), и на Vercel (api/index.ts).
 */

import express from "express";
import swaggerUi from "swagger-ui-express";
import { swaggerDocument } from "./swagger.js";
import { paymentsRouter } from "./payments.js";
import { errorHandler } from "./errors.js";

export const app = express();

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
app.use("/api/v1", paymentsRouter);
app.use(errorHandler);
