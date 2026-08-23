import { api } from "@moneybee/api-client"

export type CapabilityMap = Readonly<Record<string, boolean>>

export async function loadFeatureCapabilities(): Promise<CapabilityMap> {
  return api<CapabilityMap>("/me/capabilities")
}

export function isFeatureAvailable(
  capabilities: CapabilityMap | null | undefined,
  key: string,
): boolean {
  return capabilities?.[key] === true
}
