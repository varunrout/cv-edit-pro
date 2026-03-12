/**
 * Generates a unique identifier using crypto.randomUUID() when available,
 * with a fallback for environments where the Crypto API is not accessible.
 */
export function generateId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
