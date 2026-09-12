import type { AuthUser } from './index.js';
import type { WorkspaceRole } from './roles.js';

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
      workspaceRole?: WorkspaceRole;
      requestId?: string;
    }
  }
}

export {};
