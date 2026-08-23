import { describe, expect, it } from "vitest";
import { createIdempotencyKey } from "./index";
describe("api client",()=>{it("creates unique idempotency keys",()=>{expect(createIdempotencyKey()).not.toBe(createIdempotencyKey());});});
