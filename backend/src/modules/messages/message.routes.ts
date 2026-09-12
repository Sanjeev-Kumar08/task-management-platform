import mongoose from 'mongoose';
import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { randomUUID } from 'node:crypto';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { Message } from './message.model.js';
import { Channel } from '../channels/channel.model.js';
import { User } from '../users/user.model.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { sendSuccess } from '../../utils/response.js';
import { ForbiddenError, NotFoundError } from '../../utils/errors.js';
import { getIO } from '../../sockets/io.js';
import { enqueueNotification } from '../../jobs/queues.js';
import { Workspace } from '../workspaces/workspace.model.js';

const createMessageSchema = z.object({
  content: z.string().min(1).max(4000),
  parentMessageId: z.string().optional().nullable(),
});

const updateMessageSchema = z.object({
  content: z.string().min(1).max(4000),
});

async function resolveMentions(content: string, workspaceId: string) {
  const handles = [...content.matchAll(/@([a-zA-Z0-9._-]+)/g)].map((m) => m[1].toLowerCase());
  if (!handles.length) return [] as string[];
  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) return [];
  const memberIds = workspace.members.map((m) => m.userId);
  const users = await User.find({ _id: { $in: memberIds } }).lean();
  return users
    .filter((u) => handles.includes(u.name.toLowerCase().replace(/\s+/g, '')) || handles.includes(u.email.split('@')[0]))
    .map((u) => String(u._id));
}

export const messageRoutes = Router({ mergeParams: true });
export const messageMutationRoutes = Router();

messageRoutes.use(authenticate);
messageMutationRoutes.use(authenticate);

messageRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const channel = await Channel.findById(req.params.channelId).lean();
    if (!channel) throw new NotFoundError('Channel not found');
    await workspaceService.assertRole(req.user!.id, String(channel.workspaceId), 'VIEWER');

    const limit = Math.min(Number(req.query.limit ?? 50), 100);
    const before = req.query.before ? new Date(String(req.query.before)) : undefined;
    const parentMessageId = req.query.parentMessageId
      ? String(req.query.parentMessageId)
      : null;

    const filter: Record<string, unknown> = {
      channelId: req.params.channelId,
      deletedAt: null,
      parentMessageId: parentMessageId,
    };
    if (before && !Number.isNaN(before.getTime())) {
      filter.createdAt = { $lt: before };
    }

    const data = await Message.find(filter)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('senderId', 'name email avatar')
      .lean();
    sendSuccess(res, {
      items: data.reverse(),
      nextCursor: data.length ? data[0]?.createdAt : null,
    });
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

      const mentions = await resolveMentions(req.body.content, String(channel.workspaceId));
      const message = await Message.create({
        workspaceId: channel.workspaceId,
        channelId: channel._id,
        senderId: req.user!.id,
        content: req.body.content,
        parentMessageId: req.body.parentMessageId ?? null,
        mentions: mentions.map((id) => new mongoose.Types.ObjectId(id)),
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

      for (const mentionId of mentions) {
        if (mentionId === req.user!.id) continue;
        await enqueueNotification({
          userId: mentionId,
          type: 'MENTION',
          title: 'You were mentioned',
          message: req.body.content.slice(0, 120),
          entityType: 'Message',
          entityId: String(message._id),
        });
      }

      sendSuccess(res, populated, 'Message sent', 201);
    } catch (err) {
      next(err);
    }
  },
);

messageMutationRoutes.patch(
  '/:messageId',
  validate(updateMessageSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await Message.findById(req.params.messageId);
      if (!message || message.deletedAt) throw new NotFoundError('Message not found');
      if (String(message.senderId) !== req.user!.id) {
        throw new ForbiddenError('Can only edit your own messages');
      }
      await workspaceService.assertRole(req.user!.id, String(message.workspaceId), 'MEMBER');
      message.content = req.body.content;
      message.editedAt = new Date();
      message.mentions = (await resolveMentions(req.body.content, String(message.workspaceId))).map(
        (id) => new mongoose.Types.ObjectId(id),
      );
      await message.save();
      const populated = await Message.findById(message._id).populate(
        'senderId',
        'name email avatar',
      );
      getIO()
        ?.to(`channel:${String(message.channelId)}`)
        .emit('message:updated', { eventId: randomUUID(), message: populated });
      sendSuccess(res, populated, 'Message updated');
    } catch (err) {
      next(err);
    }
  },
);

messageMutationRoutes.delete(
  '/:messageId',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const message = await Message.findById(req.params.messageId);
      if (!message || message.deletedAt) throw new NotFoundError('Message not found');
      if (String(message.senderId) !== req.user!.id) {
        await workspaceService.assertRole(req.user!.id, String(message.workspaceId), 'ADMIN');
      }
      message.deletedAt = new Date();
      message.content = '[deleted]';
      await message.save();
      getIO()
        ?.to(`channel:${String(message.channelId)}`)
        .emit('message:deleted', { eventId: randomUUID(), messageId: String(message._id) });
      sendSuccess(res, null, 'Message deleted');
    } catch (err) {
      next(err);
    }
  },
);
