import type { Router, RouteRecordRaw } from "vue-router"
import { AuthRouteView } from "./vue"
import type { MoneyBeeAuthManager } from "./auth-manager"
import { LocalIdentityError } from "./errors"
import { hasMembership, hasPermission } from "./permissions"

export interface PortalGuard {
  membershipType?: "BORROWER" | "LENDER" | "MONEYBEE" | "AFFILIATE"
  permission?: string
}

export function authRoutes(): RouteRecordRaw[] {
  return [
    { path: "/auth/login", component: AuthRouteView, meta: { authAction: "login", public: true } },
    { path: "/auth/register", component: AuthRouteView, meta: { authAction: "register", public: true } },
    { path: "/auth/callback", component: AuthRouteView, meta: { authAction: "callback", public: true } },
    { path: "/auth/silent-callback", component: AuthRouteView, meta: { authAction: "silent-callback", public: true } },
    { path: "/auth/logout", component: AuthRouteView, meta: { authAction: "logout", public: true } },
    { path: "/auth/session-expired", component: AuthRouteView, meta: { authAction: "session-expired", public: true } },
    { path: "/403", component: AuthRouteView, meta: { authAction: "forbidden", public: true } },
  ]
}

export function installPortalGuard(
  router: Router,
  auth: MoneyBeeAuthManager,
  requirement: PortalGuard,
): void {
  router.beforeEach(async (to) => {
    if (to.meta.public === true) return true
    if (!(await auth.isAuthenticated())) {
      return {
        path: await auth.sessionExpired() ? "/auth/session-expired" : "/auth/login",
        query: { returnTo: to.fullPath },
      }
    }
    try {
      const principal = await auth.getLocalPrincipal()
      if (requirement.membershipType && !hasMembership(principal, requirement.membershipType)) {
        return { path: "/403" }
      }
      if (requirement.permission && !hasPermission(principal, requirement.permission)) {
        return { path: "/403" }
      }
      return true
    } catch (error) {
      if (error instanceof LocalIdentityError && error.status === 401) {
        return { path: "/auth/session-expired", query: { returnTo: to.fullPath } }
      }
      return { path: "/403" }
    }
  })
}
