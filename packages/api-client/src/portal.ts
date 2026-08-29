import { api, type ApiOptions } from "./core";
import { ENDPOINTS } from "./endpoints";

export type PortalTaskStatus =
  | "OPEN"
  | "IN_PROGRESS"
  | "BLOCKED"
  | "COMPLETED"
  | "CANCELLED"
  | "DISMISSED";

export type PortalTaskObservedStatus = PortalTaskStatus | (string & {});
export type PortalTaskPriority = "LOW" | "NORMAL" | "HIGH" | "URGENT";

export interface PortalOrganization {
  id: string;
  name: string;
  organization_type: string;
}

export interface NavigationItem {
  key: string;
  label: string;
  href: string;
  path: string;
  portal: "borrower" | "lender" | "admin" | "shared";
  group: string;
  required_permission: string | null;
}

export interface AuthContext {
  user_id: string;
  subject: string;
  active_organization_id: string;
  organizations: PortalOrganization[];
  organization_ids: string[];
  roles: string[];
  permissions: string[];
  membership_types: string[];
  borrower_id: string | null;
  lender_id: string | null;
  portal: "BORROWER" | "LENDER" | "ADMIN" | "AFFILIATE" | "UNKNOWN";
  capabilities: Record<string, boolean>;
  navigation: NavigationItem[];
}

interface AuthContextWire {
  user_id: string;
  subject: string;
  active_organization_id: string | null;
  organizations: PortalOrganization[];
  roles: string[];
  permissions: string[];
  membership_types: string[];
  portal: AuthContext["portal"];
  capabilities: Record<string, boolean>;
}

interface NavigationItemWire {
  key: string;
  label: string;
  path: string;
  group: string;
  required_permission: string | null;
}

export interface PortalTask {
  id: string;
  tenant_id: string;
  organization_id?: string | null;
  application_id: string | null;
  task_type: string;
  title: string;
  description: string | null;
  status: PortalTaskObservedStatus;
  priority: PortalTaskPriority;
  assigned_to_subject: string | null;
  created_by_subject: string;
  due_at: string | null;
  completed_at: string | null;
  version: number;
  metadata_payload: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface PortalTaskCreate {
  application_id?: string | null;
  task_type?: string;
  title: string;
  description?: string | null;
  priority?: PortalTaskPriority;
  assigned_to_subject?: string | null;
  due_at?: string | null;
  metadata_payload?: Record<string, unknown>;
}

export interface PortalTaskUpdate {
  expected_version: number;
  status?: PortalTaskStatus;
  priority?: PortalTaskPriority;
  assigned_to_subject?: string | null;
  due_at?: string | null;
  description?: string | null;
}

export interface PortalNotification {
  id: string;
  tenant_id: string;
  application_id?: string | null;
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
  subject: string;
  status: string;
  created_by_subject: string;
  participant_subjects: string[];
  last_message_at: string | null;
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

export interface NotificationPreferences {
  email_enabled: boolean;
  sms_enabled: boolean;
  in_app_enabled: boolean;
}

function withOrganization(
  organizationId?: string | null,
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
  for (const [key, value] of Object.entries(values as Record<string, unknown>)) {
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

export async function getPortalNavigation(
  organizationId?: string | null,
  portal: AuthContext["portal"] = "UNKNOWN",
): Promise<NavigationItem[]> {
  const rows = await api<NavigationItemWire[]>(
    ENDPOINTS.identity.portalNavigation,
    withOrganization(organizationId),
  );
  const portalName = portal.toLowerCase() as NavigationItem["portal"];
  return rows.map((row) => ({
    ...row,
    href: row.path,
    portal: ["borrower", "lender", "admin"].includes(portalName)
      ? portalName
      : "shared",
  }));
}

export async function getAuthContext(
  organizationId?: string | null,
): Promise<AuthContext> {
  const wire = await api<AuthContextWire>(
    ENDPOINTS.identity.context,
    withOrganization(organizationId),
  );
  const activeOrganizationId = wire.active_organization_id || "";
  const navigation = await getPortalNavigation(activeOrganizationId, wire.portal);
  const borrowerId = wire.membership_types.includes("BORROWER")
    ? activeOrganizationId || null
    : null;
  const lenderId = wire.membership_types.includes("LENDER")
    ? activeOrganizationId || null
    : null;
  return {
    ...wire,
    active_organization_id: activeOrganizationId,
    organization_ids: wire.organizations.map((item) => item.id),
    borrower_id: borrowerId,
    lender_id: lenderId,
    navigation,
  };
}

export function getCapabilityFlags(
  organizationId?: string | null,
): Promise<Record<string, boolean>> {
  return api<Record<string, boolean>>(
    ENDPOINTS.identity.capabilities,
    withOrganization(organizationId),
  );
}

export function getNotificationPreferences(
  organizationId?: string | null,
): Promise<NotificationPreferences> {
  return api<NotificationPreferences>(
    ENDPOINTS.identity.notificationPreferences,
    withOrganization(organizationId),
  );
}

export function updateNotificationPreferences(
  payload: NotificationPreferences,
  organizationId?: string | null,
): Promise<NotificationPreferences> {
  return api<NotificationPreferences>(
    ENDPOINTS.identity.notificationPreferences,
    withOrganization(organizationId, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),
  );
}

export function listPortalTasks(
  query: PortalQuery = {},
  organizationId?: string,
): Promise<PortalTask[]> {
  return api<PortalTask[]>(
    `${ENDPOINTS.borrower.tasks}${queryString(query)}`,
    withOrganization(organizationId),
  );
}

export function updatePortalTask(
  taskId: string,
  payload: PortalTaskUpdate,
  organizationId?: string,
): Promise<PortalTask> {
  return api<PortalTask>(
    ENDPOINTS.borrower.task(taskId),
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
    `${ENDPOINTS.borrower.notifications}${queryString({ unread_only: unreadOnly })}`,
    withOrganization(organizationId),
  );
}

export function markPortalNotificationRead(
  notificationId: string,
  organizationId?: string,
): Promise<PortalNotification> {
  return api<PortalNotification>(
    ENDPOINTS.borrower.notificationRead(notificationId),
    withOrganization(organizationId, { method: "POST" }),
  );
}

export function listPortalConversations(
  status?: string,
  organizationId?: string,
): Promise<PortalConversation[]> {
  return api<PortalConversation[]>(
    `${ENDPOINTS.borrower.conversations}${queryString({ status })}`,
    withOrganization(organizationId),
  );
}

export function createPortalConversation(
  payload: PortalConversationCreate,
  organizationId?: string,
): Promise<PortalConversation> {
  return api<PortalConversation>(
    ENDPOINTS.borrower.conversations,
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
    ENDPOINTS.borrower.conversationMessages(conversationId),
    withOrganization(organizationId),
  );
}

export function createPortalMessage(
  conversationId: string,
  payload: PortalMessageCreate,
  organizationId?: string,
): Promise<PortalMessage> {
  return api<PortalMessage>(
    ENDPOINTS.borrower.conversationMessages(conversationId),
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export { queryString, withOrganization };
