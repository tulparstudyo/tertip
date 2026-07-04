import { Router } from 'express';
import healthRoutes from './health.routes.js';
import userRoutes from './user.routes.js';
import adminRoutes from './admin.routes.js';
import publicRoutes from './public.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/public', publicRoutes);
router.use('/user', userRoutes);
router.use('/admin', adminRoutes);

export default router;
