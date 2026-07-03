import { Router } from 'express';
import { testConnection } from '../config/database.js';
import { asyncHandler } from '../shared/utils/async-handler.util.js';
import { sendSuccess } from '../shared/utils/api-response.util.js';

const router = Router();

router.get(
  '/',
  asyncHandler(async (req, res) => {
    await testConnection();
    sendSuccess(res, { message: req.t('health.ok') });
  }),
);

export default router;
