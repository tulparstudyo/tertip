import { Router } from 'express';
import multer from 'multer';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { requireEmailVerifiedMiddleware } from '../../../shared/middleware/require-email-verified.middleware.js';
import { aiController } from './ai.controller.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 },
});

const router = Router();
router.use(userAuthMiddleware);
router.use(requireEmailVerifiedMiddleware);

router.get('/command-types', aiController.listCommandTypes);
router.get('/logs', aiController.listLogs);
router.get('/logs/:logId', aiController.getLog);

router.post(
  '/voice-to-academic',
  upload.single('audio'),
  aiController.voiceToAcademic,
);
router.post('/screenshot-ocr', upload.single('image'), aiController.screenshotOcr);
router.post('/screenshot-ocr-ottoman', upload.single('image'), aiController.screenshotOcrOttoman);
router.post('/rewrite-grammar', aiController.rewriteGrammar);

export default router;
