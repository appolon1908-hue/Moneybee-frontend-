import { api } from "./core";
import {
  queryString,
  withOrganization,
  type PortalTask,
  type PortalTaskPriority,
  type PortalTaskStatus,
} from "./portal";

export interface AdminOperationsWorkspace {
  metrics: {
    applications: number;
    active_applications: number;
    lender_submissions: number;
    pending_lender_submissions: number;
    open_tasks: number;
    urgent_tasks: number;
    open_operational_exceptions: number;
  };
  work_queue: PortalTask[];
  operational_exceptions: Array<Record<string, unknown>>;
}

export interface AdminTaskCreate {
  tenant_id: string;
  application_id?: string | null;
  task_type?: string;
  title: string;
  description?: string | null;
  priority?: PortalTaskPriority;
  assigned_to_subject?: string | null;
  due_at?: string | null;
  metadata_payload?: Record<string, unknown>;
}

export interface AdminTaskPatch {
  expected_version: number;
  status?: PortalTaskStatus;
  priority?: PortalTaskPriority;
  assigned_to_subject?: string | null;
  due_at?: string | null;
  description?: string | null;
}

export interface AdminTaskQuery {
  tenant_id?: string;
  application_id?: string;
  status?: string;
  priority?: string;
  assigned_to_subject?: string;
  limit?: number;
  offset?: number;
}

export interface AdminNotificationCreate {
  tenant_id: string;
  recipient_subject: string;
  notification_type?: string;
  title: string;
  body: string;
  href?: string | null;
  metadata_payload?: Record<string, unknown>;
}

export interface AdminSearchResults {
  query: string;
  leads: Array<Record<string, unknown>>;
  organizations: Array<Record<string, unknown>>;
  users: Array<Record<string, unknown>>;
}

export interface WebhookReceipt {
  id: string;
  provider: string;
  event_id: string;
  event_type: string;
  tenant_id: string | null;
  payload_hash: string;
  signature_valid: boolean;
  status: string;
  attempts: number;
  last_error: string | null;
  processed_at: string | null;
  created_at: string;
  payload?: unknown;
}

export function getAdminOperationsWorkspace(
  organizationId?: string,
): Promise<AdminOperationsWorkspace> {
  return api<AdminOperationsWorkspace>(
    "/admin/operations/workspace",
    withOrganization(organizationId),
  );
}

export function listAdminTasks(
  query: AdminTaskQuery = {},
  organizationId?: string,
): Promise<PortalTask[]> {
  return api<PortalTask[]>(
    `/admin/tasks${queryString(query)}`,
    withOrganization(organizationId),
  );
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
  return api<PortalTask>(
    `/admin/tasks/${encodeURIComponent(taskId)}`,
    withOrganization(organizationId, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );
}

export function createAdminNotification(
  payload: AdminNotificationCreate,
  organizationId?: string,
): Promise<Record<string, unknown>> {
  return api<Record<string, unknown>>(
    "/admin/notifications",
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function searchAdminPortal(
  query: string,
  organizationId?: string,
): Promise<AdminSearchResults> {
  return api<AdminSearchResults>(
    `/admin/search${queryString({ q: query })}`,
    withOrganization(organizationId),
  );
}

export function listAdminAuditEvents(
  query: {
    action?: string;
    entity_type?: string;
    actor_subject?: string;
    before?: string;
    limit?: number;
  } = {},
  organizationId?: string,
): Promise<Array<Record<string, unknown>>> {
  return api<Array<Record<string, unknown>>>(
    `/admin/audit${queryString(query)}`,
    withOrganization(organizationId),
  );
}

export function listAdminOrganizations(
  query: { organization_type?: string; active?: boolean; limit?: number; offset?: number } = {},
  organizationId?: string,
): Promise<Array<Record<string, unknown>>> {
  return api<Array<Record<string, unknown>>>(
    `/admin/organizations${queryString(query)}`,
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

export function listWebhookReceipts(
  query: {
    provider?: string;
    status?: string;
    event_type?: string;
    before?: string;
    limit?: number;
  } = {},
  organizationId?: string,
): Promise<WebhookReceipt[]> {
  return api<WebhookReceipt[]>(
    `/admin/webhook-gateway/receipts${queryString(query)}`,
    withOrganization(organizationId),
  );
}

export function getWebhookReceipt(
  receiptId: string,
  includePayload = false,
  organizationId?: string,
): Promise<WebhookReceipt> {
  return api<WebhookReceipt>(
    `/admin/webhook-gateway/receipts/${encodeURIComponent(receiptId)}${queryString({
      include_payload: includePayload,
    })}`,
    withOrganization(organizationId),
  );
}

export function requeueWebhookReceipt(
  receiptId: string,
  idempotencyKey: string,
  organizationId?: string,
): Promise<{ requeued: true; receipt: WebhookReceipt }> {
  return api<{ requeued: true; receipt: WebhookReceipt }>(
    `/admin/webhook-gateway/receipts/${encodeURIComponent(receiptId)}/requeue`,
    withOrganization(organizationId, {
      method: "POST",
      idempotencyKey,
    }),
  );
}
