import { describe, expect, it } from "vitest";

import { AUTH_IMPLEMENTATION_STATUS } from "./index";

describe("auth bootstrap", () => {
  it("does not pretend production authentication is implemented", () => {
    expect(AUTH_IMPLEMENTATION_STATUS).toBe("NOT_IMPLEMENTED");
  });
});
