import { describe, expect, it } from "vitest"
import { financingSlugs, landingPages } from "./landingPages"
import { resourcePages } from "./resourcePages"

describe("marketing SEO content", () => {
  it("publishes twenty unique funding landing pages", () => {
    expect(financingSlugs).toHaveLength(20)
    expect(new Set(financingSlugs).size).toBe(20)
    for (const slug of financingSlugs) {
      const page = landingPages[slug]
      expect(page.title.length).toBeGreaterThan(20)
      expect(page.description.length).toBeGreaterThan(60)
      expect(page.keywords.length).toBeGreaterThanOrEqual(3)
      expect(page.useCases.length).toBeGreaterThanOrEqual(4)
    }
  })

  it("keeps required trust and advertising pages crawlable", () => {
    for (const slug of [
      "privacy",
      "terms",
      "cookie-notice",
      "advertising-disclosure",
      "privacy-choices",
      "consents-and-disclosures",
      "accessibility",
      "complaints",
    ]) {
      expect(resourcePages[slug]).toBeTruthy()
      expect(resourcePages[slug].description.length).toBeGreaterThan(40)
      expect(resourcePages[slug].keywords.length).toBeGreaterThanOrEqual(3)
    }
  })
})
