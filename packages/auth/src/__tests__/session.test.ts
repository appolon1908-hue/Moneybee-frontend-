import { beforeEach, describe, expect, it, vi } from "vitest"
import {
  ACTIVE_ORGANIZATION_KEY,
  getActiveOrganizationId,
  onActiveOrganizationChange,
  setActiveOrganizationId,
} from "../session"

beforeEach(() => {
  sessionStorage.clear()
  setActiveOrganizationId(null)
})

describe("getActiveOrganizationId", () => {
  it("returns null when nothing is set", () => {
    expect(getActiveOrganizationId()).toBeNull()
  })

  it("returns the id after setActiveOrganizationId is called", () => {
    setActiveOrganizationId("org-123")
    expect(getActiveOrganizationId()).toBe("org-123")
  })

  it("persists to sessionStorage", () => {
    setActiveOrganizationId("org-abc")
    expect(sessionStorage.getItem(ACTIVE_ORGANIZATION_KEY)).toBe("org-abc")
  })

  it("removes from sessionStorage when set to null", () => {
    setActiveOrganizationId("org-abc")
    setActiveOrganizationId(null)
    expect(sessionStorage.getItem(ACTIVE_ORGANIZATION_KEY)).toBeNull()
  })
})

describe("onActiveOrganizationChange", () => {
  it("calls listener when org changes", () => {
    const listener = vi.fn()
    const unsubscribe = onActiveOrganizationChange(listener)
    setActiveOrganizationId("org-1")
    expect(listener).toHaveBeenCalledWith("org-1")
    unsubscribe()
  })

  it("does not call listener after unsubscribe", () => {
    const listener = vi.fn()
    const unsubscribe = onActiveOrganizationChange(listener)
    unsubscribe()
    setActiveOrganizationId("org-2")
    expect(listener).not.toHaveBeenCalled()
  })

  it("calls multiple listeners", () => {
    const first = vi.fn()
    const second = vi.fn()
    const unsubscribeFirst = onActiveOrganizationChange(first)
    const unsubscribeSecond = onActiveOrganizationChange(second)
    setActiveOrganizationId("org-multi")
    expect(first).toHaveBeenCalledWith("org-multi")
    expect(second).toHaveBeenCalledWith("org-multi")
    unsubscribeFirst()
    unsubscribeSecond()
  })
})
