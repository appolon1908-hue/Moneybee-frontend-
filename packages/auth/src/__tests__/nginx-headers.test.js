import { describe, expect, it } from "vitest"
import { readFileSync } from "node:fs"
import { resolve } from "node:path"

const nginxConf = readFileSync(
  resolve(process.cwd(), "nginx.conf"),
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
