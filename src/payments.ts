/**
 * Платежи: валидация (Zod), заглушка провайдера, обработчики и роуты.
 */

import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import { prisma } from "./db.ts";
import {
  ValidationError,
  NotFoundError,
  IdempotencyConflictError,
} from "./errors.ts";

// ——— Схемы валидации (Zod) ———
// Проверяем входящие данные до записи в БД

const providers = ["yookassa", "tbank", "sber"] as const;

const createBodySchema = z.object({
  amountKopeks: z.number().int().positive("Сумма в копейках"),
  currency: z.literal("RUB").default("RUB"),
  provider: z.enum(providers),
  description: z.string().max(500).optional(),
  returnUrl: z.url().optional(),
});

const listQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  status: z.enum(["pending", "succeeded", "failed", "cancelled"]).optional(),
});

const idParamSchema = z.object({ id: z.string().min(1) });

// ——— Заглушка провайдера ———
// В проде здесь вызов API ЮKassa / Т‑Банка / Сбера

function createPaymentStub(params: {
  idempotencyKey: string;
  returnUrl?: string;
}) {
  const id = `stub_${params.idempotencyKey.slice(0, 8)}_${Date.now()}`;
  return {
    providerPaymentId: id,
    status: "pending" as const,
    payUrl: params.returnUrl ? `${params.returnUrl}?payment=${id}` : undefined,
  };
}

// ——— Преобразование записи БД в JSON для ответа ———

function paymentToJson(p: {
  id: string;
  amountKopeks: number;
  currency: string;
  provider: string;
  providerPaymentId: string | null;
  status: string;
  description: string | null;
  returnUrl: string | null;
  metadata: unknown;
  createdAt: Date;
  updatedAt: Date;
}) {
  return {
    id: p.id,
    amountKopeks: p.amountKopeks,
    currency: p.currency,
    provider: p.provider,
    providerPaymentId: p.providerPaymentId,
    status: p.status,
    description: p.description,
    returnUrl: p.returnUrl,
    metadata: p.metadata,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}

// ——— Обработчики (handlers) ———
// Каждый handler: читает req, пишет в БД через prisma, отправляет res

async function createPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const key = req.headers["idempotency-key"];
    const idempotencyKey =
      typeof key === "string" && key.trim() ? key.trim() : null;
    if (!idempotencyKey) {
      throw new ValidationError("Нужен заголовок Idempotency-Key");
    }

    const parsed = createBodySchema.safeParse(req.body);
    if (!parsed.success) {
      throw new ValidationError("Неверное тело запроса", parsed.error.flatten());
    }
    const body = parsed.data;

    // Идемпотентность: тот же ключ — возвращаем тот же платёж
    const existing = await prisma.payment.findUnique({
      where: { idempotencyKey },
    });
    if (existing) {
      if (
        existing.amountKopeks !== body.amountKopeks ||
        existing.provider !== body.provider
      ) {
        throw new IdempotencyConflictError(
          "Idempotency-Key уже использован с другими данными"
        );
      }
      res.status(200).json(paymentToJson(existing));
      return;
    }

    const result = createPaymentStub({
      idempotencyKey,
      returnUrl: body.returnUrl,
    });

    const payment = await prisma.payment.create({
      data: {
        amountKopeks: body.amountKopeks,
        currency: body.currency,
        provider: body.provider,
        providerPaymentId: result.providerPaymentId,
        status: result.status,
        idempotencyKey,
        description: body.description ?? null,
        returnUrl: body.returnUrl ?? null,
        metadata: result.payUrl ? { payUrl: result.payUrl } : undefined,
      },
    });

    res.status(201).json(paymentToJson(payment));
  } catch (e) {
    next(e);
  }
}

async function listPayments(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = listQuerySchema.safeParse(req.query);
    if (!parsed.success) {
      throw new ValidationError("Неверные параметры", parsed.error.flatten());
    }
    const { limit, status } = parsed.data;

    const payments = await prisma.payment.findMany({
      where: status ? { status } : undefined,
      take: limit,
      orderBy: { createdAt: "desc" },
    });

    res.status(200).json({ items: payments.map(paymentToJson) });
  } catch (e) {
    next(e);
  }
}

async function getPayment(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const parsed = idParamSchema.safeParse(req.params);
    if (!parsed.success) {
      throw new ValidationError("Неверный id");
    }
    const payment = await prisma.payment.findUnique({
      where: { id: parsed.data.id },
    });
    if (!payment) {
      throw new NotFoundError("Платёж", parsed.data.id);
    }
    res.status(200).json(paymentToJson(payment));
  } catch (e) {
    next(e);
  }
}

// ——— Роутер ———
// Подключаем обработчики к путям

export const paymentsRouter = Router();
paymentsRouter.post("/payments", createPayment);
paymentsRouter.get("/payments", listPayments);
paymentsRouter.get("/payments/:id", getPayment);
