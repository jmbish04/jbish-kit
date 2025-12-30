#!/usr/bin/env bun
/**
 * @file CLI entry point for JBish-Kit
 *
 * This CLI provides commands for managing agents, AI modules, and code generation.
 */

import { Command } from "commander";
import chalk from "chalk";
import { init } from "./commands/init";
import { generatePage } from "./commands/generate";
import { addAgent } from "./commands/add-agent";
import { addAIModule } from "./commands/add-ai-module";

const program = new Command();

program
  .name("jbish")
  .description("JBishKit - Cloudflare Workers development toolkit with AI agents")
  .version("0.1.0");

// Init command
program
  .command("init <name>")
  .description("Initialize a new JBishKit project")
  .option("-t, --template <template>", "Project template")
  .option("--ai <providers...>", "AI providers to include")
  .option("--bindings <types...>", "Cloudflare bindings to include")
  .option("--monorepo", "Use monorepo structure")
  .option("--github-create", "Create GitHub repository")
  .option("--agent-url <url>", "Worker agent URL")
  .action(async (name, options) => {
    await init(name, options);
  });

// Generate commands
const generate = program
  .command("generate")
  .alias("g")
  .description("Generate code with AI agent");

generate
  .command("page <name>")
  .description("Generate a new page")
  .option("-r, --route <path>", "Route path", "/")
  .option("-f, --features <features...>", "Features to include", [])
  .option("--ui-library <library>", "UI library to use")
  .option("--no-validate", "Skip frontend validation")
  .option("--auto-merge", "Auto-merge PR if validation passes")
  .option("--verbose", "Verbose logging", true)
  .option("--debug", "Debug logging", false)
  .action(async (name, options) => {
    await generatePage(name, {
      route: options.route,
      features: options.features,
      uiLibrary: options.uiLibrary,
      validate: options.validate,
      autoMerge: options.autoMerge,
      verbose: options.verbose,
      debug: options.debug,
    });
  });

generate
  .command("agent <name>")
  .description("Generate a new AI agent")
  .option("-t, --tools <tools...>", "Tools to include", [])
  .option("-p, --providers <providers...>", "AI providers", ["anthropic"])
  .option("-c, --capabilities <capabilities...>", "Agent capabilities", [])
  .action(async (name, options) => {
    console.log(chalk.blue("Generating agent:", name));
    console.log("Options:", options);
    // TODO: Implement generateAgent
  });

// Health commands
const health = program
  .command("health")
  .description("Health check system");

health
  .command("audit")
  .description("Run comprehensive health audit")
  .option("--comprehensive", "Full audit", false)
  .option("--bindings <bindings...>", "Bindings to check", [])
  .action(async (options) => {
    console.log(chalk.blue("Running health audit..."));
    console.log("Options:", options);
    // TODO: Implement health audit
  });

health
  .command("status")
  .description("View current health status")
  .action(async () => {
    console.log(chalk.blue("Health status:"));
    // TODO: Implement health status
  });

// Lint command
program
  .command("lint")
  .description("Lint and fix code with AI agent")
  .option("--auto-fix", "Auto-approve agent fixes", false)
  .option("--watch", "Watch mode with auto-fixing", false)
  .option("--files <files...>", "Specific files to lint")
  .action(async (options) => {
    console.log(chalk.blue("Running lint..."));
    console.log("Options:", options);
    // TODO: Implement lint
  });

// Deploy command
program
  .command("deploy [env]")
  .description("Deploy to Cloudflare")
  .option("--preview", "Deploy preview with validation")
  .action(async (env, options) => {
    console.log(chalk.blue("Deploying to:", env || "production"));
    console.log("Options:", options);
    // TODO: Implement deploy
  });

// Add commands for scaffolding agents and AI modules
const add = program
  .command("add")
  .description("Add new components to your project");

add
  .command("agent <name>")
  .description("Add a new agent extending BaseAgent")
  .option("-d, --dir <directory>", "Output directory", "packages/core/agents")
  .option("--tools <tools>", "Comma-separated list of tools")
  .option("--providers <providers>", "Comma-separated list of AI providers")
  .action(addAgent);

add
  .command("core-agent <name>")
  .description("Add a new core agent (alias for add agent)")
  .option("-d, --dir <directory>", "Output directory", "packages/core/agents")
  .option("--tools <tools>", "Comma-separated list of tools")
  .option("--providers <providers>", "Comma-separated list of AI providers")
  .action(addAgent);

add
  .command("ai-module <name>")
  .description("Add a new AI module extending BaseAIModule")
  .option("-d, --dir <directory>", "Output directory", "packages/core/ai-modules")
  .option("--providers <providers>", "Comma-separated list of AI providers", "anthropic,openai")
  .option("--default-provider <provider>", "Default AI provider", "anthropic")
  .option("--default-model <model>", "Default AI model")
  .action(addAIModule);

program.parse();
