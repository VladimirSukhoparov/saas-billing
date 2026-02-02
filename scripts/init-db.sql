-- Запустить под суперпользователем (postgres):
--   psql -U postgres -d saas_billing -f scripts/init-db.sql
--
-- 1) Права для saas_user на схему public
-- 2) Создание таблицы payments

GRANT USAGE ON SCHEMA public TO saas_user;
GRANT CREATE ON SCHEMA public TO saas_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO saas_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO saas_user;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO saas_user;

-- Таблица payments (если ещё нет)
CREATE TABLE IF NOT EXISTS "payments" (
    "id" TEXT NOT NULL,
    "amountKopeks" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'RUB',
    "provider" TEXT NOT NULL,
    "providerPaymentId" TEXT,
    "status" TEXT NOT NULL,
    "idempotencyKey" TEXT NOT NULL,
    "description" TEXT,
    "returnUrl" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "payments_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "payments_providerPaymentId_key" ON "payments"("providerPaymentId");
CREATE UNIQUE INDEX IF NOT EXISTS "payments_idempotencyKey_key" ON "payments"("idempotencyKey");
CREATE INDEX IF NOT EXISTS "payments_status_idx" ON "payments"("status");
