import type { Server as HttpServer } from 'node:http';
import { Server } from 'socket.io';
import { env } from '../config/env.js';
import { verifyAccessToken } from '../modules/auth/token.service.js';
import { workspaceService } from '../modules/workspaces/workspace.service.js';
import { Board } from '../modules/boards/board.model.js';
import { Project } from '../modules/projects/project.model.js';
import { Channel } from '../modules/channels/channel.model.js';
import { logger } from '../config/logger.js';
import { UnauthorizedError } from '../utils/errors.js';

let io: Server | null = null;

export function getIO(): Server | null {
  return io;
}

export function initSocket(httpServer: HttpServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: env.CLIENT_URL,
      credentials: true,
    },
  });

  io.use((socket, next) => {
    try {
      const token =
        (socket.handshake.auth?.token as string | undefined) ??
        (socket.handshake.headers.authorization?.startsWith('Bearer ')
          ? socket.handshake.headers.authorization.slice(7)
          : undefined);
      if (!token) throw new UnauthorizedError('Socket auth required');
      const payload = verifyAccessToken(token);
      socket.data.user = { id: payload.sub, email: payload.email, name: payload.name };
      next();
    } catch (err) {
      next(err as Error);
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.data.user.id as string;
    void socket.join(`user:${userId}`);
    logger.info({ userId, socketId: socket.id }, 'Socket connected');

    socket.on('join:workspace', async (workspaceId: string, ack?: (r: unknown) => void) => {
      try {
        await workspaceService.assertRole(userId, workspaceId, 'VIEWER');
        await socket.join(`workspace:${workspaceId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err instanceof Error ? err.message : 'Denied' });
      }
    });

    socket.on('join:project', async (projectId: string, ack?: (r: unknown) => void) => {
      try {
        const project = await Project.findById(projectId).lean();
        if (!project) throw new Error('Project not found');
        await workspaceService.assertRole(userId, String(project.workspaceId), 'VIEWER');
        await socket.join(`project:${projectId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err instanceof Error ? err.message : 'Denied' });
      }
    });

    socket.on('join:board', async (boardId: string, ack?: (r: unknown) => void) => {
      try {
        const board = await Board.findById(boardId).lean();
        if (!board) throw new Error('Board not found');
        const project = await Project.findById(board.projectId).lean();
        if (!project) throw new Error('Project not found');
        await workspaceService.assertRole(userId, String(project.workspaceId), 'VIEWER');
        await socket.join(`board:${boardId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err instanceof Error ? err.message : 'Denied' });
      }
    });

    socket.on('join:channel', async (channelId: string, ack?: (r: unknown) => void) => {
      try {
        const channel = await Channel.findById(channelId).lean();
        if (!channel) throw new Error('Channel not found');
        await workspaceService.assertRole(userId, String(channel.workspaceId), 'VIEWER');
        await socket.join(`channel:${channelId}`);
        ack?.({ ok: true });
      } catch (err) {
        ack?.({ ok: false, error: err instanceof Error ? err.message : 'Denied' });
      }
    });

    socket.on('disconnect', () => {
      logger.info({ userId, socketId: socket.id }, 'Socket disconnected');
    });
  });

  return io;
}
