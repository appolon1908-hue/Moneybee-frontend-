import { api } from "./core";
import { ENDPOINTS } from "./endpoints";
import { queryString, withOrganization, type PortalTask } from "./portal";

export interface LenderSubmissionSummary {
  id: string;
  application_id: string;
  lender_id: string;
  program_id: string | null;
  program_version?: number;
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
  expected_version: number;
  decision: "APPROVE" | "DECLINE" | "CONDITIONS" | "FRAUD_REVIEW" | "COMPLIANCE_REVIEW";
  notes?: string | null;
  reason_codes?: string[];
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

export interface LenderConditionCreate {
  description: string;
}

export interface LenderCondition {
  id: string;
  submission_id: string;
  application_id: string;
  description: string;
  status: string;
  created_at: string;
}

export interface LenderOfferCreate {
  application_id: string;
  lender_id: string;
  program_id?: string | null;
  product_type: string;
  amount: string | number;
  term_months: number;
  payment_frequency: string;
  payment_amount: string | number;
  apr?: string | number | null;
  factor_rate?: string | number | null;
  origination_fee?: string | number;
  total_repayment?: string | number | null;
  expires_at?: string | null;
}

export interface LenderOffer extends LenderOfferCreate {
  id: string;
  program_id: string | null;
  status: string;
  version: number;
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

export interface LenderBankTransaction {
  id: string;
  connection_id: string;
  account_id: string | null;
  amount: string | number;
  currency: string;
  description: string;
  category: string | null;
  transaction_type: string | null;
  posted_at: string;
  pending: boolean;
}

export function getLenderWorkspace(
  organizationId?: string | null,
): Promise<LenderWorkspaceResponse> {
  return api<LenderWorkspaceResponse>(
    ENDPOINTS.lender.workspace,
    withOrganization(organizationId),
  );
}

export function listLenderPrograms(
  active?: boolean,
  organizationId?: string | null,
): Promise<LenderProgram[]> {
  return api<LenderProgram[]>(
    `${ENDPOINTS.lender.programs}${queryString({ active })}`,
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
    ENDPOINTS.lender.program(programId),
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
    ENDPOINTS.lender.submissionWorkspace(submissionId),
    withOrganization(organizationId),
  );
}

export function assignLenderSubmission(
  submissionId: string,
  assignedToSubject: string,
  organizationId?: string | null,
): Promise<LenderSubmissionSummary> {
  return api<LenderSubmissionSummary>(
    ENDPOINTS.lender.submissionAssignment(submissionId),
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
    ENDPOINTS.lender.submissionDecisions(submissionId),
    withOrganization(organizationId, {
      method: "POST",
      idempotencyKey,
      body: JSON.stringify(payload),
    }),
  );
}

export function listLenderBankTransactions(
  submissionId: string,
  limit = 200,
  organizationId?: string | null,
): Promise<LenderBankTransaction[]> {
  return api<LenderBankTransaction[]>(
    `${ENDPOINTS.lender.submissionBankTransactions(submissionId)}${queryString({ limit })}`,
    withOrganization(organizationId),
  );
}

export function listLenderSubmissions(
  organizationId?: string | null,
): Promise<LenderSubmissionSummary[]> {
  return api<LenderSubmissionSummary[]>(
    ENDPOINTS.lender.submissions,
    withOrganization(organizationId),
  );
}

export function createLenderSubmissionCondition(
  submissionId: string,
  payload: LenderConditionCreate,
  organizationId?: string | null,
): Promise<LenderCondition> {
  return api<LenderCondition>(
    ENDPOINTS.lender.submissionConditions(submissionId),
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function createLenderSubmissionOffer(
  submissionId: string,
  payload: LenderOfferCreate,
  organizationId?: string | null,
): Promise<LenderOffer> {
  return api<LenderOffer>(
    ENDPOINTS.lender.submissionOffers(submissionId),
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function approveLenderCondition(
  conditionId: string,
  organizationId?: string | null,
): Promise<LenderCondition> {
  return api<LenderCondition>(
    ENDPOINTS.lender.conditionApprove(conditionId),
    withOrganization(organizationId, { method: "POST" }),
  );
}

export function rejectLenderCondition(
  conditionId: string,
  organizationId?: string | null,
): Promise<LenderCondition> {
  return api<LenderCondition>(
    ENDPOINTS.lender.conditionReject(conditionId),
    withOrganization(organizationId, { method: "POST" }),
  );
}

export function waiveLenderCondition(
  conditionId: string,
  organizationId?: string | null,
): Promise<LenderCondition> {
  return api<LenderCondition>(
    ENDPOINTS.lender.conditionWaive(conditionId),
    withOrganization(organizationId, { method: "POST" }),
  );
}

export function listBankAnalysisQueue(
  status?: string,
  organizationId?: string | null,
): Promise<BankAnalysisQueueItem[]> {
  return api<BankAnalysisQueueItem[]>(
    `${ENDPOINTS.lender.bankReviewQueue}${queryString({ status })}`,
    withOrganization(organizationId),
  );
}

export function getLenderPortfolio(
  organizationId?: string | null,
): Promise<LenderPortfolio> {
  return api<LenderPortfolio>(
    ENDPOINTS.lender.portfolio,
    withOrganization(organizationId),
  );
}
