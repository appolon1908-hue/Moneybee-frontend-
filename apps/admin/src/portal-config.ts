import type { PortalGuard } from "@moneybee/auth"

export const portalGuardRequirement: PortalGuard = {
  membershipType: "MONEYBEE",
  permission: "capability.read",
}
