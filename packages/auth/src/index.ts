export type AuthMode = 'disabled' | 'keycloak'
export const authMode = (): AuthMode => import.meta.env.VITE_AUTH_MODE === 'keycloak' ? 'keycloak' : 'disabled'
