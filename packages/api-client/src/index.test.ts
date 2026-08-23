import { describe, expect, it } from "vitest"
import { money } from "./index"

describe("money", () => {
  it("formats USD values", () => {
    expect(money(75000)).toContain("75,000")
  })
})
