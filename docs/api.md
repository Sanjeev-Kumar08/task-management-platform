# WorkSpace API Documentation

Swagger UI is the source of truth: [http://localhost:4000/api/docs](http://localhost:4000/api/docs)

## Common response format

Success:

```json
{
  "success": true,
  "data": {},
  "message": "Operation successful"
}
```

Error:

```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Invalid request"
  }
}
```

## Authentication

- `POST /api/auth/register` — create account; returns access token; sets refresh cookie
- `POST /api/auth/login` — login
- `POST /api/auth/refresh` — rotate refresh cookie; return new access token
- `POST /api/auth/logout` — invalidate refresh session
- `GET /api/auth/me` — current user
- `PATCH /api/auth/profile` — update profile

Access token: `Authorization: Bearer <token>` (15 minutes).  
Refresh token: HTTP-only cookie on `/api/auth` path (7 days), rotated on each refresh.

## Authorization (RBAC)

Workspace roles: `OWNER` > `ADMIN` > `MEMBER` > `VIEWER`.

Protected operations enforce role checks server-side via `authenticate` and `requireWorkspaceRole` / service asserts.

## Pagination

Notifications:

```text
GET /api/notifications?page=1&limit=20
```

Response includes `items`, `page`, `limit`, `total`, `hasMore`.

## Error codes

| Code                     | HTTP | Meaning                |
| ------------------------ | ---- | ---------------------- |
| VALIDATION_ERROR         | 422  | Zod / input validation |
| UNAUTHORIZED             | 401  | Missing/invalid token  |
| FORBIDDEN                | 403  | Insufficient role      |
| NOT_FOUND                | 404  | Missing resource       |
| CONFLICT / DUPLICATE_KEY | 409  | Unique constraint      |
| UPLOAD_ERROR             | 400  | Multer / file issues   |
| INTERNAL_ERROR           | 500  | Unexpected             |

## API inventory (~40 endpoints)

### Auth (6)

- POST `/api/auth/register`
- POST `/api/auth/login`
- POST `/api/auth/refresh`
- POST `/api/auth/logout`
- GET `/api/auth/me`
- PATCH `/api/auth/profile`

### Workspaces (7)

- GET `/api/workspaces`
- POST `/api/workspaces`
- GET `/api/workspaces/:id`
- PATCH `/api/workspaces/:id`
- DELETE `/api/workspaces/:id`
- POST `/api/workspaces/:id/members`
- DELETE `/api/workspaces/:id/members/:userId`

### Analytics / Audit (2)

- GET `/api/workspaces/:id/analytics`
- GET `/api/workspaces/:id/activity`

### Projects (5)

- GET `/api/workspaces/:workspaceId/projects`
- POST `/api/workspaces/:workspaceId/projects`
- GET `/api/projects/:id`
- PATCH `/api/projects/:id`
- DELETE `/api/projects/:id`

### Boards (5)

- GET `/api/projects/:projectId/boards`
- POST `/api/projects/:projectId/boards`
- GET `/api/boards/:id`
- PATCH `/api/boards/:id`
- DELETE `/api/boards/:id`

### Tasks (8)

- GET `/api/boards/:boardId/tasks`
- POST `/api/boards/:boardId/tasks`
- GET `/api/tasks/:id`
- PATCH `/api/tasks/:id`
- DELETE `/api/tasks/:id`
- PATCH `/api/tasks/:id/move`
- PATCH `/api/tasks/:id/assign`
- POST `/api/tasks/:id/attachments`

### Comments (3)

- GET `/api/tasks/:taskId/comments`
- POST `/api/tasks/:taskId/comments`
- DELETE `/api/comments/:id`

### Notifications (3)

- GET `/api/notifications`
- PATCH `/api/notifications/:id/read`
- PATCH `/api/notifications/read-all`

### Search (1)

- GET `/api/search?q=`

### Channels / Messages (3)

- GET `/api/workspaces/:workspaceId/channels`
- GET `/api/channels/:channelId/messages`
- POST `/api/channels/:channelId/messages`

**Total: 43** (within assessment range with minimal channels/messages for the Messages demo).

## Health

- GET `/api/health`
