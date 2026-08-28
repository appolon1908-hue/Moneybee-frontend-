import { describe, expect, it } from "vitest"
import { humanize } from "./format"

describe("humanize", () => {
  it("replaces underscores with spaces", () => {
    expect(humanize("BORROWER_ACTION_REQUIRED")).toBe("BORROWER ACTION REQUIRED")
  })

  it("replaces hyphens with spaces", () => {
    expect(humanize("under-review")).toBe("under review")
  })

  it("preserves original casing", () => {
    expect(humanize("Already_Readable")).toBe("Already Readable")
  })

  it("leaves plain text untouched", () => {
    expect(humanize("no separators here")).toBe("no separators here")
  })
})
