import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { Message } from './message.model.js';
import { Channel } from '../channels/channel.model.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { sendSuccess } from '../../utils/response.js';
import { NotFoundError } from '../../utils/errors.js';
import { getIO } from '../../sockets/io.js';

const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

export const messageRoutes = Router({ mergeParams: true });
messageRoutes.use(authenticate);

messageRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await Channel.findById(req.params.channelId).lean();
    if (!channel) throw new NotFoundError('Channel not found');
    await workspaceService.assertRole(req.user!.id, String(channel.workspaceId), 'VIEWER');
    const data = await Message.find({ channelId: req.params.channelId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('senderId', 'name email avatar')
      .lean();
    sendSuccess(res, data.reverse());
  } catch (err) {
    next(err);
  }
});

messageRoutes.post(
  '/',
  validate(createMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const channel = await Channel.findById(req.params.channelId).lean();
      if (!channel) throw new NotFoundError('Channel not found');
      await workspaceService.assertRole(req.user!.id, String(channel.workspaceId), 'MEMBER');

      const message = await Message.create({
        workspaceId: channel.workspaceId,
        channelId: channel._id,
        senderId: req.user!.id,
        content: req.body.content,
      });

      const populated = await Message.findById(message._id).populate(
        'senderId',
        'name email avatar',
      );
      getIO()
        ?.to(`channel:${String(channel._id)}`)
        .emit('message:created', {
          eventId: randomUUID(),
          message: populated,
        });

      sendSuccess(res, populated, 'Message sent', 201);
    } catch (err) {
      next(err);
    }
  },
);
