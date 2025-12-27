import { z } from "zod";

// Task message types
export type TaskType =
  | "task:init"
  | "task:generate_page"
  | "task:generate_agent"
  | "task:lint_fix"
  | "task:health_audit"
  | "task:custom";

export type AgentMessageType =
  | "log"
  | "progress"
  | "error"
  | "complete"
  | "pr_created";

export type LogLevel = "debug" | "info" | "warn" | "error";

// CLI → Agent
export interface TaskMessage {
  type: TaskType;
  taskId: string;
  repo: string;
  branch: string;
  auth: {
    github: string;
    worker: string;
  };
  args: Record<string, any>;
  settings: {
    verbose: boolean;
    debug: boolean;
    validateFrontend: boolean;
    autoMerge: boolean;
  };
}

// Agent → CLI
export interface AgentMessage {
  type: AgentMessageType;
  taskId: string;
  timestamp: number;
  data: {
    message?: string;
    level?: LogLevel;
    progress?: number;
    prUrl?: string;
    diff?: string;
    validation?: ValidationResult;
  };
}

export interface ValidationResult {
  passed: boolean;
  screenshots: string[];
  issues: string[];
}

// Zod schemas for validation
export const TaskMessageSchema = z.object({
  type: z.enum([
    "task:init",
    "task:generate_page",
    "task:generate_agent",
    "task:lint_fix",
    "task:health_audit",
    "task:custom",
  ]),
  taskId: z.string(),
  repo: z.string(),
  branch: z.string(),
  auth: z.object({
    github: z.string(),
    worker: z.string(),
  }),
  args: z.record(z.any()),
  settings: z.object({
    verbose: z.boolean(),
    debug: z.boolean(),
    validateFrontend: z.boolean(),
    autoMerge: z.boolean(),
  }),
});

export const AgentMessageSchema = z.object({
  type: z.enum(["log", "progress", "error", "complete", "pr_created"]),
  taskId: z.string(),
  timestamp: z.number(),
  data: z.object({
    message: z.string().optional(),
    level: z.enum(["debug", "info", "warn", "error"]).optional(),
    progress: z.number().optional(),
    prUrl: z.string().optional(),
    diff: z.string().optional(),
    validation: z
      .object({
        passed: z.boolean(),
        screenshots: z.array(z.string()),
        issues: z.array(z.string()),
      })
      .optional(),
  }),
});

// CLI configuration
export interface CLIConfig {
  agentUrl: string;
  github: {
    token?: string;
    user?: string;
  };
  worker: {
    secret?: string;
  };
  defaults: {
    verbose: boolean;
    debug: boolean;
    validateFrontend: boolean;
    autoMerge: boolean;
  };
}

// Task-specific argument types
export interface GeneratePageArgs {
  pageName: string;
  route: string;
  features: string[];
  uiLibrary?: string;
}

export interface GenerateAgentArgs {
  agentName: string;
  tools: string[];
  providers: string[];
  capabilities: string[];
}

export interface LintFixArgs {
  files?: string[];
  rules?: string[];
}

export interface HealthAuditArgs {
  comprehensive: boolean;
  bindings: string[];
}

export interface CustomTaskArgs {
  description: string;
  files?: string[];
  validation?: boolean;
}
