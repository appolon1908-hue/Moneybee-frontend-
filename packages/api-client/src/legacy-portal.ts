import { getAuthContext, type AuthContext, type PortalTask } from "./portal";
import {
  getLenderPortfolio,
  getLenderSubmissionWorkspace,
  getLenderWorkspace,
  listBankAnalysisQueue,
  listLenderPrograms,
  recordLenderDecision,
  updateLenderProgram,
  type LenderProgram,
  type LenderSubmissionSummary,
  type LenderWorkspaceResponse,
} from "./lender";

export type PortalContext = AuthContext;

export interface LenderDecisionInput {
  decision: "APPROVE" | "DECLINE" | "REQUEST_INFORMATION";
  reason_code?: string;
  comments?: string;
  conditions?: string[];
  approved_amount?: string;
  interest_rate?: string;
  term_months?: number;
}

export interface LenderWorkspace {
  summary: LenderWorkspaceResponse["summary"] & {
    program_count: number;
    pending_submission_count: number;
    offer_count: number;
  };
  recent_submissions: LenderSubmissionSummary[];
  open_tasks: PortalTask[];
  programs: Array<LenderProgram & Record<string, unknown>>;
  submissions: Array<LenderSubmissionSummary & Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
}

export const portalApi = {
  context: getAuthContext,
};

export const lenderPortalApi = {
  async workspace(organizationId?: string): Promise<LenderWorkspace> {
    const [workspace, programs, portfolio] = await Promise.all([
      getLenderWorkspace(organizationId),
      listLenderPrograms(undefined, organizationId),
      getLenderPortfolio(organizationId),
    ]);
    return {
      summary: {
        ...workspace.summary,
        program_count: programs.length,
        pending_submission_count: workspace.summary.pending_submissions,
        offer_count: portfolio.summary.offer_count,
      },
      recent_submissions: workspace.recent_submissions,
      open_tasks: workspace.open_tasks,
      programs: programs as Array<LenderProgram & Record<string, unknown>>,
      submissions: workspace.recent_submissions as Array<
        LenderSubmissionSummary & Record<string, unknown>
      >,
      offers: portfolio.positions,
    };
  },

  async bankAnalysisQueue(
    organizationId?: string,
  ): Promise<{ items: Array<Record<string, unknown>> }> {
    const rows = await listBankAnalysisQueue(undefined, organizationId);
    return {
      items: rows.map(({ submission, analysis }) => ({
        ...analysis,
        submission_id: submission.id,
        application_id: submission.application_id,
        submission_status: submission.status,
      })),
    };
  },

  portfolio: getLenderPortfolio,
  submissionWorkspace: getLenderSubmissionWorkspace,

  patchProgram(
    programId: string,
    payload: { active?: boolean },
    version: number,
    organizationId?: string,
  ) {
    return updateLenderProgram(programId, version, payload, organizationId);
  },

  async recordDecision(
    submissionId: string,
    payload: LenderDecisionInput,
    idempotencyKey: string,
    organizationId?: string,
  ) {
    const result = await recordLenderDecision(
      submissionId,
      {
        decision: payload.decision,
        notes: payload.comments || payload.reason_code || null,
        requested_items: payload.conditions || [],
        offer_amount: payload.approved_amount || null,
        interest_rate: payload.interest_rate || null,
        term_months: payload.term_months || null,
      },
      idempotencyKey,
      organizationId,
    );
    return { ...result, replayed: false as const };
  },
};
