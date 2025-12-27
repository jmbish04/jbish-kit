# @jmbish/cli

JBishKit CLI - Cloudflare Workers development toolkit with AI-powered agents.

## Installation

```bash
bun add -g @jmbish/cli
```

## Quick Start

```bash
# Initialize a new project
jbish init my-app

# Generate a new page with AI agent
jbish generate page pricing --route /pricing --features charts,forms

# Run health audit
jbish health audit

# Lint and fix code
jbish lint --auto-fix
```

## Commands

### `jbish init <name>`

Initialize a new JBishKit project.

**Options:**
- `-t, --template <template>` - Project template (fullstack-chat, admin-dashboard, etc.)
- `--ai <providers...>` - AI providers to include (anthropic, openai, cloudflare-ai)
- `--bindings <types...>` - Cloudflare bindings (d1, kv, r2, vectorize, queue)
- `--monorepo` - Use monorepo structure
- `--github-create` - Create GitHub repository automatically

### `jbish generate page <name>`

Generate a new page with AI agent assistance.

**Options:**
- `-r, --route <path>` - Route path (default: /)
- `-f, --features <features...>` - Features to include (charts, forms, real-time, etc.)
- `--ui-library <library>` - UI library to use (shadcn, mui, chakra)
- `--no-validate` - Skip frontend validation
- `--auto-merge` - Auto-merge PR if validation passes
- `--verbose` - Verbose logging
- `--debug` - Debug logging

### `jbish generate agent <name>`

Generate a new AI agent.

**Options:**
- `-t, --tools <tools...>` - Tools to include
- `-p, --providers <providers...>` - AI providers
- `-c, --capabilities <capabilities...>` - Agent capabilities

### `jbish health`

Health check system commands.

**Subcommands:**
- `audit` - Run comprehensive health audit
- `status` - View current health status

### `jbish lint`

Lint and fix code with AI agent.

**Options:**
- `--auto-fix` - Auto-approve agent fixes
- `--watch` - Watch mode with auto-fixing
- `--files <files...>` - Specific files to lint

### `jbish deploy [env]`

Deploy to Cloudflare.

**Options:**
- `--preview` - Deploy preview with validation

## Environment Variables

- `JBISH_AGENT_URL` - Worker agent URL (default: https://jbishkit-agent.workers.dev)
- `GITHUB_TOKEN` - GitHub personal access token
- `WORKER_SECRET` - Worker authentication secret

## Architecture

The CLI connects to a deployed Worker Agent via WebSocket. The agent:

1. Clones your repository in a sandbox environment
2. Executes the requested task (generate page, lint, health audit, etc.)
3. Validates the output (optional, using Stagehand)
4. Creates a pull request with the changes
5. Reports progress back to the CLI in real-time

## Development

```bash
# Install dependencies
bun install

# Build
bun build

# Development mode
bun dev

# Test
bun test
```

## License

MIT
