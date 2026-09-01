export const ENDPOINTS = {
  identity: {
    context: "/auth/context",
    me: "/me",
    capabilities: "/me/capabilities",
    notificationPreferences: "/me/notification-preferences",
    portalNavigation: "/portal/navigation",
  },
  public: {
    prequalifications: "/public/prequalifications",
    contactRequests: "/public/contact-requests",
    callbackRequests: "/public/callback-requests",
    lenderPartnerInquiries: "/public/lender-partner-inquiries",
    referralPartnerInquiries: "/public/referral-partner-inquiries",
    dealSubmissionInquiries: "/public/deal-submission-inquiries",
  },
  borrower: {
    overview: "/borrower/overview",
    tasks: "/borrower/tasks",
    task: (taskId: string) => `/borrower/tasks/${encodeURIComponent(taskId)}`,
    notifications: "/borrower/notifications",
    notificationRead: (notificationId: string) =>
      `/borrower/notifications/${encodeURIComponent(notificationId)}/read`,
    conversations: "/borrower/conversations",
    conversationMessages: (conversationId: string) =>
      `/borrower/conversations/${encodeURIComponent(conversationId)}/messages`,
    applicationDocuments: (applicationId: string) =>
      `/borrower/applications/${encodeURIComponent(applicationId)}/documents`,
    applicationUploadSessions: (applicationId: string) =>
      `/borrower/applications/${encodeURIComponent(applicationId)}/documents/upload-sessions`,
    uploadSessionComplete: (sessionId: string) =>
      `/borrower/document-upload-sessions/${encodeURIComponent(sessionId)}/complete`,
    commercialFinancingDisclosure: (offerId: string) =>
      `/borrower/offers/${encodeURIComponent(offerId)}/commercial-financing-disclosure`,
    commercialFinancingDisclosureAcknowledge: (offerId: string) =>
      `/borrower/offers/${encodeURIComponent(offerId)}/commercial-financing-disclosure/acknowledge`,
  },
  applications: {
    collection: "/applications",
    fromLead: (leadId: string) => `/applications/from-lead/${encodeURIComponent(leadId)}`,
    item: (applicationId: string) => `/applications/${encodeURIComponent(applicationId)}`,
    requirements: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/requirements`,
    timeline: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/timeline`,
    business: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/business`,
    financialProfile: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/financial-profile`,
    owners: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/owners`,
    owner: (applicationId: string, ownerId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/owners/${encodeURIComponent(ownerId)}`,
    offers: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/offers`,
    conditions: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/conditions`,
    complaints: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/complaints`,
    creditAuthorizations: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/credit-authorizations`,
    requirementSnapshots: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/requirement-snapshots`,
    submit: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/submit`,
    funding: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/funding`,
    bankLinkSession: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/bank/link-session`,
    bankExchange: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/bank/exchange`,
    bankSync: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/bank/sync`,
    bankAccounts: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/bank/accounts`,
    bankAnalysis: (applicationId: string) =>
      `/applications/${encodeURIComponent(applicationId)}/bank/analysis`,
  },
  conditions: {
    submit: (conditionId: string) => `/conditions/${encodeURIComponent(conditionId)}/submit`,
  },
  offers: {
    accept: (offerId: string) => `/offers/${encodeURIComponent(offerId)}/accept`,
  },
  lender: {
    workspace: "/lender/workspace",
    programs: "/lender/programs",
    program: (programId: string) => `/lender/programs/${encodeURIComponent(programId)}`,
    conditionApprove: (conditionId: string) =>
      `/lender/conditions/${encodeURIComponent(conditionId)}/approve`,
    conditionReject: (conditionId: string) =>
      `/lender/conditions/${encodeURIComponent(conditionId)}/reject`,
    conditionWaive: (conditionId: string) =>
      `/lender/conditions/${encodeURIComponent(conditionId)}/waive`,
    fundings: "/lender/fundings",
    submissions: "/lender/submissions",
    submissionWorkspace: (submissionId: string) =>
      `/lender/submissions/${encodeURIComponent(submissionId)}/workspace`,
    submissionBankTransactions: (submissionId: string) =>
      `/lender/submissions/${encodeURIComponent(submissionId)}/bank-transactions`,
    submissionAssignment: (submissionId: string) =>
      `/lender/submissions/${encodeURIComponent(submissionId)}/assignment`,
    submissionConditions: (submissionId: string) =>
      `/lender/submissions/${encodeURIComponent(submissionId)}/conditions`,
    submissionDecisions: (submissionId: string) =>
      `/lender/submissions/${encodeURIComponent(submissionId)}/decisions`,
    submissionOffers: (submissionId: string) =>
      `/lender/submissions/${encodeURIComponent(submissionId)}/offers`,
    bankReviewQueue: "/lender/bank-review-queue",
    portfolio: "/lender/portfolio",
  },
  admin: {
    dashboard: "/admin/dashboard",
    crmEvents: "/admin/crm/events",
    capabilities: "/admin/capabilities",
    providerConnections: "/admin/provider-connections",
    fundings: "/admin/fundings",
    complaints: "/admin/complaints",
    integrationEvents: "/admin/integration-events",
    reconciliationRuns: "/admin/reconciliation-runs",
    systemReadiness: "/admin/system/readiness",
    workspace: "/admin/workspace",
    tasks: "/admin/tasks",
    task: (taskId: string) => `/admin/tasks/${encodeURIComponent(taskId)}`,
    search: "/admin/search",
    auditEvents: "/admin/audit-events",
    organizations: "/admin/organizations",
    organizationMembers: (organizationId: string) =>
      `/admin/organizations/${encodeURIComponent(organizationId)}/members`,
    integrationControlPlane: "/admin/integration-control-plane",
    webhookReceipts: "/admin/webhook-receipts",
    webhookReceiptRequeue: (receiptId: string) =>
      `/admin/webhook-receipts/${encodeURIComponent(receiptId)}/requeue`,
    publicIntakes: "/admin/public-intakes",
    publicIntake: (intakeId: string) => `/admin/public-intakes/${encodeURIComponent(intakeId)}`,
    crmDeliveries: "/admin/crm-deliveries",
    crmDelivery: (deliveryId: string) => `/admin/crm-deliveries/${encodeURIComponent(deliveryId)}`,
    crmDeliveryRequeue: (deliveryId: string) =>
      `/admin/crm-deliveries/${encodeURIComponent(deliveryId)}/requeue`,
    integrationInbox: "/admin/integration-inbox",
    operationalExceptions: "/admin/operational-exceptions",
    operationalExceptionResolve: (exceptionId: string) =>
      `/admin/operational-exceptions/${encodeURIComponent(exceptionId)}/resolve`,
    webhooksConfiguration: "/admin/webhooks/configuration",
    compliance: {
      overview: "/admin/compliance/overview",
      adverseActionNotices: "/admin/compliance/adverse-action-notices",
      commercialFinancingDisclosures:
        "/admin/compliance/commercial-financing-disclosures",
      commissionTaxRecords: "/admin/compliance/commission-tax-records",
      commissionTaxRecordsGenerate:
        "/admin/compliance/commission-tax-records/generate",
      commissionTaxRecordTin: (recordId: string) =>
        `/admin/compliance/commission-tax-records/${encodeURIComponent(recordId)}/tin`,
      commissionTaxRecordFiling: (recordId: string) =>
        `/admin/compliance/commission-tax-records/${encodeURIComponent(recordId)}/filing`,
      disclosureAcknowledge: (offerId: string) =>
        `/admin/compliance/offers/${encodeURIComponent(offerId)}/commercial-financing-disclosure/acknowledge`,
    },
    catalogs: {
      leads: "/admin/catalog/leads",
      applications: "/admin/catalog/applications",
      programs: "/admin/catalog/programs",
      submissions: "/admin/catalog/submissions",
      matches: "/admin/catalog/matches",
      offers: "/admin/catalog/offers",
      underwritingReviews: "/admin/underwriting/reviews",
      slaAlerts: "/admin/sla-alerts",
      users: "/admin/users",
      integrationInbox: "/admin/integration-inbox",
      operationalExceptions: "/admin/operational-exceptions",
    },
  },
  finance: {
    accounts: "/finance/accounts",
    periods: "/finance/periods",
    periodClose: (periodId: string) => `/finance/periods/${encodeURIComponent(periodId)}/close`,
    journalEntries: "/finance/journal-entries",
    journalPostings: (entryId: string) =>
      `/finance/journal-entries/${encodeURIComponent(entryId)}/postings`,
    trialBalance: "/finance/trial-balance",
  },
} as const;
