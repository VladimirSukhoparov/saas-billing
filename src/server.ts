/**
 * Точка входа: Express-приложение и запуск сервера.
 */

import express from "express";
import swaggerUi from "swagger-ui-express";
import dotenv from "dotenv";
import { swaggerDocument } from "./swagger.ts";
import { paymentsRouter } from "./payments.ts";
import { errorHandler } from "./errors.ts";

dotenv.config();

const PORT = process.env.PORT ?? 3000;
const app = express();

// Парсим JSON в теле запроса
app.use(express.json());

// Документация API
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Роуты API: /api/v1/payments, /api/v1/payments/:id
app.use("/api/v1", paymentsRouter);

// Обработка ошибок
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
