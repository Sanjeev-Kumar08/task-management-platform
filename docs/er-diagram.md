# WorkSpace ER Diagram

```mermaid
erDiagram
  User ||--o{ Workspace : owns
  User ||--o{ WorkspaceMember : joins
  Workspace ||--o{ WorkspaceMember : has
  Workspace ||--o{ Project : contains
  Workspace ||--o{ Channel : contains
  Workspace ||--o{ AuditLog : records
  Project ||--o{ Board : has
  Project ||--o{ Task : has
  Board ||--o{ Task : contains
  Task ||--o{ Comment : has
  Task }o--o| User : assignee
  Channel ||--o{ Message : has
  User ||--o{ Message : sends
  User ||--o{ Notification : receives
  User ||--o{ Comment : writes
  User ||--o{ AuditLog : performs

  User {
    ObjectId _id
    string name
    string email
    string passwordHash
    string avatar
    string status
    date lastLoginAt
  }

  Workspace {
    ObjectId _id
    string name
    string slug
    ObjectId ownerId
  }

  WorkspaceMember {
    ObjectId userId
    string role
  }

  Project {
    ObjectId _id
    ObjectId workspaceId
    string name
    string description
    ObjectId createdBy
  }

  Board {
    ObjectId _id
    ObjectId projectId
    string name
  }

  Task {
    ObjectId _id
    ObjectId boardId
    ObjectId projectId
    string title
    string status
    string priority
    number position
    ObjectId assigneeId
    date dueDate
  }

  Comment {
    ObjectId _id
    ObjectId taskId
    ObjectId userId
    string content
  }

  Channel {
    ObjectId _id
    ObjectId workspaceId
    string name
    string type
  }

  Message {
    ObjectId _id
    ObjectId workspaceId
    ObjectId channelId
    ObjectId senderId
    string content
  }

  Notification {
    ObjectId _id
    ObjectId userId
    string type
    string title
    string message
    boolean read
  }

  AuditLog {
    ObjectId _id
    ObjectId userId
    ObjectId workspaceId
    string action
    string entity
    ObjectId entityId
  }
```

## Relationships

- A user can own and join many workspaces via `members[]`.
- Projects belong to a workspace; boards belong to a project.
- Tasks belong to a board/project and may reference an assignee.
- Comments belong to tasks; messages belong to channels.
- Notifications are per-user; audit logs are per workspace action.
