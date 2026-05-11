# MMM-FamilyChores

> **⚠️ Work in Progress** - This module is currently under development. We're working toward a stable 1.0 release with all core features implemented and tested. Early adopters are welcome to try it out, but expect changes and potential issues.

A TypeScript-based MagicMirror² module for family chore tracking with personal daily chores, rotating daily chores that cycle through family members, and a summary view.

## Current Features

- **Personal Chores**: Daily tasks assigned to specific family members that reset at midnight
- **Rotating Chores**: Shared tasks that cycle through family members when completed
- **Flexible Display**: Per-person views or summary view showing all incomplete chores
- **Deadline Indicators**: Visual warnings when chores are past due (normal → yellow → strikethrough)
- **Mark as Complete**: Click to mark chores as complete directly from the mirror (with undo option)
- **Skip Days**: Configure chores to skip specific days (e.g., weekends)
- **State Persistence**: Single JSON file stores all configuration and current state

## Planned Roadmap

_Note: This roadmap represents current plans and priorities. Features may be added, removed, or modified based on user feedback and development considerations._

- **Admin Interface**: Web-based UI for managing people and chores
- **PIN-Protected Reassignment**: Admin-only function to reassign rotating chores from the mirror
- **Activity History**: View who completed which chores and when
- **Backup/Restore**: Download and upload configuration files

## Intentionally _Not_ Included

- **Advanced Scheduling**: This module focuses on daily chores with basic features like skip days. For complex scheduling needs, consider using this alongside a calendar module for the more complex "every other Monday" or "monthly" chores.

- **Reward System**: Focused on simple chore tracking rather than gamification. Provides visual indicators for overdue tasks but doesn't track completion history or award rewards. Designed as a straightforward reminder system with rotating chore assignments.

- **Security**: Designed for private home environments only. The PIN protection provides minimal deterrence but stores PIN in plain text. Not suitable for public/shared environments.

## Installation

1. Clone this repository into your MagicMirror modules folder:

   ```bash
   cd ~/MagicMirror/modules
   git clone https://github.com/jonyo/MMM-FamilyChores.git
   ```

2. Add the module to your MagicMirror config (see Configuration section below)

That's it! The module includes all necessary dependencies in the bundled JavaScript files.

## Configuration

### Basic Options

| Option           | Type   | Default       | Description                                 |
| ---------------- | ------ | ------------- | ------------------------------------------- |
| `dataFile`       | string | `'data.json'` | Path to data file relative to module folder |
| `updateInterval` | number | `60000`       | Update interval in milliseconds             |
| `adminPin`       | string | `null`        | PIN for admin actions (reassign, undo)      |

### Display Modes

#### Per-Person View

Show only one person's personal chores plus their current rotating assignments:

```javascript
{
  module: 'MMM-FamilyChores',
  position: 'middle_center',
  header: "Alice's Chores",
  config: { personFilter: 'alice' }
}
```

#### Summary View

Show all incomplete chores and rotating assignments:

```javascript
{
  module: 'MMM-FamilyChores',
  position: 'middle_center',
  header: 'Family Chores',
  config: { viewMode: 'summary' }
}
```

#### Hybrid View

Mix per-person and summary views:

```javascript
// Alice gets her own page
{
  module: 'MMM-FamilyChores',
  config: { personFilter: 'alice' },
  classes: 'alice-page'
},
// Bob and Charlie share a summary page
{
  module: 'MMM-FamilyChores',
  config: { viewMode: 'summary', excludePerson: 'alice' },
  classes: 'others-page'
}
```

## Data File Structure

The module uses a single `data.json` file for all configuration and state. The file contains people, chores, and current tracking information. You can edit this file directly or use the admin interface when available.

The data structure uses stable identifiers internally, so you can rename people or chores without breaking the configuration.

### Chore Types

#### Personal Chores

- Fixed assignment to one person
- Reset daily at midnight
- Always visible (unless completed for the day)

#### Rotating Chores

- Cycle through specified people in order
- Only advance when marked complete
- Stay with current person until completed

### Optional Chore Settings

- `deadline`: Time in 24-hour format (`"08:00"`, `"21:00"`)
- `skipDays`: Array of day names to skip (`["saturday", "sunday"]`)
- `skipDayVisibility`: How to handle display on skip days (`"hide"`, `"show-if-overdue"`, `"show-always"`)

## Behavior

### Deadline Indicators

- **Normal**: Current time before deadline
- **Yellow**: Past deadline but not completed
- **Strikethrough**: Completed (clickable to uncheck)

### Skip Days

Chores behavior on skip days depends on the `skipDayVisibility` setting:

- **`"hide"`**: Chore never appears on skip days, no state changes
- **`"show-if-overdue"`**: Shows only if not caught up (overdue), preserves `completedToday` state, no rotation on skip days
- **`"show-always"`**: Always shows with checkmark preserved (grace days), no rotation on skip days

Rotating chores pause until the next valid day.

### Daily Reset

At midnight, all `completedToday` entries are cleared, making personal chores available again.

### Mirror Interactions

- **Mark Complete/Incomplete**: Anyone can check/uncheck chores without a PIN (UI not yet implemented)
- **Admin Actions on Mirror**: When `adminPin` is configured, reassign rotating chores to next person in rotation (backend implemented, UI not yet available)

## Development

This module is written in TypeScript and uses Vite for building.

### Prerequisites

- Node.js 24+ (for development)
- pnpm (for dependency management) - see https://pnpm.io/installation

### Setup Development Environment

```bash
git clone https://github.com/jonyo/MMM-FamilyChores.git
cd MMM-FamilyChores
pnpm install
```

### Available Scripts

```bash
pnpm run build          # Build TypeScript to JavaScript
pnpm run build:client   # Build frontend module
pnpm run build:node     # Build node helper
pnpm run typecheck      # Type checking without emitting
pnpm run lint           # Run Biome linter
pnpm run fix            # Auto-fix linting issues
pnpm run test           # Run tests
pnpm run test:watch     # Run tests in watch mode
pnpm run test:ci        # Run tests for CI
```

### File Structure

```
src/
├── frontend/
│   ├── frontend.ts             # Module definition
│   ├── register-frontend.ts    # Module registration
│   └── frontend.test.ts        # Frontend tests
├── backend/
│   ├── node-helper.ts          # Node helper for data persistence
│   └── node-helper.test.ts     # Backend tests
├── types/
│   ├── module.ts               # MagicMirror module types
│   ├── config.ts               # Configuration types
│   └── chore-types.ts          # Data structure types
└── constants/
    └── socket-notifications.ts # Socket notification constants
```

## Contributing

Contributions are welcome! This is a side project, so please understand that response times may vary.

### How to Contribute

See [CONTRIBUTING.md](CONTRIBUTING.md) for detailed contribution guidelines.

## License

MIT License - see LICENSE file for details.

## Support

If you encounter issues:

1. Check existing issues in the repository
2. Include MagicMirror version, browser, and steps to reproduce
3. Screenshots help!

## Acknowledgments

Built for the MagicMirror² community. Special thanks to all contributors who make smart mirrors smarter.
