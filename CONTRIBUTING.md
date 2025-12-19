# Contributing to Meccanico

## Commit Message Format

This project uses [Conventional Commits](https://www.conventionalcommits.org/) specification enforced by commitlint and husky.

### Commit Message Structure

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- **feat**: A new feature
- **fix**: A bug fix
- **docs**: Documentation only changes
- **style**: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
- **refactor**: A code change that neither fixes a bug nor adds a feature
- **perf**: A code change that improves performance
- **test**: Adding missing tests or correcting existing tests
- **build**: Changes that affect the build system or external dependencies
- **ci**: Changes to CI configuration files and scripts
- **chore**: Other changes that don't modify src or test files
- **revert**: Reverts a previous commit

### Scope (Optional)

The scope should be the name of the package/area affected (e.g., `backend`, `frontend`, `customer`, `job`, `inventory`).

### Subject

- Use the imperative, present tense: "change" not "changed" nor "changes"
- Don't capitalize the first letter
- No dot (.) at the end
- Maximum 100 characters

### Examples

```
feat(backend): add customer code generation

Implement automatic customer code generation in format C{5 letters}{000}

fix(frontend): resolve vehicle form validation issue

The vehicle form was not validating required fields properly

docs: update setup instructions

Add Node.js version requirements to setup documentation

test(e2e): add customer CRUD tests

Add comprehensive E2E tests for customer create, read, update, delete operations

refactor(backend): simplify job service code

Extract common logic into helper functions to reduce duplication
```

### Breaking Changes

If your commit introduces a breaking change, add `!` after the type/scope, and include a `BREAKING CHANGE:` section in the footer:

```
feat(api)!: change customer endpoint response format

BREAKING CHANGE: Customer endpoint now returns data in a nested structure
```

### Skipping Commit Lint (Not Recommended)

If you absolutely need to skip commitlint (e.g., for automated commits), you can use:

```bash
git commit --no-verify -m "your message"
```

**Note**: This should only be used in exceptional circumstances and is not recommended for regular commits.

