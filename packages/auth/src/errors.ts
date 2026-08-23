export class AuthConfigurationError extends Error {
  readonly code = "AUTH_CONFIGURATION_INVALID"
}

export class LocalIdentityError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
  ) {
    super(message)
  }
}

export function safeReturnTo(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return fallback
  }
  return value
}
