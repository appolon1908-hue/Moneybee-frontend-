import { api } from "./core";
import {
  type PortalConversation,
  type PortalNotification,
  type PortalTask,
  queryString,
  withOrganization,
} from "./portal";

export interface BorrowerApplicationSummary {
  id: string;
  borrower_id: string;
  status: string;
  requested_amount: string | null;
  use_of_funds: string | null;
  version: number;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface BorrowerWorkspace {
  applications: BorrowerApplicationSummary[];
  open_tasks: PortalTask[];
  unread_notifications: PortalNotification[];
  conversations: PortalConversation[];
  summary: {
    application_count: number;
    active_application_count: number;
  };
}

export interface BorrowerApplicationWorkspace {
  application: BorrowerApplicationSummary;
  conditions: Array<Record<string, unknown>>;
  offers: Array<Record<string, unknown>>;
  documents: Array<Record<string, unknown>>;
  bank_connections: Array<Record<string, unknown>>;
  tasks: PortalTask[];
  upload_sessions: UploadSession[];
}

export interface UploadSession {
  id: string;
  tenant_id: string;
  application_id: string;
  owner_id: string | null;
  condition_id: string | null;
  document_type: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  status: string;
  created_by_subject: string;
  expires_at: string;
  completed_at: string | null;
  created_at: string;
}

export interface UploadSessionCreate {
  owner_id?: string | null;
  condition_id?: string | null;
  document_type: string;
  original_file_name: string;
  mime_type: string;
  size_bytes: number;
  sha256: string;
  metadata_payload?: Record<string, unknown>;
}

export interface UploadSessionIssued {
  session: UploadSession;
  upload_url: string;
  upload_method: "PUT";
  upload_headers: Record<string, string>;
}

export interface CompletedUpload {
  document: Record<string, unknown>;
  upload_session: UploadSession;
  download_available: false;
  next_state: "MALWARE_SCAN_PENDING";
}

export function getBorrowerWorkspace(
  organizationId?: string,
): Promise<BorrowerWorkspace> {
  return api<BorrowerWorkspace>(
    "/borrower/workspace",
    withOrganization(organizationId),
  );
}

export function getBorrowerApplicationWorkspace(
  applicationId: string,
  organizationId?: string,
): Promise<BorrowerApplicationWorkspace> {
  return api<BorrowerApplicationWorkspace>(
    `/borrower/applications/${encodeURIComponent(applicationId)}/workspace`,
    withOrganization(organizationId),
  );
}

export function listBorrowerUploadSessions(
  applicationId?: string,
  organizationId?: string,
): Promise<UploadSession[]> {
  return api<UploadSession[]>(
    `/borrower/uploads${queryString({ application_id: applicationId })}`,
    withOrganization(organizationId),
  );
}

export function createBorrowerUploadSession(
  applicationId: string,
  payload: UploadSessionCreate,
  organizationId?: string,
): Promise<UploadSessionIssued> {
  return api<UploadSessionIssued>(
    `/borrower/applications/${encodeURIComponent(applicationId)}/uploads`,
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  );
}

export function completeBorrowerUploadSession(
  sessionId: string,
  providerEtag?: string,
  organizationId?: string,
): Promise<CompletedUpload> {
  return api<CompletedUpload>(
    `/borrower/uploads/${encodeURIComponent(sessionId)}/complete`,
    withOrganization(organizationId, {
      method: "POST",
      body: JSON.stringify({ provider_etag: providerEtag ?? null }),
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

export async function uploadBorrowerDocument(input: {
  applicationId: string;
  documentType: string;
  file: File;
  ownerId?: string | null;
  conditionId?: string | null;
  organizationId?: string;
}): Promise<CompletedUpload> {
  const sha256 = await sha256File(input.file);
  const issued = await createBorrowerUploadSession(
    input.applicationId,
    {
      owner_id: input.ownerId ?? null,
      condition_id: input.conditionId ?? null,
      document_type: input.documentType,
      original_file_name: input.file.name,
      mime_type: input.file.type || "application/octet-stream",
      size_bytes: input.file.size,
      sha256,
    },
    input.organizationId,
  );
  const uploadResponse = await fetch(issued.upload_url, {
    method: issued.upload_method,
    headers: issued.upload_headers,
    body: input.file,
  });
  if (!uploadResponse.ok) {
    throw new Error(`Secure object upload failed (${uploadResponse.status}).`);
  }
  const etag = uploadResponse.headers.get("ETag")?.replaceAll('"', "") ?? undefined;
  return completeBorrowerUploadSession(
    issued.session.id,
    etag,
    input.organizationId,
  );
}
