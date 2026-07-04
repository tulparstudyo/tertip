import { Router } from 'express';
import authRoutes from '../modules/admin/auth/auth.routes.js';
import settingsRoutes from '../modules/admin/settings/settings.routes.js';
import adminsRoutes from '../modules/admin/admins/admins.routes.js';
import usersRoutes from '../modules/admin/users/users.routes.js';
import paymentsRoutes from '../modules/admin/payments/payments.routes.js';
import landingRoutes from '../modules/admin/landing/landing.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/settings', settingsRoutes);
router.use('/admins', adminsRoutes);
router.use('/users', usersRoutes);
router.use('/payments', paymentsRoutes);
router.use('/landing', landingRoutes);

export default router;
