import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
import OffersView from "./views/OffersView.vue"

export default createRouter({
  history: createWebHistory(),
  routes: [
    {path: "/", redirect: "/dashboard"},
    {path: "/dashboard", component: DashboardView},
    {path: "/offers", component: OffersView},
    {path: "/application", component: DashboardView},
    {path: "/documents", component: DashboardView},
    {path: "/banking", component: DashboardView},
  ],
})
