# WorkSpace

WorkSpace is a production-style Mini SaaS collaboration app combining Notion-like organization, Trello-style Kanban, and Slack-style channels — built as a TypeScript modular monolith for assessment demonstration.

## Features

- JWT auth with refresh-token rotation (HTTP-only cookies + Redis sessions)
- Workspace RBAC (OWNER / ADMIN / MEMBER / VIEWER)
- Projects, boards, tasks with optimistic Kanban drag-and-drop
- Realtime updates via Socket.IO
- Comments, notifications (BullMQ), search, analytics aggregations
- File attachments (local disk), audit logs, dark mode, lightweight offline board cache
- Swagger docs, Docker Compose, GitHub Actions CI, Vitest coverage

## Tech stack

| Layer    | Tech                                                                                      |
| -------- | ----------------------------------------------------------------------------------------- |
| Frontend | React, Vite, TypeScript, Tailwind, Zustand, RHF, Zod, Axios, dnd-kit, Socket.IO Client    |
| Backend  | Express, TypeScript, Mongoose, Redis (ioredis), BullMQ, Socket.IO, JWT, Zod, Multer, Pino |
| Infra    | Docker Compose, MongoDB, Redis, GitHub Actions                                            |

## Architecture

Modular monolith — see [docs/architecture.md](docs/architecture.md) and [docs/er-diagram.md](docs/er-diagram.md).

```text
Browser (React) → Express API → MongoDB
                              → Redis (cache + sessions + BullMQ)
                              → Socket.IO rooms
```

## Quick start (Docker)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- API: http://localhost:4000
- Swagger: http://localhost:4000/api/docs

Seed after backend is up (local Node) or exec into the backend container:

```bash
npm run seed
```

## Local development

Prerequisites: Node 20+, MongoDB (replica set for transactions), Redis.

```bash
cp .env.example .env
npm install
# start Mongo (replica set) + Redis — easiest via:
docker compose up mongodb redis -d
npm run seed
npm run dev
```

> Workspace creation uses MongoDB transactions, so Mongo must run as a replica set (`?replicaSet=rs0` in `MONGODB_URI`). The Docker Compose Mongo service is already configured this way.

## Environment variables

See [.env.example](.env.example):

`NODE_ENV`, `PORT`, `MONGODB_URI`, `REDIS_URL`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRES_IN`, `JWT_REFRESH_EXPIRES_IN`, `CLIENT_URL`, `UPLOAD_DIR`, `MAX_FILE_SIZE`, `COOKIE_SECURE`, `LOG_LEVEL`.

## Demo credentials

| Role   | Email           | Password     |
| ------ | --------------- | ------------ |
| Owner  | owner@demo.com  | Password123! |
| Admin  | admin@demo.com  | Password123! |
| Member | member@demo.com | Password123! |
| Viewer | viewer@demo.com | Password123! |

## API

- Swagger UI: `/api/docs`
- Inventory: [docs/api.md](docs/api.md)

## Testing

```bash
npm test
npm run test:coverage
```

Target coverage ≥ 60%.

## Scripts

| Script                            | Description         |
| --------------------------------- | ------------------- |
| `npm run dev`                     | Frontend + backend  |
| `npm run build`                   | Build both packages |
| `npm run lint`                    | ESLint              |
| `npm run format` / `format:check` | Prettier            |
| `npm run typecheck`               | TypeScript          |
| `npm run seed`                    | Demo data           |

## Security

- bcrypt password hashes
- Short-lived access JWT + rotating refresh cookies
- Helmet, CORS locked to `CLIENT_URL`, rate limiting
- Zod validation on all mutating endpoints
- Upload MIME/size/filename sanitization
- Server-side RBAC on every protected operation

## Caching

Analytics cached in Redis at `workspace:analytics:{workspaceId}` (TTL 60s), invalidated on task/project/board mutations.

## Background jobs (BullMQ)

- `notifications` — persist Notification + emit `notification:new`
- `emails` — simulated invite emails (logged)
- `cleanup` — recurring expired-session cleanup hook

## Realtime (Socket.IO)

Authenticated connections; authorized joins for `workspace:`, `project:`, `board:`, `channel:` rooms. Events include `task:*`, `comment:created`, `message:created`, `notification:new`. Mutation IDs prevent optimistic/realtime loops.

## Offline

When offline, the UI shows a banner, serves last-known board state from `localStorage`, and disables mutating actions. On reconnect, board data is revalidated.

## Trade-offs (intentional)

- Local disk uploads instead of S3
- Simulated email delivery (no external provider)
- Lightweight offline (no multi-device CRDT)
- Desktop-first UI polish
- Minimal channels/messages (list + send only)
- Modular monolith instead of microservices
- MongoDB text search instead of Elasticsearch

## License

MIT (assessment project)
