import { describe, expect, it } from "vitest";
import {
  emptyPage,
  isCurrentRefresh,
  nextPageOffset,
  pageSummary,
  previousPageOffset,
} from "./compliance-state";

describe("compliance pagination", () => {
  it("advances and reverses bounded offsets", () => {
    const page = {
      ...emptyPage<{ id: string }>(50),
      items: Array.from({ length: 50 }, (_, index) => ({ id: String(index) })),
      total: 125,
      offset: 50,
      has_more: true,
    };

    expect(previousPageOffset(page)).toBe(0);
    expect(nextPageOffset(page)).toBe(100);
    expect(pageSummary(page)).toBe("51–100 of 125");
  });

  it("does not advance past the final page", () => {
    const page = {
      ...emptyPage<{ id: string }>(50),
      items: [{ id: "last" }],
      total: 101,
      offset: 100,
      has_more: false,
    };

    expect(nextPageOffset(page)).toBe(100);
    expect(pageSummary(page)).toBe("101–101 of 101");
  });
});

describe("compliance refresh generations", () => {
  it("rejects results from a superseded request", () => {
    expect(isCurrentRefresh(4, 5)).toBe(false);
    expect(isCurrentRefresh(5, 5)).toBe(true);
  });
});
