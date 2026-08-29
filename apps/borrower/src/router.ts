import { createRouter, createWebHistory } from "vue-router"
import { authRoutes } from "@moneybee/auth"
import ApplicationView from "./views/ApplicationView.vue"
import BankingView from "./views/BankingView.vue"
import BusinessView from "./views/BusinessView.vue"
import CapabilityWorkflowView from "./views/CapabilityWorkflowView.vue"
import ConditionsView from "./views/ConditionsView.vue"
import DashboardView from "./views/DashboardView.vue"
import FinancialsView from "./views/FinancialsView.vue"
import OffersView from "./views/OffersView.vue"
import OwnersView from "./views/OwnersView.vue"
import ProfileView from "./views/ProfileView.vue"
import SupportView from "./views/SupportView.vue"
import WorkspaceView from "./views/WorkspaceView.vue"

export default createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes(),
    {path: "/", redirect: "/dashboard"},
    {path: "/dashboard", component: DashboardView},

    {
      path: "/workspace",
      name: "borrower-portal-workspace",
      component: WorkspaceView,
      meta: { requiresAuth: true, title: "Your MoneyBee workspace" },
    },
    {path: "/application", component: ApplicationView},
    {path: "/business", component: BusinessView},
    {path: "/financials", component: FinancialsView},
    {path: "/owners", component: OwnersView},
    {path: "/conditions", component: ConditionsView},
    {path: "/offers", component: OffersView},
    {
      path: "/documents",
      component: CapabilityWorkflowView,
      props: {
        eyebrow: "APPLICATION · DOCUMENTS",
        title: "Secure documents",
        description: "Upload workflows open only after secure storage and malware scanning are approved.",
      },
    },
    {path: "/banking", component: BankingView},
    {
      path: "/verification",
      component: CapabilityWorkflowView,
      props: {
        eyebrow: "APPLICATION · VERIFICATION",
        title: "Business verification",
        description: "Complete KYB verification through an approved identity provider.",
        capability: "kyb.live_verification",
      },
    },
    {path: "/profile", component: ProfileView},
    {path: "/support", component: SupportView},
  ],
})
