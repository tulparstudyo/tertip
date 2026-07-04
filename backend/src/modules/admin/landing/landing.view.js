import { resolveLandingSettingPlaceholders } from '../../../shared/services/landing-page.service.js';

export const landingView = {
  formatLanding({ content, updatedAt }, { resolveSettings = false } = {}) {
    return {
      content: resolveSettings ? resolveLandingSettingPlaceholders(content) : content,
      updatedAt,
    };
  },
};
