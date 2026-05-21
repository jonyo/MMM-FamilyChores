export type Config = {
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
     * Show overdue section (default: true)
     */
    showOverdue?: boolean;
    /**
     * Custom titles for summary sections
     */
    incompleteTitle?: string;
    rotatingTitle?: string;
    overdueTitle?: string;
  };
};
