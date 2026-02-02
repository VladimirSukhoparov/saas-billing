/**
 * Обработчик для Vercel Serverless.
 * Все запросы проксируются сюда через vercel.json rewrites.
 * Динамический импорт + try/catch — при падении загрузки вернём ошибку в ответе (упростит отладку).
 */

import "dotenv/config";

type Req = import("http").IncomingMessage;
type Res = import("http").ServerResponse;

async function handler(req: Req, res: Res): Promise<void> {
  try {
    const { app } = await import("../src/app.js");
    app(req, res);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error("Vercel function error:", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "FUNCTION_LOAD_ERROR",
        message,
        ...(stack && { stack }),
      })
    );
  }
}

export default handler;
