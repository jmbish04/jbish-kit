import { v4 as uuid } from "uuid";
import { BranchManager } from "../git/branch-manager";
import { CommitHandler } from "../git/commit-handler";
import { WebSocketClient } from "../websocket/client";
import type { TaskMessage } from "../types";
import { promises as fs } from "fs";
import path from "path";
import chalk from "chalk";

export interface GeneratePageOptions {
  route: string;
  features: string[];
  uiLibrary?: string;
  validate?: boolean;
  autoMerge?: boolean;
  verbose?: boolean;
  debug?: boolean;
}

export async function generatePage(
  name: string,
  options: GeneratePageOptions,
): Promise<void> {
  console.log(chalk.blue.bold("\n🚀 JBishKit - Generate Page\n"));

  const branchManager = new BranchManager();
  const commitHandler = new CommitHandler();
  const taskId = uuid();

  try {
    // 1. Create feature branch
    console.log(chalk.gray("→ Creating feature branch..."));
    const branchName = await branchManager.createFeatureBranch(`page-${name}`);
    console.log(chalk.green(`✓ Branch created: ${branchName}`));

    // 2. Create skeleton files
    console.log(chalk.gray("\n→ Creating page skeleton..."));
    await createPageSkeleton(name, options);
    console.log(chalk.green("✓ Skeleton files created"));

    // 3. Commit and push
    console.log(chalk.gray("\n→ Committing changes..."));
    await commitHandler.stageAndCommit(`chore: scaffold ${name} page`);
    await commitHandler.push(branchName, true);
    console.log(chalk.green("✓ Changes pushed to GitHub"));

    // 4. Connect to agent
    console.log(chalk.gray("\n→ Connecting to JBishKit Agent..."));

    const wsClient = new WebSocketClient({
      agentUrl:
        process.env.JBISH_AGENT_URL ||
        "https://jbishkit-agent.workers.dev",
      verbose: options.verbose ?? true,
      debug: options.debug ?? false,
      useMock: true, // Use mock for now until agent is deployed
    });

    await wsClient.connect();

    // 5. Send task to agent
    const repoUrl = await branchManager.getRemoteUrl();
    
    // Validate required environment variables
    const githubToken = process.env.GITHUB_TOKEN;
    if (!githubToken) {
      throw new Error('GITHUB_TOKEN environment variable is not set.');
    }
    
    const taskMessage: TaskMessage = {
      type: "task:generate_page",
      taskId,
      repo: repoUrl,
      branch: branchName,
      auth: {
        github: githubToken,
        worker: generateWorkerJWT(),
      },
      args: {
        pageName: name,
        route: options.route,
        features: options.features || [],
        uiLibrary: options.uiLibrary,
      },
      settings: {
        verbose: options.verbose ?? true,
        debug: options.debug ?? false,
        validateFrontend: options.validate ?? true,
        autoMerge: options.autoMerge ?? false,
      },
    };

    console.log(chalk.blue("\n📡 Sending task to agent...\n"));
    await wsClient.sendTask(taskMessage);

    // 6. Wait for completion
    await wsClient.waitForCompletion();

    wsClient.close();
  } catch (error) {
    console.error(
      chalk.red("\n✗ Error:"),
      error instanceof Error ? error.message : error,
    );
    process.exit(1);
  }
}

async function createPageSkeleton(
  name: string,
  options: GeneratePageOptions,
): Promise<void> {
  const cwd = process.cwd();

  // Determine the app structure
  const webAppPath = path.join(cwd, "apps/web/src/pages");
  const mainAppPath = path.join(cwd, "apps/app/src/pages");

  let targetPath: string;

  // Check which app structure exists
  if (await pathExists(webAppPath)) {
    targetPath = webAppPath;
  } else if (await pathExists(mainAppPath)) {
    targetPath = mainAppPath;
  } else {
    // Default to creating in src/pages
    targetPath = path.join(cwd, "src/pages");
  }

  const pagePath = path.join(targetPath, name);

  // Create directory
  await fs.mkdir(pagePath, { recursive: true });

  // Create index.tsx
  const componentName = capitalize(name);
  const indexContent = `import React from "react";

export function ${componentName}Page() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold">${componentName}</h1>
      <p className="text-muted-foreground mt-2">
        This page was scaffolded by JBishKit. The agent will complete the implementation.
      </p>
      {/* Agent will add implementation here */}
    </div>
  );
}
`;

  await fs.writeFile(path.join(pagePath, "index.tsx"), indexContent);

  // Create types.ts
  const typesContent = `export interface ${componentName}Props {}

export interface ${componentName}Data {}
`;

  await fs.writeFile(path.join(pagePath, "types.ts"), typesContent);

  // Create a marker file for the agent
  const markerContent = JSON.stringify(
    {
      pageName: name,
      route: options.route,
      features: options.features,
      createdAt: new Date().toISOString(),
    },
    null,
    2,
  );

  await fs.writeFile(
    path.join(pagePath, ".jbishkit.json"),
    markerContent,
  );
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

async function pathExists(p: string): Promise<boolean> {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

function generateWorkerJWT(): string {
  // TODO: Implement proper JWT generation
  // For now, return a placeholder
  return "placeholder-jwt-token";
}
