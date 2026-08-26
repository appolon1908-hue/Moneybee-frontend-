import { createRouter, createWebHistory, type RouteRecordRaw } from "vue-router"
import LandingView from "./views/LandingView.vue"
import InquiryPageView from "./views/InquiryPageView.vue"
import ResourcePageView from "./views/ResourcePageView.vue"
import type { PublicFormKind } from "./publicFormPayloads"

const financingSlugs = [
  "business-loans", "working-capital", "business-line-of-credit",
  "equipment-financing", "sba-loans", "fast-business-funding",
  "restaurant-financing", "trucking-business-loans",
  "construction-business-loans", "retail-business-loans",
]

const resourceSlugs = [
  "how-it-works", "eligibility", "required-documents", "faq", "security",
  "privacy", "terms", "consents-and-disclosures", "accessibility", "complaints",
]

const inquiryRoutes: Array<{ path: string; kind: PublicFormKind; topic?: string }> = [
  { path: "/contact", kind: "contact", topic: "General question" },
  { path: "/support", kind: "contact", topic: "Support" },
  { path: "/callback", kind: "callback", topic: "Business funding" },
  { path: "/for-lenders", kind: "lender" },
  { path: "/lender-partners", kind: "lender" },
  { path: "/lender-programs", kind: "lender" },
  { path: "/partner-with-us", kind: "lender" },
  { path: "/submit-a-deal", kind: "deal" },
  { path: "/referral-partners", kind: "referral" },
  { path: "/brokers", kind: "referral" },
  { path: "/brokers/apply", kind: "referral" },
]

const routes: RouteRecordRaw[] = [
  { path: "/", redirect: "/business-loans" },
  ...financingSlugs.map((slug) => ({
    path: "/" + slug,
    component: LandingView,
    props: { slug },
  })),
  ...resourceSlugs.map((slug) => ({
    path: "/" + slug,
    component: ResourcePageView,
    props: { slug },
  })),
  ...inquiryRoutes.map((item) => ({
    path: item.path,
    component: InquiryPageView,
    props: {
      kind: item.kind,
      slug: item.path.slice(1),
      defaultTopic: item.topic,
    },
  })),
  { path: "/:pathMatch(.*)*", redirect: "/business-loans" },
]

export default createRouter({ history: createWebHistory(), routes })
