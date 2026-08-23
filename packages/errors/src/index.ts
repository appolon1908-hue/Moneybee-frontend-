export class MoneyBeeError extends Error { constructor(public readonly code: string, message: string) { super(message) } }
