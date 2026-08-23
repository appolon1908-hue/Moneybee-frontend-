import type { LocalPrincipal } from "./session"

export function hasPermission(
  principal: LocalPrincipal | null,
  permission: string,
): boolean {
  return Boolean(
    principal &&
      principal.is_active &&
      (principal.permissions.includes(permission) || principal.permissions.includes("*")),
  )
}

export function hasRole(principal: LocalPrincipal | null, role: string): boolean {
  return Boolean(principal?.is_active && principal.roles.includes(role))
}

export function hasMembership(
  principal: LocalPrincipal | null,
  membershipType: string,
): boolean {
  return Boolean(
    principal?.is_active && principal.membership_types.includes(membershipType),
  )
}
