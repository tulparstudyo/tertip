import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '@/composables/useAuth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
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
      path: '/',
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

  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'login' };
  }

  if (to.meta.guest && isAuthenticated.value) {
    return { name: 'dashboard' };
  }

  return true;
});

export default router;
