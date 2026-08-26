import { describe, expect, it } from "vitest";

import { queryString, withOrganization } from "./portal";


describe("portal API helpers", () => {
  it("omits undefined values and encodes query parameters", () => {
    expect(
      queryString({
        status: "IN PROGRESS",
        limit: 25,
        ignored: undefined,
        blank: "",
      }),
    ).toBe("?status=IN+PROGRESS&limit=25");
  });

  it("adds the selected organization without losing existing headers", () => {
    const options = withOrganization("organization-123", {
      headers: { "X-Request-ID": "request-456" },
    });
    const headers = new Headers(options.headers);
    expect(headers.get("X-Organization-ID")).toBe("organization-123");
    expect(headers.get("X-Request-ID")).toBe("request-456");
  });
});
