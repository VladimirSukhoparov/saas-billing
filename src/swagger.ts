export const swaggerDocument = {
  openapi: "3.0.3",
  info: {
    title: "Оплата за сервис",
    description: "API для создания и просмотра платежей. Суммы в копейках. Заголовок Idempotency-Key обязателен при создании.",
    version: "1.0.0",
  },
  servers: [
    { url: "/", description: "Текущий хост" },
    { url: "http://localhost:3000", description: "Локально" },
  ],
  paths: {
    "/api/v1/payments": {
      post: {
        summary: "Создать платёж",
        parameters: [
          { name: "Idempotency-Key", in: "header", required: true, schema: { type: "string" } },
        ],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["amountKopeks", "provider"],
                properties: {
                  amountKopeks: { type: "integer", description: "Сумма в копейках (29900 = 299 ₽)" },
                  currency: { type: "string", enum: ["RUB"], default: "RUB" },
                  provider: { type: "string", enum: ["yookassa", "tbank", "sber"] },
                  description: { type: "string" },
                  returnUrl: { type: "string", format: "uri", description: "Обязательно валидный URL (не слово «string»)" },
                },
              },
              example: {
                amountKopeks: 29900,
                currency: "RUB",
                provider: "yookassa",
                description: "Оплата подписки",
                returnUrl: "https://example.com/return",
              },
            },
          },
        },
        responses: {
          "201": { description: "Платёж создан" },
          "200": { description: "Повтор запроса (тот же Idempotency-Key) — возвращён тот же платёж" },
          "400": { description: "Ошибка валидации" },
          "409": { description: "Idempotency-Key уже использован с другими данными" },
        },
      },
      get: {
        summary: "Список платежей",
        parameters: [
          { name: "limit", in: "query", schema: { type: "integer", default: 20 } },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "succeeded", "failed", "cancelled"] } },
        ],
        responses: { "200": { description: "Список платежей" } },
      },
    },
    "/api/v1/payments/{id}": {
      get: {
        summary: "Один платёж по id",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: {
          "200": { description: "Платёж найден" },
          "404": { description: "Платёж не найден" },
        },
      },
    },
  },
};
