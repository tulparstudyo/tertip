import { Router } from 'express';
import { userAuthMiddleware } from '../../../shared/middleware/user-auth.middleware.js';
import { projectController } from './project.controller.js';
import { commentController } from './comment.controller.js';
import { shareController } from './share.controller.js';
import { citationImageController } from './citation-image.controller.js';
import { citationImageUpload } from '../../../shared/middleware/upload.middleware.js';

const router = Router();

router.use(userAuthMiddleware);

router.get('/', projectController.listProjects);
router.post('/', projectController.createProject);
router.get('/:projectId', projectController.getProjectById);
router.get('/:projectId/sections/:section', projectController.getSection);
router.put('/:projectId/sections/:section', projectController.saveSection);
router.post('/:projectId/sync-google-doc', projectController.syncGoogleDoc);
router.post('/:projectId/generate-kapak', projectController.generateKapak);
router.post('/:projectId/generate-oz', projectController.generateOz);
router.post('/:projectId/generate-abstract', projectController.generateAbstract);
router.post('/:projectId/generate-kaynakca', projectController.generateKaynakca);

router.post(
  '/:projectId/citation-images',
  citationImageUpload.single('image'),
  citationImageController.create,
);
router.get('/:projectId/citation-images/:citationImageId', citationImageController.getById);
router.put('/:projectId/citation-images/:citationImageId', citationImageController.update);
router.post(
  '/:projectId/citation-images/:citationImageId/stream-token',
  citationImageController.createStreamToken,
);

router.get('/:projectId/content', projectController.getContent);
router.put('/:projectId/content', projectController.saveContent);
router.put('/:projectId', projectController.updateProject);
router.delete('/:projectId', projectController.deleteProject);

router.get('/:projectId/comments', commentController.listComments);
router.post('/:projectId/comments', commentController.createComment);
router.patch('/:projectId/comments/:commentId/resolve', commentController.resolveComment);

router.get('/:projectId/shares', shareController.listShares);
router.post('/:projectId/shares', shareController.createShare);
router.delete('/:projectId/shares/:shareId', shareController.deleteShare);

export default router;
