import { describe, expect, it } from "vitest";
import { ApiProblem } from "./core";
import {
  IdempotencyKeyRegistry,
  isAmbiguousCommandFailure,
} from "./idempotency";

describe("IdempotencyKeyRegistry", () => {
  it("reuses a key across ambiguous failures and releases it on success", () => {
    let sequence = 0;
    const registry = new IdempotencyKeyRegistry(() => `key-${++sequence}`);

    expect(registry.forOperation("generate:2026")).toBe("key-1");
    registry.recordFailure("generate:2026", new TypeError("response lost"));
    expect(registry.forOperation("generate:2026")).toBe("key-1");

    registry.resolve("generate:2026");
    expect(registry.forOperation("generate:2026")).toBe("key-2");
  });

  it("releases a key after a definitive client rejection", () => {
    let sequence = 0;
    const registry = new IdempotencyKeyRegistry(() => `key-${++sequence}`);

    expect(registry.forOperation("ack:offer-1")).toBe("key-1");
    registry.recordFailure(
      "ack:offer-1",
      new ApiProblem("invalid", 422, "VALIDATION_ERROR"),
    );
    expect(registry.forOperation("ack:offer-1")).toBe("key-2");
  });
});

describe("isAmbiguousCommandFailure", () => {
  it("treats network and retryable server failures as ambiguous", () => {
    expect(isAmbiguousCommandFailure(new TypeError("network"))).toBe(true);
    expect(
      isAmbiguousCommandFailure(
        new ApiProblem("unavailable", 503, "UNAVAILABLE"),
      ),
    ).toBe(true);
    expect(
      isAmbiguousCommandFailure(
        new ApiProblem("retry", 409, "RETRYABLE", undefined, undefined, true),
      ),
    ).toBe(true);
  });

  it("treats ordinary 4xx rejections as definitive", () => {
    expect(
      isAmbiguousCommandFailure(
        new ApiProblem("forbidden", 403, "ACCESS_DENIED"),
      ),
    ).toBe(false);
  });
});
