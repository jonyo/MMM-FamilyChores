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
- **Biome**: Primary linting and formatting
- **ESLint**: Reactivity error detection only
- **UUID v4**: Stable identifiers for people and chores

## AI Agent Rules

### Comment Style Guide (IMPORTANT)

**Follow these comment formatting rules for consistency:**

**Inline Comments:**

- Place inline comments (`// comment`) **above** the code they describe, not on the same line
- Use for implementation details, "why" explanations, temporary notes, or non-essential context
- Avoid for API documentation or hover information - use JSDoc instead

**JSDoc Comments:**

- Use JSDoc format (`/** comment */`) for interfaces, types, properties, and functions
- Use for API documentation, property descriptions, parameter/return types, or any information useful when hovering over a "thing"

**Decision Framework:**
Ask yourself: "Is this information useful to know about this specific property/function/interface when I hover over it elsewhere?"

- **YES** → Use JSDoc
- **NO** (implementation detail) → Use inline comment

### Development Workflow

**ALWAYS run these commands before making changes:**

```bash
pnpm run typecheck    # Verify TypeScript compiles
pnpm run lint         # Run Biome (primary) and ESLint (reactivity errors)
pnpm run test         # Run tests
```

**CRITICAL: Before committing changes, you MUST:**

```bash
pnpm run build          # Build both client and node and copy to root
git add .               # Add ALL changes including built files
git commit -m "message" # Commit
```

**This is NON-NEGOTIABLE:** Built files (`MMM-FamilyChores.js`, `node_helper.js`, `public/admin.js`, and their source maps) MUST be committed. The module will not work for users without these built files. Never commit source changes without also committing the corresponding built files.

**Build process:**

```bash
pnpm run build          # Build both client and node and copy to root

pnpm run build:client   # Build frontend without copying to root
pnpm run build:node     # Build backend without copying to root
```

### Commit Standards

**Please follow Conventional Commits format**: `type(scope): description`

**Types**: `feat`, `fix`, `refactor`, `docs`, `style`, `chore`, `test`

**Examples**:

- `fix(admin): use getLocalDayName helper in isSkipDay function`
- `feat(types): add skip day visibility enum`
- `refactor(backend): extract date utilities to separate module`
- `chore(deps): update biome to v2.4.14`
- `test(api): add coverage for people CRUD operations`

**Guidelines**:

- Use lowercase for types and scope
- Scope should be specific to the area changed (e.g., `admin`, `frontend`, `backend`, `types`, `utils`)
- Description should be a concise summary of what changed and why
- Focus on the "what" and "why" rather than the "how"

If the pre-commit hook fails: `pnpm fix && pnpm build && git add . && git commit -m "your message"`

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

**Naming Conventions:**

- **ALL filenames must use kebab-case** (e.g., `person-modal.tsx`, NOT `PersonModal.tsx`)
- This applies to component files, utility files, and any new source files
- Biome linter will enforce this - violations will cause lint errors
- Examples: `personal-chore-modal.tsx`, `rotating-chore-modal.tsx`, `admin-helper.ts`
- ONLY exception: files needing to be uppercase for technical reasons, like the built files used by Magic Mirror

**Source Organization:**

```
src/
├── frontend/           # Client-side MagicMirror module
├── backend/            # Node.js helper for data persistence
├── admin/              # SolidJS admin interface (kebab-case filenames)
├── types/              # TypeScript types (`chore-types`, `config`, `module`, `request-types`, `response-types`, `socket-payload-types`)
├── constants/          # Socket notification constants
└── utils/              # Utility functions (date, uuid, HTML escaping for display)
```

**Built Files:**

- `MMM-FamilyChores.js` - Compiled frontend
- `node_helper.js` - Compiled backend
- `*.js.map` - Source maps

Note: These files are committed so that the module works out of the box without needing to run the build process. Be sure to run `pnpm build` before committing any changes to ensure the built files are up to date.

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

### SolidJS Best Practices

**Component Pattern:**

- Use the arrow function Component pattern for all SolidJS components:
  ```typescript
  export const MyComponent: Component<MyComponentProps> = (props) => {
    // component logic
    return <div>{...}</div>;
  };
  ```
- Define props interfaces explicitly with proper TypeScript types
- Import `Component` as a type from solid-js: `import type { Component } from 'solid-js';`

**Reactive Primitives:**

- Use `createSignal` for reactive state
- Use `createMemo` for computed values that derive from signals
- Use `For` for lists instead of array.map for proper reactivity
- Use `Show` for conditional rendering instead of `{condition && <Component />}` to ensure proper reactive lifecycle
- Avoid non-null assertions (`!`) - use optional chaining or proper type guards instead

**API Client Pattern:**

- Extract API calls into separate TypeScript files using arrow functions
- Split API client into multiple files by domain (e.g., `client.ts`, `people.ts`, `chores.ts`)
- Use barrel export pattern in `index.ts` to re-export from domain files
- Centralize fetch response handling in a shared `handleResponse` function
- Use proper TypeScript request/response types from `src/types/request-types.ts`
- Import enums as values (not types) when used in request bodies

**Example API Structure:**

```
src/api/
├── client.ts      # Base URL and handleResponse
├── people.ts      # Person CRUD operations
├── chores.ts      # Chore CRUD operations
└── index.ts       # Barrel exports
```

### Testing Requirements

**Before committing:**

1. Run `pnpm run test` - All tests must pass
2. Run `pnpm run typecheck` - TypeScript must compile without errors
3. Run `pnpm run lint` - Code must pass both Biome (primary) and ESLint (reactivity errors)
4. Run `pnpm run build` - Verify build succeeds (maintainers will build and commit releases)

**Test Coverage:**

- State management logic (rotating index, daily reset, skip day visibility)
- Date utilities and deadline calculations
- PIN validation for admin actions
- Config validation and error handling
- Skip day visibility behavior for all enum values
- UUID generation and validation utilities
- API client functions (people.ts, chores.ts)
- Modal components (person-modal, personal-chore-modal, rotating-chore-modal)
- Goal of as close to 100% coverage as possible

**Mock Management:**

- Test configuration automatically clears all mocks between tests
- Do **NOT** manually call `vi.clearAllMocks()` or similar in `beforeEach`/`afterEach`
- Focus on test setup and assertions rather than mock cleanup

**Test File Organization:**

- Each source file should have its own test file: `file.ts` → `file.test.ts` or `file.test.tsx`
- Test files should focus only on testing the corresponding source file
- Do not test multiple components in a single test file unless they are tightly coupled
- Keep tests co-located with the code they test for easier maintenance

**UI Testing with Browser Mode:**

- UI components should be tested using browser mode (real browser via Playwright)
- **DO NOT mock DOM properties or browser APIs unnecessarily** - use the real browser
- Instead of mocking element dimensions, set styles directly on rendered elements to achieve the desired state
- Instead of mocking scroll positions, render content that produces the scrollable state you need to test
- Test the actual rendered output, not mocked abstractions
- This approach catches real integration issues that mocking would hide

**SolidJS Testing Library for Admin/Modal Tests:**

- Use `render` from `@solidjs/testing-library` for SolidJS component testing in browser mode
- **CRITICAL**: The browser project in vitest.config.ts MUST include `solidPlugin()` in the plugins array for JSX to work
- Import CSS files in test files using relative path: `import '../../public/admin.css';`
- **DO NOT use `fireEvent`** from testing libraries - it's meant for fake DOM and uses JS to dispatch events
- Use `page` from `vitest/browser` for browser mode interactions - it works with Playwright to mimic real user actions
- The testing library's render handles container creation and cleanup automatically
- Remove manual DOM cleanup (`document.body.innerHTML = ''`) - testing library handles this
- Remove manual `afterEach` with `vi.clearAllMocks()` - test configuration handles mock cleanup automatically

**API Testing:**

- API functions should be tested in node environment (not browser)
- Mock `globalThis.fetch` to test HTTP requests without real network calls
- Test success paths, error responses, and network failures
- Verify request bodies and URLs are constructed correctly
- Test with proper TypeScript request/response types

**Vitest Configuration:**

- Node tests: Backend logic, utilities, API functions
- Browser tests: Frontend components, UI interactions, modal components
- Admin tests currently disabled due to browser import issues (CSS imports)
- Test files are automatically included based on pattern matching in vitest.config.ts

### Configuration Patterns

**Module Config:**

- Use TypeScript interfaces from `src/types/config.ts`
- Validate all configuration values
- Provide sensible defaults
- **View Modes**: Support both `'personal'` (default) and `'summary'` view modes
- **Summary Configuration**: Use `summary` object with `showIncomplete`, `showRotating`, `showOverdue` boolean flags to control section visibility in summary view mode
- **Display Options**: `personFilter` for per-person views, `viewMode: 'summary'` for organized summary sections

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

## Important Notes

### Data Privacy

- Use placeholder names (Alice, Bob, Charlie) in all examples
- Real family names belong only in user's personal config
- Never commit real personal data to the repository

### Design Philosophy

This module prioritizes simplicity and reliability over complex features. When in doubt, ask the user.
