import {
  getAdminOperationsWorkspace,
  getIntegrationHealth,
  listAdminAuditEvents,
  listAdminOrganizationMembers,
  listAdminOrganizations,
  listAdminTasks,
  listWebhookReceipts,
  requeueWebhookReceipt,
  searchAdminPortal,
  updateAdminTask,
  type AdminOrganization,
  type AdminTaskQuery,
  type WebhookReceipt,
} from "./admin";

export interface OrganizationContext extends AdminOrganization {}

export interface SearchResult {
  type: string;
  id: string;
  label: string;
  subtitle: string | null;
  status: string | null;
  path: string;
  updated_at: string | null;
}

export const adminPortalApi = {
  workspace(organizationId?: string | null) {
    return getAdminOperationsWorkspace(organizationId || undefined);
  },

  async workQueue(query: AdminTaskQuery, organizationId?: string) {
    return listAdminTasks(query, organizationId);
  },

  patchWorkItem(
    taskId: string,
    payload: {
      status?: "OPEN" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED" | "CANCELLED";
      priority?: "LOW" | "NORMAL" | "HIGH" | "URGENT";
      version?: number;
    },
    organizationId?: string,
  ) {
    const normalizedStatus =
      payload.status === "BLOCKED"
        ? "IN_PROGRESS"
        : payload.status === "CANCELLED"
          ? "DISMISSED"
          : payload.status;
    return updateAdminTask(
      taskId,
      {
        version: payload.version,
        status: normalizedStatus,
        priority: payload.priority,
      },
      organizationId,
    );
  },

  async search(query: string, organizationId?: string) {
    const rows = await searchAdminPortal(query, organizationId);
    return {
      items: rows.map<SearchResult>((row) => ({
        type: row.resource_type,
        id: row.resource_id,
        label: row.title,
        subtitle: row.subtitle,
        status: row.status,
        path: row.path,
        updated_at: row.updated_at,
      })),
    };
  },

  integrationHealth: getIntegrationHealth,

  async webhookReceipts(
    query: { provider?: string; status?: string; limit?: number },
    organizationId?: string,
  ): Promise<{ items: WebhookReceipt[] }> {
    return { items: await listWebhookReceipts(query, organizationId) };
  },

  requeueWebhookReceipt(
    receiptId: string,
    organizationId?: string,
  ) {
    return requeueWebhookReceipt(receiptId, organizationId);
  },

  async organizations(
    query: { organization_type?: string; active?: boolean; limit?: number },
    organizationId?: string,
  ): Promise<{ items: OrganizationContext[] }> {
    return { items: await listAdminOrganizations(query, organizationId) };
  },

  async organizationMembers(
    targetOrganizationId: string,
    organizationId?: string,
  ): Promise<{ items: Array<Record<string, unknown>> }> {
    const rows = await listAdminOrganizationMembers(
      targetOrganizationId,
      organizationId,
    );
    return {
      items: rows.map((row) => ({
        user: {
          id: row.user_id,
          email: row.email,
          display_name: row.display_name,
          active: row.user_active,
        },
        membership: {
          id: row.membership_id,
          membership_type: row.membership_type,
          active: row.membership_active,
          roles: row.roles,
          created_at: row.created_at,
        },
      })),
    };
  },

  async auditEvents(before: string | null, organizationId?: string) {
    const offset = before ? Number.parseInt(before, 10) || 0 : 0;
    const limit = 100;
    const page = await listAdminAuditEvents(
      { limit, offset },
      organizationId,
    );
    const nextOffset = offset + page.items.length;
    return {
      items: page.items,
      next_before: nextOffset < page.meta.total ? String(nextOffset) : null,
    };
  },
};
