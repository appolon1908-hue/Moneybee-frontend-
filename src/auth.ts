import { UserManager, WebStorageStateStore, type User } from 'oidc-client-ts'

const canonicalAuthority = 'https://auth.codestra.co/realms/codestra'
const authority = import.meta.env.VITE_OIDC_AUTHORITY || canonicalAuthority
if (authority.replace(/\/$/, '') !== canonicalAuthority) throw new Error('Only the canonical Codestra identity issuer is permitted')

export const userManager = new UserManager({
  authority,
  client_id: import.meta.env.VITE_OIDC_CLIENT_ID || 'moneybee-web',
  redirect_uri: import.meta.env.VITE_OIDC_REDIRECT_URI || `${window.location.origin}/auth/callback`,
  post_logout_redirect_uri: import.meta.env.VITE_OIDC_POST_LOGOUT_REDIRECT_URI || `${window.location.origin}/`,
  response_type: 'code',
  scope: 'openid profile email',
  userStore: new WebStorageStateStore({ store: window.sessionStorage })
})

export async function currentUser(): Promise<User | null> {
  const user = await userManager.getUser()
  return user && !user.expired ? user : null
}

export async function login(returnTo = '/'): Promise<void> {
  await userManager.signinRedirect({ state: { returnTo } })
}

export async function logout(): Promise<void> {
  await userManager.signoutRedirect()
}

export function roles(user: User | null): string[] {
  const profile = user?.profile as Record<string, unknown> | undefined
  const realmAccess = profile?.realm_access as { roles?: string[] } | undefined
  return realmAccess?.roles ?? []
}

export type { User } from 'oidc-client-ts'
