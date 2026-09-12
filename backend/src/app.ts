import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { workspaceRoutes } from './modules/workspaces/workspace.routes.js';
import { projectRoutes, workspaceProjectRoutes } from './modules/projects/project.routes.js';
import { boardRoutes, projectBoardRoutes } from './modules/boards/board.routes.js';
import { taskRoutes, boardTaskRoutes } from './modules/tasks/task.routes.js';
import { commentRoutes, taskCommentRoutes } from './modules/comments/comment.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { channelRoutes } from './modules/channels/channel.routes.js';
import { messageRoutes } from './modules/messages/message.routes.js';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CLIENT_URL,
      credentials: true,
    }),
  );
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === 'test' ? 10_000 : 500,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, message: 'Healthy' });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/workspaces', workspaceRoutes);
  app.use('/api/workspaces/:workspaceId/projects', workspaceProjectRoutes);
  app.use('/api/workspaces/:workspaceId/channels', channelRoutes);
  app.use('/api/projects', projectRoutes);
  app.use('/api/projects/:projectId/boards', projectBoardRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/boards/:boardId/tasks', boardTaskRoutes);
  app.use('/api/tasks', taskRoutes);
  app.use('/api/tasks/:taskId/comments', taskCommentRoutes);
  app.use('/api/comments', commentRoutes);
  app.use('/api/notifications', notificationRoutes);
  app.use('/api/search', searchRoutes);
  app.use('/api/channels/:channelId/messages', messageRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
