import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash, randomBytes } from 'node:crypto';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../../.env'), override: true });
loadEnv();

process.env.MONGODB_URI ??= 'mongodb://127.0.0.1:27017/workspace?directConnection=true';

function hashToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI!);
  const db = mongoose.connection.db;
  if (!db) throw new Error('No DB');

  await db.dropDatabase();

  const { User } = await import('../modules/users/user.model.js');
  const { Workspace } = await import('../modules/workspaces/workspace.model.js');
  const { Project } = await import('../modules/projects/project.model.js');
  const { Board } = await import('../modules/boards/board.model.js');
  const { Task } = await import('../modules/tasks/task.model.js');
  const { Comment } = await import('../modules/comments/comment.model.js');
  const { Channel } = await import('../modules/channels/channel.model.js');
  const { Message } = await import('../modules/messages/message.model.js');
  const { Notification } = await import('../modules/notifications/notification.model.js');
  const { Invitation } = await import('../modules/invitations/invitation.model.js');
  const { Subscription } = await import('../modules/billing/subscription.model.js');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const owner = await User.create({
    name: 'Demo Owner',
    email: 'owner@demo.com',
    passwordHash,
  });
  const admin = await User.create({
    name: 'Demo Admin',
    email: 'admin@demo.com',
    passwordHash,
  });
  const member = await User.create({
    name: 'Demo Member',
    email: 'member@demo.com',
    passwordHash,
  });
  const viewer = await User.create({
    name: 'Demo Viewer',
    email: 'viewer@demo.com',
    passwordHash,
  });

  await Subscription.create({
    ownerId: owner._id,
    planId: 'free',
    status: 'active',
  });

  const workspace = await Workspace.create({
    name: 'Acme Collaboration',
    slug: 'acme',
    description: 'Primary product workspace',
    ownerId: owner._id,
    members: [
      { userId: owner._id, role: 'OWNER', joinedAt: new Date() },
      { userId: admin._id, role: 'ADMIN', joinedAt: new Date() },
      { userId: member._id, role: 'MEMBER', joinedAt: new Date() },
      { userId: viewer._id, role: 'VIEWER', joinedAt: new Date() },
    ],
  });

  const workspace2 = await Workspace.create({
    name: 'Owner Side Project',
    slug: 'side-project',
    description: 'Second workspace for switcher demo',
    ownerId: owner._id,
    members: [{ userId: owner._id, role: 'OWNER', joinedAt: new Date() }],
  });

  const project1 = await Project.create({
    workspaceId: workspace._id,
    name: 'Product Launch',
    description: 'Q2 launch workstream',
    createdBy: owner._id,
    members: [owner._id, admin._id, member._id],
  });
  const project2 = await Project.create({
    workspaceId: workspace._id,
    name: 'Platform Ops',
    description: 'Internal tooling',
    createdBy: admin._id,
    members: [owner._id, admin._id],
  });

  const board1 = await Board.create({
    projectId: project1._id,
    name: 'Launch Board',
    columns: [
      { id: 'TODO', name: 'TODO', position: 0 },
      { id: 'IN_PROGRESS', name: 'IN PROGRESS', position: 1 },
      { id: 'DONE', name: 'DONE', position: 2 },
    ],
  });
  const board2 = await Board.create({
    projectId: project2._id,
    name: 'Ops Board',
    columns: [
      { id: 'TODO', name: 'TODO', position: 0 },
      { id: 'IN_PROGRESS', name: 'IN PROGRESS', position: 1 },
      { id: 'DONE', name: 'DONE', position: 2 },
    ],
  });

  await Project.create({
    workspaceId: workspace2._id,
    name: 'Ideas',
    description: 'Side project ideas',
    createdBy: owner._id,
    members: [owner._id],
  });

  const tasks = await Task.insertMany([
    {
      boardId: board1._id,
      projectId: project1._id,
      title: 'Draft launch checklist',
      description: 'Coordinate go-live criteria',
      status: 'TODO',
      priority: 'HIGH',
      position: 0,
      assigneeId: member._id,
      createdBy: owner._id,
      labels: ['launch', 'docs'],
      dueDate: new Date(Date.now() + 3 * 86400000),
    },
    {
      boardId: board1._id,
      projectId: project1._id,
      title: 'Design landing page',
      description: 'Hero and pricing sections',
      status: 'IN_PROGRESS',
      priority: 'MEDIUM',
      position: 0,
      assigneeId: admin._id,
      createdBy: admin._id,
      labels: ['design'],
    },
    {
      boardId: board1._id,
      projectId: project1._id,
      title: 'Ship beta invite emails',
      description: 'Finalize copy',
      status: 'DONE',
      priority: 'LOW',
      position: 0,
      assigneeId: owner._id,
      createdBy: owner._id,
      labels: ['email'],
    },
    {
      boardId: board2._id,
      projectId: project2._id,
      title: 'Rotate API keys',
      status: 'TODO',
      priority: 'URGENT',
      position: 0,
      createdBy: admin._id,
      dueDate: new Date(Date.now() - 86400000),
      labels: ['security'],
    },
  ]);

  await Comment.create({
    taskId: tasks[0]._id,
    userId: admin._id,
    content: 'Please include rollback steps.',
  });

  const channel = await Channel.create({
    workspaceId: workspace._id,
    name: 'general',
    type: 'PUBLIC',
    createdBy: owner._id,
    memberIds: [owner._id, admin._id, member._id, viewer._id],
  });

  const rootMsg = await Message.create({
    workspaceId: workspace._id,
    channelId: channel._id,
    senderId: owner._id,
    content: 'Welcome to Acme Collaboration!',
  });

  await Message.create({
    workspaceId: workspace._id,
    channelId: channel._id,
    senderId: member._id,
    content: 'Thanks @DemoOwner — excited to collaborate!',
    parentMessageId: rootMsg._id,
    mentions: [owner._id],
  });

  await Notification.create({
    userId: member._id,
    type: 'TASK_ASSIGNED',
    title: 'Task assigned',
    message: 'You were assigned to "Draft launch checklist"',
    entityType: 'Task',
    entityId: tasks[0]._id,
    read: false,
  });

  const inviteToken = randomBytes(24).toString('base64url');
  await Invitation.create({
    workspaceId: workspace._id,
    email: 'newhire@example.com',
    role: 'MEMBER',
    tokenHash: hashToken(inviteToken),
    expiresAt: new Date(Date.now() + 7 * 86400000),
    status: 'PENDING',
    invitedBy: owner._id,
  });

  // eslint-disable-next-line no-console
  console.log('Seed complete');
  // eslint-disable-next-line no-console
  console.log('Demo credentials: owner@demo.com / Password123!');
  // eslint-disable-next-line no-console
  console.log(`Workspace: ${workspace.slug} (${workspace._id})`);
  // eslint-disable-next-line no-console
  console.log(`Second workspace: ${workspace2.slug} (${workspace2._id})`);
  // eslint-disable-next-line no-console
  console.log(`Pending invite token (dev): ${inviteToken}`);
  // eslint-disable-next-line no-console
  console.log(`Board: ${board1._id}`);

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
