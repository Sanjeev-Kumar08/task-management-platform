import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { createProjectSchema, updateProjectSchema } from './project.validation.js';
import { projectController } from './project.controller.js';

export const projectRoutes = Router();
export const workspaceProjectRoutes = Router({ mergeParams: true });

projectRoutes.use(authenticate);
workspaceProjectRoutes.use(authenticate);

workspaceProjectRoutes.get('/', projectController.list);
workspaceProjectRoutes.post('/', validate(createProjectSchema), projectController.create);

projectRoutes.get('/:id', projectController.get);
projectRoutes.patch('/:id', validate(updateProjectSchema), projectController.update);
projectRoutes.delete('/:id', projectController.remove);
