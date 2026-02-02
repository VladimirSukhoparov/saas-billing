# Оплата за использование сервиса

Минимальный API для приёма оплаты за сервис (ЮKassa, Т‑Банк, Сбер). Уровень intern/junior: одна таблица платежей, три метода API. Одна таблица платежей, три метода API.

### https://saas-billing-iota.vercel.app/api-docs

## Структура `src/`

| Файл | Назначение |
|------|------------|
| `server.ts` | Точка входа: Express, роуты, запуск сервера |
| `payments.ts` | Платежи: схемы Zod, заглушка провайдера, обработчики, роутер |
| `db.ts` | Подключение к БД (Prisma) |
| `errors.ts` | Классы ошибок и обработчик errorHandler |
| `swagger.ts` | Описание API для Swagger UI |

Папок `routes/` и `services/` нет — вся логика платежей в одном файле `payments.ts`.

## Запуск

```bash
npm install
npm run db:generate   # сгенерировать Prisma Client
```

**Первый запуск — создать таблицу в БД.** Если пользователь из `DATABASE_URL` (например `saas_user`) не может создавать таблицы в `public`, один раз под суперпользователем выполните:

```bash
psql -U postgres -d saas_billing -f scripts/init-db.sql
```

Или если права уже есть: `npm run db:push`.

**Если таблицы уже созданы** (через `db:push` или `init-db.sql`) и при `npm run db:migrate` появляется ошибка P3005 («schema is not empty»), один раз выполните baseline — пометьте миграцию как применённую:

```bash
npx prisma migrate resolve --applied 20260201120000_init
```

После этого `npm run db:migrate` будет проходить без ошибок.

```bash
npm run dev
```

- API: http://localhost:3000  
- Документация: http://localhost:3000/api-docs  

## API

| Метод | Путь | Описание |
|-------|------|----------|
| **POST** | `/api/v1/payments` | Создать платёж (обязателен заголовок `Idempotency-Key`) |
| **GET** | `/api/v1/payments` | Список платежей (параметры: `limit`, `status`) |
| **GET** | `/api/v1/payments/:id` | Один платёж по id |

### Создание платежа

Тело запроса:
- `amountKopeks` (число) — сумма в копейках, например 29900 = 299 ₽
- `provider` (строка) — `yookassa`, `tbank` или `sber`
- `returnUrl` (строка, необязательно) — куда вернуть пользователя после оплаты
- `description` (строка, необязательно)

Заголовок:
- `Idempotency-Key` — уникальная строка для запроса. Если отправить тот же ключ и те же данные дважды, вернётся тот же платёж (без дубликата).

### Ошибки

Ответ с ошибкой: `{ "error": { "code": "...", "message": "..." } }`

- **400** — неверное тело или параметры (`VALIDATION_ERROR`)
- **404** — платёж не найден (`NOT_FOUND`)
- **409** — один и тот же Idempotency-Key использован с другими данными (`IDEMPOTENCY_CONFLICT`)
- **500** — ошибка сервера (`INTERNAL_ERROR`)

## База данных

Одна таблица **payments**:
- id, amountKopeks, currency, provider, status, idempotencyKey
- returnUrl, description, providerPaymentId, metadata
- createdAt, updatedAt

Схема в `prisma/schema.prisma`. Применение: `npm run db:push` или `npx prisma migrate deploy`.