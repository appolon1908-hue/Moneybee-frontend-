import { api } from "./core"
import { withOrganization } from "./portal"

export type AccountType = "ASSET" | "LIABILITY" | "EQUITY" | "REVENUE" | "EXPENSE"
export type PostingSide = "DEBIT" | "CREDIT"

export interface LedgerAccount {
  id: string
  organization_id: string
  code: string
  name: string
  account_type: AccountType
  currency: string
  active: boolean
  system_managed: boolean
}

export interface AccountingPeriod {
  id: string
  organization_id: string
  name: string
  starts_at: string
  ends_at: string
  status: "OPEN" | "CLOSED" | "LOCKED"
  closed_at: string | null
  closed_by: string | null
}

export interface JournalPostingInput {
  account_id: string
  side: PostingSide
  amount: string | number
  application_id?: string
  funding_id?: string
  commission_id?: string
  bank_transaction_id?: string
  memo?: string
  metadata_payload?: Record<string, unknown>
}

export interface JournalPosting {
  id: string
  journal_entry_id: string
  account_id: string
  side: PostingSide
  amount: string
  currency: string
  application_id: string | null
  funding_id: string | null
  commission_id: string | null
  bank_transaction_id: string | null
  memo: string | null
}

export interface JournalEntryInput {
  organization_id?: string
  idempotency_key: string
  source_type: string
  source_id?: string
  description: string
  currency?: string
  effective_at: string
  metadata_payload?: Record<string, unknown>
  postings: JournalPostingInput[]
}

export interface JournalEntry {
  id: string
  organization_id: string
  period_id: string | null
  entry_number: string
  idempotency_key: string
  source_type: string
  source_id: string | null
  description: string
  currency: string
  effective_at: string
  status: "POSTED" | "VOID"
  posted_at: string
  posted_by: string
  reversal_of_id: string | null
}

export interface TrialBalanceLine {
  account_id: string
  code: string
  name: string
  account_type: AccountType
  debit_total: string
  credit_total: string
  balance: string
}

export interface TrialBalance {
  organization_id: string
  currency: string
  as_of: string
  debit_total: string
  credit_total: string
  balanced: boolean
  accounts: TrialBalanceLine[]
}

export interface JournalListOptions {
  currency?: string
  limit?: number
}

export interface TrialBalanceOptions {
  currency?: string
  asOf?: string
}

function query(values: Record<string, string | number | undefined>): string {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(values)) {
    if (value !== undefined && value !== "") params.set(key, String(value))
  }
  const encoded = params.toString()
  return encoded ? `?${encoded}` : ""
}

export const financeApi = {
  accounts(organizationId?: string, currency?: string): Promise<LedgerAccount[]> {
    return api(
      `/finance/accounts${query({ currency })}`,
      withOrganization(organizationId),
    )
  },

  createAccount(
    input: {
      code: string
      name: string
      account_type: AccountType
      currency?: string
    },
    organizationId?: string,
  ): Promise<LedgerAccount> {
    return api(
      "/finance/accounts",
      withOrganization(organizationId, { method: "POST", body: JSON.stringify(input) }),
    )
  },

  periods(organizationId?: string): Promise<AccountingPeriod[]> {
    return api("/finance/periods", withOrganization(organizationId))
  },

  createPeriod(
    input: {
      name: string
      starts_at: string
      ends_at: string
    },
    organizationId?: string,
  ): Promise<AccountingPeriod> {
    return api(
      "/finance/periods",
      withOrganization(organizationId, { method: "POST", body: JSON.stringify(input) }),
    )
  },

  closePeriod(periodId: string, organizationId?: string): Promise<AccountingPeriod> {
    return api(
      `/finance/periods/${encodeURIComponent(periodId)}/close`,
      withOrganization(organizationId, { method: "POST" }),
    )
  },

  journalEntries(
    organizationId?: string,
    options: JournalListOptions = {},
  ): Promise<JournalEntry[]> {
    return api(
      `/finance/journal-entries${query({
        currency: options.currency,
        limit: options.limit,
      })}`,
      withOrganization(organizationId),
    )
  },

  journalPostings(entryId: string): Promise<JournalPosting[]> {
    return api(`/finance/journal-entries/${encodeURIComponent(entryId)}/postings`)
  },

  postJournal(input: JournalEntryInput): Promise<JournalEntry> {
    const { organization_id: organizationId, idempotency_key: idempotencyKey, ...body } = input
    return api(
      "/finance/journal-entries",
      withOrganization(organizationId, {
        method: "POST",
        body: JSON.stringify(body),
        idempotencyKey,
      }),
    )
  },

  trialBalance(
    organizationId?: string,
    options: TrialBalanceOptions = {},
  ): Promise<TrialBalance> {
    return api(
      `/finance/trial-balance${query({
        currency: options.currency,
        as_of: options.asOf,
      })}`,
      withOrganization(organizationId),
    )
  },
}
