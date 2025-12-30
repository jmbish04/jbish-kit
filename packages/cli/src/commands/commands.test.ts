import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { addAgent } from './add-agent';
import { addAIModule } from './add-ai-module';

describe('CLI Commands', () => {
  const testDir = path.join(tmpdir(), 'jbish-cli-test');
  
  beforeEach(() => {
    // Create test directory
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true });
    }
  });

  describe('addAgent', () => {
    it('should create an agent file with correct name', async () => {
      const agentDir = path.join(testDir, 'agents');
      
      await addAgent('TestAgent', { dir: agentDir });
      
      const filePath = path.join(agentDir, 'TestAgent.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should append "Agent" suffix if not present', async () => {
      const agentDir = path.join(testDir, 'agents');
      
      await addAgent('Test', { dir: agentDir });
      
      const filePath = path.join(agentDir, 'TestAgent.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create directory if it does not exist', async () => {
      const agentDir = path.join(testDir, 'new/agents/dir');
      
      await addAgent('TestAgent', { dir: agentDir });
      
      expect(fs.existsSync(agentDir)).toBe(true);
    });

    it('should generate file with correct content structure', async () => {
      const agentDir = path.join(testDir, 'agents');
      
      await addAgent('TestAgent', { dir: agentDir });
      
      const filePath = path.join(agentDir, 'TestAgent.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('class TestAgent extends BaseAgent');
      expect(content).toContain('export class TestAgent');
      expect(content).toContain('protected async execute');
      expect(content).toContain('TestAgentInput');
      expect(content).toContain('TestAgentOutput');
    });

    it('should include tools in configuration', async () => {
      const agentDir = path.join(testDir, 'agents');
      
      await addAgent('TestAgent', {
        dir: agentDir,
        tools: 'tool1,tool2,tool3',
      });
      
      const filePath = path.join(agentDir, 'TestAgent.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain("tools: ['tool1', 'tool2', 'tool3']");
    });

    it('should include providers in configuration', async () => {
      const agentDir = path.join(testDir, 'agents');
      
      await addAgent('TestAgent', {
        dir: agentDir,
        providers: 'anthropic,openai',
      });
      
      const filePath = path.join(agentDir, 'TestAgent.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain("providers: ['anthropic', 'openai']");
    });

    it('should fail if agent already exists', async () => {
      const agentDir = path.join(testDir, 'agents');
      
      // Create agent first time
      await addAgent('TestAgent', { dir: agentDir });
      
      // Mock process.exit to prevent test from exiting
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      // Try to create again - should fail
      await expect(
        addAgent('TestAgent', { dir: agentDir })
      ).rejects.toThrow('process.exit called');
      
      mockExit.mockRestore();
    });

    it('should validate agent name format', async () => {
      const agentDir = path.join(testDir, 'agents');
      
      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      // Test invalid names
      await expect(
        addAgent('lowercase', { dir: agentDir })
      ).rejects.toThrow('process.exit called');
      
      await expect(
        addAgent('123Invalid', { dir: agentDir })
      ).rejects.toThrow('process.exit called');
      
      await expect(
        addAgent('Invalid-Name', { dir: agentDir })
      ).rejects.toThrow('process.exit called');
      
      mockExit.mockRestore();
    });
  });

  describe('addAIModule', () => {
    it('should create an AI module file with correct name', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      await addAIModule('TestModule', { dir: moduleDir });
      
      const filePath = path.join(moduleDir, 'TestModule.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should append "Module" suffix if not present', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      await addAIModule('Test', { dir: moduleDir });
      
      const filePath = path.join(moduleDir, 'TestModule.ts');
      expect(fs.existsSync(filePath)).toBe(true);
    });

    it('should create directory if it does not exist', async () => {
      const moduleDir = path.join(testDir, 'new/modules/dir');
      
      await addAIModule('TestModule', { dir: moduleDir });
      
      expect(fs.existsSync(moduleDir)).toBe(true);
    });

    it('should generate file with correct content structure', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      await addAIModule('TestModule', { dir: moduleDir });
      
      const filePath = path.join(moduleDir, 'TestModule.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain('class TestModule extends BaseAIModule');
      expect(content).toContain('export class TestModule');
      expect(content).toContain('protected async process');
      expect(content).toContain('TestModuleInput');
      expect(content).toContain('TestModuleOutput');
    });

    it('should include default providers', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      await addAIModule('TestModule', { dir: moduleDir });
      
      const filePath = path.join(moduleDir, 'TestModule.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain("providers: ['anthropic', 'openai']");
    });

    it('should use custom providers', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      await addAIModule('TestModule', {
        dir: moduleDir,
        providers: 'cloudflare,anthropic',
      });
      
      const filePath = path.join(moduleDir, 'TestModule.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain("providers: ['cloudflare', 'anthropic']");
    });

    it('should set default provider', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      await addAIModule('TestModule', {
        dir: moduleDir,
        defaultProvider: 'openai',
      });
      
      const filePath = path.join(moduleDir, 'TestModule.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain("defaultProvider: 'openai'");
    });

    it('should set default model if provided', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      await addAIModule('TestModule', {
        dir: moduleDir,
        defaultModel: 'gpt-4',
      });
      
      const filePath = path.join(moduleDir, 'TestModule.ts');
      const content = fs.readFileSync(filePath, 'utf-8');
      
      expect(content).toContain("defaultModel: 'gpt-4'");
    });

    it('should fail if module already exists', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      // Create module first time
      await addAIModule('TestModule', { dir: moduleDir });
      
      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      // Try to create again - should fail
      await expect(
        addAIModule('TestModule', { dir: moduleDir })
      ).rejects.toThrow('process.exit called');
      
      mockExit.mockRestore();
    });

    it('should validate module name format', async () => {
      const moduleDir = path.join(testDir, 'ai-modules');
      
      // Mock process.exit
      const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit called');
      });
      
      // Test invalid names
      await expect(
        addAIModule('lowercase', { dir: moduleDir })
      ).rejects.toThrow('process.exit called');
      
      await expect(
        addAIModule('123Invalid', { dir: moduleDir })
      ).rejects.toThrow('process.exit called');
      
      await expect(
        addAIModule('Invalid-Name', { dir: moduleDir })
      ).rejects.toThrow('process.exit called');
      
      mockExit.mockRestore();
    });
  });
});
