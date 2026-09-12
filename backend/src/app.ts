import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import { pinoHttp } from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import path from 'node:path';
import { env } from './config/env.js';
import { corsOriginDelegate } from './config/cors.js';
import { logger } from './config/logger.js';
import { swaggerSpec } from './config/swagger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import { authRoutes } from './modules/auth/auth.routes.js';
import { workspaceRoutes } from './modules/workspaces/workspace.routes.js';
import { projectRoutes, workspaceProjectRoutes } from './modules/projects/project.routes.js';
import { boardRoutes, projectBoardRoutes } from './modules/boards/board.routes.js';
import { taskRoutes, boardTaskRoutes } from './modules/tasks/task.routes.js';
import { commentRoutes, taskCommentRoutes } from './modules/comments/comment.routes.js';
import { notificationRoutes } from './modules/notifications/notification.routes.js';
import { searchRoutes } from './modules/search/search.routes.js';
import { channelRoutes } from './modules/channels/channel.routes.js';
import { messageRoutes, messageMutationRoutes } from './modules/messages/message.routes.js';
import {
  invitationAuthRoutes,
  invitationPublicRoutes,
} from './modules/invitations/invitation.routes.js';
import { billingRoutes } from './modules/billing/billing.routes.js';
import { billingController } from './modules/billing/billing.controller.js';
import { storageRoutes } from './storage/storage.routes.js';
import { metrics } from './observability/metrics.js';
import { getRedis } from './db/redis.js';
import mongoose from 'mongoose';

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.use(requestIdMiddleware);
  app.use(
    pinoHttp({
      logger,
      autoLogging: env.NODE_ENV !== 'test',
      customProps: (req) => ({ requestId: (req as { requestId?: string }).requestId }),
    }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: corsOriginDelegate,
      credentials: true,
    }),
  );

  app.post(
    '/api/billing/webhook',
    express.raw({ type: 'application/json' }),
    (req, res, next) => billingController.webhook(req, res, next),
  );

  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(cookieParser());
  app.use(
    rateLimit({
      windowMs: 15 * 60 * 1000,
      max: env.NODE_ENV === 'test' ? 10_000 : env.NODE_ENV === 'development' ? 5_000 : 500,
      standardHeaders: true,
      legacyHeaders: false,
    }),
  );

  app.use('/uploads', express.static(path.resolve(process.cwd(), env.UPLOAD_DIR)));
  app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/api/health', (_req, res) => {
    res.json({ success: true, data: { status: 'ok' }, message: 'Healthy' });
  });

  app.get('/api/ready', async (_req, res) => {
    const mongoOk = mongoose.connection.readyState === 1;
    let redisOk = false;
    try {
      redisOk = (await getRedis().ping()) === 'PONG';
    } catch {
      redisOk = false;
    }
    const ready = mongoOk && (env.isTest || redisOk);
    res.status(ready ? 200 : 503).json({
      success: ready,
      data: { mongo: mongoOk, redis: redisOk, metrics: metrics.snapshot() },
      message: ready ? 'Ready' : 'Not ready',
    });
  });

  app.use('/api/auth', authRoutes);
  app.use('/api/invitations', invitationPublicRoutes);
  app.use('/api/invitations', invitationAuthRoutes);
  app.use('/api/billing', billingRoutes);
  app.use('/api/storage', storageRoutes);
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
  app.use('/api/messages', messageMutationRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
