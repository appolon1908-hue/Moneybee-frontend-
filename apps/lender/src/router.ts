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
  { path: "/programs", component: () => import("./views/DashboardView.vue") },
  { path: "/offers", component: () => import("./views/SubmissionsView.vue") },
  { path: "/funded-deals", component: () => import("./views/DashboardView.vue") },
]

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
  })
}
