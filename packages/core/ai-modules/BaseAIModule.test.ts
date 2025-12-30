import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  BaseAIModule,
  AIModuleConfig,
  AICallOptions,
  AIResponse,
} from "./BaseAIModule";

// Test implementation of BaseAIModule
class TestAIModule extends BaseAIModule<string, string> {
  public initCalled = false;
  public processCalled = false;
  public cleanupCalled = false;

  constructor(config?: Partial<AIModuleConfig>) {
    super("TestAIModule", {
      description: "Test AI module for unit testing",
      version: "1.0.0",
      providers: ["test-provider"],
      defaultProvider: "test-provider",
      ...config,
    });
  }

  protected async onInitialize(): Promise<void> {
    this.initCalled = true;
  }

  protected async process(input: string): Promise<string> {
    this.processCalled = true;

    // Make a test AI call
    const response = await this.callAI({
      prompt: `Process: ${input}`,
      provider: "test-provider",
      model: "test-model",
    });

    return response.content;
  }

  protected async onCleanup(): Promise<void> {
    this.cleanupCalled = true;
  }

  // Override makeAIRequest for testing
  protected async makeAIRequest(options: AICallOptions): Promise<AIResponse> {
    return {
      content: `AI processed: ${options.prompt}`,
      provider: options.provider,
      model: options.model,
      metadata: {
        tokens: 50,
        finishReason: "stop",
      },
    };
  }
}

// Test module that throws an error
class ErrorAIModule extends BaseAIModule<string, string> {
  constructor() {
    super("ErrorAIModule", {
      description: "Module that throws errors",
      version: "1.0.0",
      providers: ["test"],
    });
  }

  protected async process(input: string): Promise<string> {
    throw new Error("Test error");
  }
}

describe("BaseAIModule", () => {
  let module: TestAIModule;

  beforeEach(() => {
    module = new TestAIModule();
  });

  describe("constructor", () => {
    it("should create a module with the given name and config", () => {
      expect(module.getName()).toBe("TestAIModule");
      const config = module.getConfig();
      expect(config.description).toBe("Test AI module for unit testing");
      expect(config.version).toBe("1.0.0");
      expect(config.providers).toEqual(["test-provider"]);
    });

    it("should set default provider if not specified", () => {
      const customModule = new TestAIModule({
        providers: ["provider1", "provider2"],
      });
      const config = customModule.getConfig();
      expect(config.defaultProvider).toBe("provider1");
    });

    it("should accept optional configuration", () => {
      const customModule = new TestAIModule({
        defaultProvider: "custom-provider",
        defaultModel: "custom-model",
        capabilities: ["test-capability"],
      });

      const config = customModule.getConfig();
      expect(config.defaultProvider).toBe("custom-provider");
      expect(config.defaultModel).toBe("custom-model");
      expect(config.capabilities).toEqual(["test-capability"]);
    });
  });

  describe("initialize", () => {
    it("should call onInitialize hook", async () => {
      expect(module.initCalled).toBe(false);
      await module.initialize();
      expect(module.initCalled).toBe(true);
    });

    it("should only initialize once", async () => {
      await module.initialize();
      expect(module.initCalled).toBe(true);

      module.initCalled = false;
      await module.initialize();
      expect(module.initCalled).toBe(false);
    });
  });

  describe("run", () => {
    it("should process successfully with valid input", async () => {
      const result = await module.run("test input");

      expect(result.success).toBe(true);
      expect(result.data).toBe("AI processed: Process: test input");
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.startTime).toBeDefined();
      expect(result.metadata?.endTime).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
    });

    it("should automatically initialize if not already initialized", async () => {
      expect(module.initCalled).toBe(false);
      await module.run("test");
      expect(module.initCalled).toBe(true);
    });

    it("should process the input", async () => {
      expect(module.processCalled).toBe(false);
      await module.run("test");
      expect(module.processCalled).toBe(true);
    });

    it("should track AI calls in metadata", async () => {
      const result = await module.run("test");

      expect(result.metadata?.aiCalls).toBe(1);
      expect(result.metadata?.totalTokens).toBe(50);
    });

    it("should handle errors gracefully", async () => {
      const errorModule = new ErrorAIModule();
      const result = await errorModule.run("test");

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe("Test error");
      expect(result.metadata).toBeDefined();
    });

    it("should measure processing duration", async () => {
      const result = await module.run("test");

      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.endTime).toBeGreaterThanOrEqual(
        result.metadata?.startTime || 0,
      );
    });
  });

  describe("callAI", () => {
    it("should track statistics", async () => {
      await module.run("test");

      const stats = module.getStats();
      expect(stats.totalCalls).toBe(1);
      expect(stats.successfulCalls).toBe(1);
      expect(stats.failedCalls).toBe(0);
      expect(stats.totalTokens).toBe(50);
    });

    it("should track multiple calls", async () => {
      await module.run("test1");
      await module.run("test2");
      await module.run("test3");

      const stats = module.getStats();
      expect(stats.totalCalls).toBe(3);
      expect(stats.successfulCalls).toBe(3);
      expect(stats.totalTokens).toBe(150);
    });
  });

  describe("formatPrompt", () => {
    it("should replace template variables", async () => {
      // Access protected method via type assertion
      const formatted = (module as any).formatPrompt(
        "Hello {{name}}, welcome to {{place}}!",
        { name: "Alice", place: "Wonderland" },
      );

      expect(formatted).toBe("Hello Alice, welcome to Wonderland!");
    });

    it("should handle multiple occurrences of same variable", async () => {
      const formatted = (module as any).formatPrompt(
        "{{greeting}} {{name}}, {{greeting}} again!",
        { greeting: "Hello", name: "Bob" },
      );

      expect(formatted).toBe("Hello Bob, Hello again!");
    });
  });

  describe("getStats", () => {
    it("should return current statistics", async () => {
      const stats = module.getStats();

      expect(stats).toBeDefined();
      expect(stats.totalCalls).toBe(0);
      expect(stats.successfulCalls).toBe(0);
      expect(stats.failedCalls).toBe(0);
      expect(stats.totalTokens).toBe(0);
    });

    it("should return a copy of statistics", () => {
      const stats1 = module.getStats();
      const stats2 = module.getStats();

      expect(stats1).toEqual(stats2);
      expect(stats1).not.toBe(stats2);
    });
  });

  describe("cleanup", () => {
    it("should call onCleanup hook", async () => {
      await module.initialize();
      expect(module.cleanupCalled).toBe(false);

      await module.cleanup();
      expect(module.cleanupCalled).toBe(true);
    });

    it("should reset initialized state", async () => {
      await module.initialize();
      await module.cleanup();

      // Should be able to initialize again
      module.initCalled = false;
      await module.initialize();
      expect(module.initCalled).toBe(true);
    });
  });

  describe("getConfig", () => {
    it("should return a readonly copy of config", () => {
      const config = module.getConfig();
      expect(config).toBeDefined();
      expect(config.description).toBe("Test AI module for unit testing");

      // Verify it's a copy
      const config2 = module.getConfig();
      expect(config).not.toBe(config2);
    });
  });
});
