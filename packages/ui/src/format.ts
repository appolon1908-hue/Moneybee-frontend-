/**
 * Turns a SNAKE_CASE or kebab-case status/category code into readable text.
 * Preserves case exactly as before (callers were doing this inline with
 * `.replaceAll("_", " ")` across at least 8 views) - CSS text-transform,
 * not this function, decides display casing.
 */
export function humanize(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ")
}
