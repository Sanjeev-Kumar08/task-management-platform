import type { AuditAction } from '../../types/index.js';
import { AuditLog } from './audit.model.js';

export const auditService = {
  async log(input: {
    userId: string;
    workspaceId?: string | null;
    action: AuditAction;
    entity: string;
    entityId: string;
    metadata?: Record<string, unknown>;
    ip?: string | null;
  }): Promise<void> {
    await AuditLog.create({
      userId: input.userId,
      workspaceId: input.workspaceId ?? null,
      action: input.action,
      entity: input.entity,
      entityId: input.entityId,
      metadata: input.metadata ?? {},
      ip: input.ip ?? null,
    });
  },

  async listByWorkspace(workspaceId: string, limit = 20) {
    return AuditLog.find({ workspaceId }).sort({ createdAt: -1 }).limit(limit).lean();
  },
};
