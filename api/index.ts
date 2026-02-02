/**
 * Обработчик для Vercel Serverless.
 * Все запросы проксируются сюда через vercel.json rewrites.
 */

import "dotenv/config";
import { app } from "../src/app.ts";

export default app;
