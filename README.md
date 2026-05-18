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

```bash
Copy-Item .env.example .env -Force
```

3. Fill `SESSION_SECRET` in `.env`.

4. Start local Prisma Postgres without Docker:

```bash
npm run db:local
```

5. Generate Prisma client:

```bash
npm run db:generate
```

6. Sync the local database schema:

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

## Seed Users

- `admin` / `drayaparol` / `admin`
- `rayakrutaya2006` / `rayakrutaya2006` / `participant`

The seed script also creates the base Barboss task catalog.
