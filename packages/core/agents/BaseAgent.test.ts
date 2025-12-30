import { describe, it, expect, beforeEach } from 'vitest';
import { BaseAgent, AgentConfig, AgentResult } from './BaseAgent';

// Test implementation of BaseAgent
class TestAgent extends BaseAgent<string, string> {
  public initCalled = false;
  public executeCalled = false;
  public cleanupCalled = false;

  constructor(config?: Partial<AgentConfig>) {
    super('TestAgent', {
      description: 'Test agent for unit testing',
      version: '1.0.0',
      ...config,
    });
  }

  protected async onInitialize(): Promise<void> {
    this.initCalled = true;
  }

  protected async execute(input: string): Promise<string> {
    this.executeCalled = true;
    return `Processed: ${input}`;
  }

  protected async onCleanup(): Promise<void> {
    this.cleanupCalled = true;
  }
}

// Test agent that throws an error
class ErrorAgent extends BaseAgent<string, string> {
  constructor() {
    super('ErrorAgent', {
      description: 'Agent that throws errors',
      version: '1.0.0',
    });
  }

  protected async execute(input: string): Promise<string> {
    throw new Error('Test error');
  }
}

describe('BaseAgent', () => {
  let agent: TestAgent;

  beforeEach(() => {
    agent = new TestAgent();
  });

  describe('constructor', () => {
    it('should create an agent with the given name and config', () => {
      expect(agent.getName()).toBe('TestAgent');
      const config = agent.getConfig();
      expect(config.description).toBe('Test agent for unit testing');
      expect(config.version).toBe('1.0.0');
    });

    it('should accept optional configuration', () => {
      const customAgent = new TestAgent({
        capabilities: ['test-capability'],
        tools: ['test-tool'],
        providers: ['test-provider'],
      });

      const config = customAgent.getConfig();
      expect(config.capabilities).toEqual(['test-capability']);
      expect(config.tools).toEqual(['test-tool']);
      expect(config.providers).toEqual(['test-provider']);
    });
  });

  describe('initialize', () => {
    it('should call onInitialize hook', async () => {
      expect(agent.initCalled).toBe(false);
      await agent.initialize();
      expect(agent.initCalled).toBe(true);
    });

    it('should only initialize once', async () => {
      await agent.initialize();
      expect(agent.initCalled).toBe(true);
      
      agent.initCalled = false;
      await agent.initialize();
      expect(agent.initCalled).toBe(false); // Should not call again
    });
  });

  describe('run', () => {
    it('should execute successfully with valid input', async () => {
      const result = await agent.run('test input');

      expect(result.success).toBe(true);
      expect(result.data).toBe('Processed: test input');
      expect(result.error).toBeUndefined();
      expect(result.metadata).toBeDefined();
      expect(result.metadata?.startTime).toBeDefined();
      expect(result.metadata?.endTime).toBeDefined();
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
    });

    it('should automatically initialize if not already initialized', async () => {
      expect(agent.initCalled).toBe(false);
      await agent.run('test');
      expect(agent.initCalled).toBe(true);
    });

    it('should execute the agent logic', async () => {
      expect(agent.executeCalled).toBe(false);
      await agent.run('test');
      expect(agent.executeCalled).toBe(true);
    });

    it('should include logs in metadata', async () => {
      const result = await agent.run('test');
      
      expect(result.metadata?.logs).toBeDefined();
      expect(result.metadata?.logs?.length).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const errorAgent = new ErrorAgent();
      const result = await errorAgent.run('test');

      expect(result.success).toBe(false);
      expect(result.data).toBeUndefined();
      expect(result.error).toBe('Test error');
      expect(result.metadata).toBeDefined();
    });

    it('should measure execution duration', async () => {
      const result = await agent.run('test');
      
      expect(result.metadata?.duration).toBeGreaterThanOrEqual(0);
      expect(result.metadata?.endTime).toBeGreaterThanOrEqual(
        result.metadata?.startTime || 0
      );
    });
  });

  describe('cleanup', () => {
    it('should call onCleanup hook', async () => {
      await agent.initialize();
      expect(agent.cleanupCalled).toBe(false);
      
      await agent.cleanup();
      expect(agent.cleanupCalled).toBe(true);
    });

    it('should reset initialized state', async () => {
      await agent.initialize();
      await agent.cleanup();
      
      // Should be able to initialize again
      agent.initCalled = false;
      await agent.initialize();
      expect(agent.initCalled).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return a readonly copy of config', () => {
      const config = agent.getConfig();
      expect(config).toBeDefined();
      expect(config.description).toBe('Test agent for unit testing');
      
      // Verify it's a copy (modifications don't affect original)
      const config2 = agent.getConfig();
      expect(config).not.toBe(config2);
    });
  });

  describe('getLogs', () => {
    it('should return agent logs', async () => {
      await agent.run('test');
      const logs = agent.getLogs();
      
      expect(Array.isArray(logs)).toBe(true);
      // Logs are cleared after run, so this will be empty
      expect(logs.length).toBe(0);
    });
  });
});
