import prompts from "prompts";
import chalk from "chalk";
import { promises as fs } from "fs";
import path from "path";

export interface InitOptions {
  template?: string;
  ai?: string[];
  bindings?: string[];
  monorepo?: boolean;
  githubCreate?: boolean;
  agentUrl?: string;
}

export async function init(
  projectName: string,
  options: InitOptions,
): Promise<void> {
  console.log(chalk.blue.bold("\n🚀 JBishKit - Initialize Project\n"));

  // Interactive prompts if options not provided
  const answers = await prompts([
    {
      type: options.template ? null : "select",
      name: "template",
      message: "Select a template:",
      choices: [
        { title: "Full-stack Chat", value: "fullstack-chat" },
        { title: "Admin Dashboard", value: "admin-dashboard" },
        { title: "API Server", value: "api-server" },
        { title: "SPA Application", value: "spa-app" },
        { title: "Blank", value: "blank" },
      ],
      initial: 0,
    },
    {
      type: options.ai ? null : "multiselect",
      name: "ai",
      message: "Select AI providers:",
      choices: [
        { title: "Anthropic (Claude)", value: "anthropic", selected: true },
        { title: "OpenAI", value: "openai" },
        { title: "Cloudflare AI", value: "cloudflare-ai" },
      ],
    },
    {
      type: options.bindings ? null : "multiselect",
      name: "bindings",
      message: "Select Cloudflare bindings:",
      choices: [
        { title: "D1 (SQL Database)", value: "d1", selected: true },
        { title: "KV (Key-Value)", value: "kv" },
        { title: "R2 (Object Storage)", value: "r2" },
        { title: "Vectorize", value: "vectorize" },
        { title: "Queue", value: "queue" },
      ],
    },
    {
      type: options.githubCreate === undefined ? "confirm" : null,
      name: "githubCreate",
      message: "Create GitHub repository?",
      initial: true,
    },
  ]);

  const config = {
    template: options.template || answers.template,
    ai: options.ai || answers.ai || [],
    bindings: options.bindings || answers.bindings || [],
    githubCreate: options.githubCreate ?? answers.githubCreate ?? false,
    agentUrl: options.agentUrl || "https://jbishkit-agent.workers.dev",
  };

  console.log(chalk.gray("\n→ Creating project structure..."));

  // Create project directory
  const projectPath = path.join(process.cwd(), projectName);
  await fs.mkdir(projectPath, { recursive: true });

  // Copy template files
  await createTemplate(projectPath, config);

  console.log(chalk.green(`\n✓ Project created: ${projectName}`));
  console.log(chalk.blue("\nNext steps:"));
  console.log(chalk.gray(`  cd ${projectName}`));
  console.log(chalk.gray("  bun install"));
  console.log(chalk.gray("  jbish dev"));
}

async function createTemplate(
  projectPath: string,
  config: any,
): Promise<void> {
  // Create basic structure
  const dirs = [
    "apps/web",
    "apps/app",
    "apps/api",
    "packages/ui",
    "packages/core",
    "db",
  ];

  for (const dir of dirs) {
    await fs.mkdir(path.join(projectPath, dir), { recursive: true });
  }

  // Create package.json
  const packageJson = {
    name: path.basename(projectPath),
    version: "0.0.0",
    private: true,
    workspaces: ["apps/*", "packages/*", "db"],
    scripts: {
      dev: "bun --filter @repo/web --filter @repo/api dev",
      build: "bun build",
      deploy: "jbish deploy",
    },
  };

  await fs.writeFile(
    path.join(projectPath, "package.json"),
    JSON.stringify(packageJson, null, 2),
  );

  // Create .jbishkit config
  const jbishkitConfig = {
    version: "0.1.0",
    agentUrl: config.agentUrl,
    template: config.template,
    ai: config.ai,
    bindings: config.bindings,
  };

  await fs.writeFile(
    path.join(projectPath, ".jbishkit.json"),
    JSON.stringify(jbishkitConfig, null, 2),
  );

  console.log(chalk.green("✓ Project structure created"));
}
