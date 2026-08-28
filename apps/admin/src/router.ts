import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import { authRoutes } from "@moneybee/auth"

export const routes: RouteRecordRaw[] = [
  ...authRoutes(),
  {path: "/", redirect: "/dashboard"},
  {path: "/dashboard", component: () => import("./views/DashboardView.vue")},
  {
    path: "/operations-portal",
    name: "admin-operations-portal",
    component: () => import("./views/OperationsPortalView.vue"),
    meta: { requiresAuth: true, title: "MoneyBee operations portal" },
  },
  {
    path: "/leads",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Leads", endpoint: "/admin/catalog/leads", description: "Business-funding leads without personal contact fields." },
  },
  {
    path: "/applications",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Applications", endpoint: "/admin/catalog/applications", description: "Application state, ownership assignment, and completion." },
  },
  {
    path: "/lenders",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Lender programs", endpoint: "/admin/catalog/programs", description: "Versioned eligibility programs available to matching." },
  },
  {
    path: "/submissions",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Lender submissions", endpoint: "/admin/catalog/submissions", description: "Prepared and delivered lender submission records." },
  },
  {
    path: "/matches",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Application matches", endpoint: "/admin/catalog/matches", description: "Explainable, version-pinned eligibility results." },
  },
  {
    path: "/offers",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Offers", endpoint: "/admin/catalog/offers", description: "Normalized lender offers and availability state." },
  },
  {
    path: "/underwriting",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Underwriting reviews", endpoint: "/admin/underwriting/reviews", description: "Authoritative manual decisions with policy and reason codes." },
  },
  {path: "/finance", component: () => import("./views/FinanceView.vue"), meta: { requiresAuth: true, title: "Financial ledger" }},
  {
    path: "/sla-alerts",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "SLA alerts", endpoint: "/admin/sla-alerts", description: "Operational alerts requiring follow-up." },
  },
  {
    path: "/users",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "User accounts", endpoint: "/admin/users", description: "Identity subjects known to the MoneyBee application." },
  },
  {path: "/operations", component: () => import("./views/OperationsView.vue")},
  {path: "/public-intakes", component: () => import("./views/PublicIntakesView.vue"), meta: { requiresAuth: true, title: "Public intakes" }},
  {path: "/crm-deliveries", component: () => import("./views/CrmDeliveriesView.vue"), meta: { requiresAuth: true, title: "CRM deliveries" }},
  {
    path: "/integration-inbox",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Integration inbox", endpoint: "/admin/integration-inbox", description: "Authenticated, deduplicated callbacks awaiting approved domain handling." },
  },
  {
    path: "/operational-exceptions",
    component: () => import("./views/ResourceView.vue"),
    props: { title: "Operational exceptions", endpoint: "/admin/operational-exceptions?status=OPEN", description: "Explicit recovery work created when automated processing exhausts its safe retry budget." },
  },
  {path: "/crm", component: () => import("./views/CRMView.vue")},
  {path: "/audit", component: () => import("./views/DashboardView.vue")},
  {path: "/system", component: () => import("./views/CapabilityView.vue")},
]

export function createAppRouter() {
  return createRouter({
    history: createWebHistory(),
    routes,
  })
}
