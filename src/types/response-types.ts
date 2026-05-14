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
