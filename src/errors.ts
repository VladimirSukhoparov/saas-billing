/**
 * Ошибки API: базовый класс AppError и обработчик errorHandler.
 * Все ответы с ошибкой в формате { error: { code, message } }.
 */

export class AppError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly statusCode: number = 500
  ) {
    super(message);
    this.name = "AppError";
  }
}

export class ValidationError extends AppError {
  details?: Record<string, unknown>;
  constructor(message: string, details?: Record<string, unknown>) {
    super("VALIDATION_ERROR", message, 400);
    this.details = details;
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, id?: string) {
    super("NOT_FOUND", `${resource} не найден${id ? `: ${id}` : ""}`, 404);
  }
}

export class IdempotencyConflictError extends AppError {
  constructor(message = "Ключ идемпотентности уже использован с другими данными") {
    super("IDEMPOTENCY_CONFLICT", message, 409);
  }
}

export function errorHandler(
  err: unknown,
  _req: import("express").Request,
  res: import("express").Response,
  _next: import("express").NextFunction
): void {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      code: err.code,
      message: err.message,
    };
    if ("details" in err && err.details) body.details = err.details;
    res.status(err.statusCode).json({ error: body });
    return;
  }

  const prismaErr = err as { code?: string };
  if (prismaErr?.code === "P2002") {
    res.status(409).json({
      error: { code: "IDEMPOTENCY_CONFLICT", message: "Такой Idempotency-Key уже есть." },
    });
    return;
  }
  if (prismaErr?.code === "P2025") {
    res.status(404).json({
      error: { code: "NOT_FOUND", message: "Запись не найдена." },
    });
    return;
  }

  console.error(err);
  // В ответе возвращаем реальное сообщение — по нему можно понять причину (БД, Prisma и т.д.)
  const message = err instanceof Error ? err.message : "Ошибка сервера.";
  res.status(500).json({ error: { code: "INTERNAL_ERROR", message } });
}
