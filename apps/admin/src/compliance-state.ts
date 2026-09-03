import type { CompliancePage } from "@moneybee/api-client";

export function emptyPage<T>(limit: number): CompliancePage<T> {
  return {
    items: [],
    total: 0,
    limit,
    offset: 0,
    has_more: false,
  };
}

export function previousPageOffset<T>(page: CompliancePage<T>): number {
  return Math.max(0, page.offset - page.limit);
}

export function nextPageOffset<T>(page: CompliancePage<T>): number {
  return page.has_more ? page.offset + page.limit : page.offset;
}

export function pageSummary<T>(page: CompliancePage<T>): string {
  if (page.total === 0) return "0 records";
  const first = page.offset + 1;
  const last = Math.min(page.total, page.offset + page.items.length);
  return `${first}–${last} of ${page.total}`;
}

export function isCurrentRefresh(
  startedGeneration: number,
  currentGeneration: number,
): boolean {
  return startedGeneration === currentGeneration;
}
