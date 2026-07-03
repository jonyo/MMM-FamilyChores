# Changelog

All notable changes to this project will be documented in this file.

## [1.5.2](https://github.com/jonyo/MMM-FamilyChores/compare/v1.5.1...v1.5.2) (2026-07-03)

### Fixed
- Fixed un-responsive "Add Rotating Chore" button in the Rotation Chores tab

## [1.5.1](https://github.com/jonyo/MMM-FamilyChores/compare/v1.5.0...v1.5.1) (2026-06-29)

### Changed
- In the admin People tab, replace the `+` / `−` accordion toggle with a chevron icon that rotates to show expand/collapse state

### Fixed
- Active tab styling not applied on initial page load — the People tab appeared unselected until you switched away and back

## [1.5.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.4.0...v1.5.0) (2026-06-28)

### Added
- Add a **Time Format** setting (System / 12-hour / 24-hour) in the admin Settings panel — controls how times are displayed throughout the admin panel and on the mirror
- Replace the native time input in chore modals with a dropdown time picker using 30-minute increments; times previously saved at non-30-minute intervals continue to appear correctly as an extra option

### Fixed
- Start time and deadline inputs now work correctly in Safari, which does not support `<input type="time">`
- Changing a start time or deadline to "not set" now correctly clears the value when saving if it was previously set

## [1.4.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.3.2...v1.4.0) (2026-06-20)

### Added
- Reorganize admin panel into tabs: People, Rotating Chores, and System Actions
- Collapse person cards by default in the People tab so the list stays manageable; expand a card to see and edit its chores
- Add optional start time to chores — a chore stays hidden until that time of day, then appears automatically
- Add "Advanced Display Options" section in chore modals with fine-grained control over how a chore behaves:
  - Before start time: hide the chore, or show it anyway if the person is behind
  - After deadline: keep showing normally, highlight as overdue, or move it to the "Earlier chores" section
  - Not caught up: show as overdue or just show normally
  - Skip days: hide, always show, or show only when behind (previously only hide was supported)
- Show a "N more chores start later" indicator when chores are hidden because their start time hasn't been reached yet
- Add an "Earlier chores" collapsed section in personal view for chores whose deadline has passed, so they're out of the way but still accessible
- Chores only move to "Earlier chores" a few seconds after you stop checking things off, so the list doesn't jump around while you're busy
- Show start time alongside deadline in the admin chore list
- Add clear buttons to the start time and deadline fields in chore modals
- Older data files are automatically upgraded with sensible defaults for the new display options

### Changed
- Skip day visibility setting moved into the new Advanced Display Options section in chore modals

## [1.3.2](https://github.com/jonyo/MMM-FamilyChores/compare/v1.3.1...v1.3.2) (2026-06-16)

### Fixed
- Fix chores hidden on a skip day not reappearing after midnight without restarting MagicMirror

## [1.3.1](https://github.com/jonyo/MMM-FamilyChores/compare/v1.3.0...v1.3.1) (2026-05-28)

### Fixed
- Fix admin page scrolling back to top after deleting a person or chore
- Socket data updates now diff only what changed instead of replacing everything, preventing the full-display "reload flash" that was especially noticeable with CSS transition effects

## [1.3.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.2.1...v1.3.0) (2026-05-25)

### Changed
- Rewrote the MagicMirror display frontend using SolidJS, splitting it from a single monolithic file into focused components for improved reliability and easier future development (no visible change for users)

## [1.2.1](https://github.com/jonyo/MMM-FamilyChores/compare/v1.2.0...v1.2.1) (2026-05-24)

### Fixed
- Use a two-column layout for chores in wide MagicMirror regions to reduce vertical space when many chores are displayed
- Fix glitchy visual cycling on touchscreens when tapping chore checkboxes

## [1.2.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.1.0...v1.2.0) (2026-05-22)

### Added
- Add contextual help descriptions for skip day visibility options in chore modals
- Hide skip day visibility selector when no skip days are configured for a chore
- Add tooltip to the deadline field explaining overdue behavior

### Fixed
- Fix tooltip for adding people being clipped off-screen

## [1.1.0](https://github.com/jonyo/MMM-FamilyChores/compare/v1.0.1...v1.1.0) (2026-05-21)

### Changed
- **Breaking:** Remove `dataFile` and `updateInterval` config options — if you have these in your `config.js` they will be silently ignored
- Daily chore reset now happens automatically at midnight without requiring MagicMirror to poll for updates

### Documentation
- Add update instructions to README
- Add CODE_OF_CONDUCT.md

## [1.0.1](https://github.com/jonyo/MMM-FamilyChores/compare/v1.0.0...v1.0.1) (2026-05-20)

### Documentation
- Comprehensive README with configuration examples, admin panel guide, and troubleshooting section

## [1.0.0](https://github.com/jonyo/MMM-FamilyChores/releases/tag/v1.0.0) (2026-05-20)

### Added
- Initial release of MMM-FamilyChores
- Interactive checkboxes for marking chores complete, with automatic daily reset at midnight
- Personal chores assigned to specific family members
- Rotating chores that cycle to the next person when completed
- Summary view showing all incomplete chores, rotating assignments, and overdue chores
- Per-person view using the `personFilter` config option
- Skip days so chores can be configured to not appear on certain days of the week
- Deadline indicators that highlight overdue chores
- Color-coded names for easy visual identification
- Admin panel for managing people and chores without editing config files
  - Add, edit, and delete people and chores
  - Configure deadlines, skip days, and visibility options
  - View two weeks of completion history per person
  - System actions: advance all rotations, reset caught-up status, backup/restore data
- Optional PIN protection for admin actions
- MMM-pages integration support for multi-page mirror setups
