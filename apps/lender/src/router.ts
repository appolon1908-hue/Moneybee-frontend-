import { createRouter, createWebHistory } from "vue-router"
import DashboardView from "./views/DashboardView.vue"
export default createRouter({history: createWebHistory(), routes: [
  {path: "/", redirect: "/dashboard"}, {path: "/dashboard", component: DashboardView},
  {path: "/applications", component: DashboardView}, {path: "/programs", component: DashboardView},
  {path: "/offers", component: DashboardView}, {path: "/funded-deals", component: DashboardView},
]})
