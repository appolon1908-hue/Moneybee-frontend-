const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api/v1"

let accessTokenProvider: (() => Promise<string | null>) | null = null

export function configureAccessTokenProvider(
  provider: () => Promise<string | null>,
): void {
  accessTokenProvider = provider
}

export class ApiProblem extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly requestId?: string,
    public readonly fields?: unknown[],
  ) {
    super(message)
  }
}

export type ApiOptions = RequestInit & {
  idempotencyKey?: string
  requestId?: string
}

export async function api<T>(
  path: string,
  options: ApiOptions = {},
): Promise<T> {
  const token = accessTokenProvider ? await accessTokenProvider() : null
  const requestId = options.requestId || crypto.randomUUID()
  const headers = new Headers(options.headers)

  headers.set("Accept", "application/json")
  headers.set("X-Request-ID", requestId)
  if (!(options.body instanceof FormData)) headers.set("Content-Type", "application/json")
  if (token) headers.set("Authorization", "Bearer " + token)
  if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey)

  const response = await fetch(API_BASE_URL + path, {...options, headers})
  if (!response.ok) {
    let problem: Record<string, unknown> = {}
    try {
      problem = await response.json()
    } catch {
      problem = {detail: await response.text()}
    }
    throw new ApiProblem(
      String(problem.detail || problem.title || "Request failed"),
      response.status,
      String(problem.request_id || response.headers.get("X-Request-ID") || requestId),
      Array.isArray(problem.errors) ? problem.errors : undefined,
    )
  }
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}

export function money(value: string | number | null | undefined): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}
