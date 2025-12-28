import { DurableObject } from "cloudflare:workers";
import type { Env, TaskMessage, AgentMessage } from "../types";
import { TaskMessageSchema } from "../types";
import { createTaskExecutor } from "../tasks/factory";

export class TaskSession extends DurableObject {
  private ws?: WebSocket;
  private taskId?: string;
  private env: Env;

  constructor(state: DurableObjectState, env: Env) {
    super(state, env);
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    // Handle WebSocket upgrade
    if (request.headers.get("Upgrade") === "websocket") {
      const pair = new WebSocketPair();
      const { 0: client, 1: server } = pair;

      this.ws = server;
      this.ws.accept();

      this.ws.addEventListener("message", async (event) => {
        if (typeof event.data === "string") {
          await this.handleMessage(event.data);
        } else {
          this.log("Received non-string WebSocket message", "warn");
        }
      });

      this.ws.addEventListener("error", (event) => {
        console.error("WebSocket error:", event);
      });

      this.ws.addEventListener("close", () => {
        console.log("WebSocket closed");
      });

      return new Response(null, {
        status: 101,
        // @ts-ignore - WebSocket upgrade
        webSocket: client,
      });
    }

    return new Response("Expected WebSocket", { status: 400 });
  }

  private async handleMessage(data: string): Promise<void> {
    try {
      const message = JSON.parse(data);
      const validated = TaskMessageSchema.parse(message);

      this.taskId = validated.taskId;
      this.log(`Received task: ${validated.type}`, "info");

      // Execute task
      await this.executeTask(validated);
    } catch (error) {
      this.log(
        `Error handling message: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );

      this.sendMessage({
        type: "error",
        taskId: this.taskId || "unknown",
        timestamp: Date.now(),
        data: {
          message:
            error instanceof Error ? error.message : "Unknown error",
        },
      });
    }
  }

  private async executeTask(task: TaskMessage): Promise<void> {
    try {
      const executor = createTaskExecutor(task.type, this.env, this);
      await executor.execute(task);

      this.sendMessage({
        type: "complete",
        taskId: task.taskId,
        timestamp: Date.now(),
        data: {
          message: "Task completed successfully",
        },
      });
    } catch (error) {
      this.log(
        `Task execution failed: ${error instanceof Error ? error.message : String(error)}`,
        "error",
      );

      this.sendMessage({
        type: "error",
        taskId: task.taskId,
        timestamp: Date.now(),
        data: {
          message:
            error instanceof Error ? error.message : "Task execution failed",
        },
      });
    }
  }

  sendMessage(message: AgentMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }

  log(message: string, level: "debug" | "info" | "warn" | "error" = "info"): void {
    if (!this.taskId) return;

    this.sendMessage({
      type: "log",
      taskId: this.taskId,
      timestamp: Date.now(),
      data: { message, level },
    });
  }

  progress(percent: number, message?: string): void {
    if (!this.taskId) return;

    this.sendMessage({
      type: "progress",
      taskId: this.taskId,
      timestamp: Date.now(),
      data: { progress: percent, message },
    });
  }
}
