# WorkSpace Architecture

WorkSpace is a **modular monolith**: one Express TypeScript API and one React SPA, sharing MongoDB and Redis.

## High-level

```mermaid
flowchart TB
  Browser["React_Vite_Zustand"]
  API["Express_Modular_Monolith"]
  Mongo[(MongoDB)]
  Redis[(Redis)]
  Bull["BullMQ_Workers"]
  Sockets["Socket_IO"]

  Browser -->|"REST_Axios"| API
  Browser -->|"Socket_IO"| Sockets
  API --> Mongo
  API --> Redis
  API --> Bull
  API --> Sockets
  Bull --> Redis
  Bull -->|"notify_emit"| Sockets
```

## Request path

```mermaid
flowchart LR
  Client --> Routes
  Routes --> Controllers
  Controllers --> Services
  Services --> Repositories
  Repositories --> MongoDB
  Services --> Redis
  Services --> BullMQ
  Services --> SocketIO
```

## Background jobs

```mermaid
flowchart TB
  API["API_Service"] --> QNotify["notifications_queue"]
  API --> QEmail["emails_queue"]
  Scheduler["Recurring_cleanup"] --> QCleanup["cleanup_queue"]
  QNotify --> WNotify["NotificationWorker"]
  QEmail --> WEmail["EmailWorker"]
  QCleanup --> WCleanup["CleanupWorker"]
  WNotify --> Mongo[(MongoDB)]
  WNotify --> SocketIO["Socket_IO"]
  WEmail --> Logs["Structured_logs"]
```

## Realtime

```mermaid
flowchart LR
  Mutation["REST_mutation"] --> Persist["MongoDB"]
  Persist --> Emit["Socket_IO_emit"]
  Emit --> Room["board_or_channel_room"]
  Room --> Clients["Connected_clients"]
```

## Modules

Backend modules live under `backend/src/modules/*` with controller → service → repository/model layering:

- auth, users, workspaces, projects, boards, tasks
- comments, channels, messages, notifications, search, audit

## Security

- JWT access tokens (15m) + HTTP-only refresh cookies (7d) with Redis session rotation
- Workspace RBAC: OWNER / ADMIN / MEMBER / VIEWER
- Helmet, CORS(`CLIENT_URL`), rate limiting, Zod validation, Multer MIME/size checks
