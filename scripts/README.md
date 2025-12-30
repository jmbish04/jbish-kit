# Repository Scripts & CLI

This directory contains the repository CLI tool and automation scripts.

## CLI Tool

The repository CLI is built with [Commander.js](https://github.com/tj/commander.js) and provides commands for managing and maintaining the monorepo.

### Available Commands

- **`lint`** - Validate and fix project configuration issues

See the [CLI documentation](../docs/cli.md) for detailed usage information.

## Patterns Incorporated

This CLI incorporates proven patterns from the [Cloudflare templates repository](https://github.com/cloudflare/templates/tree/main/cli):

1. **Type-safe CLI with Commander.js** - Using `@commander-js/extra-typings` for full TypeScript support
2. **Modular command structure** - Each command in its own file
3. **Rich error formatting** - MarkdownError class for better DX
4. **GitHub Actions integration** - Automatic summary output
5. **Configuration utilities** - JSON, JSONC, and TOML parsing helpers

## Development

### Build

```bash
bun run build
```

Compiles TypeScript to JavaScript in the `dist/` directory.

### Type Check

```bash
bun run typecheck
```

### Run Locally

```bash
# After building
node dist/index.js lint --help
```

## File Structure

```
scripts/
├── index.ts           # CLI entry point
├── lint.ts            # Lint command implementation
├── util.ts            # Shared utilities
├── MarkdownError.ts   # Custom error class
├── mcp.ts             # MCP server (existing)
├── post-install.ts    # Post-install script (existing)
├── package.json       # Package configuration
├── tsconfig.json      # TypeScript configuration
└── dist/              # Compiled output (gitignored)
```

## Adding New Commands

1. Create a new TypeScript file for your command
2. Import and register it in `index.ts`
3. Rebuild the CLI with `bun run build`

See the [CLI documentation](../docs/cli.md) for a complete example.
