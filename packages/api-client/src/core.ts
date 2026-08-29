const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v2"

let accessTokenProvider: (() => Promise<string | null>) | null = null
let unauthorizedHandler: (() => Promise<boolean>) | null = null
let organizationIdProvider: (() => string | null) | null = null

export function configureAccessTokenProvider(
  provider: () => Promise<string | null>,
): void {
  accessTokenProvider = provider
}

export function configureUnauthorizedHandler(
  handler: () => Promise<boolean>,
): void {
  unauthorizedHandler = handler
}

export function configureOrganizationIdProvider(
  provider: () => string | null,
): void {
  organizationIdProvider = provider
}

export class ApiProblem extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly requestId?: string,
    public readonly fields?: unknown[],
    public readonly retryable = false,
    public readonly retryAfter?: number,
    public readonly context?: Record<string, unknown>,
  ) {
    super(message)
  }
}

export type ApiOptions = RequestInit & {
  idempotencyKey?: string
  requestId?: string
  correlationId?: string
  expectedVersion?: number | string
}

export interface ApiResponse<T> {
  data: T
  etag: string | null
  requestId: string
}

export type ApiRecoveryAction =
  | "REAUTHENTICATE"
  | "ACCESS_DENIED"
  | "RELOAD_RESOURCE"
  | "RETRY_AFTER"
  | "RETRYABLE_FAILURE"
  | "NONE"

export function recoveryAction(problem: ApiProblem): ApiRecoveryAction {
  if (problem.status === 401) return "REAUTHENTICATE"
  if (problem.status === 403) return "ACCESS_DENIED"
  if (
    problem.status === 428
    || (problem.status === 409 && problem.code === "CONCURRENT_MODIFICATION")
  ) return "RELOAD_RESOURCE"
  if (problem.status === 429) return "RETRY_AFTER"
  if (problem.status >= 500 || problem.retryable) return "RETRYABLE_FAILURE"
  return "NONE"
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  return (await apiResponse<T>(path, options)).data
}

export async function apiResponse<T>(
  path: string,
  options: ApiOptions = {},
  recovered = false,
): Promise<ApiResponse<T>> {
  const token = accessTokenProvider ? await accessTokenProvider() : null
  const requestId = options.requestId || crypto.randomUUID()
  const correlationId = options.correlationId || requestId
  const headers = new Headers(options.headers)

  headers.set("Accept", "application/json")
  headers.set("X-Request-ID", requestId)
  headers.set("X-Correlation-ID", correlationId)
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", "Bearer " + token)
  const organizationId = organizationIdProvider ? organizationIdProvider() : null
  if (organizationId) headers.set("X-Organization-ID", organizationId)
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey)
  if (options.expectedVersion !== undefined) {
    headers.set("If-Match", `"${String(options.expectedVersion).replaceAll('"', "")}"`)
  }

  const response = await fetch(API_BASE_URL + path, {...options, headers})
  if (response.status === 401 && !recovered && unauthorizedHandler && await unauthorizedHandler()) {
    return apiResponse<T>(path, options, true)
  }
  if (!response.ok) {
    let problem: Record<string, unknown> = {}
    try {
      problem = await response.json()
    } catch {
      problem = {detail: await response.text()}
    }
    const nested = problem.error && typeof problem.error === "object"
      ? problem.error as Record<string, unknown>
      : problem.detail && typeof problem.detail === "object"
        ? problem.detail as Record<string, unknown>
        : problem
    const retryAfter = response.headers.get("Retry-After")
    throw new ApiProblem(
      String(nested.detail || nested.message || problem.detail || problem.title || "Request failed"),
      response.status,
      String(nested.code || problem.code || "REQUEST_FAILED"),
      String(problem.request_id || response.headers.get("X-Request-ID") || requestId),
      Array.isArray(problem.errors) ? problem.errors : undefined,
      Boolean(nested.retryable),
      retryAfter && /^\d+$/.test(retryAfter) ? Number(retryAfter) : undefined,
      nested.context && typeof nested.context === "object"
        ? nested.context as Record<string, unknown>
        : undefined,
    )
  }
  const data = response.status === 204
    ? undefined as T
    : await response.json() as T
  return {
    data,
    etag: response.headers.get("ETag"),
    requestId: response.headers.get("X-Request-ID") || requestId,
  }
}

export function money(value: string | number | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}
