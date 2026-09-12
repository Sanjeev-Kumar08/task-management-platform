import { Notification } from './notification.model.js';
import { NotFoundError } from '../../utils/errors.js';

export const notificationService = {
  async list(userId: string, page = 1, limit = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Notification.find({ userId }).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({ userId }),
    ]);
    return {
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  },

  async markRead(userId: string, id: string) {
    const doc = await Notification.findOneAndUpdate(
      { _id: id, userId },
      { read: true },
      { new: true },
    );
    if (!doc) throw new NotFoundError('Notification not found');
    return doc;
  },

  async markAllRead(userId: string) {
    await Notification.updateMany({ userId, read: false }, { read: true });
    return { updated: true };
  },
};
