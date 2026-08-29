import { api } from "./core";
import { ENDPOINTS } from "./endpoints";
import {
  queryString,
  withOrganization,
  type PortalConversation,
  type PortalMessage,
  type PortalNotification,
  type PortalTask,
  type PortalTaskPriority,
} from "./portal";

interface BorrowerApplicationWire {
  id: string;
  lead_id?: string;
  requested_amount: string | number | null;
  monthly_revenue?: string | number | null;
  time_in_business_months?: number;
  industry?: string | null;
  state?: string | null;
  status: string;
  completion_percentage?: number;
  version: number;
  created_at: string;
  updated_at: string;
}

interface BorrowerOverviewWire {
  active_application: BorrowerApplicationWire | null;
  applications: BorrowerApplicationWire[];
  requirements: Record<string, unknown> | null;
  open_tasks: number;
  unread_notifications: number;
  open_conditions: number;
  available_offers: number;
  recent_activity: Array<Record<string, unknown>>;
}

interface PortalTaskWire {
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

interface NotificationWire {
  id: string;
  application_id: string | null;
  organization_id: string | null;
  subject: string;
  category: string;
  title: string;
  body: string;
  action_path: string | null;
  read_at: string | null;
  metadata_payload: Record<string, unknown>;
  created_at: string;
}

interface ConversationWire {
  id: string;
  application_id: string | null;
  organization_id: string | null;
  topic: string;
  status: string;
  created_by_subject: string;
  last_message_at: string | null;
  created_at: string;
  updated_at?: string;
}

interface MessageWire {
  id: string;
  conversation_id: string;
  sender_subject: string;
  sender_type: string;
  body: string;
  message_type: string;
  attachment_document_id: string | null;
  metadata_payload: Record<string, unknown>;
  created_at: string;
}

export interface BorrowerApplication {
  id: string;
  application_number: string;
  business_name: string | null;
  borrower_id: string | null;
  status: string;
  requested_amount: string | null;
  monthly_revenue: string | null;
  use_of_funds: string | null;
  completion_percentage: number;
  version: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BorrowerWorkspace {
  applications: BorrowerApplication[];
  tasks: PortalTask[];
  open_tasks: PortalTask[];
  unread_notifications: PortalNotification[];
  conversations: PortalConversation[];
  recent_activity: Array<Record<string, unknown>>;
  summary: {
    application_count: number;
    active_application_count: number;
    open_task_count: number;
    unread_notification_count: number;
  };
}

export interface BorrowerApplicationSummary {
  application: BorrowerApplication;
  summary: {
    offer_count: number;
    document_count: number;
    condition_count: number;
    task_count: number;
    bank_connection_count: number;
  };
  conditions: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  bank_connections: Array<Record<string, unknown>>;
  tasks: PortalTask[];
  upload_sessions: UploadSession[];
}

export type BorrowerApplicationWorkspace = BorrowerApplicationSummary;

export interface UploadSession {
  id: string;
  application_id: string;
  document_type: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  expected_sha256: string | null;
  sha256: string;
  status: string;
  scan_status?: string | null;
  expires_at: string;
  created_at: string;
  upload_url: string | null;
  upload_headers: Record<string, string>;
}

export interface UploadSessionCreate {
  document_type: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256?: string | null;
}

export interface CompletedUpload {
  id: string;
  application_id: string;
  document_type: string;
  original_file_name: string;
  mime_type: string | null;
  size_bytes: number;
  sha256: string;
  status: string;
  uploaded_by: string;
  created_at: string;
  updated_at: string;
}

function asMoney(value: string | number | null | undefined): string | null {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function normalizeApplication(
  row: BorrowerApplicationWire,
  borrowerId?: string | null,
): BorrowerApplication {
  return {
    id: row.id,
    application_number: `MB-${row.id.slice(0, 8).toUpperCase()}`,
    business_name: null,
    borrower_id: borrowerId || null,
    status: String(row.status),
    requested_amount: asMoney(row.requested_amount),
    monthly_revenue: asMoney(row.monthly_revenue),
    use_of_funds: null,
    completion_percentage: Number(row.completion_percentage || 0),
    version: row.version,
    submitted_at: null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeTask(row: PortalTaskWire): PortalTask {
  return {
    id: row.id,
    tenant_id: row.organization_id || "",
    organization_id: row.organization_id,
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
      assignee_user_id: row.assignee_user_id,
      source_type: row.source_type,
      source_reference: row.source_reference,
    },
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

function normalizeNotification(row: NotificationWire): PortalNotification {
  return {
    id: row.id,
    tenant_id: row.organization_id || "",
    application_id: row.application_id,
    recipient_subject: row.subject,
    notification_type: row.category,
    title: row.title,
    body: row.body,
    href: row.action_path,
    read_at: row.read_at,
    metadata_payload: row.metadata_payload,
    created_at: row.created_at,
  };
}

function normalizeConversation(row: ConversationWire): PortalConversation {
  return {
    id: row.id,
    tenant_id: row.organization_id || "",
    application_id: row.application_id,
    topic: row.topic,
    subject: row.topic,
    status: row.status,
    created_by_subject: row.created_by_subject,
    participant_subjects: [],
    last_message_at: row.last_message_at,
    metadata_payload: {},
    created_at: row.created_at,
    updated_at: row.updated_at || row.created_at,
  };
}

function normalizeMessage(row: MessageWire): PortalMessage {
  return {
    id: row.id,
    conversation_id: row.conversation_id,
    sender_subject: row.sender_subject,
    body: row.body,
    attachments: row.attachment_document_id
      ? [{ document_id: row.attachment_document_id, type: row.message_type }]
      : [],
    metadata_payload: {
      ...row.metadata_payload,
      sender_type: row.sender_type,
      message_type: row.message_type,
    },
    created_at: row.created_at,
  };
}

export async function getBorrowerWorkspace(
  organizationId?: string,
): Promise<BorrowerWorkspace> {
  const options = withOrganization(organizationId);
  const [overview, taskRows, notificationRows, conversationRows] = await Promise.all([
    api<BorrowerOverviewWire>(ENDPOINTS.borrower.overview, options),
    api<PortalTaskWire[]>(`${ENDPOINTS.borrower.tasks}?limit=200`, options),
    api<NotificationWire[]>(
      `${ENDPOINTS.borrower.notifications}?unread_only=true&limit=200`,
      options,
    ),
    api<ConversationWire[]>(ENDPOINTS.borrower.conversations, options),
  ]);
  const applications = overview.applications.map((row) =>
    normalizeApplication(row, organizationId),
  );
  const tasks = taskRows.map(normalizeTask);
  return {
    applications,
    tasks,
    open_tasks: tasks.filter(
      (task) => !["COMPLETED", "CANCELLED", "DISMISSED"].includes(task.status),
    ),
    unread_notifications: notificationRows.map(normalizeNotification),
    conversations: conversationRows.map(normalizeConversation),
    recent_activity: overview.recent_activity,
    summary: {
      application_count: applications.length,
      active_application_count: applications.filter(
        (item) =>
          !["CLOSED", "WITHDRAWN", "DECLINED", "EXPIRED", "CANCELLED"].includes(
            item.status,
          ),
      ).length,
      open_task_count: overview.open_tasks,
      unread_notification_count: overview.unread_notifications,
    },
  };
}

export async function getBorrowerApplicationWorkspace(
  applicationId: string,
  organizationId?: string,
): Promise<BorrowerApplicationSummary> {
  const options = withOrganization(organizationId);
  const [applicationWire, offers, documents, taskRows] = await Promise.all([
    api<BorrowerApplicationWire>(
      ENDPOINTS.applications.item(applicationId),
      options,
    ),
    api<Array<Record<string, unknown>>>(
      ENDPOINTS.applications.offers(applicationId),
      options,
    ),
    api<Array<Record<string, unknown>>>(
      ENDPOINTS.borrower.applicationDocuments(applicationId),
      options,
    ),
    api<PortalTaskWire[]>(`${ENDPOINTS.borrower.tasks}?limit=200`, options),
  ]);
  const tasks = taskRows
    .filter((row) => row.application_id === applicationId)
    .map(normalizeTask);
  const application = normalizeApplication(applicationWire, organizationId);
  return {
    application,
    summary: {
      offer_count: offers.length,
      document_count: documents.length,
      condition_count: 0,
      task_count: tasks.length,
      bank_connection_count: 0,
    },
    conditions: [],
    offers,
    documents,
    bank_connections: [],
    tasks,
    upload_sessions: [],
  };
}

export async function updateBorrowerTask(
  taskId: string,
  status: string,
  organizationId?: string,
): Promise<PortalTask> {
  const normalized = status === "CANCELLED" ? "DISMISSED" : status;
  const row = await api<PortalTaskWire>(
    ENDPOINTS.borrower.task(taskId),
    withOrganization(organizationId, {
      method: "PATCH",
      body: JSON.stringify({ status: normalized }),
    }),
  );
  return normalizeTask(row);
}

export async function listBorrowerMessages(
  conversationId: string,
  organizationId?: string,
): Promise<PortalMessage[]> {
  const rows = await api<MessageWire[]>(
    ENDPOINTS.borrower.conversationMessages(conversationId),
    withOrganization(organizationId),
  );
  return rows.map(normalizeMessage);
}

export async function createBorrowerConversation(
  payload: { application_id?: string | null; topic: string; body: string },
  organizationId?: string,
): Promise<PortalConversation> {
  const row = await api<ConversationWire>(
    ENDPOINTS.borrower.conversations,
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  return normalizeConversation(row);
}

export async function createBorrowerMessage(
  conversationId: string,
  payload: { body: string; attachment_document_id?: string | null },
  organizationId?: string,
): Promise<PortalMessage> {
  const row = await api<MessageWire>(
    ENDPOINTS.borrower.conversationMessages(conversationId),
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
  return normalizeMessage(row);
}

export function createBorrowerUploadSession(
  applicationId: string,
  payload: UploadSessionCreate,
  organizationId?: string,
): Promise<UploadSession> {
  return api<UploadSession>(
    ENDPOINTS.borrower.applicationUploadSessions(applicationId),
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function completeBorrowerUploadSession(
  sessionId: string,
  payload: { sha256: string; size_bytes: number },
  organizationId?: string,
): Promise<CompletedUpload> {
  return api<CompletedUpload>(
    ENDPOINTS.borrower.uploadSessionComplete(sessionId),
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export async function sha256File(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest("SHA-256", buffer);
  return Array.from(new Uint8Array(digest))
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export async function uploadPortalDocument(
  session: UploadSession,
  file: File,
  organizationId?: string,
): Promise<CompletedUpload> {
  if (!session.upload_url) {
    throw new Error("The secure upload session did not include an upload URL.");
  }
  const checksum = session.expected_sha256 || session.sha256 || (await sha256File(file));
  const response = await fetch(session.upload_url, {
    method: "PUT",
    headers: session.upload_headers,
    body: file,
  });
  if (!response.ok) {
    throw new Error(`Secure object upload failed (${response.status}).`);
  }
  return completeBorrowerUploadSession(
    session.id,
    { sha256: checksum, size_bytes: file.size },
    organizationId,
  );
}

export async function uploadBorrowerDocument(input: {
  applicationId: string;
  documentType: string;
  file: File;
  organizationId?: string;
}): Promise<CompletedUpload> {
  const checksum = await sha256File(input.file);
  const session = await createBorrowerUploadSession(
    input.applicationId,
    {
      document_type: input.documentType,
      original_file_name: input.file.name,
      mime_type: input.file.type || "application/octet-stream",
      size_bytes: input.file.size,
      sha256: checksum,
    },
    input.organizationId,
  );
  return uploadPortalDocument(session, input.file, input.organizationId);
}

export const borrowerPortalApi = {
  workspace: getBorrowerWorkspace,
  applicationSummary: getBorrowerApplicationWorkspace,
};

export { queryString };
