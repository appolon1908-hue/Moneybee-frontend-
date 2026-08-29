import { api, type ApiOptions } from "./core";

export type PortalTaskStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISMISSED";

export type PortalTaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface NavigationItem {
  key: string;
  label: string;
  href?: string;
  path?: string;
  portal?: "borrower" | "lender" | "admin" | "shared";
  group?: string;
  required_permission?: string | null;
}

export interface PortalOrganization {
  id: string;
  name: string;
  organization_type: string;
}

export interface AuthContext {
  user_id: string;
  subject: string;
  active_organization_id: string | null;
  organizations?: PortalOrganization[];
  organization_ids?: string[];
  roles: string[];
  permissions: string[];
  membership_types: string[];
  portal?: "BORROWER" | "LENDER" | "ADMIN" | "AFFILIATE" | "UNKNOWN";
  capabilities?: Record<string, boolean>;
  borrower_id?: string | null;
  lender_id?: string | null;
  navigation?: NavigationItem[];
}

export type PortalContext = AuthContext;

export interface PortalTask {
  id: string;
  application_id: string | null;
  organization_id?: string | null;
  tenant_id?: string;
  assignee_user_id?: string | null;
  assignee_subject?: string | null;
  assigned_to_subject?: string | null;
  task_type: string;
  title: string;
  description: string | null;
  // The backend read model intentionally treats task status as data so newer
  // server statuses remain readable. Mutation payloads stay constrained below.
  status: string;
  priority: PortalTaskPriority;
  created_by_subject?: string;
  due_at: string | null;
  completed_at: string | null;
  source_type?: string | null;
  source_reference?: string | null;
  version?: number;
  metadata_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PortalTaskCreate {
  application_id?: string | null;
  organization_id?: string | null;
  assignee_user_id?: string | null;
  assignee_subject?: string | null;
  task_type?: string;
  title: string;
  description?: string | null;
  priority?: PortalTaskPriority;
  assigned_to_subject?: string | null;
  due_at?: string | null;
  source_type?: string | null;
  source_reference?: string | null;
  metadata_payload?: Record<string, unknown>;
}

export interface PortalTaskUpdate {
  expected_version?: number;
  status?: PortalTaskStatus;
  priority?: PortalTaskPriority;
  assigned_to_subject?: string | null;
  assignee_subject?: string | null;
  assignee_user_id?: string | null;
  due_at?: string | null;
  description?: string | null;
}

export interface PortalNotification {
  id: string;
  tenant_id: string;
  recipient_subject: string;
  notification_type: string;
  title: string;
  body: string;
  href: string | null;
  read_at: string | null;
  metadata_payload: Record<string, unknown>;
  created_at: string;
}

export interface PortalConversation {
  id: string;
  tenant_id: string;
  application_id: string | null;
  topic: string;
  status: string;
  created_by_subject: string;
  participant_subjects: string[];
  last_message_at: string;
  metadata_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PortalMessage {
  id: string;
  conversation_id: string;
  sender_subject: string;
  body: string;
  attachments: Array<Record<string, unknown>>;
  metadata_payload: Record<string, unknown>;
  created_at: string;
}

export interface PortalConversationCreate {
  application_id?: string | null;
  topic: string;
  participant_subjects?: string[];
  opening_message?: string | null;
  metadata_payload?: Record<string, unknown>;
}

export interface PortalMessageCreate {
  body: string;
  attachments?: Array<Record<string, unknown>>;
  metadata_payload?: Record<string, unknown>;
}

export interface PortalQuery {
  status?: string;
  application_id?: string;
  unread_only?: boolean;
  assigned_to_me?: boolean;
  limit?: number;
  offset?: number;
}

function withOrganization(
  organizationId?: string,
  options: ApiOptions = {},
): ApiOptions {
  if (!organizationId) return options;
  return {
    ...options,
    headers: {
      ...Object.fromEntries(new Headers(options.headers).entries()),
      "X-Organization-ID": organizationId,
    },
  };
}

function queryString<T extends object>(values: T): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(values)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export function getAuthContext(organizationId?: string): Promise<AuthContext> {
  return api<AuthContext>("/auth/context", withOrganization(organizationId));
}

export function getPortalNavigation(
  organizationId?: string,
): Promise<NavigationItem[]> {
  return api<NavigationItem[]>(
    "/portal/navigation",
    withOrganization(organizationId),
  );
}

export function listPortalTasks(
  query: PortalQuery = {},
  organizationId?: string,
): Promise<PortalTask[]> {
  return api<PortalTask[]>(
    `/portal/tasks${queryString(query)}`,
    withOrganization(organizationId),
  );
}

export function createPortalTask(
  payload: PortalTaskCreate,
  organizationId?: string,
): Promise<PortalTask> {
  return api<PortalTask>(
    "/portal/tasks",
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function updatePortalTask(
  taskId: string,
  payload: PortalTaskUpdate,
  organizationId?: string,
): Promise<PortalTask> {
  return api<PortalTask>(
    `/portal/tasks/${encodeURIComponent(taskId)}`,
    withOrganization(organizationId, {
      method: "PATCH",
      body: JSON.stringify(payload),
    }),
  );
}

export function listPortalNotifications(
  unreadOnly = false,
  organizationId?: string,
): Promise<PortalNotification[]> {
  return api<PortalNotification[]>(
    `/portal/notifications${queryString({ unread_only: unreadOnly })}`,
    withOrganization(organizationId),
  );
}

export function markPortalNotificationRead(
  notificationId: string,
  organizationId?: string,
): Promise<PortalNotification> {
  return api<PortalNotification>(
    `/portal/notifications/${encodeURIComponent(notificationId)}/read`,
    withOrganization(organizationId, { method: "POST" }),
  );
}

export function listPortalConversations(
  status?: string,
  organizationId?: string,
): Promise<PortalConversation[]> {
  return api<PortalConversation[]>(
    `/portal/conversations${queryString({ status })}`,
    withOrganization(organizationId),
  );
}

export function createPortalConversation(
  payload: PortalConversationCreate,
  organizationId?: string,
): Promise<PortalConversation> {
  return api<PortalConversation>(
    "/portal/conversations",
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function listPortalMessages(
  conversationId: string,
  organizationId?: string,
): Promise<PortalMessage[]> {
  return api<PortalMessage[]>(
    `/portal/conversations/${encodeURIComponent(conversationId)}/messages`,
    withOrganization(organizationId),
  );
}

export function createPortalMessage(
  conversationId: string,
  payload: PortalMessageCreate,
  organizationId?: string,
): Promise<PortalMessage> {
  return api<PortalMessage>(
    `/portal/conversations/${encodeURIComponent(conversationId)}/messages`,
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export const portalApi = {
  context: getAuthContext,
  navigation: getPortalNavigation,
  tasks: listPortalTasks,
  notifications: listPortalNotifications,
  conversations: listPortalConversations,
};

export { queryString, withOrganization };
