import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createBoardSchema, updateBoardSchema } from './board.validation.js';
import { boardController } from './board.controller.js';

export const boardRoutes = Router();
export const projectBoardRoutes = Router({ mergeParams: true });

boardRoutes.use(authenticate);
projectBoardRoutes.use(authenticate);

projectBoardRoutes.get('/', boardController.list);
projectBoardRoutes.post('/', validate(createBoardSchema), boardController.create);

boardRoutes.get('/:id', boardController.get);
boardRoutes.patch('/:id', validate(updateBoardSchema), boardController.update);
boardRoutes.delete('/:id', boardController.remove);
