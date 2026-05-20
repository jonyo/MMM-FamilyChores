import type { UUID } from './chore-types';
import type { Config } from './config';

/**
 * Payloads for MagicMirror `sendSocketNotification` traffic between the frontend
 * module and `node_helper`. Use with {@link SocketNotifications} in
 * `../constants/socket-notifications`.
 *
 * HTTP admin API bodies are defined in `request-types.ts`.
 * Persisted domain data is defined in `chore-types.ts`.
 */

// --- Frontend → node_helper ---

export interface ChoreTogglePayload {
  /**
   * ID of the chore to toggle
   */
  choreId: UUID;
  /**
   * Whether the chore is completed for today
   */
  completed: boolean;
}

/**
 * Union of payloads the node helper accepts on `socketNotificationReceived`
 * (excluding unknown notifications).
 */
export type NodeHelperIncomingSocketPayload = Config | ChoreTogglePayload;

// --- node_helper → frontend ---

export interface ChoreUpdateResultPayload {
  choreId: UUID;
  completed: boolean;
}
