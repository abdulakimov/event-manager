# Event Manager — Admin Panel

Modern admin dashboard for managing events, organizers, students, and registrations.

## Highlights
- Events CRUD with registrations management
- Organizers with leader assignment (AdminUser)
- Users (students) list + detail with registration breakdown
- Role-based access (SUPERADMIN, EDITOR, CLUB/ FACULTY leader)
- Excel export for registrations

## Tech Stack
- Next.js (App Router)
- Prisma ORM + PostgreSQL
- Tailwind CSS + shadcn/ui
- Better Auth (Google)

## Project Structure
- `src/app/(dashboard)` – admin routes
- `src/components` – UI + feature components
- `src/lib` – helpers (auth, prisma, toast, etc.)
- `prisma/schema.prisma` – database schema

## Requirements
- Node.js 18+
- PostgreSQL (local or cloud)

## Environment
Create `.env` with:
```
DATABASE_URL=postgresql://...
BETTER_AUTH_SECRET=...
BETTER_AUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

## Development
Install dependencies and run:
```
npm install
npm run dev
```

Open: `http://localhost:3000`

## Lint
```
npm run lint
```

## Database (Prisma)
Migrations + client:
```
npx prisma migrate dev
npx prisma generate
```

## Deployment (high level)
- **Web**: Deploy `apps/admin` to Vercel
- **DB**: Neon PostgreSQL
- **Bot**: `apps/bot` on VPS (systemd/pm2)

## Scripts
From `apps/admin`:
- `npm run dev`
- `npm run lint`
- `npx prisma migrate dev`
- `npx prisma generate`

---
If you want a full deployment guide (Vercel + Neon + VPS), ask and I’ll generate it.
