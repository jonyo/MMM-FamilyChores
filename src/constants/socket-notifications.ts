// Socket notification constants for MMM-FamilyChores

export const SocketNotifications = {
  // Frontend to Backend
  CONFIG_REQUEST: 'CONFIG_REQUEST',
  CHORE_TOGGLE: 'CHORE_TOGGLE',

  // Backend to Frontend
  CONFIG_RESPONSE: 'CONFIG_RESPONSE',
  CHORE_DATA: 'CHORE_DATA',
  CHORE_UPDATE_RESULT: 'CHORE_UPDATE_RESULT',
} as const;
