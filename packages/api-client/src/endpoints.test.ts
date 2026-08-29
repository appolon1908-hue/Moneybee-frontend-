import { describe, expect, it } from "vitest";
import { ENDPOINTS } from "./endpoints";

describe("MoneyBee endpoint builders", () => {
  it("keeps portal collections on canonical api v2-relative paths", () => {
    expect(ENDPOINTS.public.prequalifications).toBe("/public/prequalifications");
    expect(ENDPOINTS.borrower.overview).toBe("/borrower/overview");
    expect(ENDPOINTS.lender.workspace).toBe("/lender/workspace");
    expect(ENDPOINTS.admin.workspace).toBe("/admin/workspace");
    expect(ENDPOINTS.finance.accounts).toBe("/finance/accounts");
    expect(ENDPOINTS.admin.systemReadiness).toBe("/admin/system/readiness");
    expect(ENDPOINTS.identity.capabilities).toBe("/me/capabilities");
  });

  it("encodes dynamic URL segments for portal APIs", () => {
    expect(ENDPOINTS.applications.fromLead("lead/1")).toBe("/applications/from-lead/lead%2F1");
    expect(ENDPOINTS.applications.item("application/1")).toBe("/applications/application%2F1");
    expect(ENDPOINTS.applications.submit("application/1")).toBe("/applications/application%2F1/submit");
    expect(ENDPOINTS.borrower.conversationMessages("conversation/1"))
      .toBe("/borrower/conversations/conversation%2F1/messages");
    expect(ENDPOINTS.lender.submissionDecisions("submission/1"))
      .toBe("/lender/submissions/submission%2F1/decisions");
    expect(ENDPOINTS.applications.owner("application/1", "owner/1"))
      .toBe("/applications/application%2F1/owners/owner%2F1");
    expect(ENDPOINTS.admin.webhookReceiptRequeue("receipt/1"))
      .toBe("/admin/webhook-receipts/receipt%2F1/requeue");
    expect(ENDPOINTS.admin.operationalExceptionResolve("exception/1"))
      .toBe("/admin/operational-exceptions/exception%2F1/resolve");
    expect(ENDPOINTS.finance.journalPostings("journal/1"))
      .toBe("/finance/journal-entries/journal%2F1/postings");
  });

  it("does not expose legacy api version prefixes to portal callers", () => {
    const serialized = JSON.stringify(ENDPOINTS);
    expect(serialized).not.toContain("/api/v1");
    expect(serialized).not.toContain("/api/v2");
  });
});
