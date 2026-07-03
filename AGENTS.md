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

JSDoc is encouraged but not strictly required when the name and type signature are already self-documenting. Focus JSDoc on non-obvious behavior, constraints, or public API contracts.

### Testing Conventions (Browser Tests)

**Preferred Locators:**
Always use `page.` locators from `vitest/browser` in this priority order:

1. `page.getByTestId('...')` - For elements with `data-testid` attributes
2. `page.getByLabelText('...')` - For form inputs with associated labels
3. `page.getByRole('button', { name: '...' })` - For buttons and interactive elements
4. `page.getByPlaceholder('...')` - For inputs without labels (fallback)
5. `page.getByText('...')` - For text content assertions

**Avoid these patterns:**
- `document.querySelector('#id')` or `document.querySelector('[data-testid="..."]')`
- `document.querySelectorAll(...)` - use `page.getByTestId().elements()` instead
- `screen.getByText()` or `screen.queryByText()` from `@solidjs/testing-library`
- `fireEvent` - use `page.getByRole('button').click()` instead

**Assertion Patterns:**
- Use `await expect.element(locator).toBeVisible()` for visibility checks
- **Avoid** `.toBeInTheDocument()` from `@solidjs/testing-library` - use `.toBeVisible()` with `page.` locators instead
- Use `await expect.element(locator).toHaveTextContent('...')` for text content
- Use `await expect.element(locator).toHaveValue('...')` for input values
- Use `await expect.element(locator).not.toBeChecked()` for checkbox state
- Use `expect(page.getByText('...').elements().length).toBe(0)` for "not exists" checks

**Example:**
```typescript
import { render } from '@solidjs/testing-library';
import { page } from 'vitest/browser';

// Good
await expect.element(page.getByTestId('modal-title')).toBeVisible();
await expect.element(page.getByLabelText('Chore Name')).toHaveValue('Do dishes');
await page.getByRole('button', { name: 'Save' }).click();

// Avoid
document.querySelector('#choreName');
screen.getByText('Save').click();
```

### Development Workflow

**ALWAYS run these commands before making changes:**

```bash
pnpm run typecheck    # Verify TypeScript compiles
pnpm run lint         # Run Biome (primary) and ESLint (reactivity errors)
pnpm run test         # Run tests
```

**MANDATORY: After completing ALL code changes, you MUST run these and include the following checklist in your final response:**

```
## Verification
- [✅/❌] `pnpm run lint`
- [✅/❌] `pnpm run build`
- [✅/❌] `pnpm run test`
```

Use ✅ if it passed, ❌ if it failed (and explain why). You MAY omit items that are genuinely not applicable (e.g. skip `build` and `test` for documentation-only changes, skip `build` if you are mid-task and have not finished yet) — but if you skip an item, **say so explicitly** rather than silently omitting it. Never omit all three without explanation.

**CRITICAL: Before committing changes, you MUST:**

```bash
pnpm run build          # Build both client and node and copy to root
git add .               # Add ALL changes including built files
git commit -m "message" # Commit
```

**This is NON-NEGOTIABLE:** Built files (`MMM-FamilyChores.js`, `node_helper.js`, `public/admin.js`) MUST be committed. The module will not work for users without these built files. Never commit source changes without also committing the corresponding built files.

**Release Workflow:**

For any branch that will be merged to main (including feature branches and release preparation):

1. Update `CHANGELOG.md` with changes for the new version
2. Bump version in `package.json` following semantic versioning
3. Build and commit as above
4. Push branch to remote and create PR
5. Create the release: remind the user to create the release using the Github UI after merging to main. Doing so will automatically create the tag and release.

**IMPORTANT: MMPM Update Detection**

MMPM (MagicMirror Package Manager) detects updates by comparing the local HEAD commit SHA with the remote origin/HEAD commit SHA. This means:

- **Users are notified as soon as you merge to main** - there is no delay or central DB cache
- Users cannot "opt in" to updates - they will see your changes immediately when they run `mmpm update`
- **No breaking change warnings** - MMPM does not check changelogs or semver before upgrading
- Users blindly pull whatever is on your main branch

**Implications:**
- Be conservative about what you merge to main
- Use feature branches and only merge when ready for users
- Document breaking changes prominently in README/CHANGELOG
- Consider using GitHub releases with release notes (even though MMPM doesn't check them)

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
- Daily reset at midnight clears `completedToday` (backend checks every minute and broadcasts updates to frontends)
- Rotating chores stay with current person until completed

**Validation on Load:**

- The in-memory `choreData` is treated as trusted — it is validated once when loaded from disk and invalid entries are skipped
- `validatePerson`, `validateChore`, `validateSettings`, and `validateDailyCompletion` in `src/backend/validator.ts` enforce all shapes at load time
- **Any change to the shape of `choreData` or any of its sub-parts MUST include updating the corresponding validator.** If you add a field to `Person`, `Chore`, `Settings`, or `DailyCompletion` (or change the type of an existing field), update the matching `validate*` function and add tests in `src/backend/validator.test.ts`
- This prevents corrupted or unexpected data from silently entering the trusted in-memory state

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
- ONLY exception: files needing to be uppercase for technical reasons, like the built files used by MagicMirror²

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

- All parameters must have explicit types
- Use generic types where appropriate instead of `any`
- Leverage TypeScript's type inference but provide explicit types when clarity is needed
- Explicit return types are encouraged for public/exported functions and complex logic, but not strictly required for simple `void` helpers where inference is clear
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

### escapeHtml for User-Entered Text

**ALWAYS call `escapeHtml()` when displaying user-entered text in JSX/HTML.**

This module is for household use, not a high-security context — but `escapeHtml` is still required for correct display, not just safety. If a family member names a chore `<Sunday Chores>`, it must render as literal text, not be interpreted as an HTML tag and disappear or break the layout.

- Import from `src/utils/browser`: `import { escapeHtml } from '../utils/browser';`
- Apply at the point of display, not at the point of storage
- Required for: person names, chore names, or any other field the user can type into
- Not required for: IDs, enum values, system-generated values, or static strings
- Examples: `{escapeHtml(person.name)}`, `{escapeHtml(chore.name)}`
- This applies to all admin components, frontend templates, and anywhere user data is rendered

### Admin Panel Styling

**Tailwind CSS v4 with CSS-First Configuration:**

- The admin panel uses Tailwind CSS v4 with a CSS-first configuration approach
- Configuration is in `src/admin/admin.css` using `@import "tailwindcss"` and `@theme` rules
- This approach eliminates the need for a separate `tailwind.config.js` file
- Custom theme colors and animations are defined directly in the CSS file using `@theme`

**Button Component:**

- All admin components use the reusable `Button` component from `src/admin/button.tsx`
- The Button component supports variants: `primary`, `secondary`, `warning`, `danger`, `success`
- Size option: `sm` for smaller buttons
- Use `dataTestId` prop for testing instead of `data-testid` attribute
- Example: `<Button type="button" variant="primary" onClick={handler}>Click me</Button>`

**Component Styling:**

- All admin components use Tailwind utility classes for styling
- No legacy CSS files exist in `src/admin/` - all styling is done with Tailwind
- Tooltip styles are preserved in `src/admin/admin.css` using `@layer components`
- Use `data-testid` attributes on elements that need to be selected in tests
- This is especially important for modal content, lists, and other dynamic elements

**Biome Configuration:**

- `biome.jsonc` is configured to recognize Tailwind CSS directives
- The CSS parser has `tailwindDirectives` enabled to support `@theme` and `@apply` rules
- This prevents Biome from flagging Tailwind-specific CSS as errors

**ESLint Configuration:**

- `eslint-plugin-solid` enforces SolidJS reactivity best practices (e.g., `solid/reactivity`)
- `eslint-plugin-better-tailwindcss` validates Tailwind CSS classes and detects unknown/incorrect utilities
  - Uses `entryPoint: "src/admin/admin.css"` to read Tailwind v4 CSS-first configuration
  - `detectComponentClasses: true` recognizes custom `@layer components` classes (e.g., `tooltip`, `tooltip-above`)
  - Only correctness rules are enabled (unknown classes, conflicting classes)
- Biome handles all formatting and additional linting for the admin panel

**Testing Considerations:**

- When adding new admin components, always add `data-testid` attributes to key elements
- Use `data-testid` selectors in test files instead of CSS class selectors
- This makes tests more robust against styling changes
- Example: `expect(container.querySelector('[data-testid="modal-content"]')).toBeTruthy()`

### Testing Requirements

**Before committing:**

1. Run `pnpm run test` - All tests must pass
2. Run `pnpm run typecheck` - TypeScript must compile without errors
3. Run `pnpm run lint` - Code must pass both Biome (primary) and ESLint (reactivity + Tailwind correctness)
4. Run `pnpm run build` - Verify build succeeds (maintainers will build and commit releases)
5. **If you changed data model shapes** (`Person`, `Chore`, `Settings`, `DailyCompletion`, or request types), verify the matching `validate*` function in `src/backend/validator.ts` and its tests are updated

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
- CSS is loaded globally via the browser setup file (`src/admin/browser-setup.ts`) importing `src/admin/admin.css`
- The `@tailwindcss/vite` plugin must be included in the Vitest browser project plugins array alongside `solidPlugin()`
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
- Admin tests are enabled and run in browser mode with Playwright
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

- Uses `data.json` (hardcoded path in module directory)
- Create automatic backups before writes
- Validate data structure on load

### Socket Communication

**Notifications (from constants):**

- `CONFIG_REQUEST`: Frontend requests initial data
- `CONFIG_RESPONSE`: Backend sends configuration and state
- `CHORE_DATA`: Backend sends updated chore data
- `CHORE_TOGGLE`: Toggle chore completion status
- `CHORE_UPDATE_RESULT`: Backend confirms a chore toggle

**Payload Types:**

- Use proper TypeScript interfaces for all payloads
- Validate incoming data before processing

### Admin Actions

**PIN Protection:**

- All admin HTTP API actions require valid PIN when configured
- Toggle actions (mark complete/incomplete from the mirror UI) do not require PIN

**Available Actions:**

- **Toggle**: Mark chore complete/incomplete (no PIN required, via socket)
- All other admin actions (add/edit/delete people and chores, settings, backup/restore, advance rotations) are HTTP API actions and require PIN when configured

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
