import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { paymentsController } from './payments.controller.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', paymentsController.list);
router.get('/:paymentId', paymentsController.getById);
router.post('/:paymentId/approve', paymentsController.approve);
router.post('/:paymentId/reject', paymentsController.reject);

export default router;
