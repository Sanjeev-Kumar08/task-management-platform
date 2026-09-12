import bcrypt from 'bcrypt';
import mongoose from 'mongoose';
import { config as loadEnv } from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
loadEnv({ path: path.resolve(__dirname, '../../../.env') });
loadEnv();

process.env.MONGODB_URI ??= 'mongodb://localhost:27017/workspace';

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

  const workspace = await Workspace.create({
    name: 'Acme Collaboration',
    slug: 'acme',
    ownerId: owner._id,
    members: [
      { userId: owner._id, role: 'OWNER' },
      { userId: admin._id, role: 'ADMIN' },
      { userId: member._id, role: 'MEMBER' },
      { userId: viewer._id, role: 'VIEWER' },
    ],
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
  });

  await Message.create({
    workspaceId: workspace._id,
    channelId: channel._id,
    senderId: owner._id,
    content: 'Welcome to Acme Collaboration!',
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

  // eslint-disable-next-line no-console
  console.log('Seed complete');
  // eslint-disable-next-line no-console
  console.log('Demo credentials: owner@demo.com / Password123!');
  // eslint-disable-next-line no-console
  console.log(`Workspace: ${workspace.slug} (${workspace._id})`);
  // eslint-disable-next-line no-console
  console.log(`Board: ${board1._id}`);

  await mongoose.disconnect();
}

seed().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect();
  process.exit(1);
});
