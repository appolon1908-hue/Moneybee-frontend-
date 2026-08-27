import { api } from "./core";
import {
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

export interface AdminOperationsWorkspace {
  principal: {
    global_scope: boolean;
  };
  metrics: Record<string, number>;
  work_queue: PortalTask[];
  operational_exceptions: Array<Record<string, unknown>>;
}

interface AdminTaskWire {
  id: string;
  application_id: string | null;
  organization_id: string | null;
  assignee_user_id: string | null;
  assignee_subject: string | null;
  task_type: string;
  title: string;
  description: string | null;
  status: string;
  priority: PortalTaskPriority;
  due_at: string | null;
  completed_at: string | null;
  source_type: string | null;
  source_reference: string | null;
  metadata_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

interface PageWire<T> {
  items: T[];
  meta: PageMeta;
}

function normalizeTask(row: AdminTaskWire): PortalTask {
  return {
    id: row.id,
    tenant_id: row.organization_id || "",
    application_id: row.application_id,
    task_type: row.task_type,
    title: row.title,
    description: row.description,
    status: row.status,
    priority: row.priority,
    assigned_to_subject: row.assignee_subject,
    created_by_subject: "moneybee",
    due_at: row.due_at,
    completed_at: row.completed_at,
    version: Number(row.metadata_payload?.version || 1),
    metadata_payload: {
      ...row.metadata_payload,
      organization_id: row.organization_id,
      assignee_user_id: row.assignee_user_id,
      source_type: row.source_type,
      source_reference: row.source_reference,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
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
  version?: number;
  status?: PortalTaskStatus;
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

export interface AdminSearchResult {
  resource_type: string;
  resource_id: string;
  title: string;
  subtitle: string | null;
  status: string | null;
  path: string;
  updated_at: string | null;
}

export interface AdminOrganization {
  id: string;
  name: string;
  organization_type: string;
  active: boolean;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export interface AdminOrganizationMember {
  membership_id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  membership_type: string;
  membership_active: boolean;
  user_active: boolean;
  roles: string[];
  created_at: string;
}

export interface WebhookReceipt {
  id: string;
  provider: string;
  provider_event_id: string;
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
  updated_at?: string;
  payload_metadata?: Record<string, unknown>;
  payload?: unknown;
}

interface WebhookReceiptWire {
  id: string;
  provider: string;
  provider_event_id: string;
  event_type: string;
  payload_hash: string;
  payload_metadata?: Record<string, unknown>;
  status: string;
  processed_at: string | null;
  created_at: string;
  updated_at?: string;
}

function normalizeReceipt(row: WebhookReceiptWire): WebhookReceipt {
  return {
    ...row,
    event_id: row.provider_event_id,
    tenant_id:
      typeof row.payload_metadata?.tenant_id === "string"
        ? row.payload_metadata.tenant_id
        : null,
    signature_valid: true,
    attempts: Number(row.payload_metadata?.attempts || 0),
    last_error:
      typeof row.payload_metadata?.last_error === "string"
        ? row.payload_metadata.last_error
        : null,
  };
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

export async function getAdminOperationsWorkspace(
  organizationId?: string,
): Promise<AdminOperationsWorkspace> {
  const wire = await api<AdminOperationsWorkspace & { work_queue: AdminTaskWire[] }>(
    "/admin/workspace",
    withOrganization(organizationId),
  );
  return { ...wire, work_queue: wire.work_queue.map(normalizeTask) };
}

export async function listAdminTasks(
  query: AdminTaskQuery = {},
  organizationId?: string,
): Promise<PageWire<PortalTask>> {
  const limit = Math.min(Math.max(query.limit || 100, 1), 200);
  const wire = await api<PageWire<AdminTaskWire>>(
    `/admin/tasks${queryString({
      status: query.status,
      assignee_subject: query.assignee_subject,
      application_id: query.application_id,
      limit,
      offset: query.offset || 0,
    })}`,
    withOrganization(organizationId),
  );
  const items = wire.items.map(normalizeTask).filter((item) =>
    query.priority ? item.priority === query.priority : true,
  );
  return { items, meta: wire.meta };
}

export async function createAdminTask(
  payload: AdminTaskCreate,
  organizationId?: string,
): Promise<PortalTask> {
  const row = await api<AdminTaskWire>(
    "/admin/tasks",
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  return normalizeTask(row);
}

export async function updateAdminTask(
  taskId: string,
  payload: AdminTaskPatch,
  organizationId?: string,
): Promise<PortalTask> {
  const { version: _version, ...body } = payload;
  const row = await api<AdminTaskWire>(
    `/admin/tasks/${encodeURIComponent(taskId)}`,
    withOrganization(organizationId, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  );
  return normalizeTask(row);
}

export function searchAdminPortal(
  query: string,
  organizationId?: string,
): Promise<AdminSearchResult[]> {
  return api<AdminSearchResult[]>(
    `/admin/search${queryString({ q: query, limit: 50 })}`,
    withOrganization(organizationId),
  );
}

export function listAdminAuditEvents(
  query: {
    actor_id?: string;
    action?: string;
    resource_type?: string;
    resource_id?: string;
    limit?: number;
    offset?: number;
  } = {},
  organizationId?: string,
): Promise<PageWire<Record<string, unknown>>> {
  return api<PageWire<Record<string, unknown>>>(
    `/admin/audit-events${queryString(query)}`,
    withOrganization(organizationId),
  );
}

export function listAdminOrganizations(
  query: { organization_type?: string; active?: boolean; limit?: number } = {},
  organizationId?: string,
): Promise<AdminOrganization[]> {
  return api<AdminOrganization[]>(
    `/admin/organizations${queryString({
      ...query,
      limit: Math.min(Math.max(query.limit || 100, 1), 200),
    })}`,
    withOrganization(organizationId),
  );
}

export function listAdminOrganizationMembers(
  targetOrganizationId: string,
  organizationId?: string,
): Promise<AdminOrganizationMember[]> {
  return api<AdminOrganizationMember[]>(
    `/admin/organizations/${encodeURIComponent(targetOrganizationId)}/members`,
    withOrganization(organizationId),
  );
}

export function getIntegrationHealth(
  organizationId?: string,
): Promise<Record<string, unknown>> {
  return api<Record<string, unknown>>(
    "/admin/integration-control-plane",
    withOrganization(organizationId),
  );
}

export async function listWebhookReceipts(
  query: { provider?: string; status?: string; limit?: number } = {},
  organizationId?: string,
): Promise<WebhookReceipt[]> {
  const rows = await api<WebhookReceiptWire[]>(
    `/admin/webhook-receipts${queryString({
      ...query,
      limit: Math.min(Math.max(query.limit || 100, 1), 200),
    })}`,
    withOrganization(organizationId),
  );
  return rows.map(normalizeReceipt);
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
