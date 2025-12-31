import type { Env, TaskMessage } from "../types";
import type { TaskSession } from "../durable-objects/TaskSession";

export abstract class BaseTask {
  protected env: Env;
  protected session: TaskSession;

  constructor(env: Env, session: TaskSession) {
    this.env = env;
    this.session = session;
  }

  abstract execute(task: TaskMessage): Promise<void>;

  protected log(
    message: string,
    level: "debug" | "info" | "warn" | "error" = "info",
  ): void {
    this.session.log(message, level);
  }

  protected progress(percent: number, message?: string): void {
    this.session.progress(percent, message);
  }

  protected async validateAuth(workerJWT: string): Promise<boolean> {
    // TODO: Implement JWT validation
    return true;
  }
}
