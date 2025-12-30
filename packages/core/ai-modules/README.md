# AI Modules Directory

This directory contains all AI module implementations for the JBish-Kit system.

## What is an AI Module?

An AI module is a specialized component that leverages AI capabilities to perform intelligent tasks. All AI modules extend the `BaseAIModule` class, which provides:

- **Multi-Provider Support**: Integration with multiple AI providers (Anthropic, OpenAI, Cloudflare AI, etc.)
- **Prompt Management**: Template-based prompt generation
- **Response Processing**: Structured handling of AI responses
- **Token Tracking**: Automatic tracking of AI usage and costs
- **Error Handling**: Robust error handling with retries
- **Type Safety**: Full TypeScript support with generics

## Creating a New AI Module

### Using the CLI (Recommended)

```bash
bun run jbish add ai-module <module-name>
```

This will automatically create a new AI module file with the proper structure.

### Manual Creation

1. Create a new file in this directory: `MyAIModule.ts`
2. Import and extend `BaseAIModule`:

```typescript
import { BaseAIModule, AIModuleConfig, AICallOptions } from './BaseAIModule';

/**
 * MyAIModule - Brief description of what this AI module does
 * 
 * This module uses AI to [specific task] by [method].
 * 
 * @example
 * ```typescript
 * const module = new MyAIModule();
 * const result = await module.run({ input: 'data' });
 * if (result.success) {
 *   console.log('Output:', result.data);
 * }
 * ```
 */
export class MyAIModule extends BaseAIModule<InputType, OutputType> {
  constructor() {
    super('MyAIModule', {
      description: 'Brief description of the AI module',
      version: '1.0.0',
      providers: ['anthropic', 'openai', 'cloudflare'],
      defaultProvider: 'anthropic',
      defaultModel: 'claude-3-sonnet-20240229',
      capabilities: ['text-generation', 'analysis']
    });
  }

  /**
   * Optional: Override for custom initialization
   */
  protected async onInitialize(): Promise<void> {
    // Setup resources, load models, etc.
  }

  /**
   * Required: Implement the core processing logic
   */
  protected async process(input: InputType): Promise<OutputType> {
    // Call AI with your prompt
    const response = await this.callAI({
      prompt: this.buildPrompt(input),
      provider: this.config.defaultProvider!,
      model: this.config.defaultModel!,
      temperature: 0.7,
      maxTokens: 1000
    });

    // Process the AI response
    return this.parseResponse(response.content);
  }

  /**
   * Helper: Build prompt from input
   */
  private buildPrompt(input: InputType): string {
    const template = `You are an expert at {{task}}.
    
Input: {{input}}

Please provide {{output_type}}.`;

    return this.formatPrompt(template, {
      task: 'your task',
      input: JSON.stringify(input),
      output_type: 'your output format'
    });
  }

  /**
   * Helper: Parse AI response into structured output
   */
  private parseResponse(content: string): OutputType {
    // Parse and structure the response
    return JSON.parse(content);
  }
}
```

## AI Module Best Practices

### 1. Clear Purpose
- Each module should have a single, well-defined purpose
- Name modules descriptively: `TextSummarizerModule`, `CodeAnalyzerModule`

### 2. Prompt Engineering
- Use clear, specific prompts
- Include examples in your prompts when helpful
- Use the `formatPrompt()` helper for template-based prompts

### 3. Provider Configuration
- Support multiple providers for resilience
- Set sensible defaults for provider and model
- Document which providers work best for your use case

### 4. Response Handling
- Always validate AI responses
- Handle malformed responses gracefully
- Parse structured data (JSON) when possible

### 5. Error Handling
- Implement retry logic for transient failures
- Provide meaningful error messages
- Log failed AI calls for debugging

### 6. Cost Management
- Monitor token usage via statistics
- Set appropriate maxTokens limits
- Consider caching responses for repeated queries

## Example AI Modules

### Simple Text Processing Module

```typescript
interface SummaryInput {
  text: string;
  maxLength?: number;
}

export class TextSummarizerModule extends BaseAIModule<SummaryInput, string> {
  constructor() {
    super('TextSummarizer', {
      description: 'Summarizes long text into concise summaries',
      version: '1.0.0',
      providers: ['anthropic', 'openai'],
      defaultProvider: 'anthropic',
      defaultModel: 'claude-3-haiku-20240307', // Fast and cost-effective
      capabilities: ['text-summarization']
    });
  }

  protected async process(input: SummaryInput): Promise<string> {
    const maxLength = input.maxLength || 200;
    
    const response = await this.callAI({
      prompt: `Summarize the following text in ${maxLength} words or less:\n\n${input.text}`,
      provider: this.config.defaultProvider!,
      model: this.config.defaultModel!,
      temperature: 0.3, // Lower temperature for consistent summaries
      maxTokens: Math.ceil(maxLength * 1.5) // Words to tokens approximation
    });

    return response.content.trim();
  }
}
```

### Complex Multi-Step Module

```typescript
interface CodeReviewInput {
  code: string;
  language: string;
  context?: string;
}

interface CodeReviewOutput {
  issues: Array<{
    line: number;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }>;
  overallRating: number;
  summary: string;
}

export class CodeReviewerModule extends BaseAIModule<CodeReviewInput, CodeReviewOutput> {
  constructor() {
    super('CodeReviewer', {
      description: 'AI-powered code review with suggestions',
      version: '1.0.0',
      providers: ['anthropic', 'openai'],
      defaultProvider: 'anthropic',
      defaultModel: 'claude-3-sonnet-20240229',
      capabilities: ['code-analysis', 'security-review', 'best-practices']
    });
  }

  protected async process(input: CodeReviewInput): Promise<CodeReviewOutput> {
    // Step 1: Analyze for issues
    const issuesPrompt = this.buildIssuesPrompt(input);
    const issuesResponse = await this.callAI({
      prompt: issuesPrompt,
      provider: this.config.defaultProvider!,
      model: this.config.defaultModel!,
      temperature: 0.2, // Low temperature for consistent analysis
      maxTokens: 2000
    });

    const issues = this.parseIssues(issuesResponse.content);

    // Step 2: Generate overall summary
    const summaryPrompt = this.buildSummaryPrompt(input, issues);
    const summaryResponse = await this.callAI({
      prompt: summaryPrompt,
      provider: this.config.defaultProvider!,
      model: this.config.defaultModel!,
      temperature: 0.5,
      maxTokens: 500
    });

    return {
      issues,
      overallRating: this.calculateRating(issues),
      summary: summaryResponse.content.trim()
    };
  }

  private buildIssuesPrompt(input: CodeReviewInput): string {
    return this.formatPrompt(
      `Review the following {{language}} code for:
- Bugs and errors
- Security vulnerabilities
- Performance issues
- Best practice violations
- Code style issues

{{context}}

Code:
\`\`\`{{language}}
{{code}}
\`\`\`

Return a JSON array of issues with format:
[{ "line": number, "severity": "error|warning|info", "message": string, "suggestion": string }]`,
      {
        language: input.language,
        code: input.code,
        context: input.context ? `Context: ${input.context}\n` : ''
      }
    );
  }

  private buildSummaryPrompt(input: CodeReviewInput, issues: any[]): string {
    return `Based on the code review that found ${issues.length} issues, provide a brief summary of the code quality and main areas for improvement.`;
  }

  private parseIssues(content: string): CodeReviewOutput['issues'] {
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/) || 
                       content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[1] || jsonMatch[0]);
      }
      return [];
    } catch {
      return [];
    }
  }

  private calculateRating(issues: any[]): number {
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;
    
    // Simple rating algorithm: 10 - (errors * 2) - (warnings * 0.5)
    const rating = Math.max(0, 10 - (errorCount * 2) - (warningCount * 0.5));
    return Math.round(rating * 10) / 10;
  }
}
```

## Provider Integration

### Implementing Real AI Providers

To use actual AI providers, override the `makeAIRequest` method:

```typescript
protected async makeAIRequest(options: AICallOptions): Promise<AIResponse> {
  if (options.provider === 'anthropic') {
    return this.callAnthropic(options);
  } else if (options.provider === 'openai') {
    return this.callOpenAI(options);
  } else if (options.provider === 'cloudflare') {
    return this.callCloudflareAI(options);
  }
  
  throw new Error(`Unsupported provider: ${options.provider}`);
}

private async callAnthropic(options: AICallOptions): Promise<AIResponse> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
      'content-type': 'application/json'
    },
    body: JSON.stringify({
      model: options.model,
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature || 0.7,
      system: options.systemPrompt,
      messages: [{ role: 'user', content: options.prompt }]
    })
  });

  const data = await response.json();
  
  return {
    content: data.content[0].text,
    provider: 'anthropic',
    model: options.model,
    metadata: {
      tokens: data.usage.input_tokens + data.usage.output_tokens,
      finishReason: data.stop_reason
    }
  };
}
```

## Testing AI Modules

Create test files with mocked AI responses:

```typescript
// MyAIModule.test.ts
import { describe, it, expect, vi } from 'vitest';
import { MyAIModule } from './MyAIModule';

describe('MyAIModule', () => {
  it('should process input successfully', async () => {
    const module = new MyAIModule();
    
    // Mock the AI call
    vi.spyOn(module as any, 'makeAIRequest').mockResolvedValue({
      content: 'Mocked AI response',
      provider: 'anthropic',
      model: 'claude-3-sonnet-20240229',
      metadata: { tokens: 100 }
    });

    const result = await module.run({ /* input */ });
    
    expect(result.success).toBe(true);
    expect(result.data).toBeDefined();
  });

  it('should track AI usage statistics', async () => {
    const module = new MyAIModule();
    
    vi.spyOn(module as any, 'makeAIRequest').mockResolvedValue({
      content: 'Response',
      provider: 'anthropic',
      model: 'test',
      metadata: { tokens: 50 }
    });

    await module.run({ /* input */ });
    
    const stats = module.getStats();
    expect(stats.totalCalls).toBeGreaterThan(0);
    expect(stats.totalTokens).toBeGreaterThan(0);
  });
});
```

## Integration Examples

### In API Routes

```typescript
import { TextSummarizerModule } from '@repo/core/ai-modules';

export default {
  async fetch(request: Request): Promise<Response> {
    const { text } = await request.json();
    
    const module = new TextSummarizerModule();
    const result = await module.run({ text, maxLength: 150 });
    
    if (!result.success) {
      return Response.json({ error: result.error }, { status: 500 });
    }
    
    return Response.json({ summary: result.data });
  }
};
```

### In Worker Agents

```typescript
import { CodeReviewerModule } from '@repo/core/ai-modules';
import { BaseAgent } from '@repo/core/agents';

export class CodeReviewAgent extends BaseAgent {
  private reviewer = new CodeReviewerModule();

  protected async execute(input: any): Promise<any> {
    await this.reviewer.initialize();
    
    const result = await this.reviewer.run({
      code: input.code,
      language: input.language,
      context: input.context
    });
    
    return result.data;
  }
}
```

## Cost Optimization Tips

1. **Choose the Right Model**: Use smaller/faster models (like Claude Haiku or GPT-3.5) when possible
2. **Limit Token Usage**: Set appropriate `maxTokens` based on expected output length
3. **Cache Responses**: Implement caching for repeated or similar queries
4. **Batch Requests**: Process multiple items in a single AI call when possible
5. **Monitor Usage**: Regularly check module statistics to identify high-usage areas

## Need Help?

- Check the BaseAIModule source code for implementation details
- Review existing AI modules in this directory for examples
- Consult the AI provider documentation for specific features
- Use the CLI to generate boilerplate code

---

**Note**: This directory is part of the `@repo/core` package and is shared across all applications in the monorepo.
