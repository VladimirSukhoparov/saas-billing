/**
 * Точка входа для локального запуска (npm run dev).
 * На Vercel используется api/index.ts.
 */

import dotenv from "dotenv";
import { app } from "./app.js";

dotenv.config();

const PORT = process.env.PORT ?? 3000;

app.listen(PORT, () => {
  console.log(`Сервер: http://localhost:${PORT}`);
  console.log(`Swagger: http://localhost:${PORT}/api-docs`);
});
