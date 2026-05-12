/**
 * UUID v4 generation utilities
 * Implements RFC 4122 UUID version 4
 */

/**
 * Generate a random UUID v4
 * Format: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
 * @returns A new UUID v4 string
 */
export function generateUUID(): string {
  // Get random bytes
  const bytes = new Uint8Array(16);

  // Fill with cryptographically secure random values
  crypto.getRandomValues(bytes);

  // Set version bits to 0100 for UUID v4
  bytes[6] = (bytes[6] & 0x0f) | 0x40;

  // Set variant bits to 10xx
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  // Convert to hex string
  const hex = Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');

  // Insert hyphens at correct positions
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
}

/**
 * Validate if a string is a valid UUID v4
 * @param uuid The string to validate
 * @returns True if valid UUID v4, false otherwise
 */
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

/**
 * Generate a UUID v4 for testing purposes (deterministic)
 * This uses a simple counter for predictable UUIDs in tests
 * @param counter A counter value for deterministic generation
 * @returns A deterministic UUID v4 for testing
 */
export function generateTestUUID(counter: number): string {
  // Create an 8-digit hex counter for the first segment
  const counterHex = counter.toString(16).padStart(8, '0');

  // Use the counter value in decimal for the last segment to match test expectations
  const lastSegment = counter.toString().padStart(12, '0');

  // Construct a deterministic UUID v4 format
  // xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
  return `${counterHex}-0000-4000-8000-${lastSegment}`;
}
