import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { libraryUpload } from '../../../shared/middleware/upload.middleware.js';
import { libraryController } from './library.controller.js';

const router = Router();

router.get('/stream/:gatewayToken', libraryController.streamFile);

router.use(userAuthMiddleware);

router.get('/sources', libraryController.listSources);
router.post('/sources', libraryController.createSource);
router.get('/sources/:sourceId', libraryController.getSourceById);
router.put('/sources/:sourceId', libraryController.updateSource);
router.delete('/sources/:sourceId', libraryController.deleteSource);
router.post(
  '/sources/:sourceId/upload',
  libraryUpload.single('file'),
  libraryController.uploadFile,
);
router.post('/sources/:sourceId/stream-token', libraryController.createStreamToken);

export default router;
