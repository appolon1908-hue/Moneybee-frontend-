import type { PortalGuard } from "@moneybee/auth"

export const portalGuardRequirement: PortalGuard = { membershipType: "BORROWER" }
