import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { requireRole } from '../../../shared/middleware/require-role.middleware.js';
import { adminsController } from './admins.controller.js';

const router = Router();

router.use(adminAuthMiddleware);
router.use(requireRole('super_admin'));

router.get('/', adminsController.list);
router.post('/', adminsController.create);
router.get('/:adminId', adminsController.getById);
router.put('/:adminId', adminsController.update);
router.patch('/:adminId/active', adminsController.setActive);

export default router;
