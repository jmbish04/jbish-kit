#!/usr/bin/env node

/**
 * @file CLI entry point for JBish-Kit
 *
 * This CLI provides commands for managing agents and AI modules.
 */

import { Command } from 'commander';
import { addAgent } from './commands/add-agent';
import { addAIModule } from './commands/add-ai-module';

const program = new Command();

program
  .name('jbish')
  .description('JBish-Kit CLI - Cloudflare Workers development toolkit')
  .version('0.0.0');

// Add agent command
program
  .command('add')
  .description('Add new components to your project')
  .addCommand(
    new Command('agent')
      .description('Add a new agent extending BaseAgent')
      .argument('<name>', 'Name of the agent (e.g., DocumentAnalyzer)')
      .option('-d, --dir <directory>', 'Output directory', 'packages/core/agents')
      .option('--tools <tools>', 'Comma-separated list of tools')
      .option('--providers <providers>', 'Comma-separated list of AI providers')
      .action(addAgent),
  )
  .addCommand(
    new Command('core-agent')
      .description('Add a new core agent (alias for add agent)')
      .argument('<name>', 'Name of the agent')
      .option('-d, --dir <directory>', 'Output directory', 'packages/core/agents')
      .option('--tools <tools>', 'Comma-separated list of tools')
      .option('--providers <providers>', 'Comma-separated list of AI providers')
      .action(addAgent),
  )
  .addCommand(
    new Command('ai-module')
      .description('Add a new AI module extending BaseAIModule')
      .argument('<name>', 'Name of the AI module (e.g., TextSummarizer)')
      .option('-d, --dir <directory>', 'Output directory', 'packages/core/ai-modules')
      .option('--providers <providers>', 'Comma-separated list of AI providers', 'anthropic,openai')
      .option('--default-provider <provider>', 'Default AI provider', 'anthropic')
      .option('--default-model <model>', 'Default AI model')
      .action(addAIModule),
  );

program.parse();
