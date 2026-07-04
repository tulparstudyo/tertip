import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { requireEmailVerifiedMiddleware } from '../../../shared/middleware/require-email-verified.middleware.js';
import { standardAbbreviationsController } from '../../admin/settings/standard-abbreviations.controller.js';

const router = Router();

router.use(userAuthMiddleware);
router.use(requireEmailVerifiedMiddleware);

router.get('/standard-abbreviations', standardAbbreviationsController.getForUser);

export default router;
