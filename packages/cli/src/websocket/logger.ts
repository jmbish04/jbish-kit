import chalk from "chalk";
import ora, { type Ora } from "ora";

export class Logger {
  private verbose: boolean;
  private debug: boolean;
  private spinner?: Ora;

  constructor(verbose = true, debug = false) {
    this.verbose = verbose;
    this.debug = debug;
  }

  info(message: string): void {
    if (this.verbose) {
      console.log(chalk.blue("ℹ"), message);
    }
  }

  success(message: string): void {
    console.log(chalk.green("✓"), message);
  }

  warn(message: string): void {
    console.log(chalk.yellow("⚠"), message);
  }

  error(message: string): void {
    console.error(chalk.red("✗"), message);
  }

  debug(message: string): void {
    if (this.debug) {
      console.log(chalk.gray("[DEBUG]"), message);
    }
  }

  progress(percent: number, message?: string): void {
    if (!this.spinner) {
      this.spinner = ora().start();
    }

    const progressBar = this.createProgressBar(percent);
    const text = message
      ? `${progressBar} ${message}`
      : `${progressBar} ${percent}%`;

    this.spinner.text = text;

    if (percent >= 100) {
      this.spinner.succeed("Task completed");
      this.spinner = undefined;
    }
  }

  private createProgressBar(percent: number, width = 20): string {
    const filled = Math.round((percent / 100) * width);
    const empty = width - filled;

    return (
      chalk.green("█".repeat(filled)) +
      chalk.gray("░".repeat(empty)) +
      ` ${percent}%`
    );
  }

  startSpinner(text: string): void {
    this.spinner = ora(text).start();
  }

  stopSpinner(success = true, text?: string): void {
    if (this.spinner) {
      if (success) {
        this.spinner.succeed(text);
      } else {
        this.spinner.fail(text);
      }
      this.spinner = undefined;
    }
  }
}
