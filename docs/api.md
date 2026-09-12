# WorkSpace API Documentation

Swagger UI is the source of truth: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

## Authentication

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/refresh`
- `POST /api/auth/logout`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/change-password`
- `GET /api/auth/me`
- `PATCH /api/auth/profile`
- `GET /api/auth/sessions`
- `DELETE /api/auth/sessions/:sessionId`
- `DELETE /api/auth/account`

## Workspaces

- `GET/POST /api/workspaces`
- `GET/PATCH/DELETE /api/workspaces/:id`
- `POST /api/workspaces/:id/members`
- `PATCH /api/workspaces/:id/members/:userId`
- `DELETE /api/workspaces/:id/members/:userId`
- `POST /api/workspaces/:id/leave`
- `POST /api/workspaces/:id/transfer-ownership`
- `GET /api/workspaces/:id/analytics`
- `GET /api/workspaces/:id/activity`
- `GET/POST /api/workspaces/:id/invitations`
- `POST /api/workspaces/:id/invitations/:inviteId/resend`
- `DELETE /api/workspaces/:id/invitations/:inviteId`

## Invitations (public/auth)

- `GET /api/invitations/:token`
- `POST /api/invitations/:token/accept`

## Billing

- `GET /api/billing/plans`
- `GET /api/billing/subscription`
- `POST /api/billing/checkout`
- `POST /api/billing/portal`
- `POST /api/billing/webhook` (raw Stripe body)

## Storage

- `POST /api/storage/sign-upload`
- `PUT /api/storage/upload`
- `GET /api/storage/download`

## Projects / Boards / Tasks / Comments

Unchanged core paths plus project archive via `PATCH /api/projects/:id` (`archived`), task `labels`, comment `PATCH /api/comments/:id`.

## Channels / Messages

- `GET/POST /api/workspaces/:workspaceId/channels`
- `PATCH/DELETE /api/workspaces/:workspaceId/channels/:channelId`
- `POST /api/workspaces/:workspaceId/channels/:channelId/read`
- `GET/POST /api/channels/:channelId/messages` (paginated `{ items, nextCursor }`, threads via `parentMessageId`)
- `PATCH/DELETE /api/messages/:messageId`

## Health

- `GET /api/health`
- `GET /api/ready`
