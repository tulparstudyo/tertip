import { Router } from 'express';
import authRoutes from '../modules/user/auth/auth.routes.js';
import googleRoutes from '../modules/user/google/google.routes.js';
import libraryRoutes from '../modules/user/library/library.routes.js';
import projectRoutes from '../modules/user/project/project.routes.js';
import aiRoutes from '../modules/user/ai/ai.routes.js';
import settingsRoutes from '../modules/user/settings/settings.routes.js';
import paymentsRoutes from '../modules/user/payments/payments.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/google', googleRoutes);
router.use('/library', libraryRoutes);
router.use('/projects', projectRoutes);
router.use('/ai', aiRoutes);
router.use('/settings', settingsRoutes);
router.use('/payments', paymentsRoutes);

export default router;
