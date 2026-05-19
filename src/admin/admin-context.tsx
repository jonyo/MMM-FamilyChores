import type { Accessor } from 'solid-js';
import { createContext, useContext } from 'solid-js';
import type { FamilyChoresData } from '../types/chore-types';

/**
 * Admin context interface
 * Provides chore data and PIN management functions to child components
 */
export interface AdminContextValue {
  /** Accessor for the chore data (always non-null in consumers) */
  choreData: Accessor<FamilyChoresData>;
  /** Function to refresh data from the API */
  loadData: () => Promise<void>;
  /** Accessor for whether PIN is required */
  pinRequired: Accessor<boolean>;
  /** Request PIN from user (opens modal) */
  requestPin: (
    title: string,
    message: string
  ) => Promise<{ pin: string | null; remember: boolean }>;
  /** Cache PIN for future use (10-minute timeout) */
  cachePin: (pin: string) => void;
  /** Accessor for the cached admin PIN */
  adminPin: Accessor<string>;
}

/**
 * Admin context for sharing data and state across admin panel components
 */
const AdminContext = createContext<AdminContextValue>();

/**
 * Hook to access the admin context
 * Must be used within an AdminContext.Provider
 */
export const useAdminContext = (): AdminContextValue => {
  const context = useContext(AdminContext);
  if (!context) {
    throw new Error('useAdminContext must be used within an AdminContext.Provider');
  }
  return context;
};

export default AdminContext;
