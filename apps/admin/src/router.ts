import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
import CRMView from "./views/CRMView.vue"
import CapabilityView from "./views/CapabilityView.vue"
export default createRouter({history: createWebHistory(), routes: [
  {path: "/", redirect: "/dashboard"}, {path: "/dashboard", component: DashboardView},
  {path: "/leads", component: DashboardView}, {path: "/applications", component: DashboardView},
  {path: "/lenders", component: DashboardView}, {path: "/crm", component: CRMView},
  {path: "/audit", component: DashboardView}, {path: "/system", component: CapabilityView},
]})
