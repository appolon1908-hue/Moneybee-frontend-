import type { CommercialFinancingDisclosure } from "@moneybee/api-client";

export function disclosureCanBeAccepted(
  disclosure: CommercialFinancingDisclosure | null,
): boolean {
  return Boolean(disclosure?.acknowledged_at);
}
