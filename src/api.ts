import { z } from 'zod'
import { currentUser } from './auth'

const baseUrl = (import.meta.env.VITE_API_BASE_URL || 'https://api.moneybeeloans.com/api/v1').replace(/\/$/, '')

export const ApplicationSchema = z.object({
  id: z.string().uuid(),
  company_name: z.string(),
  contact_name: z.string(),
  email: z.string().email(),
  phone: z.string(),
  requested_amount: z.coerce.number(),
  annual_revenue: z.coerce.number().nullable(),
  status: z.string(),
  owner_subject: z.string(),
  consent_version: z.string(),
  consented_at: z.string(),
  created_at: z.string(),
  updated_at: z.string()
})
export type Application = z.infer<typeof ApplicationSchema>

async function request(path: string, init: RequestInit = {}, authenticated = false): Promise<unknown> {
  const headers = new Headers(init.headers)
  headers.set('Content-Type', 'application/json')
  headers.set('X-Correlation-ID', crypto.randomUUID())
  if (authenticated) {
    const user = await currentUser()
    if (!user) throw new Error('Authentication required')
    headers.set('Authorization', `Bearer ${user.access_token}`)
  }
  const response = await fetch(`${baseUrl}${path}`, { ...init, headers })
  if (!response.ok) {
    const payload = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(typeof payload.detail === 'string' ? payload.detail : `HTTP ${response.status}`)
  }
  if (response.status === 204) return null
  return response.json()
}

export async function createApplication(input: {
  company_name: string
  contact_name: string
  email: string
  phone: string
  requested_amount: number
  annual_revenue?: number
  consent_version: string
  consent_to_terms: true
}): Promise<Application> {
  const payload = await request('/applications', {
    method: 'POST',
    headers: { 'Idempotency-Key': crypto.randomUUID() },
    body: JSON.stringify(input)
  }, true)
  return ApplicationSchema.parse(payload)
}

export async function submitApplication(id: string): Promise<Application> {
  const payload = await request(`/applications/${id}/submit`, { method: 'POST' }, true)
  return ApplicationSchema.parse(payload)
}

export async function getApplication(id: string): Promise<Application> {
  return ApplicationSchema.parse(await request(`/applications/${id}`, {}, true))
}

export async function listApplications(): Promise<Application[]> {
  return z.array(ApplicationSchema).parse(await request('/applications', {}, true))
}

export async function getMe(): Promise<{ subject: string; roles: string[] }> {
  return z.object({ subject: z.string(), roles: z.array(z.string()) }).parse(await request('/me', {}, true))
}
