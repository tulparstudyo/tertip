import { Router } from 'express';
import authRoutes from '../modules/admin/auth/auth.routes.js';
import settingsRoutes from '../modules/admin/settings/settings.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);

export default router;
