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
- This improves readability and follows personal preference
- **Use for**: Implementation details, "why" explanations, temporary notes, or non-essential context
- **Avoid for**: API documentation or hover information about "what it is" - use JSDoc instead

**Examples of good inline comments:**

```typescript
// we do it this way so XYZ doesn't break
const config = { ... };

// This is a temporary workaround for bug #123
const tempValue = getWorkaround();

// Use local date for comparison (implementation detail)
const resetDate = getLocalDate();
```

**JSDoc Comments:**

- Use JSDoc format (`/** comment */`) for interfaces, types, properties, and functions
- This enables hover information in IDEs and provides better documentation
- **Use for**: API documentation, property descriptions, parameter/return types, or any information useful when hovering over a "thing"

**Examples of when to use JSDoc:**

```typescript
export interface Config {
  /**
   * Format: "HH:mm" in 24-hour format, default "03:00"
   */
  dailyResetTime?: string;
}

/**
 * This is the id for XYZ that follows Foo Bar best practices
 */
export const XYZ_ID = "xyz-123";
```

**Decision Framework:**
Ask yourself: "Is this information useful to know about this specific property/function/interface when I hover over it elsewhere?"

- **YES** → Use JSDoc
- **NO** (implementation detail) → Use inline comment

**Examples:**

✅ **CORRECT:**

```typescript
// Use local date for comparison
const resetDate = getLocalDate();

export interface Config {
  /**
   * Format: "HH:mm" in 24-hour format, default "03:00"
   */
  dailyResetTime?: string;
}
```

❌ **WRONG:**

```typescript
const resetDate = getLocalDate(); // Use local date for comparison

export interface Config {
  dailyResetTime?: string; // Format: "HH:mm" in 24-hour format, default "03:00"
}
```

### Development Workflow

**ALWAYS run these commands before making changes:**

```bash
pnpm run typecheck    # Verify TypeScript compiles
pnpm run lint         # Run Biome (primary) and ESLint (reactivity errors)
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

Note: These files are committed so that the module works out of the box without needing to run the build process.

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
- Use `Component<Record<string, never>>` for components with no props (not `Component = () => {}`)
- Import `Component` as a type from solid-js: `import type { Component } from 'solid-js';`

**Reactive Primitives:**

- Use `createSignal` for reactive state
- Use `createMemo` for computed values that derive from signals
- Use `For` for lists instead of array.map for proper reactivity
- Use `Show` with `keyed={true}` when rendering conditional content that might be null
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

**Security Practice**: Contributors should verify builds locally but not commit built files. Maintainers build trusted releases.

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
- Use `page` or `userEvent` for browser mode interactions - they work with Playwright/browser to mimic real user actions
- The testing library's render handles container creation and cleanup automatically
- Remove manual DOM cleanup (`document.body.innerHTML = ''`) - testing library handles this
- Remove manual `afterEach` with `vi.clearAllMocks()` - test configuration handles mock cleanup automatically

**Required vitest.config.ts Setup for Browser Mode:**

```typescript
import solidPlugin from "vite-plugin-solid";
import { playwright } from "@vitest/browser-playwright";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: "browser",
          include: [
            "src/admin/**/*.test.tsx",
            // ... other browser tests
          ],
          css: {
            include: /.+/,
          },
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium" }],
          },
        },
        plugins: [solidPlugin()], // CRITICAL: Required for JSX transformation in browser mode
      },
    ],
  },
});
```

**Example UI Testing Pattern:**

````typescript
import { render } from '@solidjs/testing-library';
import { describe, expect, it, vi } from 'vitest';
import '../../public/admin.css'; // Import CSS for styles
import { MyComponent } from './my-component';

describe('MyComponent', () => {
  // No afterEach needed - testing library handles cleanup

  it('should render correctly', () => {
    const closeModal = vi.fn();

    const { container } = render(() => (
      <MyComponent closeModal={closeModal} />
    ));

    expect(container.querySelector('h3')?.textContent).toBe('Expected Title');
  });
});

// BAD - mocking DOM properties
vi.spyOn(element, "getBoundingClientRect").mockReturnValue({
  width: 100,
  height: 50,
});

// GOOD - set styles to produce the desired state
element.style.width = "100px";
element.style.height = "50px";

// BAD - using fireEvent (fake DOM)
fireEvent.click(button);

// GOOD - using page or userEvent (real browser interaction)
await page.getByRole("button").click();
// or
await userEvent.click(button);

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

## Development Commands

### Quick Development Cycle

```bash
pnpm run build          # Build all components
pnpm run test           # Run tests
pnpm run lint           # Check code quality
````

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
pnpm run lint           # Run Biome (primary) and ESLint (reactivity errors)
pnpm run fix            # Auto-fix Biome linting issues and ESLint reactivity errors
```

**ESLint Configuration:**

- ESLint is configured in `eslint.config.js` to only handle SolidJS reactivity linting
- It runs the `solid/reactivity` rule on `src/admin/**/*.tsx` files
- Biome handles all other linting (formatting, style, general code quality)
- ESLint is configured with `noInlineConfig: true` to prevent disabling rules with comments - DO NOT CHANGE THIS - fix the reactivity issues instead
- The solid/reactivity rule is sometimes fixable with `eslint --fix`

## Common Tasks

### Adding New Chore Features

1. Update TypeScript interfaces in `src/types/chore-types.ts`
2. Implement logic in `src/backend/node-helper.ts`
3. Update frontend in `src/frontend/frontend.ts`
4. Add tests for new functionality
5. Update documentation

### Working with UUID Utilities

1. Use `generateUUID()` for creating new person/chore identifiers
2. Use `isValidUUID()` to validate UUID strings from external sources
3. Use `generateTestUUID()` only in tests for deterministic UUIDs
4. All UUID utilities are located in `src/utils/uuid.ts`
5. Tests for UUID utilities are in `src/utils/uuid.test.ts`

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
