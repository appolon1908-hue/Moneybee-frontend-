export type ApiError = { code: string; message: string; correlation_id: string | null; fields: Record<string, string[]> | null }
export const apiBaseUrl = () => import.meta.env.VITE_API_BASE_URL ?? '/api/v2'
