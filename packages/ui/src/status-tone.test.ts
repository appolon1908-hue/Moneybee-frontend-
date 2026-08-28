import { describe, expect, it } from "vitest"
import { statusTone } from "./status-tone"

describe("statusTone", () => {
  it("maps completion/approval states to success", () => {
    expect(statusTone("FUNDED")).toBe("success")
    expect(statusTone("SATISFIED")).toBe("success")
    expect(statusTone("approved")).toBe("success")
  })

  it("maps in-progress/action-needed states to warning", () => {
    expect(statusTone("BORROWER_ACTION_REQUIRED")).toBe("warning")
    expect(statusTone("under-review")).toBe("warning")
    expect(statusTone("PENDING")).toBe("warning")
  })

  it("maps terminal-negative states to danger", () => {
    expect(statusTone("REJECTED")).toBe("danger")
    expect(statusTone("declined")).toBe("danger")
    expect(statusTone("EXPIRED")).toBe("danger")
  })

  it("falls back to neutral for unrecognized codes", () => {
    expect(statusTone("SOME_NEW_STATE")).toBe("neutral")
    expect(statusTone("")).toBe("neutral")
  })

  it("is case- and separator-insensitive", () => {
    expect(statusTone("borrower_action_required")).toBe(statusTone("borrower-action-required"))
  })
})
