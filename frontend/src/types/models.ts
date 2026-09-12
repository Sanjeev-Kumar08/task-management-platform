export type WorkspaceRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE';
export type TaskPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type ChannelType = 'PUBLIC' | 'PRIVATE';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  status?: string;
  lastLoginAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface WorkspaceMember {
  userId: string;
  role: WorkspaceRole;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  ownerId: string;
  members: WorkspaceMember[];
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  workspaceId: string;
  name: string;
  description: string;
  createdBy: string;
  members: string[];
  createdAt: string;
  updatedAt: string;
}

export interface BoardColumn {
  id: string;
  name: string;
  position: number;
}

export interface Board {
  id: string;
  projectId: string;
  name: string;
  columns: BoardColumn[];
  createdAt: string;
  updatedAt: string;
}

export interface TaskAttachment {
  id?: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  path: string;
  uploadedAt: string;
}

export interface Task {
  id: string;
  boardId: string;
  projectId: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  position: number;
  assigneeId: string | null;
  dueDate: string | null;
  attachments: TaskAttachment[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  taskId: string;
  userId: string | User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Channel {
  id: string;
  workspaceId: string;
  name: string;
  type: ChannelType;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  workspaceId: string;
  channelId: string;
  senderId: string | User;
  content: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  entityType: string | null;
  entityId: string | null;
  read: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationPage {
  items: Notification[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface WorkspaceAnalytics {
  totalProjects: number;
  totalTasks: number;
  completedTasks: number;
  overdueTasks: number;
  tasksByStatus: Array<{ status: string; count: number }>;
  tasksByPriority: Array<{ priority: string; count: number }>;
  tasksByAssignee: Array<{ assigneeId: string | null; count: number }>;
}

export interface AuditLog {
  id: string;
  userId: string;
  workspaceId: string;
  action: string;
  entity: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface SearchResults {
  projects: Project[];
  tasks: Task[];
  comments: Comment[];
}

export interface TaskMovedEvent {
  eventId: string;
  mutationId?: string;
  task: Task;
}

export interface MessageCreatedEvent {
  eventId: string;
  message: Message;
}

export interface NotificationNewEvent {
  eventId?: string;
  notification: Notification;
}
