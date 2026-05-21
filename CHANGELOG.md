# Changelog

All notable changes to this project will be documented in this file.

## [1.1.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.0.1...v1.1.0) (2026-05-21)

### Changed
- Remove `dataFile` and `updateInterval` config options (breaking change)
  - Data file path is now hardcoded to `data.json` in module directory
  - Users with these options in their config will have them silently ignored
- Move daily reset logic from frontend polling to backend timer
  - Backend now checks for daily reset every 60 seconds
  - When reset occurs, broadcasts updated data to all frontend instances via socket notifications
  - Frontend no longer polls for data updates
- Remove `scheduleUpdate()` method from frontend module

### Fixed
- Add `stop()` method to node helper to properly clean up daily reset timer on module shutdown

## [1.0.1](https://github.com/jonyo/MMM-FamilyChores/compare/v1.0.0...v1.0.1) (2026-05-20)

### Documentation
- Update README with comprehensive documentation
- Add detailed configuration examples for summary view
- Add admin panel screenshots and usage guide
- Add troubleshooting section for common issues
- Document security and privacy considerations

## [1.0.0](https://github.com/jonyo/MMM-FamilyChores/releases/tag/v1.0.0) (2026-05-20)

### Added
- Initial release of MMM-FamilyChores
- Interactive checkbox interface for marking chores complete/incomplete
- Personal chores with daily reset at midnight
- Rotating chores that cycle through family members when completed
- Configurable summary view showing all incomplete chores, rotating assignments, and overdue sections
- Per-person views using `personFilter` option
- Skip days configuration for chores (e.g., weekends)
- Skip day visibility options: hide, show-if-overdue, show-always
- Deadline indicators with overdue badges
- Color-coded person names for visual identification
- Real-time updates via socket notifications
- Single JSON data file for configuration and state persistence
- Full-featured admin panel with web-based UI
  - Manage people (add, edit, delete)
  - Manage chores (add, edit, delete personal and rotating chores)
  - Configure chore deadlines, skip days, and visibility
  - View activity history (2-week completion tracking per person)
  - System actions: advance all rotations, reset caught-up status
  - Backup/restore configuration files
- Optional PIN protection for admin actions
- History tracking with on-time/late detection for chores with deadlines
- MMM-pages integration support for multi-page setups
- TypeScript implementation with strong typing
- Comprehensive test coverage (480 tests)
- SolidJS admin interface with Tailwind CSS v4 styling
