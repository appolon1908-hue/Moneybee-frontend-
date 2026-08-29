import { api } from "./core";
import {
  getAuthContext,
  queryString,
  withOrganization,
  type PortalTask,
  type PortalTaskPriority,
  type PortalTaskStatus,
} from "./portal";

export interface PageMeta {
  limit: number;
  offset: number;
  total: number;
}

export interface Page<T> {
  items: T[];
  meta: PageMeta;
}

export interface AdminOverview {
  leads: number;
  applications: number;
  applications_by_status: Record<string, number>;
  submissions_needing_review: number;
  open_tasks: number;
  overdue_tasks: number;
  unread_notifications: number;
  open_conversations: number;
  open_complaints: number;
  open_operational_exceptions: number;
  pending_outbox: number;
  failed_integrations: number;
  webhook_receipts_pending: number;
}

export interface AdminOperationsWorkspace {
  principal: {
    global_scope: boolean;
  };
  metrics: Record<string, number>;
  work_queue: PortalTask[];
  operational_exceptions: Array<Record<string, unknown>>;
  overview: AdminOverview;
}

export interface AdminTaskCreate {
  organization_id?: string | null;
  application_id?: string | null;
  assignee_user_id?: string | null;
  assignee_subject?: string | null;
  task_type: string;
  title: string;
  description?: string | null;
  priority?: PortalTaskPriority;
  due_at?: string | null;
  source_type?: string | null;
  source_reference?: string | null;
  metadata_payload?: Record<string, unknown>;
}

export interface AdminTaskPatch {
  status?: PortalTaskStatus | "DISMISSED" | string;
  priority?: PortalTaskPriority;
  assignee_user_id?: string | null;
  assignee_subject?: string | null;
  due_at?: string | null;
}

export interface AdminTaskQuery {
  application_id?: string;
  status?: string;
  priority?: string;
  assignee_subject?: string;
  limit?: number;
  offset?: number;
}

export interface SearchResult {
  type: string;
  id: string;
  label: string;
  subtitle?: string | null;
  status?: string | null;
  path: string;
  updated_at?: string | null;
}

interface BackendSearchResult {
  resource_type: string;
  resource_id: string;
  title: string;
  subtitle?: string | null;
  status?: string | null;
  path: string;
  updated_at?: string | null;
}

export interface OrganizationContext {
  id: string;
  name: string;
  organization_type: string;
  active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface WebhookReceipt {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload_hash: string;
  payload_metadata: Record<string, unknown>;
  status: string;
  processed_at: string | null;
  created_at: string;
  updated_at: string;
  attempts?: number;
}

export interface IntegrationControlPlane extends Record<string, unknown> {
  authority: string;
  middleware: string;
  crm_projection: string;
  inbox_messages: number;
  pending_outbox_events: number;
  providers: Array<{
    provider_type: string;
    provider: string;
    selected: boolean;
    configured: boolean;
  }>;
}

export interface AuditEvent extends Record<string, unknown> {
  id: string;
  actor_id: string;
  action: string;
  resource_type: string;
  resource_id: string;
  request_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
}

export interface CursorPage<T> {
  items: T[];
  next_before: string | null;
}

function safeLimit(value: number | undefined, fallback = 100): number {
  return Math.min(Math.max(value ?? fallback, 1), 200);
}

function backendTaskQuery(query: AdminTaskQuery): Record<string, string | number | undefined> {
  return {
    application_id: query.application_id,
    status: query.status,
    assignee_subject: query.assignee_subject,
    limit: safeLimit(query.limit),
    offset: Math.max(query.offset ?? 0, 0),
  };
}

function ensureSupportedTaskStatus(status: string | undefined): void {
  if (!status) return;
  if (!["OPEN", "IN_PROGRESS", "COMPLETED", "DISMISSED"].includes(status)) {
    throw new Error(
      `Task status ${status} is not supported by the current MoneyBee backend contract.`,
    );
  }
}

export function getAdminOverview(organizationId?: string): Promise<AdminOverview> {
  return api<AdminOverview>("/admin/overview", withOrganization(organizationId));
}

export async function getAdminOperationsWorkspace(
  organizationId?: string,
): Promise<AdminOperationsWorkspace> {
  const [overview, queue, exceptions, context] = await Promise.all([
    getAdminOverview(organizationId),
    listAdminTasks({ limit: 100 }, organizationId),
    api<Array<Record<string, unknown>>>(
      "/admin/operational-exceptions?limit=100",
      withOrganization(organizationId),
    ),
    getAuthContext(organizationId),
  ]);

  return {
    principal: { global_scope: context.permissions.includes("*") },
    metrics: {
      lead_count: overview.leads,
      application_count: overview.applications,
      lender_submission_count: overview.submissions_needing_review,
      open_task_count: overview.open_tasks,
      leads: overview.leads,
      applications: overview.applications,
      submissions_needing_review: overview.submissions_needing_review,
      open_tasks: overview.open_tasks,
      overdue_tasks: overview.overdue_tasks,
      open_operational_exceptions: overview.open_operational_exceptions,
      pending_outbox: overview.pending_outbox,
      failed_integrations: overview.failed_integrations,
      webhook_receipts_pending: overview.webhook_receipts_pending,
    },
    work_queue: queue.items,
    operational_exceptions: exceptions,
    overview,
  };
}

export async function listAdminTasks(
  query: AdminTaskQuery = {},
  organizationId?: string,
): Promise<Page<PortalTask>> {
  const response = await api<Page<PortalTask>>(
    `/admin/tasks${queryString(backendTaskQuery(query))}`,
    withOrganization(organizationId),
  );
  if (!query.priority) return response;
  return {
    ...response,
    items: response.items.filter((item) => item.priority === query.priority),
  };
}

export function createAdminTask(
  payload: AdminTaskCreate,
  organizationId?: string,
): Promise<PortalTask> {
  return api<PortalTask>(
    "/admin/tasks",
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function updateAdminTask(
  taskId: string,
  payload: AdminTaskPatch,
  organizationId?: string,
): Promise<PortalTask> {
  ensureSupportedTaskStatus(payload.status);
  return api<PortalTask>(
    `/admin/tasks/${encodeURIComponent(taskId)}`,
    withOrganization(organizationId, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );
}

export async function searchAdminPortal(
  query: string,
  organizationId?: string,
): Promise<SearchResult[]> {
  const rows = await api<BackendSearchResult[]>(
    `/admin/search${queryString({ q: query })}`,
    withOrganization(organizationId),
  );
  return rows.map((row) => ({
    type: row.resource_type,
    id: row.resource_id,
    label: row.title,
    subtitle: row.subtitle,
    status: row.status,
    path: row.path,
    updated_at: row.updated_at,
  }));
}

export function getIntegrationControlPlane(
  organizationId?: string,
): Promise<IntegrationControlPlane> {
  return api<IntegrationControlPlane>(
    "/admin/integration-control-plane",
    withOrganization(organizationId),
  );
}

export function listWebhookReceipts(
  query: { provider?: string; status?: string; limit?: number } = {},
  organizationId?: string,
): Promise<WebhookReceipt[]> {
  return api<WebhookReceipt[]>(
    `/admin/webhook-receipts${queryString({
      provider: query.provider,
      status: query.status,
      limit: safeLimit(query.limit),
    })}`,
    withOrganization(organizationId),
  );
}

export function requeueWebhookReceipt(
  receiptId: string,
  organizationId?: string,
): Promise<{ id: string; status: string; inbox_status: string }> {
  return api<{ id: string; status: string; inbox_status: string }>(
    `/admin/webhook-receipts/${encodeURIComponent(receiptId)}/requeue`,
    withOrganization(organizationId, { method: "POST" }),
  );
}

export function listAdminOrganizations(
  query: { organization_type?: string; active?: boolean; limit?: number } = {},
  organizationId?: string,
): Promise<OrganizationContext[]> {
  return api<OrganizationContext[]>(
    `/admin/organizations${queryString({
      organization_type: query.organization_type,
      active: query.active,
      limit: safeLimit(query.limit),
    })}`,
    withOrganization(organizationId),
  );
}

export function listAdminOrganizationMembers(
  targetOrganizationId: string,
  organizationId?: string,
): Promise<Array<Record<string, unknown>>> {
  return api<Array<Record<string, unknown>>>(
    `/admin/organizations/${encodeURIComponent(targetOrganizationId)}/members`,
    withOrganization(organizationId),
  );
}

export async function listAdminAuditEvents(
  cursor: string | null = null,
  organizationId?: string,
): Promise<CursorPage<AuditEvent>> {
  const limit = 100;
  const offset = cursor && /^\d+$/.test(cursor) ? Number(cursor) : 0;
  const response = await api<Page<AuditEvent>>(
    `/admin/audit-events${queryString({ limit, offset })}`,
    withOrganization(organizationId),
  );
  const nextOffset = response.meta.offset + response.items.length;
  return {
    items: response.items,
    next_before: nextOffset < response.meta.total ? String(nextOffset) : null,
  };
}

export const adminPortalApi = {
  workspace(organizationId?: string | null): Promise<AdminOperationsWorkspace> {
    return getAdminOperationsWorkspace(organizationId ?? undefined);
  },
  workQueue: listAdminTasks,
  patchWorkItem(
    taskId: string,
    payload: AdminTaskPatch & { version?: number },
    organizationId?: string,
  ): Promise<PortalTask> {
    const { version: _ignoredVersion, ...currentPayload } = payload;
    return updateAdminTask(taskId, currentPayload, organizationId);
  },
  async search(query: string, organizationId?: string): Promise<{ items: SearchResult[] }> {
    return { items: await searchAdminPortal(query, organizationId) };
  },
  integrationHealth: getIntegrationControlPlane,
  async webhookReceipts(
    query: { provider?: string; status?: string; limit?: number } = {},
    organizationId?: string,
  ): Promise<{ items: WebhookReceipt[] }> {
    return { items: await listWebhookReceipts(query, organizationId) };
  },
  requeueWebhookReceipt,
  async organizations(
    query: { organization_type?: string; active?: boolean; limit?: number } = {},
    organizationId?: string,
  ): Promise<{ items: OrganizationContext[] }> {
    return { items: await listAdminOrganizations(query, organizationId) };
  },
  async organizationMembers(
    targetOrganizationId: string,
    organizationId?: string,
  ): Promise<{ items: Array<Record<string, unknown>> }> {
    return {
      items: await listAdminOrganizationMembers(targetOrganizationId, organizationId),
    };
  },
  auditEvents: listAdminAuditEvents,
};
