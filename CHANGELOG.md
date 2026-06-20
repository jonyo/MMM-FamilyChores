# Changelog

All notable changes to this project will be documented in this file.

## [1.4.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.3.2...v1.4.0) (2026-06-20)

### Added
- Add optional `startTime` field to chores so chores can stay hidden until a specific time
- Add "Advanced Display Options" accordion to chore modals with:
  - `beforeStartTimeVisibility`: hide or show not-caught-up chores before `startTime`
  - `afterDeadlineVisibility`: show normally, show as overdue, or move to "Earlier chores" after `deadline`
  - `notCaughtUpDisplay`: show not-caught-up chores as overdue or normal
  - `skipDayVisibility`: hide, always show, or show if overdue on skip days
- Add dynamic InfoBox descriptions with styled info icon for each Advanced Display Options setting
- Add `Earlier chores` collapsed section in personal view for chores whose deadline has passed; completed chores move there automatically and incomplete chores with "Move to earlier chores" move there too
- Add shared 5-second debounce after the last check/uncheck before moving chores into the "Earlier chores" section so the UI does not shift while the user is interacting
- Add `data-upgrade.ts` module to safely fill default values for missing display-option fields in older `data.json` files
- Add validation for `startTime` format and enforce `startTime < deadline` when both are set
- Add clear buttons to start time and deadline inputs in chore modals
- Show `startTime` alongside `deadline` in admin chore lists
- Add tests for `DisplayOptionsSection` component covering dynamic option descriptions

### Changed
- Move skip day visibility setting into the Advanced Display Options accordion

## [1.3.2](https://github.com/jonyo/MMM-FamilyChores/compare/v1.3.1...v1.3.2) (2026-06-16)

### Fixed
- Fix skip-day chores not reappearing after midnight if MagicMirror had not restarted — `todaysDayOfWeek` is now a reactive signal in the Solid store rather than a plain value read inside memos, so day rollovers trigger a proper re-render without a restart
- Update `todaysDayOfWeek` atomically alongside chore data on every `CHORE_DATA` socket message, eliminating any in-between state at midnight when the backend reset and frontend day signal update in sequence
- Fix `frontend.test.tsx` not being picked up by the Vitest browser project (glob was `*.test.ts`, not `*.test.tsx`)
- Fix `postAdvanceRotations` 503 test using `toISOString()` for yesterday's date (UTC-based, wrong in negative-offset timezones) — replaced with `getLocalDateString()`

## [1.3.1](https://github.com/jonyo/MMM-FamilyChores/compare/v1.3.0...v1.3.1) (2026-05-28)

### Fixed
- Fix admin page scrolling back to top after deleting a person or chore by switching from a single signal to a `createStore` + `reconcile` so SolidJS diffs the updated data instead of recreating all DOM nodes
- Apply the same `createStore` + `reconcile` pattern to the frontend module so socket-pushed data updates are diffed rather than replaced, preserving DOM identity for unchanged chore items

## [1.3.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.2.1...v1.3.0) (2026-05-25)

### Changed
- Rewrite frontend from string-template rendering to SolidJS component tree
  - Extract chore filtering logic into pure `chore-filters.ts` utility module
  - Create SolidJS components: `app.tsx`, `chore-item.tsx`, `personal-view.tsx`, `summary-view.tsx`, `rotating-chore-inline.tsx`, `overdue-by-person.tsx`, `incomplete-by-person.tsx`
  - Convert `frontend.ts` to thin MagicMirror glue module `frontend.tsx` that mounts Solid `<App>` once and forwards socket payloads into reactive signals
  - Update Vite client config to use `vite-plugin-solid` with `.tsx` entry point
  - Migrate frontend tests from monolithic `frontend.test.ts` to component-level `frontend.test.tsx`

## [1.2.1](https://github.com/jonyo/MMM-FamilyChores/compare/v1.2.0...v1.2.1) (2026-05-24)

### Fixed
- Use two-column layout for chores in wide MagicMirror regions to reduce vertical space when many chores are displayed
- Remove hover/focus/active state transitions from chore items and checkboxes to prevent glitchy visual cycling on touchscreens

## [1.2.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.1.0...v1.2.0) (2026-05-22)

### Added
- Add contextual help descriptions for skip day visibility options in chore modals
- Hide skip day visibility selector when no skip days are configured
- Add tooltip to deadline field in chore modals explaining that chores turn yellow after the deadline and that chores not done the previous day also show as overdue automatically
- Add reusable `HelpIcon` component (styled question-mark circle with tooltip) and replace all emoji/character info icons in the admin panel with it

### Fixed
- Align the tooltip for adding people so it is not clipped

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

### Documentation
- Add repository field to package.json
- Add update section to README.md with git pull instructions
- Add CODE_OF_CONDUCT.md file
- Replace `git checkout` with `git switch` in CONTRIBUTING.md (modern git command)
- Fix typos: Magic Mirror → MagicMirror² in admin.tsx and chore-history-modal.tsx

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
