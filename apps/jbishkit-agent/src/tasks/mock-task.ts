import { BaseTask } from "./base-task";
import type { TaskMessage } from "../types";

export class MockTask extends BaseTask {
  async execute(task: TaskMessage): Promise<void> {
    this.log(`Executing mock task: ${task.type}`);

    // Simulate task execution
    this.progress(25, "Starting task...");
    await this.sleep(1000);

    this.progress(50, "Processing...");
    await this.sleep(1000);

    this.progress(75, "Finalizing...");
    await this.sleep(1000);

    this.progress(100, "Task completed");

    this.log("Mock task completed successfully");
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
