import { createRouter, createWebHistory } from "vue-router"
import LandingView from "./views/LandingView.vue"

const slugs = [
  "business-loans", "working-capital", "business-line-of-credit",
  "equipment-financing", "sba-loans", "fast-business-funding",
  "restaurant-financing", "trucking-business-loans",
  "construction-business-loans", "retail-business-loans",
]

export default createRouter({
  history: createWebHistory(),
  routes: [
    {path: "/", redirect: "/business-loans"},
    ...slugs.map((slug) => ({path: "/" + slug, component: LandingView, props: {slug}})),
    {path: "/:pathMatch(.*)*", redirect: "/business-loans"},
  ],
})
