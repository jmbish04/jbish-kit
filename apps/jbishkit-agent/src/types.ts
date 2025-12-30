import { z } from "zod";

export interface Env {
  // Bindings
  TASK_SESSION: DurableObjectNamespace;
  PREVIEW_MAPPINGS: KVNamespace;
  SANDBOX?: any; // Sandbox SDK binding (when available)
  STAGEHAND?: DurableObjectNamespace;

  // Environment variables
  GITHUB_TOKEN?: string;
  ANTHROPIC_API_KEY?: string;
  OPENAI_API_KEY?: string;
  CLOUDFLARE_API_TOKEN?: string;
  WORKER_SECRET?: string;
  ENVIRONMENT: string;
}

// Task message types (shared with CLI)
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
