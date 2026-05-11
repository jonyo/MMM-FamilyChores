# MMM-FamilyChores - AI Agent Context

This document provides essential context for AI agents assisting with MMM-FamilyChores development and maintenance.

## Project Overview

This is a standalone MagicMirror² module for family chore tracking, maintained as a separate repository for MMPM community distribution.

## Architecture

### Module Structure

- **Frontend**: TypeScript-based MagicMirror module (`src/frontend/frontend.ts`)
- **Backend**: Node helper for data persistence (`src/backend/node-helper.ts`)
- **Build System**: Vite for both client and node builds
- **Testing**: Vitest with browser mode support
- **Data Storage**: Single JSON file with UUID-based references

### Key Technologies

- **TypeScript**: Strong typing for all data structures
- **Vite**: Fast build system for both frontend and backend
- **Vitest**: Testing framework with browser support
- **Biome**: Linting and formatting
- **UUID v4**: Stable identifiers for people and chores

## AI Agent Rules

### Development Workflow

**ALWAYS run these commands before making changes:**

```bash
pnpm run typecheck    # Verify TypeScript compiles
pnpm run lint         # Check for linting issues
pnpm run test         # Run tests
```

**Build process:**

```bash
pnpm run build          # Build both client and node and copy to root

pnpm run build:client   # Build frontend without copying to root
pnpm run build:node     # Build backend without copying to root
```

### Data Model Rules

**UUID-Based IDs:**

- All people and chores use UUID v4 identifiers
- Names are mutable metadata, IDs are stable references
- Never use names as foreign keys

**State Management:**

- Single `data.json` file contains both config and state
- State updates are atomic to prevent race conditions
- Daily reset at midnight clears `completedToday`
- Rotating chores stay with current person until completed

**Chore Types:**

- `personal`: Fixed assignment, daily reset
- `rotating`: Cycles through rotation list on completion

**Skip Day Visibility:**

- `hide`: Never shows on skip days, no state changes
- `show-if-overdue`: Shows only when not caught up, preserves completion state, no rotation on skip days
- `show-always`: Always shows with checkmark preserved (grace days), no rotation on skip days

### File Structure Rules

**Source Organization:**

```
src/
├── frontend/           # Client-side MagicMirror module
├── backend/            # Node.js helper for data persistence
├── types/              # TypeScript interfaces
└── constants/          # Socket notification constants
```

**Built Files (gitignored):**

- `MMM-FamilyChores.js` - Compiled frontend
- `node_helper.js` - Compiled backend
- `*.js.map` - Source maps

### TypeScript Requirements

**CRITICAL: NEVER USE `any` TYPES - THIS INCLUDES TEST FILES**

- **ABSOLUTELY NO `any` types** anywhere in the codebase - not in production code, not in test files, not anywhere
- Use proper TypeScript interfaces and types for all data structures
- If you think you need `any`, you're wrong - create a proper type instead
- `any` completely defeats the purpose of TypeScript and introduces runtime errors
- This rule is **NON-NEGOTIABLE** - violations will be rejected immediately
- Test files are NOT exempt - they must also use proper typing

**Type Safety:**

- All functions must have explicit return types
- All parameters must have explicit types
- Use generic types where appropriate instead of `any`
- Leverage TypeScript's type inference but provide explicit types when clarity is needed
- Use `unknown` instead of `any` when you must handle values of uncertain types - requires type narrowing before use
- Consider `never` for impossible states, unreachable code paths, or functions that never return

### Testing Requirements

**Before committing:**

1. Run `pnpm run test` - All tests must pass
2. Run `pnpm run typecheck` - TypeScript must compile without errors
3. Run `pnpm run lint` - Code must pass linting

**Test Coverage:**

- State management logic (rotating index, daily reset, skip day visibility)
- Date utilities and deadline calculations
- PIN validation for admin actions
- Config validation and error handling
- Skip day visibility behavior for all enum values
- Goal of as close to 100% coverage as possible

**Mock Management:**

- Test configuration automatically clears all mocks between tests
- Do **NOT** manually call `vi.clearAllMocks()` or similar in `beforeEach`/`afterEach`
- Focus on test setup and assertions rather than mock cleanup

### Configuration Patterns

**Module Config:**

- Use TypeScript interfaces from `src/types/config.ts`
- Validate all configuration values
- Provide sensible defaults

**Data File:**

- Use `data.json` as default location
- Create automatic backups before writes
- Validate data structure on load

### Socket Communication

**Notifications (from constants):**

- `CONFIG_REQUEST`: Frontend requests initial data
- `CONFIG_RESPONSE`: Backend sends configuration and state
- `CHORE_DATA`: Backend sends updated chore data
- `CHORE_TOGGLE`: Toggle chore completion status
- `CHORE_REASSIGN`: Reassign rotating chore
- `CAUGHTUP_RESET`: Admin reset of caughtUp status for a person
- `CHORE_UPDATE_RESULT`, `CHORE_REASSIGN_RESULT`, `CAUGHTUP_RESET_RESULT`: Success responses
- `PIN_ERROR`: Backend reports invalid PIN

**Payload Types:**

- Use proper TypeScript interfaces for all payloads
- Validate incoming data before processing
- Include PIN only for reassign action when required

### Admin Actions

**PIN Protection:**

- Reassign and caughtUp reset actions require valid PIN when configured
- Toggle actions (mark complete/incomplete) do not require PIN
- Validate PIN before performing admin operations
- Return `PIN_ERROR` notification for invalid attempts

**Available Actions:**

- **Toggle**: Mark chore complete/incomplete (no PIN required)
- **Reassign**: Move rotating chore to next person (requires PIN)
- **CaughtUp Reset**: Reset all caughtUp flags to `true` for a person (requires PIN) - useful for vacation returns. **Does NOT rotate** - person picks up at same rotation position.

### CSS and Styling

**MagicMirror Conventions:**

- Use CSS custom properties for theming
- Follow MagicMirror class naming conventions
- Ensure readability on mirror displays

**Responsive Design:**

- Test with different screen sizes
- Ensure touch targets are appropriately sized
- Consider mirror-specific viewing conditions

## Development Commands

### Quick Development Cycle

```bash
pnpm run build          # Build all components
pnpm run test           # Run tests
pnpm run lint           # Check code quality
```

### Testing Commands

```bash
pnpm run test           # Run all tests
pnpm run test:watch     # Watch mode for development
pnpm run test:ci        # CI mode (single run) - same as test
pnpm run test:browser   # Browser-based tests
```

### Code Quality

```bash
pnpm run typecheck      # TypeScript validation
pnpm run lint           # Biome linting
pnpm run fix            # Auto-fix linting issues
```

## Common Tasks

### Adding New Chore Features

1. Update TypeScript interfaces in `src/types/chore-types.ts`
2. Implement logic in `src/backend/node-helper.ts`
3. Update frontend in `src/frontend/frontend.ts`
4. Add tests for new functionality
5. Update documentation

### Modifying State Management

1. Always test state changes with unit tests
2. Ensure atomic updates to prevent race conditions
3. Update data validation if structure changes
4. Test with edge cases (empty data, corrupted files)

### UI Changes

1. Modify `getDom()` method in `src/frontend/frontend.ts`
2. Update CSS in `css/main.css`
3. Test with different data scenarios
4. Ensure accessibility and usability

## Important Notes

### Data Privacy

- Use placeholder names (Alice, Bob, Charlie) in all examples
- Real family names belong only in user's personal config
- Never commit real personal data to the repository

### MMPM Compatibility

- This module is designed for MMPM community distribution
- Follow MagicMirror module conventions
- Maintain clear documentation and examples
- Test with various MagicMirror versions

### Performance Considerations

- Minimize DOM updates in `getDom()`
- Use efficient data structures for state management
- Avoid unnecessary file I/O operations
- Consider memory usage for large families

## Troubleshooting

### Common Issues

- **Build failures**: Check TypeScript compilation first
- **Test failures**: Verify data structure matches interfaces
- **State corruption**: Check file permissions and disk space
- **Display issues**: Verify CSS and DOM structure

### Debugging Steps

1. Check browser console for errors
2. Verify `data.json` structure is valid
3. Test with minimal configuration
4. Check MagicMirror module loading
5. Verify socket communication between frontend and backend

This module prioritizes simplicity and reliability over complex features. When in doubt, choose the simplest solution that meets the requirements.
