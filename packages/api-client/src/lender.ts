import { api } from "./core";
import { queryString, withOrganization, type PortalTask } from "./portal";

export interface LenderSubmissionSummary {
  id: string;
  application_id: string;
  program_id: string | null;
  status: string;
  assigned_to_subject: string | null;
  submitted_at: string | null;
  version: number | null;
  created_at: string;
}

export interface LenderWorkspaceResponse {
  summary: {
    active_programs: number;
    submission_count: number;
    pending_submissions: number;
  };
  recent_submissions: LenderSubmissionSummary[];
  open_tasks: PortalTask[];
}

export interface LenderProgram {
  id: string;
  lender_id: string;
  name: string;
  product_type: string;
  min_amount: string;
  max_amount: string;
  minimum_monthly_revenue: string;
  minimum_time_in_business_months: number;
  states: string[];
  excluded_industries: string[];
  active: boolean;
  version: number;
  updated_at: string;
}

export interface LenderProgramPatch {
  name?: string;
  product_type?: string;
  min_amount?: number;
  max_amount?: number;
  minimum_monthly_revenue?: number;
  minimum_time_in_business_months?: number;
  states?: string[] | null;
  excluded_industries?: string[] | null;
  active?: boolean;
}

export interface LenderSubmissionWorkspace {
  submission: LenderSubmissionSummary & Record<string, unknown>;
  application: Record<string, unknown>;
  conditions: Array<Record<string, unknown>>;
  bank_analyses: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
}

export interface LenderDecisionCreate {
  expected_version: number;
  decision: "APPROVE" | "DECLINE" | "CONDITIONS" | "FRAUD_REVIEW" | "COMPLIANCE_REVIEW";
  reason_codes?: string[];
  notes?: string | null;
}

export interface LenderDecisionResult {
  review_id: string;
  submission_id: string;
  application_id: string;
  decision: LenderDecisionCreate["decision"];
  status: string;
  version: number;
  created_at: string;
}

export interface BankAnalysisQueueItem {
  submission: LenderSubmissionSummary;
  analysis: Record<string, unknown>;
}

export interface LenderPortfolio {
  summary: {
    offer_count: number;
    accepted_or_funded_count: number;
    accepted_or_funded_amount: string;
  };
  positions: Array<Record<string, unknown>>;
  submission_status_counts?: Record<string, number>;
}

export function getLenderWorkspace(
  organizationId?: string | null,
): Promise<LenderWorkspaceResponse> {
  return api<LenderWorkspaceResponse>(
    "/lender/workspace",
    withOrganization(organizationId),
  );
}

export function listLenderPrograms(
  active?: boolean,
  organizationId?: string | null,
): Promise<LenderProgram[]> {
  return api<LenderProgram[]>(
    `/lender/programs${queryString({ active })}`,
    withOrganization(organizationId),
  );
}

export function updateLenderProgram(
  programId: string,
  version: number,
  payload: LenderProgramPatch,
  organizationId?: string | null,
): Promise<LenderProgram> {
  return api<LenderProgram>(
    `/lender/programs/${encodeURIComponent(programId)}`,
    withOrganization(organizationId, {
      method: "PATCH",
      body: JSON.stringify({ ...payload, version }),
    }),
  );
}

export function getLenderSubmissionWorkspace(
  submissionId: string,
  organizationId?: string | null,
): Promise<LenderSubmissionWorkspace> {
  return api<LenderSubmissionWorkspace>(
    `/lender/submissions/${encodeURIComponent(submissionId)}/workspace`,
    withOrganization(organizationId),
  );
}

export function assignLenderSubmission(
  submissionId: string,
  assignedToSubject: string,
  organizationId?: string | null,
): Promise<LenderSubmissionSummary> {
  return api<LenderSubmissionSummary>(
    `/lender/submissions/${encodeURIComponent(submissionId)}/assignment`,
    withOrganization(organizationId, {
      method: "PATCH",
      body: JSON.stringify({ assigned_to_subject: assignedToSubject }),
    }),
  );
}

export function recordLenderDecision(
  submissionId: string,
  payload: LenderDecisionCreate,
  idempotencyKey: string,
  organizationId?: string | null,
): Promise<LenderDecisionResult> {
  return api<LenderDecisionResult>(
    `/lender/submissions/${encodeURIComponent(submissionId)}/decisions`,
    withOrganization(organizationId, {
      method: "POST",
      idempotencyKey,
      body: JSON.stringify(payload),
    }),
  );
}

export function listBankAnalysisQueue(
  status?: string,
  organizationId?: string | null,
): Promise<BankAnalysisQueueItem[]> {
  return api<BankAnalysisQueueItem[]>(
    `/lender/bank-review-queue${queryString({ status })}`,
    withOrganization(organizationId),
  );
}

export function getLenderPortfolio(
  organizationId?: string | null,
): Promise<LenderPortfolio> {
  return api<LenderPortfolio>(
    "/lender/portfolio",
    withOrganization(organizationId),
  );
}
