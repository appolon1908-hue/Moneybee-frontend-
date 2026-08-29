import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import { authRoutes } from "@moneybee/auth"

export const routes: RouteRecordRaw[] = [
  ...authRoutes(),
  { path: "/", redirect: "/dashboard" },
  { path: "/dashboard", component: () => import("./views/DashboardView.vue") },
  {
    path: "/workspace",
    name: "lender-portal-workspace",
    component: () => import("./views/PortalWorkspaceView.vue"),
    meta: { requiresAuth: true, title: "Lender workspace" },
  },
  { path: "/applications", component: () => import("./views/SubmissionsView.vue") },
  { path: "/underwriting", component: () => import("./views/UnderwritingView.vue") },
  { path: "/conditions", component: () => import("./views/ConditionsView.vue") },
  { path: "/programs", component: () => import("./views/ProgramsView.vue") },
  { path: "/offers", component: () => import("./views/OffersView.vue") },
  { path: "/funded-deals", component: () => import("./views/FundedView.vue") },
  { path: "/reports", component: () => import("./views/ReportsView.vue") },
  { path: "/settings", component: () => import("./views/SettingsView.vue") },
]

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
  })
}
