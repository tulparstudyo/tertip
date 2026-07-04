import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { authController } from './auth.controller.js';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.get('/reset-password/validate', authController.validateResetToken);
router.post('/reset-password', authController.resetPassword);
router.get('/verify-email/validate', authController.validateVerifyToken);
router.post('/verify-email', authController.verifyEmail);

router.get('/me', userAuthMiddleware, authController.me);
router.put('/profile', userAuthMiddleware, authController.updateProfile);
router.post('/request-password-reset', userAuthMiddleware, authController.requestPasswordReset);
router.post('/resend-verification', userAuthMiddleware, authController.resendVerification);

export default router;
