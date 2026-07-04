import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { landingController } from './landing.controller.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', landingController.get);
router.put('/', landingController.update);

export default router;
