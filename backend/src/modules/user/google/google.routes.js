import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { requireEmailVerifiedMiddleware } from '../../../shared/middleware/require-email-verified.middleware.js';
import { googleController } from './google.controller.js';

const router = Router();

router.get('/callback', googleController.callback);

router.use(userAuthMiddleware);
router.use(requireEmailVerifiedMiddleware);

router.get('/connect', googleController.connect);
router.get('/connect-url', googleController.connectUrl);
router.get('/status', googleController.status);
router.delete('/disconnect', googleController.disconnect);

export default router;
