import bcrypt from 'bcrypt';
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../../utils/errors.js';
import { userRepository } from './auth.repository.js';
import {
  createRefreshSession,
  invalidateAllUserSessions,
  invalidateRefreshSession,
  listUserSessions,
  revokeUserSession,
  rotateRefreshSession,
  signAccessToken,
} from './token.service.js';
import type {
  ChangePasswordInput,
  LoginInput,
  RegisterInput,
  UpdateProfileInput,
} from './auth.validation.js';
import type { PublicUser } from './auth.types.js';
import type { UserDocument } from '../users/user.model.js';
import { logger } from '../../config/logger.js';
import { AuthToken } from './authToken.model.js';
import { generateSecureToken, hashToken } from '../../utils/tokens.js';
import { enqueueEmail } from '../../jobs/queues.js';
import { emailTemplates } from '../../email/email.service.js';
import { getPrimaryClientUrl } from '../../config/cors.js';
import { Workspace } from '../workspaces/workspace.model.js';
import { Invitation } from '../invitations/invitation.model.js';
import { User } from '../users/user.model.js';
import { auditService } from '../audit/audit.service.js';
import { Subscription } from '../billing/subscription.model.js';

const RESET_TTL_MS = 60 * 60 * 1000;

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

async function issueAuthTokens(user: UserDocument, userAgent?: string) {
  const accessToken = signAccessToken({
    sub: String(user._id),
    email: user.email,
    name: user.name,
  });
  const { token: refreshToken } = await createRefreshSession(String(user._id), userAgent);
  return { accessToken, refreshToken };
}

export const authService = {
  async register(
    input: RegisterInput,
    userAgent?: string,
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

    const tokens = await issueAuthTokens(user, userAgent);
    logger.info({ userId: String(user._id) }, 'User registered');
    return { user: toPublicUser(user), ...tokens };
  },

  async login(
    input: LoginInput,
    userAgent?: string,
  ): Promise<{ user: PublicUser; accessToken: string; refreshToken: string }> {
    const user = await userRepository.findByEmail(input.email, true);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedError('Invalid email or password');
    }

    if (user.status === 'INACTIVE') {
      throw new ForbiddenError('Account is inactive');
    }

    user.lastLoginAt = new Date();
    await user.save();

    const tokens = await issueAuthTokens(user, userAgent);
    logger.info({ userId: String(user._id) }, 'User logged in');
    return { user: toPublicUser(user), ...tokens };
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

  async changePassword(userId: string, input: ChangePasswordInput): Promise<void> {
    const user = await User.findById(userId).select('+passwordHash');
    if (!user) throw new NotFoundError('User not found');
    const ok = await bcrypt.compare(input.currentPassword, user.passwordHash);
    if (!ok) throw new UnauthorizedError('Current password is incorrect');
    user.passwordHash = await bcrypt.hash(input.newPassword, 12);
    await user.save();
    await invalidateAllUserSessions(userId);
    await auditService.log({
      userId,
      workspaceId: undefined,
      action: 'PASSWORD_CHANGED',
      entity: 'User',
      entityId: userId,
    });
  },

  async forgotPassword(email: string): Promise<void> {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const raw = generateSecureToken(32);
    const expiresAt = new Date(Date.now() + RESET_TTL_MS);
    await AuthToken.deleteMany({ userId: user._id, type: 'PASSWORD_RESET' });
    await AuthToken.create({
      userId: user._id,
      type: 'PASSWORD_RESET',
      tokenHash: hashToken(raw),
      expiresAt,
    });
    const resetUrl = `${getPrimaryClientUrl()}/reset-password?token=${raw}`;
    const tpl = emailTemplates.passwordReset({ resetUrl, expiresAt });
    await enqueueEmail({
      to: user.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: 'password_reset',
    });
  },

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const tokenHash = hashToken(token);
    const record = await AuthToken.findOne({ tokenHash, type: 'PASSWORD_RESET' });
    if (!record || record.usedAt || record.expiresAt.getTime() < Date.now()) {
      throw new ValidationError('Invalid or expired reset token');
    }
    const user = await User.findById(record.userId).select('+passwordHash');
    if (!user) throw new NotFoundError('User not found');
    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();
    record.usedAt = new Date();
    await record.save();
    await invalidateAllUserSessions(String(user._id));
  },

  async listSessions(userId: string) {
    return listUserSessions(userId);
  },

  async revokeSession(userId: string, sessionId: string) {
    await revokeUserSession(userId, sessionId);
  },

  async deleteAccount(userId: string): Promise<void> {
    const owned = await Workspace.find({ ownerId: userId });
    for (const ws of owned) {
      const owners = ws.members.filter((m) => m.role === 'OWNER');
      if (owners.length <= 1) {
        throw new ForbiddenError(
          `Transfer ownership or delete workspace "${ws.name}" before deleting your account`,
        );
      }
    }

    await Workspace.updateMany(
      { 'members.userId': userId },
      { $pull: { members: { userId } } },
    );
    await Invitation.deleteMany({ invitedBy: userId, status: 'PENDING' });
    await AuthToken.deleteMany({ userId });
    await Subscription.deleteMany({ ownerId: userId });
    await invalidateAllUserSessions(userId);
    await User.findByIdAndDelete(userId);
    await auditService.log({
      userId,
      action: 'ACCOUNT_DELETED',
      entity: 'User',
      entityId: userId,
    });
  },
};
