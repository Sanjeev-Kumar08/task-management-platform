import { User, type UserDocument } from '../users/user.model.js';
import type { FilterQuery } from 'mongoose';

export const userRepository = {
  async create(data: { name: string; email: string; passwordHash: string }): Promise<UserDocument> {
    return User.create(data);
  },

  async findByEmail(email: string, withPassword = false): Promise<UserDocument | null> {
    const q = User.findOne({ email: email.toLowerCase() });
    if (withPassword) q.select('+passwordHash');
    return q.exec();
  },

  async findById(id: string, withPassword = false): Promise<UserDocument | null> {
    const q = User.findById(id);
    if (withPassword) q.select('+passwordHash');
    return q.exec();
  },

  async updateById(
    id: string,
    update: FilterQuery<UserDocument> & Record<string, unknown>,
  ): Promise<UserDocument | null> {
    return User.findByIdAndUpdate(id, update, { new: true }).exec();
  },
};
