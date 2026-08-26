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
  min_amount: string | null;
  max_amount: string | null;
  min_credit_score: number | null;
  min_monthly_revenue: string | null;
  min_time_in_business_months: number | null;
  allowed_states: string[];
  active: boolean;
  version: number;
  created_at: string;
  updated_at: string;
}

export interface LenderProgramPatch {
  name?: string;
  product_type?: string;
  min_amount?: string | null;
  max_amount?: string | null;
  min_credit_score?: number | null;
  min_monthly_revenue?: string | null;
  min_time_in_business_months?: number | null;
  allowed_states?: string[] | null;
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
  decision: "APPROVE" | "DECLINE" | "REQUEST_INFORMATION";
  notes?: string | null;
  requested_items?: string[];
  offer_amount?: string | null;
  term_months?: number | null;
  interest_rate?: string | null;
}

export interface LenderDecisionResult {
  submission_id: string;
  application_id: string;
  decision: LenderDecisionCreate["decision"];
  status: string;
  version: number | null;
  live_submission_triggered: false;
  recorded_at: string;
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
      expectedVersion: version,
      body: JSON.stringify(payload),
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
    `/lender/submissions/${encodeURIComponent(submissionId)}/decision`,
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
    `/lender/bank-analysis-queue${queryString({ status })}`,
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
