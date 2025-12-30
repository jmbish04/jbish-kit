#! /usr/bin/env node

import { Command } from "@commander-js/extra-typings";
import { lint } from "./lint";
import { actionWithSummary } from "./util";

const program = new Command();

program.name("repo-cli").description("A handy CLI for the repository");

program
  .command("lint")
  .description("Find and fix project style problems")
  .argument("[path-to-project]", "Path to project root directory", ".")
  .option("--fix", "Fix problems that can be automatically fixed")
  .action((projectDirectory, options) => {
    return actionWithSummary("Lint", () =>
      lint({ projectDirectory, fix: options.fix ?? false }),
    );
  });

program.parseAsync();
