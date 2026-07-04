import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { aiLogsController } from './ai-logs.controller.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/command-types', aiLogsController.listCommandTypes);
router.get('/', aiLogsController.list);
router.get('/:logId', aiLogsController.getById);

export default router;
