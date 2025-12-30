# Agents Directory

This directory contains all agent implementations for the JBish-Kit system.

## What is an Agent?

An agent is a specialized module that performs specific tasks autonomously. All agents extend the `BaseAgent` class, which provides:

- **Lifecycle Management**: Initialize, execute, and cleanup methods
- **Error Handling**: Built-in error catching and reporting
- **Logging**: Automatic logging of agent activities
- **Configuration**: Standardized configuration interface
- **Type Safety**: Full TypeScript support with generics

## Creating a New Agent

### Using the CLI (Recommended)

```bash
bun run jbish add agent <agent-name>
```

This will automatically create a new agent file with the proper structure.

### Manual Creation

1. Create a new file in this directory: `MyAgent.ts`
2. Import and extend `BaseAgent`:

```typescript
import { BaseAgent, AgentConfig, AgentResult } from './BaseAgent';

/**
 * MyAgent - Brief description of what this agent does
 * 
 * This agent handles [specific task] by [method].
 * 
 * @example
 * ```typescript
 * const agent = new MyAgent();
 * const result = await agent.run({ input: 'data' });
 * if (result.success) {
 *   console.log('Output:', result.data);
 * }
 * ```
 */
export class MyAgent extends BaseAgent<InputType, OutputType> {
  constructor() {
    super('MyAgent', {
      description: 'Brief description of the agent',
      version: '1.0.0',
      capabilities: ['capability1', 'capability2'],
      tools: ['tool1', 'tool2'],
      providers: ['anthropic', 'openai']
    });
  }

  /**
   * Optional: Override for custom initialization
   */
  protected async onInitialize(): Promise<void> {
    // Setup resources, connections, etc.
    this.log('Performing custom initialization...');
  }

  /**
   * Required: Implement the core agent logic
   */
  protected async execute(input: InputType): Promise<OutputType> {
    this.log('Processing input...');
    
    // Your agent logic here
    const result = await this.processData(input);
    
    this.log('Processing complete');
    return result;
  }

  /**
   * Optional: Override for custom cleanup
   */
  protected async onCleanup(): Promise<void> {
    // Clean up resources, close connections, etc.
    this.log('Performing custom cleanup...');
  }

  /**
   * Helper methods for your agent
   */
  private async processData(input: InputType): Promise<OutputType> {
    // Implementation details
  }
}
```

## Agent Structure Best Practices

### 1. Clear Naming
- Use descriptive names that indicate the agent's purpose
- Follow PascalCase convention: `DocumentAnalyzerAgent`, `WebScraperAgent`

### 2. Comprehensive Documentation
- Add JSDoc comments explaining what the agent does
- Include usage examples
- Document input/output types clearly

### 3. Type Safety
- Define specific input and output types
- Use TypeScript generics: `BaseAgent<InputType, OutputType>`
- Export your types for consumers

### 4. Error Handling
- Use try-catch blocks within `execute()` for specific error cases
- Throw meaningful errors with context
- The base class will catch and wrap errors automatically

### 5. Logging
- Use `this.log()` for important events
- Keep logs concise and informative
- Logs are automatically included in the result metadata

### 6. Configuration
- Include all relevant config in the constructor
- Document available tools and providers
- List capabilities clearly

## Example Agents

### Simple Agent

```typescript
export class GreeterAgent extends BaseAgent<string, string> {
  constructor() {
    super('GreeterAgent', {
      description: 'A simple agent that greets users',
      version: '1.0.0'
    });
  }

  protected async execute(name: string): Promise<string> {
    return `Hello, ${name}!`;
  }
}
```

### Complex Agent with Dependencies

```typescript
interface DocumentInput {
  url: string;
  format: 'pdf' | 'docx' | 'txt';
}

interface DocumentOutput {
  text: string;
  metadata: {
    pages: number;
    wordCount: number;
  };
}

export class DocumentParserAgent extends BaseAgent<DocumentInput, DocumentOutput> {
  private parser: DocumentParser;

  constructor() {
    super('DocumentParserAgent', {
      description: 'Extracts text and metadata from documents',
      version: '1.0.0',
      capabilities: ['pdf-parsing', 'docx-parsing', 'text-extraction'],
      tools: ['pdf-lib', 'mammoth']
    });
  }

  protected async onInitialize(): Promise<void> {
    // Initialize parser with configuration
    this.parser = new DocumentParser({
      maxFileSize: 10 * 1024 * 1024, // 10MB
      timeout: 30000 // 30 seconds
    });
  }

  protected async execute(input: DocumentInput): Promise<DocumentOutput> {
    this.log(`Parsing document from ${input.url}`);
    
    // Download document
    const buffer = await this.downloadDocument(input.url);
    
    // Parse based on format
    const text = await this.parser.parse(buffer, input.format);
    
    // Extract metadata
    const metadata = this.extractMetadata(text);
    
    this.log(`Parsed ${metadata.pages} pages, ${metadata.wordCount} words`);
    
    return { text, metadata };
  }

  protected async onCleanup(): Promise<void> {
    // Clean up parser resources
    await this.parser.dispose();
  }

  private async downloadDocument(url: string): Promise<Buffer> {
    // Implementation
  }

  private extractMetadata(text: string) {
    // Implementation
  }
}
```

## Testing Your Agent

Create a test file alongside your agent:

```typescript
// MyAgent.test.ts
import { describe, it, expect } from 'vitest';
import { MyAgent } from './MyAgent';

describe('MyAgent', () => {
  it('should execute successfully with valid input', async () => {
    const agent = new MyAgent();
    const result = await agent.run({ /* input */ });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should handle errors gracefully', async () => {
    const agent = new MyAgent();
    const result = await agent.run({ /* invalid input */ });
    
    expect(result.success).toBe(false);
    expect(result.error).toBeDefined();
  });
});
```

## Integration with Other Systems

Agents can be used in various contexts:

### In API Endpoints
```typescript
import { MyAgent } from '@repo/core/agents';

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const agent = new MyAgent();
    const input = await request.json();
    const result = await agent.run(input);
    
    return Response.json(result);
  }
};
```

### In CLI Commands
```typescript
import { MyAgent } from '@repo/core/agents';

export async function handleCommand(args: any) {
  const agent = new MyAgent();
  const result = await agent.run(args);
  
  if (result.success) {
    console.log('Success:', result.data);
  } else {
    console.error('Error:', result.error);
  }
}
```

### In Worker Tasks
```typescript
import { MyAgent } from '@repo/core/agents';

export async function scheduledHandler(event: ScheduledEvent) {
  const agent = new MyAgent();
  const result = await agent.run({ scheduled: true });
  
  // Process result...
}
```

## Extending Functionality

The BaseAgent class is designed to be extensible. You can:

1. **Add Middleware**: Create decorator functions to add behavior
2. **Create Specialized Base Classes**: Extend BaseAgent for specific domains
3. **Compose Agents**: Have agents call other agents
4. **Add Hooks**: Use onInitialize and onCleanup for lifecycle events

## Need Help?

- Check the BaseAgent source code for implementation details
- Review existing agents in this directory for examples
- Consult the main project documentation
- Use the CLI to generate boilerplate code

---

**Note**: This directory is part of the `@repo/core` package and is shared across all applications in the monorepo.
