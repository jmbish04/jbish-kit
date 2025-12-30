/**
 * @file BaseAgent - Foundation class for all agents in the system.
 *
 * This class provides the core functionality that all agents should inherit.
 * It handles common operations like initialization, configuration, and lifecycle management.
 *
 * @example
 * ```typescript
 * import { BaseAgent } from '@repo/core/agents';
 *
 * export class MyCustomAgent extends BaseAgent {
 *   constructor() {
 *     super('MyCustomAgent', {
 *       description: 'A custom agent for specific tasks',
 *       version: '1.0.0'
 *     });
 *   }
 *
 *   async execute(input: any): Promise<any> {
 *     // Your agent logic here
 *     return await this.process(input);
 *   }
 * }
 * ```
 */

/**
 * Configuration options for an agent
 */
export interface AgentConfig {
  /** Human-readable description of what this agent does */
  description: string;
  /** Version of the agent (semver format) */
  version: string;
  /** Optional capabilities this agent provides */
  capabilities?: string[];
  /** Optional tools this agent can use */
  tools?: string[];
  /** Optional AI providers this agent supports */
  providers?: string[];
}

/**
 * Result returned from agent execution
 */
export interface AgentResult<T = any> {
  /** Whether the agent execution was successful */
  success: boolean;
  /** The result data if successful */
  data?: T;
  /** Error message if execution failed */
  error?: string;
  /** Execution metadata (timing, logs, etc.) */
  metadata?: {
    startTime: number;
    endTime: number;
    duration: number;
    logs?: string[];
  };
}

/**
 * BaseAgent - Abstract base class for all agents
 *
 * All agents in the system should extend this class to ensure consistency
 * and access to common functionality.
 *
 * Key Features:
 * - Lifecycle management (initialize, execute, cleanup)
 * - Error handling and logging
 * - Configuration management
 * - Execution tracking
 */
export abstract class BaseAgent<TInput = any, TOutput = any> {
  /** Unique name identifier for this agent */
  protected readonly name: string;

  /** Configuration for this agent */
  protected readonly config: AgentConfig;

  /** Internal state tracking */
  protected initialized: boolean = false;

  /** Execution logs */
  protected logs: string[] = [];

  /**
   * Create a new agent instance
   *
   * @param name - Unique identifier for this agent
   * @param config - Configuration options
   */
  constructor(name: string, config: AgentConfig) {
    this.name = name;
    this.config = config;
    this.log(`Agent '${name}' created with version ${config.version}`);
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the agent's configuration
   */
  getConfig(): Readonly<AgentConfig> {
    return { ...this.config };
  }

  /**
   * Initialize the agent
   *
   * This method should be called before first execution.
   * Override this method to add custom initialization logic.
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      this.log("Agent already initialized");
      return;
    }

    this.log("Initializing agent...");
    await this.onInitialize();
    this.initialized = true;
    this.log("Agent initialized successfully");
  }

  /**
   * Hook for custom initialization logic
   * Override this in subclasses
   */
  protected async onInitialize(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to add custom initialization
  }

  /**
   * Execute the agent with given input
   *
   * This is the main entry point for agent execution.
   * It handles timing, error handling, and result wrapping.
   *
   * @param input - Input data for the agent
   * @returns Agent execution result
   */
  async run(input: TInput): Promise<AgentResult<TOutput>> {
    if (!this.initialized) {
      await this.initialize();
    }

    const startTime = Date.now();
    this.log(`Executing agent...`);

    try {
      const data = await this.execute(input);
      const endTime = Date.now();

      this.log(`Agent execution completed successfully`);

      return {
        success: true,
        data,
        metadata: {
          startTime,
          endTime,
          duration: endTime - startTime,
          logs: [...this.logs],
        },
      };
    } catch (error) {
      const endTime = Date.now();
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";

      this.log(`Agent execution failed: ${errorMessage}`);

      return {
        success: false,
        error: errorMessage,
        metadata: {
          startTime,
          endTime,
          duration: endTime - startTime,
          logs: [...this.logs],
        },
      };
    } finally {
      // Clear logs after execution
      this.logs = [];
    }
  }

  /**
   * Execute the agent's core logic
   *
   * This method MUST be implemented by all subclasses.
   * It contains the actual agent logic.
   *
   * @param input - Input data for the agent
   * @returns The agent's output
   */
  protected abstract execute(input: TInput): Promise<TOutput>;

  /**
   * Clean up agent resources
   *
   * Override this method to add custom cleanup logic.
   * Called when the agent is no longer needed.
   */
  async cleanup(): Promise<void> {
    this.log("Cleaning up agent resources...");
    await this.onCleanup();
    this.initialized = false;
    this.log("Agent cleanup completed");
  }

  /**
   * Hook for custom cleanup logic
   * Override this in subclasses
   */
  protected async onCleanup(): Promise<void> {
    // Default implementation does nothing
    // Subclasses can override to add custom cleanup
  }

  /**
   * Log a message
   *
   * @param message - Message to log
   */
  protected log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${this.name}] ${message}`;
    this.logs.push(logEntry);

    // Also output to console in development
    if (process.env.NODE_ENV === "development") {
      console.log(logEntry);
    }
  }

  /**
   * Get execution logs
   */
  getLogs(): string[] {
    return [...this.logs];
  }
}
