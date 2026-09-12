import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import {
  assignTaskSchema,
  createTaskSchema,
  moveTaskSchema,
  updateTaskSchema,
} from './task.validation.js';
import { taskController } from './task.controller.js';
import { upload } from '../../middleware/upload.js';

export const taskRoutes = Router();
export const boardTaskRoutes = Router({ mergeParams: true });

taskRoutes.use(authenticate);
boardTaskRoutes.use(authenticate);

boardTaskRoutes.get('/', taskController.list);
boardTaskRoutes.post('/', validate(createTaskSchema), taskController.create);

taskRoutes.get('/:id', taskController.get);
taskRoutes.patch('/:id', validate(updateTaskSchema), taskController.update);
taskRoutes.delete('/:id', taskController.remove);
taskRoutes.patch('/:id/move', validate(moveTaskSchema), taskController.move);
taskRoutes.patch('/:id/assign', validate(assignTaskSchema), taskController.assign);
taskRoutes.post('/:id/attachments', upload.single('file'), taskController.uploadAttachment);
