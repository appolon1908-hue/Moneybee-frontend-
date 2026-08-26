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

export interface PublicIntakeSummary {
  id: string;
  reference: string;
  intake_type: string;
  status: string;
  business_name: string | null;
  contact_name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  attribution: Record<string, unknown>;
  created_at: string;
}

export interface PublicIntakeDetail extends PublicIntakeSummary {
  contact: {
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
  };
  message: string | null;
  details: Record<string, unknown>;
  source_evidence: Record<string, unknown>;
  consents: Array<{
    id: string;
    type: string;
    document_version: string;
    document_hash: string | null;
    accepted: boolean;
    evidence: Record<string, unknown>;
  }>;
  updated_at: string;
}

export interface CrmDeliverySummary {
  id: string;
  event_type: string;
  aggregate_type: string;
  aggregate_id: string;
  status: string;
  attempt_count: number;
  provider: string | null;
  destination: string | null;
  last_http_status: number | null;
  last_error_code: string | null;
  last_error: string | null;
  next_attempt_at: string | null;
  delivered_at: string | null;
  created_at: string;
  updated_at: string;
  reference: string | null;
  intake_type: string | null;
  moneybee_intake_id: string | null;
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

export function listPublicIntakes(
  query: { intake_type?: string; limit?: number } = {},
  organizationId?: string,
): Promise<PublicIntakeSummary[]> {
  return api<PublicIntakeSummary[]>(
    `/admin/public-intakes${queryString(query)}`,
    withOrganization(organizationId),
  );
}

export function getPublicIntake(
  intakeId: string,
  organizationId?: string,
): Promise<PublicIntakeDetail> {
  return api<PublicIntakeDetail>(
    `/admin/public-intakes/${encodeURIComponent(intakeId)}`,
    withOrganization(organizationId),
  );
}

export function listCrmDeliveries(
  query: { status?: string; limit?: number } = {},
  organizationId?: string,
): Promise<CrmDeliverySummary[]> {
  return api<CrmDeliverySummary[]>(
    `/admin/crm-deliveries${queryString(query)}`,
    withOrganization(organizationId),
  );
}

export function getCrmDelivery(
  deliveryId: string,
  organizationId?: string,
): Promise<CrmDeliverySummary> {
  return api<CrmDeliverySummary>(
    `/admin/crm-deliveries/${encodeURIComponent(deliveryId)}`,
    withOrganization(organizationId),
  );
}

export function requeueCrmDelivery(
  deliveryId: string,
  reason: string,
  organizationId?: string,
): Promise<CrmDeliverySummary> {
  return api<CrmDeliverySummary>(
    `/admin/crm-deliveries/${encodeURIComponent(deliveryId)}/requeue`,
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  );
}
