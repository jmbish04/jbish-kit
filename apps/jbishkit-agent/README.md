# JBishKit Agent

Deployed Worker Agent for executing AI-powered development tasks in a sandbox environment.

## Features

- **WebSocket Communication** - Real-time bidirectional communication with CLI
- **Sandbox Execution** - Isolated environment for code generation and validation
- **Task Types** - Page generation, agent creation, linting, health audits, and more
- **Frontend Validation** - Integration with Stagehand for visual QA
- **GitHub Integration** - Automatic PR creation and code review

## Architecture

```
┌─────────────┐         ┌──────────────────┐         ┌─────────────┐
│  Local CLI  │◄───WS──►│  Worker Agent    │◄───RPC─►│  Stagehand  │
│             │         │  (w/ Sandbox)    │         │   Worker    │
└─────┬───────┘         └────────┬─────────┘         └─────────────┘
      │                          │
      ▼                          ▼
┌─────────────────────────────────────────┐
│            GitHub Repository            │
└─────────────────────────────────────────┘
```

## Task Execution Flow

1. **Receive Task** - CLI sends task message via WebSocket
2. **Clone Repo** - Clone repository in Sandbox SDK environment
3. **Execute Task** - Run AI-powered code generation/modification
4. **Validate** - Optional Stagehand validation of frontend changes
5. **Create PR** - Commit changes and open pull request
6. **Report** - Send completion status back to CLI

## Supported Tasks

- `task:generate_page` - Generate new page with AI
- `task:generate_agent` - Generate new AI agent
- `task:lint_fix` - Lint and fix code issues
- `task:health_audit` - Run comprehensive health audit
- `task:custom` - Custom task with natural language description

## Environment Variables

Required:
- `GITHUB_TOKEN` - GitHub API token
- `ANTHROPIC_API_KEY` - Anthropic API key
- `WORKER_SECRET` - JWT secret for authentication

Optional:
- `OPENAI_API_KEY` - OpenAI API key
- `CLOUDFLARE_API_TOKEN` - Cloudflare API token

## Deployment

```bash
# Development
bun dev

# Deploy to Cloudflare
bun deploy

# View logs
bun logs
```

## Durable Objects

### TaskSession

Manages WebSocket connections and task execution state.

**Methods:**
- `sendMessage(message)` - Send message to CLI
- `log(message, level)` - Log message
- `progress(percent, message)` - Update progress

## Development

### Local Testing

```bash
# Install dependencies
bun install

# Run locally
bun dev

# Type check
bun typecheck

# Test
bun test
```

### Creating New Tasks

1. Extend `BaseTask` class
2. Implement `execute(task)` method
3. Register in `tasks/factory.ts`

Example:

```typescript
import { BaseTask } from "./base-task";

export class MyTask extends BaseTask {
  async execute(task: TaskMessage): Promise<void> {
    this.log("Starting task...");
    this.progress(50, "Processing...");
    // Task logic here
    this.log("Completed!");
  }
}
```

## License

MIT
