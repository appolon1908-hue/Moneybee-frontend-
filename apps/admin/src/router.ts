import { createRouter, createWebHistory } from "vue-router"
import { authRoutes } from "@moneybee/auth"
import CapabilityView from "./views/CapabilityView.vue"
import CRMView from "./views/CRMView.vue"
import CrmDeliveriesView from "./views/CrmDeliveriesView.vue"
import DashboardView from "./views/DashboardView.vue"
import OperationsView from "./views/OperationsView.vue"
import PublicIntakesView from "./views/PublicIntakesView.vue"
import ResourceView from "./views/ResourceView.vue"

export default createRouter({
  history: createWebHistory(),
  routes: [
    ...authRoutes(),
    {path: "/", redirect: "/dashboard"},
    {path: "/dashboard", component: DashboardView},
    {
      path: "/operations-portal",
      name: "admin-operations-portal",
      component: () => import("./views/OperationsPortalView.vue"),
      meta: { requiresAuth: true, title: "MoneyBee operations portal" },
    },
    {
      path: "/leads",
      component: ResourceView,
      props: { title: "Leads", endpoint: "/admin/catalog/leads", description: "Business-funding leads without personal contact fields." },
    },
    {
      path: "/applications",
      component: ResourceView,
      props: { title: "Applications", endpoint: "/admin/catalog/applications", description: "Application state, ownership assignment, and completion." },
    },
    {
      path: "/lenders",
      component: ResourceView,
      props: { title: "Lender programs", endpoint: "/admin/catalog/programs", description: "Versioned eligibility programs available to matching." },
    },
    {
      path: "/submissions",
      component: ResourceView,
      props: { title: "Lender submissions", endpoint: "/admin/catalog/submissions", description: "Prepared and delivered lender submission records." },
    },
    {
      path: "/matches",
      component: ResourceView,
      props: { title: "Application matches", endpoint: "/admin/catalog/matches", description: "Explainable, version-pinned eligibility results." },
    },
    {
      path: "/offers",
      component: ResourceView,
      props: { title: "Offers", endpoint: "/admin/catalog/offers", description: "Normalized lender offers and availability state." },
    },
    {
      path: "/underwriting",
      component: ResourceView,
      props: { title: "Underwriting reviews", endpoint: "/admin/underwriting/reviews", description: "Authoritative manual decisions with policy and reason codes." },
    },
    {
      path: "/sla-alerts",
      component: ResourceView,
      props: { title: "SLA alerts", endpoint: "/admin/sla-alerts", description: "Operational alerts requiring follow-up." },
    },
    {
      path: "/users",
      component: ResourceView,
      props: { title: "User accounts", endpoint: "/admin/users", description: "Identity subjects known to the MoneyBee application." },
    },
    {path: "/operations", component: OperationsView},
    {path: "/public-intakes", component: PublicIntakesView, meta: { requiresAuth: true, title: "Public intakes" }},
    {path: "/crm-deliveries", component: CrmDeliveriesView, meta: { requiresAuth: true, title: "CRM deliveries" }},
    {
      path: "/integration-inbox",
      component: ResourceView,
      props: { title: "Integration inbox", endpoint: "/admin/integration-inbox", description: "Authenticated, deduplicated callbacks awaiting approved domain handling." },
    },
    {
      path: "/operational-exceptions",
      component: ResourceView,
      props: { title: "Operational exceptions", endpoint: "/admin/operational-exceptions?status=OPEN", description: "Explicit recovery work created when automated processing exhausts its safe retry budget." },
    },
    {path: "/crm", component: CRMView},
    {path: "/audit", component: DashboardView},
    {path: "/system", component: CapabilityView},
  ],
})
