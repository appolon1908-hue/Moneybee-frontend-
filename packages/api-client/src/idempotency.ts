import { ApiProblem } from "./core";

export function isAmbiguousCommandFailure(error: unknown): boolean {
  if (!(error instanceof ApiProblem)) return true;
  return Boolean(
    error.retryable
      || error.status >= 500
      || error.status === 408
      || error.status === 425
      || error.status === 429,
  );
}

export class IdempotencyKeyRegistry {
  private readonly keys = new Map<string, string>();

  constructor(
    private readonly createKey: () => string = () => crypto.randomUUID(),
  ) {}

  forOperation(operation: string): string {
    const existing = this.keys.get(operation);
    if (existing) return existing;
    const created = this.createKey();
    this.keys.set(operation, created);
    return created;
  }

  resolve(operation: string): void {
    this.keys.delete(operation);
  }

  recordFailure(operation: string, error: unknown): void {
    if (!isAmbiguousCommandFailure(error)) this.keys.delete(operation);
  }

  peek(operation: string): string | undefined {
    return this.keys.get(operation);
  }
}
