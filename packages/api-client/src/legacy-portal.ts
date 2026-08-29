/**
 * @deprecated
 * Legacy portal API compatibility layer.
 * Use the canonical modules directly:
 *   - Borrower operations: import from './borrower'
 *   - Lender operations:   import from './lender'
 *   - Auth context:        import from './portal'
 *
 * Planned removal: Q4 2026
 * Tracking: https://github.com/appolon1908-hue/Moneybee-frontend-/issues
 *
 * Do not add new functions here. Add to the canonical module instead.
 */
import {
  acceptBorrowerOffer,
  listBorrowerApplicationConditions,
  listBorrowerApplicationOffers,
  submitBorrowerCondition,
  createBorrowerConversation,
  createBorrowerMessage,
  createBorrowerUploadSession,
  listBorrowerMessages,
  updateBorrowerTask,
} from "./borrower";
import { getAuthContext, type AuthContext, type PortalTask } from "./portal";
import {
  getLenderPortfolio,
  getLenderSubmissionWorkspace,
  getLenderWorkspace,
  listBankAnalysisQueue,
  listLenderBankTransactions,
  listLenderPrograms,
  recordLenderDecision,
  createLenderSubmissionCondition,
  createLenderSubmissionOffer,
  approveLenderCondition,
  rejectLenderCondition,
  waiveLenderCondition,
  updateLenderProgram,
  type LenderProgram,
  type LenderSubmissionSummary,
  type LenderWorkspaceResponse,
} from "./lender";

export type PortalContext = AuthContext;

export interface LenderDecisionInput {
  expected_version: number;
  decision: "APPROVE" | "DECLINE" | "CONDITIONS" | "FRAUD_REVIEW" | "COMPLIANCE_REVIEW";
  reason_code?: string;
  comments?: string;
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

  applicationConditions: listBorrowerApplicationConditions,
  submitCondition: submitBorrowerCondition,
  applicationOffers: listBorrowerApplicationOffers,
  acceptOffer: acceptBorrowerOffer,

  messages(conversationId: string, organizationId?: string) {
    return listBorrowerMessages(conversationId, organizationId);
  },

  patchTask(
    taskId: string,
    payload: { status: string; version?: number },
    organizationId?: string,
  ) {
    return updateBorrowerTask(taskId, payload.status, organizationId);
  },

  createConversation(
    payload: {
      subject: string;
      application_id?: string | null;
      first_message?: string | null;
    },
    organizationId?: string,
  ) {
    return createBorrowerConversation(
      {
        topic: payload.subject,
        application_id: payload.application_id || null,
        body: payload.first_message || "Support request opened.",
      },
      organizationId,
    );
  },

  createMessage(
    conversationId: string,
    payload: { body: string },
    organizationId?: string,
  ) {
    return createBorrowerMessage(conversationId, payload, organizationId);
  },

  createUploadSession(
    applicationId: string,
    payload: {
      original_file_name: string;
      mime_type: string;
      size_bytes: number;
      sha256?: string | null;
      document_type?: string;
    },
    organizationId?: string,
  ) {
    return createBorrowerUploadSession(
      applicationId,
      {
        document_type: payload.document_type || "OTHER",
        original_file_name: payload.original_file_name,
        mime_type: payload.mime_type,
        size_bytes: payload.size_bytes,
        sha256: payload.sha256,
      },
      organizationId,
    );
  },
};

export const lenderPortalApi = {
  async workspace(organizationId?: string | null): Promise<LenderWorkspace> {
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
    organizationId?: string | null,
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

  async portfolio(
    organizationId?: string | null,
  ): Promise<Record<string, unknown>> {
    return (await getLenderPortfolio(organizationId)) as unknown as Record<
      string,
      unknown
    >;
  },

  async submissionWorkspace(
    submissionId: string,
    organizationId?: string | null,
  ): Promise<Record<string, unknown>> {
    return (await getLenderSubmissionWorkspace(
      submissionId,
      organizationId,
    )) as unknown as Record<string, unknown>;
  },

  async bankTransactions(
    submissionId: string,
    organizationId?: string | null,
  ): Promise<Array<Record<string, unknown>>> {
    return (await listLenderBankTransactions(
      submissionId,
      200,
      organizationId,
    )) as unknown as Array<Record<string, unknown>>;
  },

  patchProgram(
    programId: string,
    payload: { active?: boolean },
    version: number,
    organizationId?: string | null,
  ) {
    return updateLenderProgram(programId, version, payload, organizationId);
  },

  async recordDecision(
    submissionId: string,
    payload: LenderDecisionInput,
    idempotencyKey: string,
    organizationId?: string | null,
  ) {
    const result = await recordLenderDecision(
      submissionId,
      {
        expected_version: payload.expected_version,
        decision: payload.decision,
        reason_codes: payload.reason_code ? [payload.reason_code] : [],
        notes: payload.comments || payload.reason_code || null,
      },
      idempotencyKey,
      organizationId,
    );
    return { ...result, replayed: false as const };
  },

  createCondition: createLenderSubmissionCondition,
  createOffer: createLenderSubmissionOffer,
  approveCondition: approveLenderCondition,
  rejectCondition: rejectLenderCondition,
  waiveCondition: waiveLenderCondition,
};
