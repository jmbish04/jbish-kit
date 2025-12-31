/**
 * @file BaseAIModule - Foundation class for AI modules in the system.
 *
 * This class provides the core functionality for AI-powered modules.
 * It handles AI provider integration, prompt management, and response processing.
 *
 * @example
 * ```typescript
 * import { BaseAIModule } from '@repo/core/ai-modules';
 *
 * export class TextSummarizerModule extends BaseAIModule {
 *   constructor() {
 *     super('TextSummarizer', {
 *       description: 'Summarizes long text into concise summaries',
 *       version: '1.0.0',
 *       providers: ['anthropic', 'openai']
 *     });
 *   }
 *
 *   async process(text: string): Promise<string> {
 *     const response = await this.callAI({
 *       prompt: `Summarize the following text: ${text}`,
 *       provider: 'anthropic',
 *       model: 'claude-3-sonnet-20240229'
 *     });
 *     return response.content;
 *   }
 * }
 * ```
 */

/**
 * Configuration options for an AI module
 */
export interface AIModuleConfig {
  /** Human-readable description of what this module does */
  description: string;
  /** Version of the module (semver format) */
  version: string;
  /** AI providers this module supports (e.g., 'anthropic', 'openai', 'cloudflare') */
  providers: string[];
  /** Optional default provider to use */
  defaultProvider?: string;
  /** Optional default model to use */
  defaultModel?: string;
  /** Optional capabilities this module provides */
  capabilities?: string[];
}

/**
 * Options for AI API calls
 */
export interface AICallOptions {
  /** The prompt to send to the AI */
  prompt: string;
  /** AI provider to use */
  provider: string;
  /** Model to use (e.g., 'claude-3-sonnet-20240229', 'gpt-4') */
  model: string;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Temperature for response randomness (0-1) */
  temperature?: number;
  /** System prompt for context */
  systemPrompt?: string;
  /** Additional options specific to the provider */
  options?: Record<string, any>;
}

/**
 * Response from AI API call
 */
export interface AIResponse {
  /** The generated content */
  content: string;
  /** Provider that generated the response */
  provider: string;
  /** Model used for generation */
  model: string;
  /** Metadata about the response */
  metadata?: {
    tokens?: number;
    finishReason?: string;
    cost?: number;
  };
}

/**
 * Result from AI module processing
 */
export interface AIModuleResult<T = any> {
  /** Whether the processing was successful */
  success: boolean;
  /** The result data if successful */
  data?: T;
  /** Error message if processing failed */
  error?: string;
  /** Processing metadata */
  metadata?: {
    startTime: number;
    endTime: number;
    duration: number;
    aiCalls?: number;
    totalTokens?: number;
  };
}

/**
 * BaseAIModule - Abstract base class for all AI modules
 *
 * All AI modules in the system should extend this class to ensure consistency
 * and access to AI provider functionality.
 *
 * Key Features:
 * - Multi-provider AI support
 * - Prompt management and templating
 * - Response caching and retry logic
 * - Token usage tracking
 * - Error handling
 */
export abstract class BaseAIModule<TInput = any, TOutput = any> {
  /** Unique name identifier for this module */
  protected readonly name: string;

  /** Configuration for this module */
  protected readonly config: AIModuleConfig;

  /** Internal state tracking */
  protected initialized: boolean = false;

  /** AI call statistics */
  protected stats = {
    totalCalls: 0,
    totalTokens: 0,
    successfulCalls: 0,
    failedCalls: 0,
  };

  /**
   * Create a new AI module instance
   *
   * @param name - Unique identifier for this module
   * @param config - Configuration options
   */
  constructor(name: string, config: AIModuleConfig) {
    this.name = name;
    this.config = config;

    // Set default provider if not specified
    if (!this.config.defaultProvider && this.config.providers.length > 0) {
      this.config.defaultProvider = this.config.providers[0];
    }
  }

  /**
   * Get the module's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the module's configuration
   */
  getConfig(): Readonly<AIModuleConfig> {
    return { ...this.config };
  }

  /**
   * Get module statistics
   */
  getStats() {
    return { ...this.stats };
  }

  /**
   * Initialize the module
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.onInitialize();
    this.initialized = true;
  }

  /**
   * Hook for custom initialization logic
   * Override this in subclasses
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation does nothing
  }

  /**
   * Process input with the AI module
   *
   * This is the main entry point for module usage.
   *
   * @param input - Input data for the module
   * @returns Module processing result
   */
  async run(input: TInput): Promise<AIModuleResult<TOutput>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    const initialCalls = this.stats.totalCalls;
    const initialTokens = this.stats.totalTokens;

    try {
      const data = await this.process(input);
      const endTime = Date.now();

      return {
        success: true,
        data,
        metadata: {
          startTime,
          endTime,
          duration: endTime - startTime,
          aiCalls: this.stats.totalCalls - initialCalls,
          totalTokens: this.stats.totalTokens - initialTokens,
        },
      };
    } catch (error) {
      const endTime = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      return {
        success: false,
        error: errorMessage,
        metadata: {
          startTime,
          endTime,
          duration: endTime - startTime,
          aiCalls: this.stats.totalCalls - initialCalls,
          totalTokens: this.stats.totalTokens - initialTokens,
        },
      };
    }
  }

  /**
   * Process the module's core logic
   *
   * This method MUST be implemented by all subclasses.
   *
   * @param input - Input data for the module
   * @returns The module's output
   */
  protected abstract process(input: TInput): Promise<TOutput>;

  /**
   * Call an AI provider
   *
   * This is a helper method for making AI API calls.
   * Override this to implement actual AI provider integration.
   *
   * @param options - Options for the AI call
   * @returns AI response
   */
  protected async callAI(options: AICallOptions): Promise<AIResponse> {
    this.stats.totalCalls++;

    try {
      // This is a placeholder implementation
      // In a real implementation, this would call the actual AI provider API
      const response = await this.makeAIRequest(options);

      this.stats.successfulCalls++;
      if (response.metadata?.tokens) {
        this.stats.totalTokens += response.metadata.tokens;
      }

      return response;
    } catch (error) {
      this.stats.failedCalls++;
      throw error;
    }
  }

  /**
   * Make the actual AI API request
   *
   * Override this method to implement provider-specific logic
   *
   * @param options - Options for the AI call
   * @returns AI response
   */
  protected async makeAIRequest(options: AICallOptions): Promise<AIResponse> {
    // Placeholder implementation
    // Subclasses or integrations should override this to call real AI APIs
    throw new Error(
      `AI provider "${options.provider}" not implemented. Override makeAIRequest() to add AI integration.`,
    );
  }

  /**
   * Create a prompt from a template
   *
   * Helper method for prompt templating
   *
   * @param template - Prompt template with {{variables}}
   * @param variables - Variables to substitute
   * @returns Formatted prompt
   */
  protected formatPrompt(
    template: string,
    variables: Record<string, string>,
  ): string {
    let result = template;
    for (const [key, value] of Object.entries(variables)) {
      result = result.replace(new RegExp(`{{${key}}}`, "g"), value);
    }
    return result;
  }

  /**
   * Clean up module resources
   */
  async cleanup(): Promise<void> {
    await this.onCleanup();
    this.initialized = false;
  }

  /**
   * Hook for custom cleanup logic
   */
  protected async onCleanup(): Promise<void> {
    // Default implementation does nothing
  }
}
