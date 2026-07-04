import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { standardAbbreviationsController } from './standard-abbreviations.controller.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/standard-abbreviations', standardAbbreviationsController.getForAdmin);
router.put('/standard-abbreviations', standardAbbreviationsController.updateForAdmin);

export default router;
