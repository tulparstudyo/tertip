import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { requireEmailVerifiedMiddleware } from '../../../shared/middleware/require-email-verified.middleware.js';
import { paymentsController } from './payments.controller.js';

const router = Router();

router.use(userAuthMiddleware);
router.use(requireEmailVerifiedMiddleware);

router.get('/', paymentsController.list);
router.post('/', paymentsController.create);
router.get('/:paymentId/invoice', paymentsController.downloadInvoice);

export default router;
