import { Router } from 'express';
import { adminAuthMiddleware } from '../../../shared/middleware/admin-auth.middleware.js';
import { standardAbbreviationsController } from './standard-abbreviations.controller.js';
import { systemSettingsController } from './system-settings.controller.js';
import { themeSettingsController } from './theme-settings.controller.js';

const router = Router();

router.use(adminAuthMiddleware);

router.get('/', systemSettingsController.list);
router.put('/', systemSettingsController.update);
router.post('/test-email', systemSettingsController.testEmail);
router.get('/standard-abbreviations', standardAbbreviationsController.getForAdmin);
router.put('/standard-abbreviations', standardAbbreviationsController.updateForAdmin);

router.get('/theme-settings', themeSettingsController.getForAdmin);
router.put('/theme-settings', themeSettingsController.updateForAdmin);

export default router;
