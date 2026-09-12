import bcrypt from 'bcrypt';
import { ConflictError, UnauthorizedError, NotFoundError } from '../../utils/errors.js';
import { userRepository } from './auth.repository.js';
import {
  createRefreshSession,
  invalidateRefreshSession,
  rotateRefreshSession,
  signAccessToken,
} from './token.service.js';
import type { LoginInput, RegisterInput, UpdateProfileInput } from './auth.validation.js';
import type { PublicUser } from './auth.types.js';
import type { UserDocument } from '../users/user.model.js';
import { logger } from '../../config/logger.js';

function toPublicUser(user: UserDocument): PublicUser {
  return {
    id: String(user._id),
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
    status: user.status,
    lastLoginAt: user.lastLoginAt ?? null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export const authService = {
  async register(
    input: RegisterInput,
  ): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
    const existing = await userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(input.password, 12);
    const user = await userRepository.create({
      name: input.name,
      email: input.email.toLowerCase(),
      passwordHash,
    });

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
    });
    const { token: refreshToken } = await createRefreshSession(String(user._id));

    logger.info({ userId: String(user._id) }, 'User registered');
    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async login(
    input: LoginInput,
  ): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('Invalid email or password');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
    });
    const { token: refreshToken } = await createRefreshSession(String(user._id));

    logger.info({ userId: String(user._id) }, 'User logged in');
    return { user: toPublicUser(user), accessToken, refreshToken };
  },

  async refresh(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    const rotated = await rotateRefreshSession(refreshToken);
    const user = await userRepository.findById(rotated.userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const accessToken = signAccessToken({
      sub: String(user._id),
      email: user.email,
      name: user.name,
    });

    return { accessToken, refreshToken: rotated.refreshToken };
  },

  async logout(refreshToken?: string): Promise<void> {
    if (refreshToken) {
      await invalidateRefreshSession(refreshToken);
    }
  },

  async me(userId: string): Promise<PublicUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw new NotFoundError('User not found');
    return toPublicUser(user);
  },

  async updateProfile(userId: string, input: UpdateProfileInput): Promise<PublicUser> {
    const user = await userRepository.updateById(userId, input);
    if (!user) throw new NotFoundError('User not found');
    return toPublicUser(user);
  },
};
