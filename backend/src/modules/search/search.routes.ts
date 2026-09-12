import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { searchQuerySchema, searchService } from './search.service.js';
import { sendSuccess } from '../../utils/response.js';
import { validate } from '../../middleware/validate.js';

export const searchRoutes = Router();
searchRoutes.use(authenticate);
searchRoutes.get(
  '/',
  validate(searchQuerySchema, 'query'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { q, workspaceId } = req.query as { q: string; workspaceId?: string };
      sendSuccess(res, await searchService.search(req.user!.id, q, workspaceId));
    } catch (err) {
      next(err);
    }
  },
);
