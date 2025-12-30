# Repository CLI

A handy CLI tool for managing and maintaining the repository.

## Overview

The repository CLI provides commands for automating common maintenance tasks, validating project configuration, and ensuring consistency across the monorepo.

## Installation

The CLI is built automatically when dependencies are installed:

```bash
bun install
```

## Usage

### Lint Command

The `lint` command validates project configuration files and ensures consistency across all workspace packages.

```bash
# Check for issues (dry-run)
bun lint:repo

# Fix issues automatically
bun lint:repo:fix
```

#### What It Checks

The linter validates:

1. **Wrangler Configuration**
   - Ensures `wrangler.json` or `wrangler.jsonc` is used (not `wrangler.toml`)
   - Validates `compatibility_date` is set to the target date
   - Ensures `observability.enabled` is set to `true`
   - Verifies `upload_source_maps` is enabled
   - Checks that Wrangler `name` matches package.json name

2. **Package.json**
   - Ensures workspace packages are marked as `private: true`
   - Validates that private packages don't have unnecessary version fields

#### Output

The CLI provides clear, actionable output:

- ✅ Success messages when all checks pass
- 📋 Detailed problem descriptions for each issue found
- 🔧 Automatic fixes when using the `--fix` flag
- 📝 GitHub Actions summary output when running in CI

## Architecture

### Key Patterns from Cloudflare Templates

This CLI incorporates proven patterns from the [Cloudflare templates repository](https://github.com/cloudflare/templates):

1. **Commander.js** - Type-safe CLI argument parsing with `@commander-js/extra-typings`
2. **Modular Commands** - Each command in its own file for maintainability
3. **MarkdownError** - Rich error formatting for better developer experience
4. **GitHub Actions Integration** - Automatic summary output via `GITHUB_STEP_SUMMARY`
5. **Configuration Utilities** - Helpers for JSON, JSONC, and TOML parsing

### File Structure

```
scripts/
├── index.ts           # CLI entry point with command definitions
├── lint.ts            # Linting command implementation
├── util.ts            # Shared utilities (file operations, workspace discovery)
├── MarkdownError.ts   # Custom error class for formatted output
├── package.json       # CLI dependencies
├── tsconfig.json      # TypeScript configuration
└── dist/              # Compiled JavaScript output
```

## Adding New Commands

To add a new command:

1. Create a new file in `scripts/` (e.g., `my-command.ts`)
2. Implement your command logic:

```typescript
import { getAllWorkspacePaths } from "./util";

export type MyCommandConfig = {
  projectDirectory: string;
  // ... other options
};

export function myCommand(config: MyCommandConfig) {
  const workspaces = getAllWorkspacePaths(config.projectDirectory);
  // ... command implementation
  return "✅ Command completed!";
}
```

3. Register the command in `scripts/index.ts`:

```typescript
import { myCommand } from "./my-command";

program
  .command("my-command")
  .description("Description of what the command does")
  .argument("[path-to-project]", "Path to project root", ".")
  .option("--my-option", "Description of option")
  .action((projectDirectory, options) => {
    return actionWithSummary("My Command", () =>
      myCommand({ projectDirectory, myOption: options.myOption ?? false }),
    );
  });
```

4. Rebuild the CLI:

```bash
bun --filter @repo/scripts build
```

## Utilities

### File Operations

- `readJson(filePath)` - Parse JSON files
- `readJsonC(filePath)` - Parse JSON with comments
- `readToml(filePath)` - Parse TOML files
- `writeJson(filePath, object)` - Write JSON files
- `writeJsonC(filePath, object)` - Write JSONC files

### Workspace Discovery

- `getWorkspaces(rootDir)` - Get workspace globs from package.json
- `getAllWorkspacePaths(rootDir)` - Get all workspace package paths
- `collectFiles(dirPath)` - Collect files from a directory (respects .gitignore)

### Error Handling

- `actionWithSummary(title, action)` - Wraps command execution with formatted output
- `MarkdownError` - Throw for rich, formatted error messages

## CI/CD Integration

The CLI automatically integrates with GitHub Actions:

```yaml
- name: Lint Repository
  run: bun lint:repo
  env:
    GITHUB_STEP_SUMMARY: ${{ github.step_summary }}
```

When `GITHUB_STEP_SUMMARY` is set, the CLI will append formatted output to the job summary.

## Development

### Building

```bash
bun --filter @repo/scripts build
```

### Type Checking

```bash
bun --filter @repo/scripts typecheck
```

## References

- [Cloudflare Templates CLI](https://github.com/cloudflare/templates/tree/main/cli)
- [Commander.js Documentation](https://github.com/tj/commander.js)
- [zx - Shell scripting with JavaScript](https://github.com/google/zx)
