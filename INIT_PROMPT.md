Enhanced Prompt for Coding Agent: Build JBishKit CLI & Agent Worker System
You are building JBishKit - a comprehensive Cloudflare Workers development toolkit with an intelligent agent-based workflow. The system consists of:

Local CLI - Git orchestrator and WebSocket client
Deployed Worker Agent - Autonomous task executor with sandbox environment
Stagehand Service Worker - Visual QA validation via RPC
GitHub Integration - Source of truth and coordination layer
Architecture Overview
Core Workflow Pattern
┌─────────────┐ ┌──────────────────┐ ┌─────────────┐
│ Local CLI │◄───WS──►│ Worker Agent │◄───RPC─►│ Stagehand │
│ │ │ (w/ Sandbox) │ │ Worker │
└─────┬───────┘ └────────┬─────────┘ └─────────────┘
│ │
│ │
▼ ▼
┌─────────────────────────────────────────┐
│ GitHub Repository │
│ • Source of truth │
│ • Branch-based task isolation │
│ • PR-driven code review │
└─────────────────────────────────────────┘

Task Execution Flow
CLI: Creates feature branch, commits code, pushes to GitHub
CLI: Opens WebSocket to Worker Agent with task instruction
Agent: Clones branch in Sandbox SDK environment
Agent: Executes task with verbose logging over WebSocket
Agent: Spins up dev environment, exposes on Worker frontend
Agent: Uses Stagehand (via RPC) to validate frontend visually
Agent: Commits changes, creates new branch, opens PR
CLI: Receives signal, displays diff or instructs user to review PR
User: Reviews/approves PR, merges to working branch
CLI: Pulls merged changes gracefully
Part 1: Local CLI Tool
1.1 CLI Architecture
@jmbish/cli/
├── src/
│ ├── commands/
│ │ ├── init.ts # Initialize new project
│ │ ├── generate.ts # Generate features
│ │ ├── health.ts # Health system management
│ │ ├── lint.ts # Lint & fix
│ │ └── deploy.ts # Deploy to Cloudflare
│ ├── git/
│ │ ├── branch-manager.ts # Branch creation/management
│ │ ├── commit-handler.ts # Commit operations
│ │ └── pr-manager.ts # PR creation/review
│ ├── websocket/
│ │ ├── client.ts # WebSocket client
│ │ ├── message-handler.ts # Message protocol
│ │ └── logger.ts # Display agent logs
│ ├── auth/
│ │ ├── github-auth.ts # GitHub OAuth/PAT
│ │ └── worker-auth.ts # Worker agent JWT
│ └── cli.ts # Main entry point
├── templates/ # Project templates
└── package.json

1.2 Core CLI Commands

# Initialize new worker project

jbish init my-app [options]
--template <name> # Template (fullstack-chat, admin-dashboard, etc)
--ai <providers> # AI providers
--bindings <types> # Cloudflare bindings
--monorepo react-starter # Use react-starter-kit structure
--github-create # Create GitHub repo automatically
--agent-url <url> # Worker agent URL (default: jbishkit-agent.workers.dev)

# Generate new features (agent-assisted)

jbish generate page <name> [options]
--route <path> # Route path
--features <list> # Features (charts, forms, etc)
--validate # Run Stagehand validation

jbish generate agent <name> [options]
--tools <list> # Tools to include
--providers <list> # AI providers

jbish generate health-check <service>
--binding <name> # Binding to check

# Code quality (agent-assisted)

jbish lint # Send linting errors to agent for fixing
jbish lint --auto-fix # Auto-approve agent fixes
jbish lint --watch # Watch mode with auto-fixing

# Health system

jbish health audit # Agent audits health system
jbish health status # View current health status
jbish health run # Run health checks now

# Deployment

jbish deploy [env] # Deploy to Cloudflare
jbish deploy --preview # Deploy preview with Stagehand validation

# Agent interaction

jbish agent task <description> # Send custom task to agent
jbish agent logs # View agent logs
jbish agent status # Check agent availability

1.3 Task Message Protocol (WebSocket)
// CLI → Agent
interface TaskMessage {
type: 'task:init' | 'task:generate_page' | 'task:lint_fix' | 'task:health_audit' | 'task:custom';
taskId: string;
repo: string; // GitHub repo URL
branch: string; // Branch to work on
auth: {
github: string; // GitHub PAT or App token
worker: string; // JWT for worker auth
};
args: Record<string, any>; // Task-specific arguments
settings: {
verbose: boolean;
debug: boolean;
validateFrontend: boolean; // Use Stagehand validation
autoMerge: boolean; // Auto-merge PR if validation passes
};
}

// Agent → CLI
interface AgentMessage {
type: 'log' | 'progress' | 'error' | 'complete' | 'pr_created';
taskId: string;
timestamp: number;
data: {
message?: string;
level?: 'debug' | 'info' | 'warn' | 'error';
progress?: number; // 0-100
prUrl?: string; // GitHub PR URL
diff?: string; // Code diff
validation?: { // Stagehand validation results
passed: boolean;
screenshots: string[];
issues: string[];
};
};
}

1.4 CLI Implementation Example
// src/commands/generate.ts
import simpleGit from 'simple-git';
import WebSocket from 'ws';
import { v4 as uuid } from 'uuid';

export async function generatePage(name: string, options: any) {
const git = simpleGit();
const taskId = uuid();

// 1. Create feature branch
const branchName = `feature/page-${name}`;
await git.checkoutLocalBranch(branchName);

// 2. Create skeleton files
await createPageSkeleton(name, options);

// 3. Commit and push
await git.add('.');
await git.commit(`chore: scaffold ${name} page`);
await git.push('origin', branchName);

// 4. Open WebSocket to agent
const ws = new WebSocket(process.env.JBISH_AGENT_URL || 'wss://jbishkit-agent.workers.dev');

ws.on('open', () => {
// Send task instruction
ws.send(JSON.stringify({
type: 'task:generate_page',
taskId,
repo: getGitHubRepoUrl(),
branch: branchName,
auth: {
github: process.env.GITHUB_TOKEN,
worker: generateWorkerJWT()
},
args: {
pageName: name,
route: options.route,
features: options.features || []
},
settings: {
verbose: options.verbose !== false,
debug: options.debug || false,
validateFrontend: options.validate !== false,
autoMerge: options.autoMerge || false
}
}));
});

ws.on('message', (data) => {
const message: AgentMessage = JSON.parse(data.toString());

    switch (message.type) {
      case 'log':
        console.log(`[Agent] ${message.data.message}`);
        break;

      case 'progress':
        updateProgressBar(message.data.progress);
        break;

      case 'pr_created':
        console.log(`\n✓ PR created: ${message.data.prUrl}`);
        if (options.autoMerge && message.data.validation?.passed) {
          console.log('✓ Validation passed, auto-merging...');
          // Auto-merge logic
        } else {
          console.log('\nPlease review the PR and run:');
          console.log(`  jbish pr merge ${message.data.prUrl}`);
        }
        break;

      case 'complete':
        ws.close();
        break;

      case 'error':
        console.error(`[Agent Error] ${message.data.message}`);
        ws.close();
        break;
    }

});
}

async function createPageSkeleton(name: string, options: any) {
// Create folder structure
const pagePath = `apps/web/src/pages/${name}`;
await fs.mkdir(pagePath, { recursive: true });

// Create index.tsx with imports
const indexContent = `
import React from 'react';
import { Env } from '../../../../types';

export function ${capitalize(name)}Page() {
  return (
    <div>
      <h1>${capitalize(name)}</h1>
{/_ Agent will complete this _/}
</div>
);
}
`.trim();

await fs.writeFile(`${pagePath}/index.tsx`, indexContent);

// Create types.ts
await fs.writeFile(`${pagePath}/types.ts`, `export interface ${capitalize(name)}Props {}\n`);

// Update routes
await updateRoutes(name, options.route);
}

Part 2: Worker Agent (Deployed)
2.1 Agent Architecture
jbishkit-agent/
├── src/
│ ├── index.ts # Main Worker with WebSocket handler
│ ├── sandbox/
│ │ ├── manager.ts # Sandbox SDK manager
│ │ ├── git-operations.ts # Git clone/commit in sandbox
│ │ └── dev-server.ts # Dev environment in sandbox
│ ├── tasks/
│ │ ├── base-task.ts # BaseTask class
│ │ ├── generate-page.ts # Page generation task
│ │ ├── lint-fix.ts # Linting task
│ │ ├── health-audit.ts # Health audit task
│ │ └── custom.ts # Custom tasks
│ ├── validation/
│ │ ├── stagehand-client.ts # RPC client to Stagehand worker
│ │ └── vision-validator.ts # Vision model validation
│ ├── github/
│ │ ├── pr-creator.ts # PR creation
│ │ └── branch-manager.ts # Branch operations
│ ├── ai/
│ │ ├── router.ts # Multi-provider AI routing
│ │ ├── code-generator.ts # Code generation
│ │ └── mcp-client.ts # MCP tools (Cloudflare docs, etc)
│ └── durable-objects/
│ └── TaskSession.ts # Track task execution state
├── wrangler.jsonc
└── package.json

2.2 WebSocket Handler
// src/index.ts
import { DurableObject } from 'cloudflare:workers';

export default {
async fetch(request: Request, env: Env): Promise<Response> {
const url = new URL(request.url);

    if (url.pathname === '/ws') {
      // WebSocket upgrade
      const upgradeHeader = request.headers.get('Upgrade');
      if (upgradeHeader !== 'websocket') {
        return new Response('Expected WebSocket', { status: 426 });
      }

      const webSocketPair = new WebSocketPair();
      const [client, server] = Object.values(webSocketPair);

      // Create Durable Object session
      const id = env.TASK_SESSION.idFromName('session-' + crypto.randomUUID());
      const stub = env.TASK_SESSION.get(id);
      await stub.fetch(request, { webSocket: server });

      return new Response(null, {
        status: 101,
        webSocket: client
      });
    }

    // Serve dev environment frontend (pass-through)
    if (url.pathname.startsWith('/preview/')) {
      return handlePreview(request, env);
    }

    return new Response('JBishKit Agent', { status: 200 });

}
};

// Durable Object for task session management
export class TaskSession extends DurableObject {
private ws?: WebSocket;
private taskId?: string;

async fetch(request: Request) {
this.ws = request.headers.get('Upgrade') === 'websocket'
? request.headers.get('WebSocket')
: undefined;

    if (!this.ws) {
      return new Response('Expected WebSocket', { status: 400 });
    }

    this.ws.accept();

    this.ws.addEventListener('message', async (event) => {
      const message: TaskMessage = JSON.parse(event.data);
      this.taskId = message.taskId;

      try {
        await this.executeTask(message);
      } catch (error) {
        this.sendMessage({
          type: 'error',
          taskId: this.taskId,
          timestamp: Date.now(),
          data: { message: error.message }
        });
      }
    });

    return new Response(null, { status: 101, webSocket: this.ws });

}

private async executeTask(task: TaskMessage) {
const executor = createTaskExecutor(task.type);
await executor.execute(task, this);
}

sendMessage(message: AgentMessage) {
this.ws?.send(JSON.stringify(message));
}

log(message: string, level: 'debug' | 'info' | 'warn' | 'error' = 'info') {
this.sendMessage({
type: 'log',
taskId: this.taskId!,
timestamp: Date.now(),
data: { message, level }
});
}
}

2.3 Sandbox SDK Integration
// src/sandbox/manager.ts
export class SandboxManager {
private env: Env;
private session: TaskSession;

async cloneRepository(repo: string, branch: string, auth: string) {
this.session.log(`Cloning ${repo}#${branch}...`);

    // Use Cloudflare Workers Sandbox SDK
    const sandbox = await this.env.SANDBOX.spawn({
      memory: 512, // MB
      cpuTime: 60000 // 60 seconds
    });

    // Execute git clone in sandbox
    const result = await sandbox.exec([
      'git', 'clone',
      '--branch', branch,
      '--single-branch',
      `https://x-access-token:${auth}@github.com/${repo}.git`,
      '/workspace'
    ]);

    if (result.exitCode !== 0) {
      throw new Error(`Git clone failed: ${result.stderr}`);
    }

    this.session.log('Repository cloned successfully');
    return sandbox;

}

async runDevServer(sandbox: any, port: number = 5173) {
this.session.log('Starting dev server...');

    // Install dependencies
    await sandbox.exec(['npm', 'install'], { cwd: '/workspace' });

    // Start dev server (Vite)
    const devServer = sandbox.spawn(['npm', 'run', 'dev'], {
      cwd: '/workspace',
      env: {
        PORT: port.toString(),
        HOST: '0.0.0.0'
      }
    });

    // Wait for server to be ready
    await this.waitForServer(`http://localhost:${port}`);

    this.session.log(`Dev server running on port ${port}`);

    // Expose via Worker frontend
    const publicUrl = await this.exposeDevServer(port);
    this.session.log(`Public URL: ${publicUrl}`);

    return { devServer, publicUrl };

}

private async exposeDevServer(port: number): Promise<string> {
// Create a public pass-through URL
const previewId = crypto.randomUUID();

    // Store port mapping in KV or Durable Object
    await this.env.PREVIEW_MAPPINGS.put(previewId, port.toString(), {
      expirationTtl: 3600 // 1 hour
    });

    return `https://jbishkit-agent.workers.dev/preview/${previewId}`;

}
}

2.4 Task Executor Example (Generate Page)
// src/tasks/generate-page.ts
export class GeneratePageTask extends BaseTask {
async execute(message: TaskMessage, session: TaskSession) {
const { pageName, route, features } = message.args;

    // 1. Clone repository in sandbox
    const sandbox = await this.sandboxManager.cloneRepository(
      message.repo,
      message.branch,
      message.auth.github
    );

    // 2. Analyze existing code structure
    session.log('Analyzing project structure...');
    const analysis = await this.analyzeProject(sandbox);

    // 3. Generate page code using AI
    session.log(`Generating ${pageName} page...`);
    const code = await this.generatePageCode(pageName, route, features, analysis);

    // 4. Write generated code to sandbox
    await this.writeGeneratedCode(sandbox, pageName, code);

    // 5. Start dev server
    const { publicUrl } = await this.sandboxManager.runDevServer(sandbox);

    // 6. Validate with Stagehand
    if (message.settings.validateFrontend) {
      session.log('Validating frontend with Stagehand...');
      const validation = await this.validateWithStagehand(publicUrl, route);

      if (!validation.passed) {
        session.log('Validation failed, fixing issues...');
        await this.fixValidationIssues(sandbox, validation.issues);

        // Re-validate
        const revalidation = await this.validateWithStagehand(publicUrl, route);
        if (!revalidation.passed) {
          throw new Error('Validation failed after fixes');
        }
      }

      session.log('✓ Validation passed');
    }

    // 7. Commit changes in sandbox
    session.log('Committing changes...');
    await this.commitChanges(sandbox, `feat: add ${pageName} page`);

    // 8. Create new branch and push
    const prBranch = `auto/${message.branch}-${pageName}`;
    await this.createBranchAndPush(sandbox, prBranch, message.auth.github);

    // 9. Open PR
    session.log('Creating pull request...');
    const prUrl = await this.createPR(
      message.repo,
      prBranch,
      message.branch,
      `Add ${pageName} page`,
      message.auth.github
    );

    // 10. Send completion message
    session.sendMessage({
      type: 'pr_created',
      taskId: message.taskId,
      timestamp: Date.now(),
      data: {
        prUrl,
        validation: validation || undefined
      }
    });

    session.sendMessage({
      type: 'complete',
      taskId: message.taskId,
      timestamp: Date.now(),
      data: {}
    });

}

private async generatePageCode(
name: string,
route: string,
features: string[],
analysis: any
): Promise<GeneratedCode> {
// Use AI to generate code
const prompt = `
Generate a React component for a page called "${name}".

      Route: ${route}
      Features: ${features.join(', ')}

      Project uses:
      - ${analysis.uiLibrary} for UI components
      - ${analysis.stateManagement} for state
      - ${analysis.routing} for routing

      Follow these patterns from the existing codebase:
      ${JSON.stringify(analysis.patterns, null, 2)}

      Generate:
      1. Component file (index.tsx)
      2. Types file (types.ts)
      3. Route registration code
    `;

    const result = await this.aiRouter.generate(prompt, {
      provider: 'anthropic',
      model: 'claude-sonnet-4-20250514',
      tools: ['cloudflare_docs_search'] // MCP tool
    });

    return result;

}

private async validateWithStagehand(
url: string,
route: string
): Promise<ValidationResult> {
// Call Stagehand worker via RPC
const stagehand = this.env.STAGEHAND.get(
this.env.STAGEHAND.idFromName('validator')
);

    const response = await stagehand.validate({
      url: `${url}${route}`,
      checks: [
        'accessibility',
        'visual-regression',
        'interaction'
      ]
    });

    return response;

}
}

Part 3: Stagehand Service Worker
3.1 Stagehand Architecture
jbishkit-stagehand/
├── src/
│ ├── index.ts # RPC entry point
│ ├── browser/
│ │ ├── playwright.ts # Playwright integration
│ │ └── screenshots.ts # Screenshot capture
│ ├── validation/
│ │ ├── accessibility.ts # A11y checks
│ │ ├── visual.ts # Visual regression
│ │ └── interaction.ts # User interaction simulation
│ ├── vision/
│ │ └── model.ts # Vision model integration
│ └── durable-objects/
│ └── BrowserSession.ts # Browser session management
├── wrangler.jsonc
└── package.json

3.2 RPC Interface
// src/index.ts
export class StagehandValidator extends DurableObject {
async validate(request: ValidationRequest): Promise<ValidationResult> {
const { url, checks } = request;

    const results = {
      passed: true,
      screenshots: [],
      issues: []
    };

    // Launch browser via Browser Rendering API
    const browser = await this.env.BROWSER.launch();
    const page = await browser.newPage();

    try {
      // Navigate to page
      await page.goto(url);

      // Take screenshot
      const screenshot = await page.screenshot({ fullPage: true });
      results.screenshots.push(await this.uploadScreenshot(screenshot));

      // Run checks
      if (checks.includes('accessibility')) {
        const a11yIssues = await this.checkAccessibility(page);
        results.issues.push(...a11yIssues);
      }

      if (checks.includes('interaction')) {
        const interactionIssues = await this.testInteractions(page);
        results.issues.push(...interactionIssues);
      }

      if (checks.includes('visual-regression')) {
        const visualIssues = await this.checkVisualRegression(page, screenshot);
        results.issues.push(...visualIssues);
      }

      results.passed = results.issues.length === 0;
    } finally {
      await browser.close();
    }

    return results;

}

private async checkVisualRegression(
page: any,
screenshot: Buffer
): Promise<string[]> {
// Use vision model to analyze screenshot
const analysis = await this.analyzeWithVision(screenshot);

    const issues: string[] = [];

    // Check for common UI issues
    if (analysis.hasOverlappingElements) {
      issues.push('Overlapping UI elements detected');
    }

    if (analysis.hasUnreadableText) {
      issues.push('Unreadable text due to low contrast');
    }

    if (analysis.hasBrokenLayout) {
      issues.push('Broken layout detected');
    }

    return issues;

}

private async analyzeWithVision(screenshot: Buffer): Promise<any> {
// Use Claude with vision or GPT-4V
const response = await fetch('https://api.anthropic.com/v1/messages', {
method: 'POST',
headers: {
'x-api-key': this.env.ANTHROPIC_API_KEY,
'anthropic-version': '2023-06-01',
'content-type': 'application/json'
},
body: JSON.stringify({
model: 'claude-sonnet-4-20250514',
max_tokens: 1024,
messages: [{
role: 'user',
content: [
{
type: 'image',
source: {
type: 'base64',
media_type: 'image/png',
data: screenshot.toString('base64')
}
},
{
type: 'text',
text: `Analyze this webpage screenshot for UI/UX issues: - Overlapping elements - Unreadable text (low contrast) - Broken layouts - Accessibility concerns

                Return JSON: { hasOverlappingElements, hasUnreadableText, hasBrokenLayout, issues: [] }`
            }
          ]
        }]
      })
    });

    const data = await response.json();
    return JSON.parse(data.content[0].text);

}
}

Part 4: Monorepo Structure (react-starter-kit)
4.1 Project Structure (Borrowed from react-starter-kit)
my-app/
├── .github/
│ └── workflows/
│ ├── ci.yml
│ └── deploy.yml
├── .vscode/
│ └── settings.json
├── apps/
│ ├── web/ # Frontend (Vite + React)
│ │ ├── public/
│ │ ├── src/
│ │ │ ├── pages/
│ │ │ ├── components/
│ │ │ ├── hooks/
│ │ │ ├── routes/
│ │ │ ├── core/ # From react-starter-kit
│ │ │ │ ├── router.tsx
│ │ │ │ └── relay.tsx
│ │ │ ├── App.tsx
│ │ │ └── main.tsx
│ │ ├── vite.config.ts
│ │ └── package.json
│ │
│ └── worker/ # Backend Worker
│ ├── src/
│ │ ├── index.ts
│ │ ├── routes/
│ │ ├── agents/
│ │ ├── health/
│ │ └── durable-objects/
│ ├── wrangler.jsonc
│ └── package.json
│
├── packages/
│ ├── ui/ # Shared UI components
│ ├── types/ # Shared types
│ └── utils/ # Shared utilities
│
├── scripts/
│ ├── build.ts
│ └── deploy.ts
│
├── turbo.json
├── package.json
└── pnpm-workspace.yaml

4.2 Key Patterns from react-starter-kit
Router Setup:

// apps/web/src/core/router.tsx (from react-starter-kit)
import { createBrowserRouter } from 'react-router-dom';

export const router = createBrowserRouter([
{
path: '/',
lazy: () => import('../pages/Home')
},
{
path: '/docs',
lazy: () => import('../pages/Docs')
}
// Auto-generated routes added here by agent
]);

Build Configuration:

// vite.config.ts (from react-starter-kit)
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import relay from 'vite-plugin-relay';

export default defineConfig({
plugins: [react(), relay],
build: {
outDir: 'dist',
sourcemap: true
}
});

Part 5: Task Type Definitions
5.1 Standard Task Types
// Modular task definitions

// 1. Generate Page
interface GeneratePageTask {
type: 'task:generate_page';
args: {
pageName: string;
route: string;
features: string[]; // ['forms', 'charts', 'real-time']
uiLibrary?: string; // 'shadcn', 'mui', 'chakra'
};
}

// 2. Generate Agent
interface GenerateAgentTask {
type: 'task:generate_agent';
args: {
agentName: string;
tools: string[]; // ['pdf-parsing', 'web-search']
providers: string[]; // ['anthropic', 'openai']
capabilities: string[];
};
}

// 3. Lint Fix
interface LintFixTask {
type: 'task:lint_fix';
args: {
files?: string[]; // Specific files or all
rules?: string[]; // Specific rules to fix
};
}

// 4. Health Audit
interface HealthAuditTask {
type: 'task:health_audit';
args: {
comprehensive: boolean; // Full audit or quick check
bindings: string[]; // Which bindings to check
};
}

// 5. Add Binding
interface AddBindingTask {
type: 'task:add_binding';
args: {
bindingType: 'd1' | 'kv' | 'r2' | 'vectorize' | 'queue';
name: string;
suffix?: string;
};
}

// 6. Custom Task
interface CustomTask {
type: 'task:custom';
args: {
description: string; // Natural language task description
files?: string[]; // Files to modify
validation?: boolean; // Run Stagehand validation
};
}

5.2 Modular Health Check Structure
apps/worker/src/
├── features/
│ ├── auth/
│ │ ├── index.ts
│ │ ├── types.ts
│ │ ├── routes.ts
│ │ └── health.ts # Auth-specific health checks
│ ├── agents/
│ │ ├── base-agent/
│ │ │ ├── index.ts
│ │ │ ├── types.ts
│ │ │ └── health.ts # Agent health checks
│ │ └── document-analyzer/
│ │ ├── index.ts
│ │ ├── types.ts
│ │ └── health.ts # Document analyzer health
│ └── storage/
│ ├── index.ts
│ ├── types.ts
│ └── health.ts # Storage (R2/KV) health checks
│
└── health/
├── runner.ts # Aggregates all health checks
├── reporter.ts # D1 logging + WebSocket
└── index.ts # Health API endpoints

Example Health Check (Modular):

// apps/worker/src/features/agents/base-agent/health.ts
import { Env } from '../../../types';

export async function checkAgentHealth(env: Env): Promise<HealthCheckResult> {
const checks = [];

// AI binding check
try {
const result = await env.AI.run('@cf/meta/llama-2-7b-chat-int8', {
prompt: 'test'
});
checks.push({
name: 'ai-binding',
status: 'healthy',
latency: Date.now()
});
} catch (error) {
checks.push({
name: 'ai-binding',
status: 'unhealthy',
error: error.message
});
}

// API keys check
if (!env.ANTHROPIC_API_KEY) {
checks.push({
name: 'anthropic-api-key',
status: 'unhealthy',
error: 'Missing API key'
});
}

return {
module: 'agents/base-agent',
checks,
overall: checks.every(c => c.status === 'healthy') ? 'healthy' : 'unhealthy'
};
}

Part 6: Implementation Priorities
Phase 1: Foundation (Week 1-2)
CLI scaffolding with simple-git, WebSocket client
Basic Worker agent with WebSocket handler
Sandbox SDK integration (basic git clone/commit)
GitHub PR creation
Task message protocol
Phase 2: Core Tasks (Week 3-4)
Generate Page task (with skeleton creation)
Generate Agent task (extending BaseAgent)
Lint Fix task (with MCP Cloudflare docs integration)
Health Audit task (modular health check discovery)
Phase 3: Stagehand Integration (Week 5)
Stagehand Worker (Browser Rendering API)
Visual validation with screenshots
Vision model integration (Claude/GPT-4V)
Accessibility checks
Interaction testing
Phase 4: Monorepo & Templates (Week 6)
react-starter-kit integration
Turborepo setup
Template creation (fullstack-chat, admin-dashboard, etc.)
Vite configuration
Build/deploy scripts
Phase 5: Developer Experience (Week 7-8)
IDE integration (diff display, auto-merge)
PR review flow in CLI
Auto-fix with confidence scoring
Watch mode for lint/health
Comprehensive logging
Part 7: Security & Authentication
7.1 GitHub Authentication
// Use GitHub App installation tokens
const octokit = new Octokit({
auth: process.env.GITHUB_APP_PRIVATE_KEY,
authStrategy: createAppAuth
});

const { data: installation } = await octokit.apps.getInstallation({
installation_id: process.env.GITHUB_APP_INSTALLATION_ID
});

const { data: token } = await octokit.apps.createInstallationAccessToken({
installation_id: installation.id
});

// Use token for git operations

7.2 Worker Authentication
// CLI generates JWT
import jwt from 'jsonwebtoken';

const workerToken = jwt.sign(
{
userId: getCurrentUser(),
repo: getGitHubRepoUrl(),
scope: 'task:execute'
},
process.env.JBISH_SECRET,
{ expiresIn: '1h' }
);

// Worker validates JWT
const decoded = jwt.verify(token, env.JBISH_SECRET);

Success Criteria
CLI
✅ One command scaffolds feature branch + triggers agent
✅ Real-time agent logs displayed in terminal
✅ PR created automatically with validation results
✅ Graceful merge flow (review → approve → pull)
✅ Works with react-starter-kit monorepo structure
Agent
✅ Clones repo in Sandbox SDK
✅ Executes tasks (generate page/agent, lint fix, health audit)
✅ Runs dev server with public URL
✅ Validates with Stagehand (visual + interaction)
✅ Commits + creates PR
✅ Comprehensive logging over WebSocket
Stagehand
✅ Launches browser via Browser Rendering API
✅ Captures screenshots
✅ Analyzes with vision model
✅ Reports accessibility issues
✅ Tests user interactions
Generated Code
✅ Follows project conventions (imports, types, folder structure)
✅ Modular health checks per feature
✅ Auto-registered routes
✅ Passes all validation checks
Start Building
Recommended Order:

CLI with Git + WebSocket (no agent yet, just mock responses)
Worker agent with WebSocket handler (echo messages back)
Sandbox SDK integration (clone repo, commit, push)
Generate Page task (full flow: skeleton → agent completion → PR)
Stagehand Worker (visual validation)
Additional tasks (generate agent, lint fix, health audit)
Monorepo templates with react-starter-kit patterns
First Milestone: CLI can run jbish generate page pricing, agent clones repo, generates basic page, opens PR, and CLI displays the PR URL.
