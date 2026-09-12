import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { Channel } from './channel.model.js';
import { Message } from '../messages/message.model.js';
import { workspaceService } from '../workspaces/workspace.service.js';
import { sendSuccess } from '../../utils/response.js';
import { NotFoundError } from '../../utils/errors.js';
import { auditService } from '../audit/audit.service.js';
import { getIO } from '../../sockets/io.js';

const createChannelSchema = z.object({
  name: z.string().min(2).max(80),
  type: z.enum(['PUBLIC', 'PRIVATE']).default('PUBLIC'),
  memberIds: z.array(z.string()).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(2).max(80).optional(),
  archived: z.boolean().optional(),
});

export const channelRoutes = Router({ mergeParams: true });
channelRoutes.use(authenticate);

channelRoutes.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await workspaceService.assertRole(req.user!.id, req.params.workspaceId, 'VIEWER');
    const channels = await Channel.find({
      workspaceId: req.params.workspaceId,
      archived: { $ne: true },
      $or: [{ type: 'PUBLIC' }, { memberIds: req.user!.id }, { createdBy: req.user!.id }],
    })
      .sort({ name: 1 })
      .lean();

    const withUnread = await Promise.all(
      channels.map(async (ch) => {
        const read = ch.readState?.find((r) => String(r.userId) === req.user!.id);
        const since = read?.lastReadAt ?? new Date(0);
        const unreadCount = await Message.countDocuments({
          channelId: ch._id,
          createdAt: { $gt: since },
          deletedAt: null,
          senderId: { $ne: req.user!.id },
        });
        return { ...ch, unreadCount };
      }),
    );

    sendSuccess(res, withUnread);
  } catch (err) {
    next(err);
  }
});

channelRoutes.post(
  '/',
  validate(createChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await workspaceService.assertRole(req.user!.id, req.params.workspaceId, 'ADMIN');
      const channel = await Channel.create({
        workspaceId: req.params.workspaceId,
        name: req.body.name,
        type: req.body.type,
        createdBy: req.user!.id,
        memberIds: [req.user!.id, ...(req.body.memberIds ?? [])],
      });
      await auditService.log({
        userId: req.user!.id,
        workspaceId: req.params.workspaceId,
        action: 'CHANNEL_CREATED',
        entity: 'Channel',
        entityId: String(channel._id),
        metadata: { name: channel.name },
      });
      getIO()?.to(`workspace:${req.params.workspaceId}`).emit('channel:created', { channel });
      sendSuccess(res, channel, 'Channel created', 201);
    } catch (err) {
      next(err);
    }
  },
);

channelRoutes.patch(
  '/:channelId',
  validate(updateChannelSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await workspaceService.assertRole(req.user!.id, req.params.workspaceId, 'ADMIN');
      const channel = await Channel.findOneAndUpdate(
        { _id: req.params.channelId, workspaceId: req.params.workspaceId },
        req.body,
        { new: true },
      );
      if (!channel) throw new NotFoundError('Channel not found');
      await auditService.log({
        userId: req.user!.id,
        workspaceId: req.params.workspaceId,
        action: 'CHANNEL_UPDATED',
        entity: 'Channel',
        entityId: String(channel._id),
        metadata: req.body,
      });
      sendSuccess(res, channel, 'Channel updated');
    } catch (err) {
      next(err);
    }
  },
);

channelRoutes.delete('/:channelId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await workspaceService.assertRole(req.user!.id, req.params.workspaceId, 'ADMIN');
    const channel = await Channel.findOneAndUpdate(
      { _id: req.params.channelId, workspaceId: req.params.workspaceId },
      { archived: true },
      { new: true },
    );
    if (!channel) throw new NotFoundError('Channel not found');
    await auditService.log({
      userId: req.user!.id,
      workspaceId: req.params.workspaceId,
      action: 'CHANNEL_DELETED',
      entity: 'Channel',
      entityId: String(channel._id),
    });
    sendSuccess(res, channel, 'Channel archived');
  } catch (err) {
    next(err);
  }
});

channelRoutes.post('/:channelId/read', async (req: Request, res: Response, next: NextFunction) => {
  try {
    await workspaceService.assertRole(req.user!.id, req.params.workspaceId, 'VIEWER');
    const channel = await Channel.findOne({
      _id: req.params.channelId,
      workspaceId: req.params.workspaceId,
    });
    if (!channel) throw new NotFoundError('Channel not found');
    const idx = channel.readState.findIndex((r) => String(r.userId) === req.user!.id);
    if (idx >= 0) {
      channel.readState[idx].lastReadAt = new Date();
    } else {
      channel.readState.push({
        userId: new mongoose.Types.ObjectId(req.user!.id),
        lastReadAt: new Date(),
      });
    }
    await channel.save();
    sendSuccess(res, { read: true });
  } catch (err) {
    next(err);
  }
});
