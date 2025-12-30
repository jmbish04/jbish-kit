# JBishKit - AI-Powered Cloudflare Workers Development Toolkit

> Comprehensive Cloudflare Workers development toolkit with intelligent agent-based workflow

## Overview

JBishKit is a revolutionary development toolkit that combines a local CLI, deployed Worker Agents, and visual QA validation to provide an AI-assisted development experience for Cloudflare Workers projects.

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Local CLI  │◄───WS──►│  Worker Agent    │◄───RPC─►│  Stagehand  │
│             │         │  (w/ Sandbox)    │         │   Worker    │
└─────┬───────┘         └────────┬─────────┘         └─────────────┘
      │                          │
      │                          │
      ▼                          ▼
┌─────────────────────────────────────────┐
│            GitHub Repository            │
│  • Source of truth                      │
│  • Branch-based task isolation          │
│  • PR-driven code review                │
└─────────────────────────────────────────┘
```

## Components

### 1. Local CLI (`packages/cli`)

The CLI orchestrates Git operations and communicates with the Worker Agent via WebSocket.

**Features:**
- Project initialization with templates
- AI-powered page generation
- Agent creation with customizable tools
- Automated linting and fixing
- Health check system
- Real-time progress updates

**Quick Start:**
```bash
# Install CLI
bun add -g @jmbish/cli

# Initialize project
jbish init my-app --template fullstack-chat

# Generate a page
jbish generate page pricing --route /pricing --features charts,forms
```

### 2. Worker Agent (`apps/jbishkit-agent`)

Deployed Cloudflare Worker that executes tasks in a sandbox environment.

**Features:**
- WebSocket communication with CLI
- Sandbox SDK integration for isolated execution
- AI-powered code generation
- GitHub integration for PR creation
- Modular task system

**Workflow:**
1. Receives task from CLI via WebSocket
2. Clones repository in sandbox
3. Executes AI-powered code generation
4. Validates changes (optional)
5. Creates pull request
6. Reports progress to CLI

### 3. Stagehand Worker (Planned - `apps/jbishkit-stagehand`)

Visual QA validation service using Browser Rendering API.

**Features:**
- Automated UI testing
- Visual regression detection
- Accessibility checks
- Screenshot capture
- AI-powered issue analysis

## Task Types

### Generate Page
```bash
jbish generate page dashboard --route /dashboard --features charts,tables,forms
```

Creates a new page with:
- Component scaffolding
- Type definitions
- Route registration
- AI-generated implementation
- Visual validation (optional)

### Generate Agent
```bash
jbish generate agent document-analyzer --tools pdf-parsing,ocr --providers anthropic
```

Creates a new AI agent with:
- Base agent structure
- Tool integrations
- Provider configuration
- Health checks

### Lint Fix
```bash
jbish lint --auto-fix
```

AI-powered linting:
- Detects code issues
- Generates fixes
- Creates PR with changes
- Auto-merge option

### Health Audit
```bash
jbish health audit --comprehensive
```

Comprehensive health checks:
- Binding availability
- API key validation
- Performance metrics
- Modular check discovery

## Task Execution Flow

1. **CLI**: Creates feature branch, commits skeleton code, pushes to GitHub
2. **CLI**: Opens WebSocket to Worker Agent with task instruction
3. **Agent**: Clones branch in Sandbox SDK environment
4. **Agent**: Executes task with verbose logging over WebSocket
5. **Agent**: Spins up dev environment, exposes on Worker frontend (optional)
6. **Agent**: Uses Stagehand (via RPC) to validate frontend visually (optional)
7. **Agent**: Commits changes, creates new branch, opens PR
8. **CLI**: Receives signal, displays PR URL
9. **User**: Reviews/approves PR, merges to working branch
10. **CLI**: Pulls merged changes gracefully

## Development

### Setup

```bash
# Install dependencies
bun install

# Build all packages
bun build

# Build CLI
bun cli:build

# Build and deploy agent
bun agent:deploy
```

### Local Development

```bash
# Terminal 1: Run CLI in dev mode
bun cli:dev

# Terminal 2: Run agent locally
bun agent:dev

# Terminal 3: Test CLI commands
bun --filter @jmbish/cli src/cli.ts generate page test
```

### Project Structure

```
jbish-kit/
├── packages/
│   └── cli/                     # Local CLI tool
│       ├── src/
│       │   ├── commands/        # CLI commands
│       │   ├── git/             # Git operations
│       │   ├── websocket/       # WebSocket client
│       │   └── cli.ts           # Entry point
│       └── package.json
│
├── apps/
│   ├── jbishkit-agent/          # Worker Agent
│   │   ├── src/
│   │   │   ├── tasks/           # Task executors
│   │   │   ├── sandbox/         # Sandbox SDK integration
│   │   │   ├── durable-objects/ # TaskSession DO
│   │   │   └── index.ts         # Worker entry
│   │   └── wrangler.jsonc
│   │
│   └── jbishkit-stagehand/      # Visual QA Worker (planned)
│       └── src/
│           ├── browser/          # Browser automation
│           ├── validation/       # QA checks
│           └── index.ts
│
├── apps/web/                    # Marketing site (Astro)
├── apps/app/                    # Main app (React + TanStack Router)
├── apps/api/                    # API server (Hono + tRPC)
├── packages/ui/                 # Shared UI components
└── db/                          # Database schema
```

## Environment Variables

### CLI
```bash
JBISH_AGENT_URL=https://jbishkit-agent.workers.dev
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
WORKER_SECRET=your-secret-key
```

### Worker Agent
```bash
GITHUB_TOKEN=ghp_xxxxxxxxxxxxx
ANTHROPIC_API_KEY=sk-ant-xxxxxxxxxxxxx
OPENAI_API_KEY=sk-xxxxxxxxxxxxx
WORKER_SECRET=your-secret-key
```

## Roadmap

### Phase 1: Foundation ✅
- [x] CLI scaffolding with Git operations
- [x] WebSocket client with mock responses
- [x] Worker agent with WebSocket handler
- [x] Basic task execution (generate page)
- [x] Message protocol

### Phase 2: Core Tasks (In Progress)
- [ ] Sandbox SDK integration
- [ ] AI-powered code generation
- [ ] GitHub PR creation
- [ ] Generate Agent task
- [ ] Lint Fix task
- [ ] Health Audit task

### Phase 3: Stagehand Integration
- [ ] Stagehand Worker (Browser Rendering API)
- [ ] Visual validation with screenshots
- [ ] Vision model integration
- [ ] Accessibility checks
- [ ] Interaction testing

### Phase 4: Templates & Monorepo
- [ ] Project templates (fullstack-chat, admin-dashboard)
- [ ] Turborepo integration
- [ ] Build/deploy scripts
- [ ] Template customization

### Phase 5: Developer Experience
- [ ] IDE integration
- [ ] Auto-merge with confidence scoring
- [ ] Watch mode for lint/health
- [ ] Comprehensive logging
- [ ] CLI diff display

## First Milestone

**Goal**: CLI can run `jbish generate page pricing`, agent clones repo, generates basic page, opens PR, and CLI displays the PR URL.

**Status**: ✅ Core infrastructure complete, ready for Sandbox SDK integration

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for development guidelines.

## License

MIT
