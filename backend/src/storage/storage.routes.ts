import { Router } from 'express';
import type { Request, Response, NextFunction } from 'express';
import { authenticate } from '../middleware/auth.js';
import { storageService, createReadStream } from '../storage/storage.service.js';
import { sendSuccess } from '../utils/response.js';
import { ForbiddenError, ValidationError } from '../utils/errors.js';
import { env } from '../config/env.js';
import { z } from 'zod';
import { validate } from '../middleware/validate.js';
import { entitlementsService } from '../modules/entitlements/entitlements.service.js';
import { workspaceService } from '../modules/workspaces/workspace.service.js';
import { existsSync } from 'node:fs';

const signUploadSchema = z.object({
  workspaceId: z.string().min(1),
  originalName: z.string().min(1).max(200),
  mimeType: z.string().min(1),
  size: z.number().int().positive().max(env.MAX_FILE_SIZE),
});

export const storageRoutes = Router();

storageRoutes.post(
  '/sign-upload',
  authenticate,
  validate(signUploadSchema),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { workspaceId, originalName, mimeType, size } = req.body as z.infer<
        typeof signUploadSchema
      >;
      await workspaceService.assertRole(req.user!.id, workspaceId, 'MEMBER');
      await entitlementsService.assertStorageAllowance(workspaceId, size);

      const allowed = [
        'image/png',
        'image/jpeg',
        'image/gif',
        'image/webp',
        'application/pdf',
        'text/plain',
      ];
      if (!allowed.includes(mimeType)) {
        throw new ValidationError('Unsupported file type');
      }

      const target = await storageService.createUploadTarget({
        workspaceId,
        originalName,
        mimeType,
        size,
      });
      sendSuccess(res, {
        ...target,
        provider: env.STORAGE_PROVIDER === 's3' && env.S3_BUCKET ? 's3' : 'local',
      });
    } catch (err) {
      next(err);
    }
  },
);

storageRoutes.put('/upload', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = String(req.query.key ?? '');
    if (!key || key.includes('..')) throw new ForbiddenError('Invalid key');
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
    }
    const buffer = Buffer.concat(chunks);
    if (buffer.length > env.MAX_FILE_SIZE) throw new ValidationError('File too large');
    await storageService.saveLocalBuffer(key, buffer);
    sendSuccess(res, { key, size: buffer.length });
  } catch (err) {
    next(err);
  }
});

storageRoutes.get('/download', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const key = String(req.query.key ?? '');
    if (!key || key.includes('..')) throw new ForbiddenError('Invalid key');
    const url = await storageService.createDownloadUrl(key);
    if (url.startsWith('http') && !url.includes('/api/storage/download')) {
      res.redirect(url);
      return;
    }
    const abs = storageService.resolveAbsolutePath(key);
    if (!abs || !existsSync(abs)) throw new ValidationError('File not found');
    createReadStream(abs).pipe(res);
  } catch (err) {
    next(err);
  }
});
