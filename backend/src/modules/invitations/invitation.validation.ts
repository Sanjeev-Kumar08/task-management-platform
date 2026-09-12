import { z } from 'zod';

export const createInvitationSchema = z.object({
  email: z.string().email(),
  role: z.enum(['ADMIN', 'MEMBER', 'VIEWER']),
});

export const acceptInvitationSchema = z.object({
  token: z.string().min(10).optional(),
});
