import { api } from "./core"
import { ENDPOINTS } from "./endpoints"

export type BankAccount = {
  id: string
  connection_id: string
  name: string
  official_name: string | null
  mask: string | null
  account_type: string | null
  subtype: string | null
  current_balance: number | null
  available_balance: number | null
  currency: string | null
  active: boolean
}

export type BankAnalysis = {
  average_monthly_deposits: number | null
  average_daily_balance: number | null
  negative_balance_days_90d: number
  nsf_count_90d: number
  deposit_count_90d: number
  largest_deposit_90d: number | null
  revenue_trend: string | null
  risk_flags: string[]
}

export type LinkSession = {
  provider: string
  link_token: string
  expiration?: string
}

export const bankingApi = {
  createLinkSession(applicationId: string) {
    return api<LinkSession>(
      ENDPOINTS.applications.bankLinkSession(applicationId),
      {method: "POST"},
    )
  },

  exchange(applicationId: string, publicToken: string) {
    return api(
      ENDPOINTS.applications.bankExchange(applicationId),
      {
        method: "POST",
        body: JSON.stringify({public_token: publicToken}),
      },
    )
  },

  sync(applicationId: string) {
    return api(
      ENDPOINTS.applications.bankSync(applicationId),
      {method: "POST"},
    )
  },

  accounts(applicationId: string) {
    return api<BankAccount[]>(
      ENDPOINTS.applications.bankAccounts(applicationId),
    )
  },

  analysis(applicationId: string) {
    return api<BankAnalysis | null>(
      ENDPOINTS.applications.bankAnalysis(applicationId),
    )
  },
}
