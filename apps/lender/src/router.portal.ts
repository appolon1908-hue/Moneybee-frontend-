import router from './router'

if (!router.hasRoute('lender-portal-workspace')) {
  router.addRoute({
    path: '/workspace',
    name: 'lender-portal-workspace',
    component: () => import('./views/PortalWorkspaceView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Lender workspace',
    },
  })
}

export default router
