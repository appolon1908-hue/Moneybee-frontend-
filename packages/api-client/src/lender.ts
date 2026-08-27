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

export interface LenderWorkspace {
  summary: {
    active_programs: number;
    program_count: number;
    submission_count: number;
    pending_submissions: number;
    pending_submission_count: number;
    offer_count: number;
  };
  recent_submissions: LenderSubmissionSummary[];
  open_tasks: PortalTask[];
  programs: Array<Record<string, unknown>>;
  submissions: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
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
  [key: string]: unknown;
  submission: LenderSubmissionSummary & Record<string, unknown>;
  application: Record<string, unknown>;
  conditions: Array<Record<string, unknown>>;
  bank_analyses: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
  tasks?: PortalTask[];
}

export interface LenderDecisionCreate {
  decision: "APPROVE" | "DECLINE" | "REQUEST_INFORMATION";
  notes?: string | null;
  requested_items?: string[];
  offer_amount?: string | null;
  term_months?: number | null;
  interest_rate?: string | null;
}

export interface LenderDecisionInput {
  decision: LenderDecisionCreate["decision"];
  reason_code?: string;
  comments?: string;
  conditions?: Array<Record<string, unknown>>;
  approved_amount?: string;
  interest_rate?: string;
  term_months?: number;
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
  [key: string]: unknown;
  summary: {
    offer_count: number;
    accepted_or_funded_count: number;
    accepted_or_funded_amount: string;
  };
  positions: Array<Record<string, unknown>>;
  submission_status_counts?: Record<string, number>;
}

export function getLenderWorkspace(
  organizationId?: string,
): Promise<Omit<LenderWorkspace, "programs" | "submissions" | "offers">> {
  return api(
    "/lender/workspace",
    withOrganization(organizationId),
  );
}

export function listLenderPrograms(
  active?: boolean,
  organizationId?: string,
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
  organizationId?: string,
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
  organizationId?: string,
): Promise<LenderSubmissionWorkspace> {
  return api<LenderSubmissionWorkspace>(
    `/lender/submissions/${encodeURIComponent(submissionId)}/workspace`,
    withOrganization(organizationId),
  );
}

export function assignLenderSubmission(
  submissionId: string,
  assignedToSubject: string,
  organizationId?: string,
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
  organizationId?: string,
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
  organizationId?: string,
): Promise<BankAnalysisQueueItem[]> {
  return api<BankAnalysisQueueItem[]>(
    `/lender/bank-analysis-queue${queryString({ status })}`,
    withOrganization(organizationId),
  );
}

export function getLenderPortfolio(
  organizationId?: string,
): Promise<LenderPortfolio> {
  return api<LenderPortfolio>(
    "/lender/portfolio",
    withOrganization(organizationId),
  );
}

export const lenderPortalApi = {
  async workspace(organizationId?: string): Promise<LenderWorkspace> {
    const [workspace, programs, portfolio] = await Promise.all([
      getLenderWorkspace(organizationId),
      listLenderPrograms(undefined, organizationId),
      getLenderPortfolio(organizationId),
    ]);
    return {
      ...workspace,
      summary: {
        ...workspace.summary,
        program_count: workspace.summary.active_programs,
        pending_submission_count: workspace.summary.pending_submissions,
        offer_count: portfolio.summary.offer_count,
      },
      programs: programs as unknown as Array<Record<string, unknown>>,
      submissions: workspace.recent_submissions as unknown as Array<Record<string, unknown>>,
      offers: portfolio.positions,
    };
  },

  async bankAnalysisQueue(organizationId?: string): Promise<{items: Array<Record<string, unknown>>}> {
    const queue = await listBankAnalysisQueue(undefined, organizationId);
    return {
      items: queue.map(({ submission, analysis }) => ({
        ...analysis,
        submission_id: submission.id,
        application_id: submission.application_id,
        submission_status: submission.status,
      })),
    };
  },

  async portfolio(organizationId?: string): Promise<LenderPortfolio> {
    const [portfolio, workspace] = await Promise.all([
      getLenderPortfolio(organizationId),
      getLenderWorkspace(organizationId),
    ]);
    const submissionStatusCounts = workspace.recent_submissions.reduce<Record<string, number>>(
      (counts, submission) => {
        counts[submission.status] = (counts[submission.status] || 0) + 1;
        return counts;
      },
      {},
    );
    return { ...portfolio, submission_status_counts: submissionStatusCounts };
  },

  submissionWorkspace: getLenderSubmissionWorkspace,

  patchProgram(
    programId: string,
    payload: LenderProgramPatch,
    version: number,
    organizationId?: string,
  ): Promise<LenderProgram> {
    return updateLenderProgram(programId, version, payload, organizationId);
  },

  async recordDecision(
    submissionId: string,
    payload: LenderDecisionInput,
    idempotencyKey: string,
    organizationId?: string,
  ): Promise<LenderDecisionResult & {replayed: boolean}> {
    const result = await recordLenderDecision(
      submissionId,
      {
        decision: payload.decision,
        notes: [payload.reason_code, payload.comments].filter(Boolean).join(": ") || undefined,
        requested_items: payload.conditions?.map((condition) => String(condition.code || condition.type || "condition")),
        offer_amount: payload.approved_amount,
        interest_rate: payload.interest_rate,
        term_months: payload.term_months,
      },
      idempotencyKey,
      organizationId,
    );
    return { ...result, replayed: false };
  },
};
