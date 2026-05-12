export type Config = {
  updateInterval?: number;
  dataFile?: string;
  adminPin?: string | null;
  personFilter?: string | null;
  /**
   * Format: "HH:mm" in 24-hour format, default "03:00"
   */
  dailyResetTime?: string;
};
