# WorkSpace

WorkSpace is a self-serve SaaS collaboration platform combining Notion-like organization, Trello-style Kanban, and Slack-style channels — built as a TypeScript modular monolith.

## Features

- JWT auth with refresh-token rotation, password reset, sessions
- Workspace lifecycle: create, switch, invite (new + existing users), roles, ownership transfer
- Workspace RBAC (OWNER / ADMIN / MEMBER / VIEWER) with members and invitations UI
- Projects, boards, tasks (labels, due dates, filters) with optimistic Kanban
- Channels/messages with threads, mentions, unread counts
- Realtime updates via Socket.IO
- Comments, notifications (BullMQ), search, analytics, audit activity
- File attachments via local or S3-compatible storage (signed uploads)
- Stripe billing and entitlements (Free plan works without Stripe keys)
- Email via console (dev) or Resend (prod)
- Dark mode, responsive shell, offline mutation queue
- Swagger docs, Docker Compose, GitHub Actions CI, Vitest coverage

## Tech stack

| Layer    | Tech                                                                                      |
| -------- | ----------------------------------------------------------------------------------------- |
| Frontend | React, Vite, TypeScript, Tailwind, Zustand, RHF, Zod, Axios, dnd-kit, Socket.IO Client    |
| Backend  | Express, TypeScript, Mongoose, Redis (ioredis), BullMQ, Socket.IO, JWT, Zod, Multer, Pino |
| Infra    | Docker Compose, MongoDB, Redis, GitHub Actions, Stripe, Resend, S3/R2                     |

## Architecture

Modular monolith — see [docs/architecture.md](docs/architecture.md) and [docs/er-diagram.md](docs/er-diagram.md).

```text
Browser (React) → Express API → MongoDB
                              → Redis (cache + sessions + BullMQ)
                              → Socket.IO rooms
                              → Object storage (local | S3)
                              → Email (console | Resend)
                              → Stripe (optional)
```

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:4000
- Swagger: http://localhost:4000/api/docs
- Readiness: http://localhost:4000/api/ready

Seed after backend is up:

```bash
npm run seed
```

## Local development

Prerequisites: Node 20+, MongoDB (replica set for transactions), Redis.

```bash
cp .env.example .env
npm install
docker compose up mongodb redis -d
npm run seed
npm run dev
```

Workspace creation uses MongoDB transactions, so Mongo must run as a replica set (`?replicaSet=rs0` in `MONGODB_URI`).

## Environment variables

See [.env.example](.env.example). Dev defaults: `EMAIL_PROVIDER=console`, `STORAGE_PROVIDER=local`, Free billing without Stripe keys.

## Demo credentials

| Role   | Email           | Password     |
| ------ | --------------- | ------------ |
| Owner  | owner@demo.com  | Password123! |
| Admin  | admin@demo.com  | Password123! |
| Member | member@demo.com | Password123! |
| Viewer | viewer@demo.com | Password123! |

## Testing

```bash
npm test
npm run test:coverage
```

## Scripts

| Script                            | Description         |
| --------------------------------- | ------------------- |
| `npm run dev`                     | Frontend + backend  |
| `npm run build`                   | Build both packages |
| `npm run lint`                    | ESLint              |
| `npm run format` / `format:check` | Prettier            |
| `npm run typecheck`               | TypeScript          |
| `npm run seed`                    | Demo data           |

## Billing

Plans: Free / Pro / Business. Entitlements enforce limits server-side. Configure `STRIPE_*` for checkout/portal; without keys Free remains usable.

## License

MIT
