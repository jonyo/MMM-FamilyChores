export type Config = {
  updateInterval?: number;
  dataFile?: string;
  adminPin?: string | null;
  personFilter?: string | null;
  /**
   * View mode: 'personal' (default) or 'summary'
   */
  viewMode?: 'personal' | 'summary';
  /**
   * Summary view configuration options
   */
  summary?: {
    /**
     * Show incomplete chores section (default: true)
     */
    showIncomplete?: boolean;
    /**
     * Show rotating assignments section (default: true)
     */
    showRotating?: boolean;
    /**
     * Show overdue/behind schedule section (default: true)
     */
    showOverdue?: boolean;
  };
  /**
   * Format: "HH:mm" in 24-hour format, default "03:00"
   */
  dailyResetTime?: string;
};
