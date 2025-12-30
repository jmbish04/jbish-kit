import type { TaskType, Env } from "../types";
import type { TaskSession } from "../durable-objects/TaskSession";
import type { BaseTask } from "./base-task";
import { GeneratePageTask } from "./generate-page";
import { MockTask } from "./mock-task";

export function createTaskExecutor(
  type: TaskType,
  env: Env,
  session: TaskSession,
): BaseTask {
  switch (type) {
    case "task:generate_page":
      return new GeneratePageTask(env, session);

    case "task:generate_agent":
    case "task:lint_fix":
    case "task:health_audit":
    case "task:custom":
      // Use mock task for now
      return new MockTask(env, session);

    default:
      throw new Error(`Unknown task type: ${type}`);
  }
}
