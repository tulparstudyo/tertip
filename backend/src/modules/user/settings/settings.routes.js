import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { standardAbbreviationsController } from '../../admin/settings/standard-abbreviations.controller.js';

const router = Router();

router.use(userAuthMiddleware);

router.get('/standard-abbreviations', standardAbbreviationsController.getForUser);

export default router;
