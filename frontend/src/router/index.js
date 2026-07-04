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
      ],
    },
  ],
});

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth();
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

  if ((to.meta.guest || to.meta.public) && isAuthenticated.value) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
