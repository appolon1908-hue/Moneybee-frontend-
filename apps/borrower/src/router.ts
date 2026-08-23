import { createRouter, createWebHistory } from "vue-router"
import ApplicationView from "./views/ApplicationView.vue"
import DashboardView from "./views/DashboardView.vue"
import OffersView from "./views/OffersView.vue"

export default createRouter({
  history: createWebHistory(),
  routes: [
    {path: "/", redirect: "/dashboard"},
    {path: "/dashboard", component: DashboardView},
    {path: "/offers", component: OffersView},
    {path: "/application", component: ApplicationView},
    {path: "/documents", component: DashboardView},
    {path: "/banking", component: DashboardView},
  ],
})
