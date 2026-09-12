/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name: { type: string }
 *               email: { type: string }
 *               password: { type: string }
 *     responses:
 *       201:
 *         description: Registered
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Login
 *     responses:
 *       200:
 *         description: Logged in
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Refresh access token
 *     responses:
 *       200:
 *         description: Token refreshed
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     security: []
 *     summary: Logout
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Current user
 * /api/auth/profile:
 *   patch:
 *     tags: [Auth]
 *     summary: Update profile
 * /api/workspaces:
 *   get:
 *     tags: [Workspaces]
 *     summary: List workspaces
 *   post:
 *     tags: [Workspaces]
 *     summary: Create workspace (transaction)
 * /api/workspaces/{id}:
 *   get:
 *     tags: [Workspaces]
 *     summary: Get workspace
 *   patch:
 *     tags: [Workspaces]
 *     summary: Update workspace
 *   delete:
 *     tags: [Workspaces]
 *     summary: Delete workspace
 * /api/workspaces/{id}/members:
 *   post:
 *     tags: [Workspaces]
 *     summary: Add member
 * /api/workspaces/{id}/members/{userId}:
 *   delete:
 *     tags: [Workspaces]
 *     summary: Remove member
 * /api/workspaces/{id}/analytics:
 *   get:
 *     tags: [Analytics]
 *     summary: Workspace analytics aggregation
 * /api/workspaces/{id}/activity:
 *   get:
 *     tags: [Audit]
 *     summary: Recent audit activity
 * /api/workspaces/{workspaceId}/projects:
 *   get:
 *     tags: [Projects]
 *     summary: List projects
 *   post:
 *     tags: [Projects]
 *     summary: Create project
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project
 *   patch:
 *     tags: [Projects]
 *     summary: Update project
 *   delete:
 *     tags: [Projects]
 *     summary: Delete project
 * /api/projects/{projectId}/boards:
 *   get:
 *     tags: [Boards]
 *     summary: List boards
 *   post:
 *     tags: [Boards]
 *     summary: Create board
 * /api/boards/{id}:
 *   get:
 *     tags: [Boards]
 *     summary: Get board
 *   patch:
 *     tags: [Boards]
 *     summary: Update board
 *   delete:
 *     tags: [Boards]
 *     summary: Delete board
 * /api/boards/{boardId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks
 *   post:
 *     tags: [Tasks]
 *     summary: Create task
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete task
 * /api/tasks/{id}/move:
 *   patch:
 *     tags: [Tasks]
 *     summary: Move task (status/position)
 * /api/tasks/{id}/assign:
 *   patch:
 *     tags: [Tasks]
 *     summary: Assign task
 * /api/tasks/{id}/attachments:
 *   post:
 *     tags: [Tasks]
 *     summary: Upload attachment
 * /api/tasks/{taskId}/comments:
 *   get:
 *     tags: [Comments]
 *     summary: List comments
 *   post:
 *     tags: [Comments]
 *     summary: Create comment
 * /api/comments/{id}:
 *   delete:
 *     tags: [Comments]
 *     summary: Delete comment
 * /api/notifications:
 *   get:
 *     tags: [Notifications]
 *     summary: List notifications (paginated)
 * /api/notifications/read-all:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark all read
 * /api/notifications/{id}/read:
 *   patch:
 *     tags: [Notifications]
 *     summary: Mark one read
 * /api/search:
 *   get:
 *     tags: [Search]
 *     summary: Search projects, tasks, comments
 * /api/workspaces/{workspaceId}/channels:
 *   get:
 *     tags: [Channels]
 *     summary: List channels
 * /api/channels/{channelId}/messages:
 *   get:
 *     tags: [Messages]
 *     summary: List messages
 *   post:
 *     tags: [Messages]
 *     summary: Send message
 */
export {};
