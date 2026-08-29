import { expect, test } from "@playwright/test"

const landingPages = [
  "business-loans",
  "working-capital",
  "business-line-of-credit",
  "equipment-financing",
  "sba-loans",
  "fast-business-funding",
  "restaurant-financing",
  "trucking-business-loans",
  "construction-business-loans",
  "retail-business-loans",
  "merchant-cash-advance",
  "invoice-financing",
  "commercial-real-estate-loans",
  "medical-practice-financing",
  "beauty-salon-financing",
  "franchise-financing",
  "startup-business-loans",
  "minority-business-loans",
  "women-owned-business-loans",
  "bad-credit-business-loans",
]

const policyPages = [
  "privacy",
  "terms",
  "cookie-notice",
  "advertising-disclosure",
  "privacy-choices",
  "consents-and-disclosures",
  "accessibility",
  "complaints",
]

test.describe("MoneyBee launch E2E", () => {
  for (const slug of landingPages) {
    test(`landing page is crawlable and actionable: ${slug}`, async ({ page }) => {
      await page.goto(`/${slug}`)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      await expect(page.locator("link[rel='canonical']")).toHaveAttribute("href", new RegExp(`/${slug}$`))
      const description = await page.locator("meta[name='description']").getAttribute("content")
      expect(description?.length).toBeGreaterThan(50)
      const jsonLd = await page.locator("script[type='application/ld\\+json']").textContent()
      expect(jsonLd).toContain("Business financing request and review")
      await expect(page.getByRole("link", { name: "Start request" })).toBeVisible()
      await expect(page.getByRole("form", { name: "Business funding prequalification" })).toBeVisible()
    })
  }

  for (const slug of policyPages) {
    test(`policy page is reachable: ${slug}`, async ({ page }) => {
      await page.goto(`/${slug}`)
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible()
      await expect(page.getByLabel("Related MoneyBee pages")).toBeVisible()
    })
  }

  test("cookie consent is visible and dismissible", async ({ page }) => {
    await page.goto("/business-loans")
    await expect(page.getByLabel("Cookie notice")).toBeVisible()
    await page.getByRole("button", { name: "Accept" }).click()
    await expect(page.getByLabel("Cookie notice")).toBeHidden()
  })

  test("prequalification form validates and progresses through the guided flow", async ({ page }) => {
    await page.goto("/business-loans")
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Purpose")).toBeVisible()
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Business profile")).toBeVisible()
    await expect(page.getByText("Planning range:")).toBeVisible()
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Business details")).toBeVisible()
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Complete this step before continuing.")).toBeVisible()
    await page.getByLabel("Business name").fill("Launch Test Honey")
    await page.getByLabel("ZIP/postal code").fill("33101")
    await page.getByRole("button", { name: "Continue" }).click()
    await expect(page.getByText("Contact and consent")).toBeVisible()
  })

  test("seo assets are served", async ({ page }) => {
    const robots = await page.goto("/robots.txt")
    expect(robots?.ok()).toBeTruthy()
    await expect(page.locator("body")).toContainText("Sitemap: https://moneybeeloan.com/sitemap.xml")

    const sitemap = await page.goto("/sitemap.xml")
    expect(sitemap?.ok()).toBeTruthy()
    await expect(page.locator("body")).toContainText("https://moneybeeloan.com/business-loans")

    const ads = await page.goto("/ads.txt")
    expect(ads?.ok()).toBeTruthy()
    await expect(page.locator("body")).toContainText("Replace this placeholder")
  })
})
