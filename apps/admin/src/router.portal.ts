import router from './router'

if (!router.hasRoute('admin-operations-portal')) {
  router.addRoute({
    path: '/operations-portal',
    name: 'admin-operations-portal',
    component: () => import('./views/OperationsPortalView.vue'),
    meta: {
      requiresAuth: true,
      title: 'MoneyBee operations portal',
    },
  })
}

export default router
