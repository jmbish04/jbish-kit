# JBish-Kit CLI Usage Guide

The JBish-Kit CLI provides commands to scaffold and manage agents and AI modules for your Cloudflare Workers project.

## Installation

The CLI is included in the monorepo. No additional installation is needed.

## Available Commands

### Add Agent

Create a new agent that extends `BaseAgent`:

```bash
npm run cli add agent <name> [options]
```

**Arguments:**

- `<name>` - Name of the agent (e.g., DocumentAnalyzer, WebScraper)
  - Must start with an uppercase letter
  - Will automatically append "Agent" suffix if not present

**Options:**

- `-d, --dir <directory>` - Output directory (default: `packages/core/agents`)
- `--tools <tools>` - Comma-separated list of tools the agent uses
- `--providers <providers>` - Comma-separated list of AI providers

**Examples:**

```bash
# Create a basic agent
npm run cli add agent DocumentAnalyzer

# Create an agent with tools and providers
npm run cli add agent WebScraper --tools "puppeteer,cheerio" --providers "anthropic,openai"

# Create an agent in a custom directory
npm run cli add agent CustomAgent --dir apps/api/agents
```

**What gets created:**

```
packages/core/agents/
└── DocumentAnalyzerAgent.ts   # Full agent implementation with:
    ├── BaseAgent extension
    ├── Type definitions (Input/Output)
    ├── execute() method (to implement)
    ├── Lifecycle hooks
    └── Comprehensive documentation
```

### Add Core Agent

Alias for `add agent`:

```bash
npm run cli add core-agent <name> [options]
```

### Add AI Module

Create a new AI module that extends `BaseAIModule`:

```bash
npm run cli add ai-module <name> [options]
```

**Arguments:**

- `<name>` - Name of the AI module (e.g., TextSummarizer, CodeAnalyzer)
  - Must start with an uppercase letter
  - Will automatically append "Module" suffix if not present

**Options:**

- `-d, --dir <directory>` - Output directory (default: `packages/core/ai-modules`)
- `--providers <providers>` - Comma-separated AI providers (default: `anthropic,openai`)
- `--default-provider <provider>` - Default AI provider (default: first in list)
- `--default-model <model>` - Default AI model to use

**Examples:**

```bash
# Create a basic AI module
npm run cli add ai-module TextSummarizer

# Create an AI module with specific providers and model
npm run cli add ai-module CodeReviewer \
  --providers "anthropic,openai,cloudflare" \
  --default-provider "anthropic" \
  --default-model "claude-3-sonnet-20240229"

# Create an AI module in a custom directory
npm run cli add ai-module CustomModule --dir apps/api/ai-modules
```

**What gets created:**

```
packages/core/ai-modules/
└── TextSummarizerModule.ts   # Full AI module with:
    ├── BaseAIModule extension
    ├── Type definitions (Input/Output)
    ├── process() method (to implement)
    ├── AI provider integration stubs
    ├── Prompt templating helpers
    └── Comprehensive documentation
```

## Quick Start Examples

### Creating and Using an Agent

1. **Create the agent:**

```bash
npm run cli add agent DocumentParser --tools "pdf-lib"
```

2. **Implement the logic:**

Edit `packages/core/agents/DocumentParserAgent.ts`:

```typescript
protected async execute(input: DocumentParserAgentInput): Promise<DocumentParserAgentOutput> {
  this.log('Parsing document...');

  const content = await this.parseDocument(input.url);
  const metadata = this.extractMetadata(content);

  return {
    content,
    metadata
  };
}
```

3. **Use the agent:**

```typescript
import { DocumentParserAgent } from "@repo/core/agents/DocumentParserAgent";

const agent = new DocumentParserAgent();
const result = await agent.run({ url: "https://example.com/doc.pdf" });

if (result.success) {
  console.log("Parsed:", result.data);
}
```

### Creating and Using an AI Module

1. **Create the module:**

```bash
npm run cli add ai-module TextSummarizer
```

2. **Implement the AI logic:**

Edit `packages/core/ai-modules/TextSummarizerModule.ts`:

```typescript
protected async process(input: TextSummarizerModuleInput): Promise<TextSummarizerModuleOutput> {
  const prompt = `Summarize this text in ${input.maxWords || 100} words:\n\n${input.text}`;

  const response = await this.callAI({
    prompt,
    provider: this.config.defaultProvider!,
    model: 'claude-3-haiku-20240307',
    temperature: 0.3,
    maxTokens: 200
  });

  return {
    summary: response.content.trim(),
    originalLength: input.text.length,
    summaryLength: response.content.length
  };
}
```

3. **Use the module:**

```typescript
import { TextSummarizerModule } from "@repo/core/ai-modules/TextSummarizerModule";

const module = new TextSummarizerModule();
const result = await module.run({
  text: "Long text to summarize...",
  maxWords: 50,
});

if (result.success) {
  console.log("Summary:", result.data.summary);
  console.log("Tokens used:", result.metadata?.totalTokens);
}
```

## Testing

### Run Tests

```bash
# Test CLI commands
npm run cli:test

# Test core functionality (agents and AI modules)
npm run core:test

# Run all tests
npm test
```

### Write Tests

Tests are automatically generated alongside your implementations:

- Agent tests: `packages/core/agents/YourAgent.test.ts`
- AI module tests: `packages/core/ai-modules/YourModule.test.ts`

## Project Structure

After creating agents and AI modules, your structure will look like:

```
packages/
├── cli/                      # CLI tool
│   ├── src/
│   │   ├── cli.ts           # Main CLI entry
│   │   ├── commands/         # Command implementations
│   │   └── templates/        # Code generation templates
│   └── package.json
│
├── core/                     # Core package
│   ├── agents/              # All agents
│   │   ├── BaseAgent.ts     # Base class for agents
│   │   ├── README.md        # Agent documentation
│   │   └── *.ts             # Your custom agents
│   │
│   ├── ai-modules/          # All AI modules
│   │   ├── BaseAIModule.ts  # Base class for AI modules
│   │   ├── README.md        # AI module documentation
│   │   └── *.ts             # Your custom AI modules
│   │
│   └── index.ts             # Core package exports
│
└── ...
```

## Best Practices

### Agents

1. **Single Responsibility**: Each agent should have one clear purpose
2. **Type Safety**: Define specific input/output types
3. **Logging**: Use `this.log()` for debugging and monitoring
4. **Error Handling**: Throw errors for exceptional cases
5. **Testing**: Write tests for each agent

### AI Modules

1. **Clear Prompts**: Use specific, well-crafted prompts
2. **Provider Fallback**: Support multiple AI providers
3. **Token Management**: Set appropriate `maxTokens` limits
4. **Cost Tracking**: Monitor usage via statistics
5. **Response Parsing**: Validate and parse AI responses

## Environment Variables

For AI modules that use external providers, set these environment variables:

```bash
# Anthropic
ANTHROPIC_API_KEY=your_key_here

# OpenAI
OPENAI_API_KEY=your_key_here

# Cloudflare (when using Workers AI)
# Configured automatically in Cloudflare Workers
```

## Troubleshooting

### "Command not found"

Make sure you're running commands from the project root:

```bash
cd /path/to/jbish-kit
npm run cli add agent MyAgent
```

### "Agent/Module already exists"

The CLI prevents overwriting existing files. Either:

1. Delete the existing file first
2. Choose a different name
3. Manually edit the existing file

### TypeScript Errors

After creating new agents/modules, run:

```bash
npm run typecheck
```

## Next Steps

1. **Explore Examples**: Check the README files in:
   - `packages/core/agents/README.md`
   - `packages/core/ai-modules/README.md`

2. **Read Documentation**: See the inline comments in generated files

3. **Write Tests**: Add tests for your implementations

4. **Integrate**: Use your agents and modules in:
   - API endpoints
   - Worker functions
   - CLI commands
   - Scheduled tasks

## Support

For issues or questions:

- Check the generated code comments
- Review the base class implementations
- Consult the main project README
- Open an issue on GitHub

---

**Happy Building! 🚀**
