import type { RouteLocationNormalizedLoaded } from "vue-router"
import { landingPages } from "./landingPages"
import { resourcePages } from "./resourcePages"

const siteUrl = "https://moneybeeloan.com"
const siteName = "MoneyBeeLoans"

function upsertMeta(selector: string, attrs: Record<string, string>): void {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement("meta")
    document.head.appendChild(element)
  }
  Object.entries(attrs).forEach(([key, value]) => element.setAttribute(key, value))
}

function upsertLink(rel: string, href: string): void {
  let element = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement("link")
    element.rel = rel
    document.head.appendChild(element)
  }
  element.href = href
}

function upsertJsonLd(payload: Record<string, unknown>): void {
  const id = "moneybee-jsonld"
  let element = document.getElementById(id) as HTMLScriptElement | null
  if (!element) {
    element = document.createElement("script")
    element.id = id
    element.type = "application/ld+json"
    document.head.appendChild(element)
  }
  element.textContent = JSON.stringify(payload)
}

function pageFor(route: RouteLocationNormalizedLoaded) {
  const slug = String(route.params.slug || route.path.replace(/^\//, "") || "business-loans")
  if (landingPages[slug]) {
    const page = landingPages[slug]
    return {
      title: `${page.title} | MoneyBeeLoans`,
      description: page.description,
      keywords: page.keywords.join(", "),
      type: "FinancialService",
      slug,
    }
  }
  if (resourcePages[slug]) {
    const page = resourcePages[slug]
    return {
      title: `${page.title} | MoneyBeeLoans`,
      description: page.description,
      keywords: page.keywords.join(", "),
      type: "WebPage",
      slug,
    }
  }
  return {
    title: "MoneyBeeLoans | Business funding",
    description: "Secure business funding requests, lender review, and borrower portal access.",
    keywords: "business funding, small business loans, MoneyBee",
    type: "WebSite",
    slug: "business-loans",
  }
}

export function installSeo(router: {
  afterEach: (handler: (route: RouteLocationNormalizedLoaded) => void) => void
}): void {
  router.afterEach((route) => {
    const page = pageFor(route)
    const canonical = `${siteUrl}/${page.slug}`
    document.title = page.title
    upsertMeta("meta[name=\"description\"]", { name: "description", content: page.description })
    upsertMeta("meta[name=\"keywords\"]", { name: "keywords", content: page.keywords })
    upsertMeta("meta[name=\"robots\"]", { name: "robots", content: "index,follow,max-image-preview:large" })
    upsertMeta("meta[property=\"og:title\"]", { property: "og:title", content: page.title })
    upsertMeta("meta[property=\"og:description\"]", { property: "og:description", content: page.description })
    upsertMeta("meta[property=\"og:type\"]", { property: "og:type", content: "website" })
    upsertMeta("meta[property=\"og:site_name\"]", { property: "og:site_name", content: siteName })
    upsertMeta("meta[property=\"og:url\"]", { property: "og:url", content: canonical })
    upsertMeta("meta[name=\"twitter:card\"]", { name: "twitter:card", content: "summary_large_image" })
    upsertMeta("meta[name=\"twitter:title\"]", { name: "twitter:title", content: page.title })
    upsertMeta("meta[name=\"twitter:description\"]", { name: "twitter:description", content: page.description })
    upsertLink("canonical", canonical)
    upsertJsonLd({
      "@context": "https://schema.org",
      "@type": page.type,
      name: page.title.replace(" | MoneyBeeLoans", ""),
      description: page.description,
      url: canonical,
      provider: {
        "@type": "Organization",
        name: siteName,
        url: siteUrl,
      },
      areaServed: "US",
      serviceType: "Business financing request and review",
    })
  })
}
