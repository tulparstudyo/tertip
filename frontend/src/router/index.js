import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/composables/useAuth';
import { useAdminAuth } from '@/composables/useAdminAuth';

const router = createRouter({
  history: createWebHistory(),
  scrollBehavior(to) {
    if (to.hash) {
      return { el: to.hash, behavior: 'smooth', top: 80 };
    }
    return { top: 0 };
  },
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('@/views/LandingPageView.vue'),
      meta: { public: true },
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/RegisterView.vue'),
      meta: { guest: true },
    },
    {
      path: '/forgot-password',
      name: 'forgot-password',
      component: () => import('@/views/ForgotPasswordView.vue'),
      meta: { guest: true },
    },
    {
      path: '/reset-password',
      name: 'reset-password',
      component: () => import('@/views/ResetPasswordView.vue'),
      meta: { public: true, allowAuth: true },
    },
    {
      path: '/verify-email',
      name: 'verify-email',
      component: () => import('@/views/VerifyEmailView.vue'),
      meta: { public: true, allowAuth: true },
    },
    {
      path: '/verify-email-pending',
      name: 'verify-email-pending',
      component: () => import('@/views/VerifyEmailPendingView.vue'),
      meta: { requiresAuth: true, allowUnverified: true },
    },
    {
      path: '/admin/login',
      name: 'admin-login',
      component: () => import('@/views/admin/AdminLoginView.vue'),
      meta: { adminGuest: true },
    },
    {
      path: '/admin',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAdmin: true },
      children: [
        {
          path: '',
          name: 'admin-dashboard',
          component: () => import('@/views/admin/AdminDashboardView.vue'),
          meta: { titleKey: 'admin.nav.dashboard' },
        },
        {
          path: 'admins',
          name: 'admin-admins',
          component: () => import('@/views/admin/AdminAdminsView.vue'),
          meta: { titleKey: 'admin.nav.admins', superAdminOnly: true },
        },
        {
          path: 'users',
          name: 'admin-users',
          component: () => import('@/views/admin/AdminUsersView.vue'),
          meta: { titleKey: 'admin.nav.users' },
        },
        {
          path: 'payments',
          name: 'admin-payments',
          component: () => import('@/views/admin/AdminPaymentsView.vue'),
          meta: { titleKey: 'admin.nav.payments' },
        },
        {
          path: 'landing',
          name: 'admin-landing',
          component: () => import('@/views/admin/AdminLandingView.vue'),
          meta: { titleKey: 'admin.nav.landing' },
        },
        {
          path: 'ai-logs',
          name: 'admin-ai-logs',
          component: () => import('@/views/admin/AdminAiLogsView.vue'),
          meta: { titleKey: 'admin.nav.aiLogs' },
        },
      ],
    },
    {
      path: '/app',
      component: () => import('@/layouts/AppLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'dashboard',
          component: () => import('@/views/DashboardView.vue'),
        },
        {
          path: 'library',
          name: 'library',
          component: () => import('@/views/LibraryView.vue'),
        },
        {
          path: 'ai-usage',
          name: 'ai-usage',
          component: () => import('@/views/AiUsageView.vue'),
        },
        {
          path: 'projects',
          name: 'projects',
          component: () => import('@/views/ProjectsView.vue'),
        },
        {
          path: 'projects/:projectId/editor/:section',
          name: 'project-editor',
          component: () => import('@/views/ProjectEditorView.vue'),
        },
        {
          path: 'projects/:projectId/editor',
          redirect: (to) => ({
            name: 'project-editor',
            params: { projectId: to.params.projectId, section: 'body' },
          }),
        },
        {
          path: 'settings/google',
          name: 'settings-google',
          component: () => import('@/views/SettingsView.vue'),
        },
        {
          path: 'profile',
          name: 'profile',
          component: () => import('@/views/ProfileView.vue'),
        },
        {
          path: 'payments',
          name: 'payments',
          component: () => import('@/views/PaymentsView.vue'),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const { isAuthenticated, isEmailVerified, user, fetchMe } = useAuth();
  const { isAuthenticated: isAdminAuthenticated, isSuperAdmin } = useAdminAuth();

  if (to.meta.requiresAdmin && !isAdminAuthenticated.value) {
    return { name: 'admin-login' };
  }

  if (to.meta.adminGuest && isAdminAuthenticated.value) {
    return { name: 'admin-dashboard' };
  }

  if (to.matched.some((r) => r.meta.superAdminOnly) && !isSuperAdmin.value) {
    return { name: 'admin-dashboard' };
  }

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login' };
  }

  if (isAuthenticated.value && user.value?.emailVerified === undefined) {
    try {
      await fetchMe();
    } catch {
      return { name: 'login' };
    }
  }

  if (
    to.meta.requiresAuth
    && !to.meta.allowUnverified
    && isAuthenticated.value
    && !isEmailVerified.value
  ) {
    return { name: 'verify-email-pending' };
  }

  if (to.name === 'verify-email-pending' && isEmailVerified.value) {
    return { name: 'dashboard' };
  }

  if ((to.meta.guest || to.meta.public) && isAuthenticated.value && !to.meta.allowAuth) {
    return isEmailVerified.value ? { name: 'dashboard' } : { name: 'verify-email-pending' };
  }

  return true;
});

export default router;
