import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { usersController } from './users.controller.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', usersController.list);
router.post('/', usersController.create);
router.get('/:userId', usersController.getById);
router.put('/:userId', usersController.update);
router.patch('/:userId/active', usersController.setActive);

export default router;
