import { api, type ApiOptions } from './core'

export type UUID = string
export type ISODateTime = string

export interface NavigationItem {
  key: string
  label: string
  path: string
}

export interface OrganizationContext {
  id: UUID
  name: string
  organization_type: string
  active: boolean
}

export interface PortalContext {
  user_id: UUID
  active_organization_id: UUID
  organizations: OrganizationContext[]
  roles: string[]
  permissions: string[]
  membership_types: string[]
  navigation: NavigationItem[]
  capabilities: Record<string, boolean>
}

export interface PortalTask {
  id: UUID
  organization_id: UUID
  application_id: UUID | null
  assignee_user_id: UUID | null
  task_type: string
  title: string
  description: string | null
  status: string
  priority: string
  due_at: ISODateTime | null
  completed_at: ISODateTime | null
  version: number
  metadata_payload: Record<string, unknown>
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface PortalTaskPatch {
  status?: 'OPEN' | 'IN_PROGRESS' | 'BLOCKED' | 'COMPLETED' | 'CANCELLED'
  assignee_user_id?: UUID | null
  priority?: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT'
  due_at?: ISODateTime | null
  version: number
}

export interface PortalNotification {
  id: UUID
  organization_id: UUID
  user_id: UUID
  notification_type: string
  title: string
  body: string
  action_url: string | null
  read_at: ISODateTime | null
  metadata_payload: Record<string, unknown>
  created_at: ISODateTime
}

export interface PortalConversation {
  id: UUID
  organization_id: UUID
  application_id: UUID | null
  created_by_user_id: UUID
  subject: string
  status: string
  version: number
  created_at: ISODateTime
  updated_at: ISODateTime
}

export interface PortalMessage {
  id: UUID
  conversation_id: UUID
  sender_user_id: UUID
  body: string
  channel: string
  attachment_document_id: UUID | null
  metadata_payload: Record<string, unknown>
  created_at: ISODateTime
}

export interface UploadSession {
  id: UUID
  application_id: UUID
  original_file_name: string
  mime_type: string
  size_bytes: number
  sha256: string
  status: string
  scan_status: string
  expires_at: ISODateTime
  completed_at: ISODateTime | null
  upload_url: string | null
  upload_headers: Record<string, string>
  upload_token: string | null
  version?: number
}

export interface BorrowerApplication {
  id: UUID
  application_number?: string | null
  business_name?: string | null
  status?: string | null
  requested_amount?: string | null
  approved_amount?: string | null
  purpose?: string | null
  term_months?: number | null
  progress_percent?: number | null
  submitted_at?: ISODateTime | null
  created_at?: ISODateTime
  updated_at?: ISODateTime
  version?: number
}

export interface BorrowerWorkspace {
  principal: {
    user_id: UUID
    borrower_id: UUID
    organization_id: UUID
  }
  summary: {
    application_count: number
    active_application_count: number
    open_task_count: number
    unread_notification_count: number
    conversation_count: number
  }
  applications: BorrowerApplication[]
  tasks: PortalTask[]
  notifications: PortalNotification[]
  conversations: PortalConversation[]
}

export interface BorrowerApplicationSummary {
  application: BorrowerApplication
  summary: {
    offer_count: number
    document_count: number
    open_task_count: number
    pending_upload_count: number
    accepted_offer_id: UUID | null
  }
  offers: Array<Record<string, unknown>>
  documents: Array<Record<string, unknown>>
  tasks: PortalTask[]
  upload_sessions: UploadSession[]
}

export interface LenderWorkspace {
  principal: {
    user_id: UUID
    lender_id: UUID
    organization_id: UUID
  }
  summary: {
    program_count: number
    active_program_count: number
    submission_count: number
    pending_submission_count: number
    offer_count: number
  }
  programs: Array<Record<string, unknown>>
  submissions: Array<Record<string, unknown>>
  offers: Array<Record<string, unknown>>
}

export interface LenderProgramPatch {
  active?: boolean
  min_amount?: string | number
  max_amount?: string | number
  min_term_months?: number
  max_term_months?: number
  min_credit_score?: number
  min_monthly_revenue?: string | number
  industries?: string[]
  states?: string[]
}

export interface LenderDecisionInput {
  decision: 'APPROVE' | 'DECLINE' | 'REQUEST_INFORMATION'
  reason_code?: string
  comments?: string
  approved_amount?: string | number
  interest_rate?: string | number
  term_months?: number
  conditions?: string[]
}

export interface LenderDecision {
  id: UUID
  submission_id: UUID
  decision: string
  reason_code: string | null
  comments: string | null
  status: string
  created_at: ISODateTime
  replayed: boolean
}

export interface AdminOperationsWorkspace {
  principal: {
    user_id: UUID
    organization_id: UUID
    global_scope: boolean
  }
  metrics: Record<string, number>
  integration_health: {
    outbox: Record<string, number>
    inbox: Record<string, number>
  }
  work_queue: PortalTask[]
}

export interface SearchResult {
  type: 'lead' | 'application' | 'borrower' | 'lender' | string
  id: UUID
  label: string
  status: string | null
}

export interface WebhookReceipt {
  id: UUID
  provider: string
  provider_event_id: string
  event_type: string
  tenant_id: string | null
  payload_hash: string
  signature_valid: boolean
  status: string
  attempts: number
  next_attempt_at: ISODateTime | null
  processed_at: ISODateTime | null
  last_error: string | null
  metadata: Record<string, unknown>
  created_at: ISODateTime
  updated_at: ISODateTime
  payload?: Record<string, unknown>
}

function withOrganization(
  organizationId?: UUID | null,
  options: ApiOptions = {},
): ApiOptions {
  const headers = new Headers(options.headers)
  if (organizationId) headers.set('X-Organization-ID', organizationId)
  return { ...options, headers }
}

function jsonRequest(
  method: 'POST' | 'PATCH' | 'PUT' | 'DELETE',
  body: unknown,
  organizationId?: UUID | null,
  options: ApiOptions = {},
): ApiOptions {
  const configured = withOrganization(organizationId, options)
  const headers = new Headers(configured.headers)
  headers.set('Content-Type', 'application/json')
  return {
    ...configured,
    method,
    headers,
    body: JSON.stringify(body),
  }
}

export function withQuery(
  path: string,
  values: Record<string, string | number | boolean | null | undefined>,
): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === '') continue
    params.set(key, String(value))
  }
  const query = params.toString()
  return query ? `${path}?${query}` : path
}

export const portalApi = {
  context: (organizationId?: UUID | null) =>
    api<PortalContext>('/auth/context', withOrganization(organizationId)),

  navigation: (organizationId?: UUID | null) =>
    api<NavigationItem[]>('/portal/navigation', withOrganization(organizationId)),

  tasks: (
    filters: { status?: string; limit?: number } = {},
    organizationId?: UUID | null,
  ) =>
    api<PortalTask[]>(
      withQuery('/portal/tasks', filters),
      withOrganization(organizationId),
    ),

  patchTask: (
    taskId: UUID,
    input: PortalTaskPatch,
    organizationId?: UUID | null,
  ) =>
    api<PortalTask>(
      `/portal/tasks/${encodeURIComponent(taskId)}`,
      jsonRequest('PATCH', input, organizationId),
    ),

  notifications: (
    unreadOnly = false,
    organizationId?: UUID | null,
  ) =>
    api<PortalNotification[]>(
      withQuery('/portal/notifications', { unread_only: unreadOnly }),
      withOrganization(organizationId),
    ),

  markNotificationRead: (
    notificationId: UUID,
    organizationId?: UUID | null,
  ) =>
    api<PortalNotification>(
      `/portal/notifications/${encodeURIComponent(notificationId)}/read`,
      jsonRequest('POST', {}, organizationId),
    ),

  conversations: (
    applicationId?: UUID | null,
    organizationId?: UUID | null,
  ) =>
    api<PortalConversation[]>(
      withQuery('/portal/conversations', { application_id: applicationId }),
      withOrganization(organizationId),
    ),

  createConversation: (
    input: {
      subject: string
      application_id?: UUID | null
      first_message?: string | null
    },
    organizationId?: UUID | null,
  ) =>
    api<PortalConversation>(
      '/portal/conversations',
      jsonRequest('POST', input, organizationId),
    ),

  messages: (conversationId: UUID, organizationId?: UUID | null) =>
    api<PortalMessage[]>(
      `/portal/conversations/${encodeURIComponent(conversationId)}/messages`,
      withOrganization(organizationId),
    ),

  createMessage: (
    conversationId: UUID,
    input: {
      body: string
      attachment_document_id?: UUID | null
      metadata_payload?: Record<string, unknown>
    },
    organizationId?: UUID | null,
  ) =>
    api<PortalMessage>(
      `/portal/conversations/${encodeURIComponent(conversationId)}/messages`,
      jsonRequest('POST', input, organizationId),
    ),

  uploadSessions: (applicationId: UUID, organizationId?: UUID | null) =>
    api<UploadSession[]>(
      `/portal/applications/${encodeURIComponent(applicationId)}/upload-sessions`,
      withOrganization(organizationId),
    ),

  createUploadSession: (
    applicationId: UUID,
    input: {
      original_file_name: string
      mime_type: string
      size_bytes: number
      sha256: string
    },
    organizationId?: UUID | null,
  ) =>
    api<UploadSession>(
      `/portal/applications/${encodeURIComponent(applicationId)}/upload-sessions`,
      jsonRequest('POST', input, organizationId),
    ),

  completeUploadSession: (
    sessionId: UUID,
    version: number,
    uploadToken: string,
    organizationId?: UUID | null,
  ) => {
    const options = jsonRequest('POST', { version }, organizationId)
    const headers = new Headers(options.headers)
    headers.set('X-Upload-Token', uploadToken)
    return api<UploadSession>(
      `/portal/upload-sessions/${encodeURIComponent(sessionId)}/complete`,
      { ...options, headers },
    )
  },
}

export async function uploadPortalDocument(
  session: UploadSession,
  file: Blob,
  organizationId?: UUID | null,
): Promise<UploadSession> {
  if (!session.upload_url || !session.upload_token) {
    throw new Error('The secure upload session is missing its one-time upload data.')
  }
  if (file.size !== session.size_bytes) {
    throw new Error('The selected file size changed after the upload session was created.')
  }
  const uploadResponse = await fetch(session.upload_url, {
    method: 'PUT',
    headers: session.upload_headers,
    body: file,
  })
  if (!uploadResponse.ok) {
    throw new Error(`Secure object upload failed with status ${uploadResponse.status}.`)
  }
  return portalApi.completeUploadSession(
    session.id,
    session.version ?? 1,
    session.upload_token,
    organizationId,
  )
}

export const borrowerPortalApi = {
  workspace: (organizationId?: UUID | null) =>
    api<BorrowerWorkspace>(
      '/borrower/workspace',
      withOrganization(organizationId),
    ),

  applicationSummary: (applicationId: UUID, organizationId?: UUID | null) =>
    api<BorrowerApplicationSummary>(
      `/borrower/applications/${encodeURIComponent(applicationId)}/summary`,
      withOrganization(organizationId),
    ),

  offers: (applicationId: UUID, organizationId?: UUID | null) =>
    api<{ items: Array<Record<string, unknown>> }>(
      `/borrower/applications/${encodeURIComponent(applicationId)}/offers`,
      withOrganization(organizationId),
    ),

  documents: (applicationId: UUID, organizationId?: UUID | null) =>
    api<{
      documents: Array<Record<string, unknown>>
      upload_sessions: UploadSession[]
    }>(
      `/borrower/applications/${encodeURIComponent(applicationId)}/documents`,
      withOrganization(organizationId),
    ),

  communication: (applicationId: UUID, organizationId?: UUID | null) =>
    api<{ items: PortalConversation[] }>(
      `/borrower/applications/${encodeURIComponent(applicationId)}/communication`,
      withOrganization(organizationId),
    ),
}

export const lenderPortalApi = {
  workspace: (organizationId?: UUID | null) =>
    api<LenderWorkspace>('/lender/workspace', withOrganization(organizationId)),

  programs: (organizationId?: UUID | null) =>
    api<{ items: Array<Record<string, unknown>> }>(
      '/lender/programs',
      withOrganization(organizationId),
    ),

  patchProgram: (
    programId: UUID,
    input: LenderProgramPatch,
    expectedVersion: number,
    organizationId?: UUID | null,
  ) =>
    api<Record<string, unknown>>(
      `/lender/programs/${encodeURIComponent(programId)}`,
      jsonRequest('PATCH', input, organizationId, { expectedVersion }),
    ),

  submissionWorkspace: (
    submissionId: UUID,
    organizationId?: UUID | null,
  ) =>
    api<Record<string, unknown>>(
      `/lender/submissions/${encodeURIComponent(submissionId)}/workspace`,
      withOrganization(organizationId),
    ),

  recordDecision: (
    submissionId: UUID,
    input: LenderDecisionInput,
    idempotencyKey: string,
    organizationId?: UUID | null,
  ) =>
    api<LenderDecision>(
      `/lender/submissions/${encodeURIComponent(submissionId)}/decisions`,
      jsonRequest('POST', input, organizationId, { idempotencyKey }),
    ),

  bankAnalysisQueue: (organizationId?: UUID | null) =>
    api<{ items: Array<Record<string, unknown>>; count: number }>(
      '/lender/bank-analysis-queue',
      withOrganization(organizationId),
    ),

  portfolio: (organizationId?: UUID | null) =>
    api<Record<string, unknown>>(
      '/lender/portfolio',
      withOrganization(organizationId),
    ),
}

export const adminPortalApi = {
  workspace: (organizationId?: UUID | null) =>
    api<AdminOperationsWorkspace>(
      '/admin/operations/workspace',
      withOrganization(organizationId),
    ),

  workQueue: (
    filters: {
      status?: string
      priority?: string
      assignee_user_id?: UUID
      application_id?: UUID
      limit?: number
    } = {},
    organizationId?: UUID | null,
  ) =>
    api<{ items: PortalTask[] }>(
      withQuery('/admin/work-queue', filters),
      withOrganization(organizationId),
    ),

  patchWorkItem: (
    taskId: UUID,
    input: PortalTaskPatch,
    organizationId?: UUID | null,
  ) =>
    api<PortalTask>(
      `/admin/work-queue/${encodeURIComponent(taskId)}`,
      jsonRequest('PATCH', input, organizationId),
    ),

  search: (query: string, organizationId?: UUID | null) =>
    api<{ query: string; items: SearchResult[] }>(
      withQuery('/admin/search', { q: query }),
      withOrganization(organizationId),
    ),

  auditEvents: (
    before?: ISODateTime | null,
    organizationId?: UUID | null,
  ) =>
    api<{ items: Array<Record<string, unknown>>; next_before: ISODateTime | null }>(
      withQuery('/admin/audit-events', { before }),
      withOrganization(organizationId),
    ),

  organizations: (
    filters: { organization_type?: string; active?: boolean } = {},
    organizationId?: UUID | null,
  ) =>
    api<{ items: OrganizationContext[] }>(
      withQuery('/admin/organizations', filters),
      withOrganization(organizationId),
    ),

  organizationMembers: (
    targetOrganizationId: UUID,
    organizationId?: UUID | null,
  ) =>
    api<{ items: Array<Record<string, unknown>> }>(
      `/admin/organizations/${encodeURIComponent(targetOrganizationId)}/members`,
      withOrganization(organizationId),
    ),

  integrationHealth: (organizationId?: UUID | null) =>
    api<Record<string, unknown>>(
      '/admin/integration-health',
      withOrganization(organizationId),
    ),

  webhookReceipts: (
    filters: { provider?: string; status?: string; limit?: number } = {},
    organizationId?: UUID | null,
  ) =>
    api<{ items: WebhookReceipt[] }>(
      withQuery('/admin/webhook-receipts', filters),
      withOrganization(organizationId),
    ),

  webhookReceipt: (
    receiptId: UUID,
    includePayload = false,
    organizationId?: UUID | null,
  ) =>
    api<WebhookReceipt>(
      withQuery(`/admin/webhook-receipts/${encodeURIComponent(receiptId)}`, {
        include_payload: includePayload,
      }),
      withOrganization(organizationId),
    ),

  requeueWebhookReceipt: (
    receiptId: UUID,
    organizationId?: UUID | null,
  ) =>
    api<WebhookReceipt>(
      `/admin/webhook-receipts/${encodeURIComponent(receiptId)}/requeue`,
      jsonRequest('POST', {}, organizationId),
    ),
}
