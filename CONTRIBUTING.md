# Contributing to MMM-FamilyChores

Contributions are welcome! This is a side project, so please understand that response times may vary.

## How to Contribute

### Bug Reports

- Check existing issues first
- Include MagicMirror version, browser, and steps to reproduce
- Screenshots help!

### Feature Requests

- Open an issue to discuss before implementing
- Explain the use case and expected behavior

### Pull Requests

1. Fork the repository
2. Create a feature branch: `git switch -c feature/my-feature`
3. Run tests: `pnpm test`
4. Ensure TypeScript compiles: `pnpm run build` (verify only, don't commit built files)
5. Submit PR with clear description

**Security Note**: Do not commit built files (`MMM-FamilyChores.js`, `node_helper.js`) in your PR. Maintainers will build and release trusted versions.

**Release Process:**

When preparing a release (merging to main or creating a release branch):

1. Update `CHANGELOG.md` with changes for the new version
2. Bump version in `package.json` following semantic versioning
3. Build the project: `pnpm run build`
4. Commit all changes (including built files)
5. Push branch to remote and create PR
6. After merging to main, switch to main and pull
7. Create a git tag on main: `git tag v1.1.0`
8. Push tag to remote: `git push origin v1.1.0`

Tags are created for each version on main to enable users to track specific releases and for MMPM to reference stable versions.

## Guidelines

- Keep it simple - this module prioritizes ease of use
- Maintain backward compatibility when possible
- Add tests for new state management logic
- Update README.md if adding features

## Development Setup

```bash
git clone git@github.com:yourusername/MMM-FamilyChores.git
cd MMM-FamilyChores
pnpm install
pnpm test
```

## CI/CD and Security

This project uses automated vulnerability scanning to keep dependencies secure:

### CI Workflow

- **pnpm audit**: Runs on every push and PR to detect known vulnerabilities (moderate+ severity fails the build)
- **Type checking**: Ensures TypeScript compiles without errors
- **Linting**: Runs Biome (primary) and ESLint (reactivity errors)
- **Testing**: Runs all tests with Vitest

### Dependency Review

- Runs on every pull request to main
- Blocks PRs that introduce moderate or higher severity vulnerabilities
- Only allows common open-source licenses (MIT, Apache-2.0, BSD, ISC, 0BSD)

### Dependabot

- Checks dependencies weekly for known vulnerabilities
- Automatically creates PRs for security updates
- Labels PRs with "dependencies" and "security"

### Before Submitting PRs

1. Run `pnpm test` - all tests must pass
2. Run `pnpm typecheck` - TypeScript must compile without errors
3. Run `pnpm lint` - code must pass both Biome and ESLint
4. Run `pnpm audit` locally to check for vulnerabilities
5. CI will automatically run these checks on your PR

## Code of Conduct

Be respectful. We're all here to make household chore tracking a little easier.
