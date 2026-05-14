# Hearek Backend

NestJS + TypeScript + Prisma backend for the Hearek rehabilitation platform.

## Stack
- **NestJS 10** — modular HTTP framework
- **Prisma 5** — type-safe ORM (SQLite by default, PostgreSQL-ready)
- **JWT (passport-jwt)** — stateless authentication
- **bcrypt** — password hashing
- **class-validator** — DTO validation
- **helmet + throttler** — security hardening

## Architecture
```
src/
  main.ts                   bootstrap (CORS, helmet, validation, prefix /api)
  app.module.ts             root module
  common/
    decorators/             @CurrentUser, @Roles, @Public
    guards/                 JwtAuthGuard, RolesGuard
    filters/                global HTTP exception filter
  config/                   typed config loader
  prisma/                   PrismaService + PrismaModule
  modules/
    auth/                   signup, signin, signout
    users/                  /api/me
    children/               /api/children
    exercises/              daily picks + completion toggling
    progress/               progress + milestones
    diagnostics/            questions + submissions
    chat/                   AI assistant chat
    assignments/            parent-side assignment updates
    speech-checks/          mic recordings metrics
    games/                  mini-game scores
    risk/                   early risk alert engine
    specialist/             specialist panel (stats, patients, notes, assignments)
```

## Quick start
```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run start:dev
```

Server starts on `http://localhost:3001`, all routes prefixed with `/api`.

## Demo accounts (seeded)
- Parent: `ona@misol.uz` / `demo1234`
- Specialist: `nigora@misol.uz` / `demo1234`

## Switching to PostgreSQL
1. Edit `prisma/schema.prisma` → `provider = "postgresql"`
2. Set `DATABASE_URL` in `.env`
3. `npx prisma migrate dev --name init`
