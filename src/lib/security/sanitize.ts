// Input sanitization utilities for server actions
// Uses regex-based HTML stripping (React auto-escapes on render, so DOMPurify not needed)

const HTML_TAG_REGEX = /<[^>]*>/g
const DEFAULT_MAX_LENGTH = 10000

/**
 * Sanitize a text string: strip HTML tags, trim whitespace, limit length
 * @param input - Raw user input
 * @param maxLength - Maximum allowed length (default: 10000)
 */
export function sanitizeText(input: string, maxLength = DEFAULT_MAX_LENGTH): string {
  if (!input || typeof input !== 'string') return ''

  return input
    .replace(HTML_TAG_REGEX, '')
    .trim()
    .slice(0, maxLength)
}

/**
 * Apply sanitizeText to specified string fields of an object
 * Non-string fields and fields not in the list are passed through unchanged
 * @param obj - Object with fields to sanitize
 * @param fields - Array of field names to sanitize
 * @param maxLength - Optional max length per field
 */
export function sanitizeObject<T extends Record<string, unknown>>(
  obj: T,
  fields: (keyof T)[],
  maxLength = DEFAULT_MAX_LENGTH
): T {
  const result = { ...obj }

  for (const field of fields) {
    const value = result[field]
    if (typeof value === 'string') {
      ;(result as Record<string, unknown>)[field as string] = sanitizeText(value, maxLength)
    }
  }

  return result
}
