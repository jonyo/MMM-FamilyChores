/**
 * Validates that an ID contains only safe characters (a-z, 0-9, hyphen)
 * This is a simplified UUID-like validation to prevent injection attacks
 * in URL paths where IDs are used directly.
 *
 * @param id - The ID to validate
 * @returns true if the ID contains only safe characters, false otherwise
 */
export const isValidId = (id: string): boolean => {
  return /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/.test(id);
};

/**
 * Validates an ID and throws an error if it contains unsafe characters
 *
 * @param id - The ID to validate
 * @throws Error if the ID contains unsafe characters
 */
export const validateId = (id: string): void => {
  if (!isValidId(id)) {
    throw new Error(
      `Invalid ID: ${id}. ID must contain only lowercase letters, numbers, and hyphens.`
    );
  }
};
