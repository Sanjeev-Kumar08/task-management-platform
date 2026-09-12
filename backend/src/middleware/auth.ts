import type { NextFunction, Request, Response } from 'express';
import { verifyAccessToken } from '../modules/auth/token.service.js';
import { ForbiddenError, UnauthorizedError } from '../utils/errors.js';
import { Workspace } from '../modules/workspaces/workspace.model.js';
import { ROLE_RANK, type WorkspaceRole } from '../types/index.js';

export function authenticate(req: Request, _res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    next(new UnauthorizedError('Missing access token'));
    return;
  }

  try {
    const payload = verifyAccessToken(header.slice(7));
    req.user = { id: payload.sub, email: payload.email, name: payload.name };
    next();
  } catch (err) {
    next(err);
  }
}

export function authorize(..._roles: string[]) {
  return (_req: Request, _res: Response, next: NextFunction): void => {
    // Placeholder for resource-agnostic checks; workspace role uses requireWorkspaceRole.
    next();
  };
}

export function requireWorkspaceRole(minRole: WorkspaceRole, workspaceIdParam = 'id') {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new UnauthorizedError();
      }

      const workspaceId =
        req.params[workspaceIdParam] ??
        req.params.workspaceId ??
        (req.body as { workspaceId?: string }).workspaceId;

      if (!workspaceId || typeof workspaceId !== 'string') {
        throw new ForbiddenError('Workspace context required');
      }

      const workspace = await Workspace.findById(workspaceId).lean();
      if (!workspace) {
        throw new ForbiddenError('Workspace not found');
      }

      const member = workspace.members.find((m) => String(m.userId) === req.user!.id);
      if (!member) {
        throw new ForbiddenError('Not a workspace member');
      }

      const role = member.role as WorkspaceRole;
      if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
        throw new ForbiddenError(`Requires ${minRole} role or higher`);
      }

      req.workspaceRole = role;
      next();
    } catch (err) {
      next(err);
    }
  };
}

export async function assertWorkspaceRole(
  userId: string,
  workspaceId: string,
  minRole: WorkspaceRole,
): Promise<WorkspaceRole> {
  const workspace = await Workspace.findById(workspaceId).lean();
  if (!workspace) {
    throw new ForbiddenError('Workspace not found');
  }
  const member = workspace.members.find((m) => String(m.userId) === userId);
  if (!member) {
    throw new ForbiddenError('Not a workspace member');
  }
  const role = member.role as WorkspaceRole;
  if (ROLE_RANK[role] < ROLE_RANK[minRole]) {
    throw new ForbiddenError(`Requires ${minRole} role or higher`);
  }
  return role;
}
