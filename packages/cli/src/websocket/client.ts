import WebSocket from "ws";
import { v4 as uuid } from "uuid";
import type { TaskMessage, AgentMessage } from "../types";
import { AgentMessageSchema } from "../types";
import { MessageHandler } from "./message-handler";

export interface WebSocketClientOptions {
  agentUrl: string;
  verbose?: boolean;
  debug?: boolean;
  useMock?: boolean;
}

export class WebSocketClient {
  private ws?: WebSocket;
  private messageHandler: MessageHandler;
  private options: WebSocketClientOptions;
  private taskId?: string;

  constructor(options: WebSocketClientOptions) {
    this.options = options;
    this.messageHandler = new MessageHandler({
      verbose: options.verbose ?? true,
      debug: options.debug ?? false,
    });
  }

  async connect(): Promise<void> {
    // For initial development, use mock mode
    if (this.options.useMock) {
      console.log("Using mock WebSocket client");
      return;
    }

    return new Promise((resolve, reject) => {
      const wsUrl = this.options.agentUrl.replace(/^http/, "ws");

      this.ws = new WebSocket(`${wsUrl}/ws`);

      this.ws.on("open", () => {
        if (this.options.debug) {
          console.log("WebSocket connected");
        }
        resolve();
      });

      this.ws.on("error", (error) => {
        console.error("WebSocket error:", error);
        reject(error);
      });

      this.ws.on("message", (data) => {
        this.handleMessage(data.toString());
      });

      this.ws.on("close", () => {
        if (this.options.debug) {
          console.log("WebSocket disconnected");
        }
      });
    });
  }

  async sendTask(task: TaskMessage): Promise<string> {
    this.taskId = task.taskId;

    if (this.options.useMock) {
      // Mock response for development
      this.simulateMockResponse(task);
      return task.taskId;
    }

    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error("WebSocket not connected");
    }

    this.ws.send(JSON.stringify(task));
    return task.taskId;
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data);
      const validated = AgentMessageSchema.parse(message);
      this.messageHandler.handle(validated);
    } catch (error) {
      console.error("Failed to parse agent message:", error);
    }
  }

  private simulateMockResponse(task: TaskMessage): void {
    // Simulate agent responses for development
    const mockMessages: AgentMessage[] = [
      {
        type: "log",
        taskId: task.taskId,
        timestamp: Date.now(),
        data: {
          message: `Starting task: ${task.type}`,
          level: "info",
        },
      },
      {
        type: "progress",
        taskId: task.taskId,
        timestamp: Date.now() + 1000,
        data: {
          progress: 25,
          message: "Cloning repository...",
        },
      },
      {
        type: "progress",
        taskId: task.taskId,
        timestamp: Date.now() + 2000,
        data: {
          progress: 50,
          message: "Analyzing project structure...",
        },
      },
      {
        type: "progress",
        taskId: task.taskId,
        timestamp: Date.now() + 3000,
        data: {
          progress: 75,
          message: "Generating code...",
        },
      },
    ];

    // Add task-specific messages
    if (task.type === "task:generate_page") {
      mockMessages.push({
        type: "log",
        taskId: task.taskId,
        timestamp: Date.now() + 4000,
        data: {
          message: `Creating page: ${task.args.pageName}`,
          level: "info",
        },
      });

      if (task.settings.validateFrontend) {
        mockMessages.push({
          type: "log",
          taskId: task.taskId,
          timestamp: Date.now() + 5000,
          data: {
            message: "Running frontend validation...",
            level: "info",
          },
        });
      }
    }

    mockMessages.push({
      type: "pr_created",
      taskId: task.taskId,
      timestamp: Date.now() + 6000,
      data: {
        prUrl: "https://github.com/example/repo/pull/123",
        message: "Pull request created successfully",
        validation: task.settings.validateFrontend
          ? {
              passed: true,
              screenshots: ["screenshot-1.png"],
              issues: [],
            }
          : undefined,
      },
    });

    mockMessages.push({
      type: "complete",
      taskId: task.taskId,
      timestamp: Date.now() + 7000,
      data: {
        message: "Task completed successfully",
      },
    });

    // Simulate async message delivery
    mockMessages.forEach((msg, index) => {
      setTimeout(() => {
        this.messageHandler.handle(msg);
      }, index * 1000);
    });
  }

  close(): void {
    if (this.ws) {
      this.ws.close();
    }
  }

  getTaskId(): string | undefined {
    return this.taskId;
  }

  waitForCompletion(): Promise<void> {
    return this.messageHandler.waitForCompletion();
  }
}
