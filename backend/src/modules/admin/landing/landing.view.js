import { resolveLandingEnvPlaceholders } from '../../../shared/services/landing-page.service.js';

export const landingView = {
  formatLanding({ content, updatedAt }, { resolveEnv = false } = {}) {
    return {
      content: resolveEnv ? resolveLandingEnvPlaceholders(content) : content,
      updatedAt,
    };
  },
};
