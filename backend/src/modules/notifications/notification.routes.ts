import { Router } from 'express';
import { authenticate } from '../../middleware/auth.js';
import { notificationController } from './notification.controller.js';

export const notificationRoutes = Router();
notificationRoutes.use(authenticate);
notificationRoutes.get('/', notificationController.list);
notificationRoutes.patch('/read-all', notificationController.markAllRead);
notificationRoutes.patch('/:id/read', notificationController.markRead);
