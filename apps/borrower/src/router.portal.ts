import router from './router'

if (!router.hasRoute('borrower-portal-workspace')) {
  router.addRoute({
    path: '/workspace',
    name: 'borrower-portal-workspace',
    component: () => import('./views/PortalWorkspaceView.vue'),
    meta: {
      requiresAuth: true,
      title: 'Your MoneyBee workspace',
    },
  })
}

export default router
