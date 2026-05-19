# Barboss

Mobile-first Next.js application for Barboss.

## Stack

- Next.js + TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Cookie-based session auth

## Local Setup

1. Install dependencies:

```bash
npm install
```

2. Create local env file:

```powershell
Copy-Item .env.example .env -Force
```

3. Start local Prisma Postgres (writes a working `DATABASE_URL` and `SESSION_SECRET` into `.env`):

```bash
npm run db:local
```

Do not skip this step if you do not have your own PostgreSQL URL yet.  
If `db:push` fails with `Can't reach database server at HOST`, your `.env` still has the example placeholder — run `npm run db:local` again.

4. Generate Prisma client:

```bash
npm run db:generate
```

6. Sync the local database schema (Prisma dev DB must be running — check with `npx prisma dev ls`):

```bash
npm run db:push
```

7. Seed initial users and tasks:

```bash
npm run db:seed
```

8. Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`.

## Supabase Storage (видео-доказательства)

1. Создай проект на [supabase.com](https://supabase.com).
2. **Storage → New bucket** → имя `barboss` → **Public bucket**.
3. **Storage → S3** → **Generate access keys**.
4. В `.env`:

```env
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY="sb_publishable_..."
SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
SUPABASE_STORAGE_BUCKET="barboss"
STORAGE_DRIVER="supabase"
SUPABASE_SECRET_KEY="sb_secret_..."  # Settings → API Keys → Create secret key
```

`sb_publishable_*` **не работает** для серверной загрузки. Нужен **Secret key** (`sb_secret_...`) или legacy `service_role` / `anon` (`eyJ...`).

### Где взять Secret key (если нет service_role)

1. [Settings → API Keys](https://supabase.com/dashboard/project/dmjgjiaonsikqnuldnnw/settings/api-keys)
2. **Create new secret key** → скопируй `sb_secret_...`
3. В `.env`: `SUPABASE_SECRET_KEY="sb_secret_..."`
4. Вкладка **Legacy anon, service_role** — старые JWT-ключи, если нужны

5. Проверка:

```bash
npm run storage:test
npm run dev
```

Видео для заданий снимается **только с камеры** (галерея отключена).

## Уведомления и Telegram (часть 6)

В `.env` (опционально):

```env
TELEGRAM_BOT_TOKEN=""
ADMIN_TELEGRAM_CHAT_ID=""      # chat.id админа
PARTICIPANT_TELEGRAM_CHAT_ID="" # chat.id участника
```

Узнать правильные id: напиши боту `/start`, затем `npm run telegram:discover`.  
**Не используй `update_id`** из getUpdates — нужен `message.chat.id`.

Проверка: `npm run telegram:test`

- Колокольчик в шапке → `/app/notifications` или `/admin/notifications`
- Toast после действий (отправка задания, покупка, проверка)
- Чат admin ↔ participant: `/app/chat`, `/admin/chat` (текст, фото, видео, голос, кружочки)
- История участника: `/app/history` (фильтры: задания, магазин, начисления, штрафы)
- Отчёты админа: `/admin/reports` (сводка, таблица, CSV, лог открытий/экспорта)
- Логи и ошибки: `/admin/logs`, `/admin/errors` (фильтры, смена статуса open → fixed)
- 404 и error boundary с отчётом в Telegram

После обновления модели логов:

```bash
npm run db:migrate-logs
npm run db:push
```
- Telegram при новом сообщении в чате

Если обновляешь старую БД после смены `Notification`:

```bash
npm run db:migrate-notifications
npm run db:push
```

После обновления модели чата (поля `messageType`, `text`, вложения):

```bash
npm run db:migrate-chat
npm run db:push
```

## Neon (cloud PostgreSQL)

1. Create a project at [neon.tech](https://neon.tech).
2. Copy the connection string (starts with `postgresql://`).
3. Put it in `.env` as `DATABASE_URL="..."`.
4. Set `SESSION_SECRET` to any random string with at least 16 characters.
5. Run `npm run db:push` and `npm run db:seed`.

## Seed Users

- `admin` / `drayaparol` / `admin`
- `rayakrutaya2006` / `rayakrutaya2006` / `participant`

The seed script also creates the base Barboss task catalog.
