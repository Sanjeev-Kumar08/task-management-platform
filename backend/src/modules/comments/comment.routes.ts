import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createCommentSchema } from './comment.validation.js';
import { commentController } from './comment.controller.js';

export const commentRoutes = Router();
export const taskCommentRoutes = Router({ mergeParams: true });

commentRoutes.use(authenticate);
taskCommentRoutes.use(authenticate);

taskCommentRoutes.get('/', commentController.list);
taskCommentRoutes.post('/', validate(createCommentSchema), commentController.create);
commentRoutes.patch('/:id', validate(createCommentSchema), commentController.update);
commentRoutes.delete('/:id', commentController.remove);
