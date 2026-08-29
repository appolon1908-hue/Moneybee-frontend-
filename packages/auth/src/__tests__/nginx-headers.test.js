import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const nginxConf = readFileSync(
  resolve(process.cwd(), "nginx.conf"),
  "utf8",
)
const caddyfile = readFileSync(
  resolve(process.cwd(), "deploy", "Caddyfile.moneybee"),
  "utf8",
)

describe("nginx security headers", () => {
  const requiredHeaders = [
    "X-Content-Type-Options",
    "Referrer-Policy",
    "X-Frame-Options",
    "Permissions-Policy",
    "Strict-Transport-Security",
    "Content-Security-Policy",
  ]

  for (const header of requiredHeaders) {
    it(`includes ${header}`, () => {
      expect(nginxConf).toContain(header)
    })
  }

  it("CSP disallows unsafe-eval", () => {
    expect(nginxConf).not.toContain("unsafe-eval")
  })

  it("CSP script-src does not allow unsafe-inline", () => {
    const cspLine = nginxConf
      .split("\n")
      .find((line) => line.includes("Content-Security-Policy"))
    expect(cspLine).toBeDefined()
    expect(cspLine).not.toMatch(/script-src[^;]*'unsafe-inline'/)
  })

  it("HSTS max-age is at least one year", () => {
    const hstsLine = nginxConf
      .split("\n")
      .find((line) => line.includes("Strict-Transport-Security"))
    expect(hstsLine).toBeDefined()
    expect(hstsLine).toContain("max-age=31536000")
  })

  it("X-Frame-Options is DENY", () => {
    expect(nginxConf).toContain("X-Frame-Options DENY")
  })

  it("frame-ancestors none in CSP", () => {
    expect(nginxConf).toContain("frame-ancestors 'none'")
  })

  it("CSP has a base-uri directive", () => {
    expect(nginxConf).toContain("base-uri")
  })

  it("CSP has form-action directive", () => {
    expect(nginxConf).toContain("form-action")
  })

  it("all security headers have always flag", () => {
    const headerLines = nginxConf
      .split("\n")
      .filter((line) =>
        line.includes("add_header")
        && requiredHeaders.some((header) => line.includes(header)),
      )
    for (const line of headerLines) {
      expect(line, `Header line missing always: ${line}`).toContain("always")
    }
  })
})

describe("MoneyBee Caddy edge security headers", () => {
  const frontendHosts = [
    "moneybeeloan.com",
    "www.moneybeeloan.com",
    "app.moneybeeloan.com",
    "lenders.moneybeeloan.com",
    "lender.moneybeeloan.com",
    "admin.moneybeeloan.com",
  ]

  function blockFor(host) {
    const pattern = new RegExp(`${host.replaceAll(".", "\\.")} \\{[\\s\\S]*?\\n\\}`, "m")
    const match = caddyfile.match(pattern)
    expect(match, `${host} block missing`).toBeTruthy()
    return match?.[0] || ""
  }

  it("defines strict frontend and API CSP snippets", () => {
    expect(caddyfile).toContain("(moneybee_frontend_security)")
    expect(caddyfile).toContain("(moneybee_api_security)")
    expect(caddyfile).toContain("Strict-Transport-Security")
    expect(caddyfile).toContain("Content-Security-Policy")
  })

  for (const host of frontendHosts) {
    it(`${host} imports frontend security`, () => {
      expect(blockFor(host)).toContain("import moneybee_frontend_security")
    })
  }

  it("api.moneybeeloan.com imports API security", () => {
    expect(blockFor("api.moneybeeloan.com")).toContain("import moneybee_api_security")
  })

  it("api.moneybeeloan.com does not expose Prometheus metrics publicly", () => {
    expect(blockFor("api.moneybeeloan.com")).toContain("respond /metrics 404")
  })

  it("API CSP blocks script, style, font, image, frame, object, form, and base access", () => {
    const apiSnippet = caddyfile.match(/\(moneybee_api_security\) \{[\s\S]*?\n\}/m)?.[0] || ""
    for (const directive of [
      "default-src 'none'",
      "base-uri 'none'",
      "object-src 'none'",
      "frame-ancestors 'none'",
      "form-action 'none'",
      "img-src 'none'",
      "font-src 'none'",
      "style-src 'none'",
      "script-src 'none'",
    ]) {
      expect(apiSnippet).toContain(directive)
    }
  })
})
