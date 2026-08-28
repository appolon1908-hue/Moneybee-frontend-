import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import { authRoutes } from "@moneybee/auth"

export const routes: RouteRecordRaw[] = [
  ...authRoutes(),
  {path: "/", redirect: "/dashboard"},
  {path: "/dashboard", component: () => import("./views/DashboardView.vue")},
  {
    path: "/workspace",
    name: "borrower-portal-workspace",
    component: () => import("./views/WorkspaceView.vue"),
    meta: { requiresAuth: true, title: "Your MoneyBee workspace" },
  },
  {path: "/application", component: () => import("./views/ApplicationView.vue")},
  {path: "/business", component: () => import("./views/BusinessView.vue")},
  {path: "/financials", component: () => import("./views/FinancialsView.vue")},
  {path: "/owners", component: () => import("./views/OwnersView.vue")},
  {path: "/conditions", component: () => import("./views/ConditionsView.vue")},
  {path: "/offers", component: () => import("./views/OffersView.vue")},
  {
    path: "/documents",
    component: () => import("./views/CapabilityWorkflowView.vue"),
    props: {
      eyebrow: "APPLICATION · DOCUMENTS",
      title: "Secure documents",
      description: "Upload workflows open only after secure storage and malware scanning are approved.",
    },
  },
  {path: "/banking", component: () => import("./views/BankingView.vue")},
  {
    path: "/verification",
    component: () => import("./views/CapabilityWorkflowView.vue"),
    props: {
      eyebrow: "APPLICATION · VERIFICATION",
      title: "Business verification",
      description: "Complete KYB verification through an approved identity provider.",
      capability: "kyb.live_verification",
    },
  },
  {path: "/profile", component: () => import("./views/ProfileView.vue")},
  {path: "/support", component: () => import("./views/SupportView.vue")},
]

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
  })
}
