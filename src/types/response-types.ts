/**
 * JSON bodies for **failed** responses from the Express admin routes in
 * `setupAdminRoutes` (node_helper). Every 4xx / 5xx handler that responds with
 * JSON uses this shape today.
 *
 * Request bodies live in `request-types.ts`. Success payloads are route-specific
 * (e.g. `Person`, `Chore`, `FamilyChoresData`) until the admin client is typed
 * end-to-end.
 */

export interface ApiErrorBody {
  error: string;
}

/**
 * Success response body for POST /advance-rotations
 */
export interface AdvanceRotationsResponse {
  success: true;
  /** Number of chores that were advanced */
  advanced: number;
}

/**
 * Success response body for POST /reset-caught-up
 */
export interface ResetCaughtUpResponse {
  success: true;
  /** Number of chores that were reset */
  reset: number;
}
