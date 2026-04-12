/**
 * Sanitize a string for use in Content-Disposition filename.
 * Removes characters that could break HTTP headers or be used for injection.
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^\w\s\-_.()]/g, '')  // Keep only safe chars
    .replace(/\s+/g, '_')            // Spaces to underscores
    .slice(0, 200)                   // Limit length
    || 'document'                    // Fallback if empty after sanitization
}
