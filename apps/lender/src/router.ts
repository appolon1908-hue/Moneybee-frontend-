import { createRouter, createWebHistory } from "vue-router"
import { authRoutes } from "@moneybee/auth"
import DashboardView from "./views/DashboardView.vue"
import SubmissionsView from "./views/SubmissionsView.vue"

export default createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes(),
    { path: "/", redirect: "/dashboard" },
    { path: "/dashboard", component: DashboardView },
    {
      path: "/workspace",
      name: "lender-portal-workspace",
      component: () => import("./views/PortalWorkspaceView.vue"),
      meta: { requiresAuth: true, title: "Lender workspace" },
    },
    { path: "/applications", component: SubmissionsView },
    { path: "/programs", component: DashboardView },
    { path: "/offers", component: SubmissionsView },
    { path: "/funded-deals", component: DashboardView },
  ],
})
