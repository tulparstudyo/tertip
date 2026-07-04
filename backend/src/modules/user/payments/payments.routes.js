import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { paymentsController } from './payments.controller.js';

const router = Router();

router.use(userAuthMiddleware);

router.get('/', paymentsController.list);
router.post('/', paymentsController.create);

export default router;
