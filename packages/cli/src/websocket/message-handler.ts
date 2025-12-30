import type { AgentMessage } from "../types";
import { Logger } from "./logger";

export interface MessageHandlerOptions {
  verbose: boolean;
  debug: boolean;
}

export class MessageHandler {
  private logger: Logger;
  private completionPromise?: {
    resolve: () => void;
    reject: (error: Error) => void;
  };
  private prUrl?: string;
  private validationResult?: any;

  constructor(options: MessageHandlerOptions) {
    this.logger = new Logger(options.verbose, options.debug);
  }

  handle(message: AgentMessage): void {
    switch (message.type) {
      case "log":
        this.handleLog(message);
        break;

      case "progress":
        this.handleProgress(message);
        break;

      case "error":
        this.handleError(message);
        break;

      case "pr_created":
        this.handlePRCreated(message);
        break;

      case "complete":
        this.handleComplete(message);
        break;

      default:
        this.logger.debug(`Unknown message type: ${(message as any).type}`);
    }
  }

  private handleLog(message: AgentMessage): void {
    const { level, message: msg } = message.data;

    if (!msg) return;

    switch (level) {
      case "debug":
        this.logger.debug(msg);
        break;
      case "info":
        this.logger.info(msg);
        break;
      case "warn":
        this.logger.warn(msg);
        break;
      case "error":
        this.logger.error(msg);
        break;
      default:
        this.logger.info(msg);
    }
  }

  private handleProgress(message: AgentMessage): void {
    const { progress, message: msg } = message.data;

    if (progress !== undefined) {
      this.logger.progress(progress, msg);
    }
  }

  private handleError(message: AgentMessage): void {
    this.logger.error(message.data.message || "Unknown error");

    if (this.completionPromise) {
      this.completionPromise.reject(
        new Error(message.data.message || "Task failed"),
      );
      this.completionPromise = undefined;
    }
  }

  private handlePRCreated(message: AgentMessage): void {
    const { prUrl, validation } = message.data;

    this.prUrl = prUrl;
    this.validationResult = validation;

    this.logger.success(`Pull request created: ${prUrl}`);

    if (validation) {
      if (validation.passed) {
        this.logger.success("✓ Frontend validation passed");
      } else {
        this.logger.warn("⚠ Frontend validation failed:");
        validation.issues.forEach((issue: string) => {
          this.logger.warn(`  - ${issue}`);
        });
      }
    }
  }

  private handleComplete(message: AgentMessage): void {
    this.logger.success(message.data.message || "Task completed");

    if (this.prUrl) {
      this.logger.info("\nNext steps:");
      this.logger.info(`  1. Review the PR: ${this.prUrl}`);
      this.logger.info("  2. Merge when ready");
      this.logger.info("  3. Pull changes: jbish pull");
    }

    if (this.completionPromise) {
      this.completionPromise.resolve();
      this.completionPromise = undefined;
    }
  }

  waitForCompletion(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.completionPromise = { resolve, reject };
    });
  }

  getPRUrl(): string | undefined {
    return this.prUrl;
  }

  getValidationResult(): any {
    return this.validationResult;
  }
}
