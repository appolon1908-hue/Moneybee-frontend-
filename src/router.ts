import { createRouter, createWebHistory } from 'vue-router'
import { currentUser, roles } from './auth'
import HomeView from './views/HomeView.vue'
import ApplyView from './views/ApplyView.vue'
import PortalView from './views/PortalView.vue'
import AdminView from './views/AdminView.vue'
import LenderView from './views/LenderView.vue'
import AuthCallbackView from './views/AuthCallbackView.vue'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', component: HomeView },
    { path: '/apply', component: ApplyView },
    { path: '/portal', component: PortalView, meta: { requiresAuth: true, roles: ['borrower', 'admin'] } },
    { path: '/lender', component: LenderView, meta: { requiresAuth: true, roles: ['lender', 'admin'] } },
    { path: '/admin', component: AdminView, meta: { requiresAuth: true, roles: ['admin', 'operations'] } },
    { path: '/auth/callback', component: AuthCallbackView }
  ]
})

router.beforeEach(async (to) => {
  if (!to.meta.requiresAuth) return true
  const user = await currentUser()
  if (!user) return { path: '/', query: { login: 'required', next: to.fullPath } }
  const required = (to.meta.roles as string[] | undefined) ?? []
  if (required.length && !roles(user).some((role) => required.includes(role))) return { path: '/' }
  return true
})

export default router
