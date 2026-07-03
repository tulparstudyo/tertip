import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { authController } from './auth.controller.js';

const router = Router();

router.post('/login', authController.login);
router.get('/me', adminAuthMiddleware, authController.me);

export default router;
