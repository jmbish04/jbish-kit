import "zx/globals";
import { parse, stringify } from "comment-json";
import fs from "node:fs";
import path from "node:path";
import toml from "toml";
import subprocess from "node:child_process";
import MarkdownError from "./MarkdownError";

export type PackageJson = {
  name?: string;
  version?: string;
  private?: boolean;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
};

export type WranglerConfig = {
  name?: string;
  compatibility_date?: string;
  observability?: { enabled?: boolean };
  upload_source_maps?: boolean;
};

export function readToml(filePath: string): unknown {
  return toml.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

export function readJsonC(filePath: string): unknown {
  return parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

export function writeJsonC(filePath: string, object: unknown) {
  fs.writeFileSync(filePath, stringify(object, undefined, 2) + "\n");
}

export function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, { encoding: "utf-8" }));
}

export function writeJson(filePath: string, object: unknown) {
  fs.writeFileSync(filePath, JSON.stringify(object, undefined, 2) + "\n");
}

export async function actionWithSummary(
  title: string,
  action: () => Promise<string | void> | string | void,
) {
  try {
    const markdown = await action();
    if (typeof markdown === "string") {
      echo(chalk.green(markdown));
      if (process.env.GITHUB_STEP_SUMMARY !== undefined) {
        fs.appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          [`## ${title}`, markdown].join("\n"),
        );
      }
    }
  } catch (err) {
    echo(chalk.red((err as Error).message));
    if (err instanceof MarkdownError) {
      echo(chalk.yellow(err.markdown));
      if (process.env.GITHUB_STEP_SUMMARY !== undefined) {
        fs.appendFileSync(
          process.env.GITHUB_STEP_SUMMARY,
          [`## ${title}`, err.markdown].join("\n"),
        );
      }
      process.exit(1);
    }
    throw err;
  }
}

function gitIgnored(filePath: string): boolean {
  try {
    subprocess.execSync(`git check-ignore ${filePath}`);
    return true;
  } catch {
    return false;
  }
}

export function collectFiles(
  dirPath: string,
  recursive = true,
): Array<{ filePath: string; relativePath: string }> {
  return fs
    .readdirSync(dirPath, { recursive })
    .map((file) => ({
      relativePath: file.toString(),
      filePath: path.join(dirPath, file.toString()),
    }))
    .filter(
      ({ filePath }) =>
        !filePath.includes("node_modules") &&
        !fs.statSync(filePath).isDirectory() &&
        !gitIgnored(filePath),
    );
}

export function getWorkspaces(rootDir: string): string[] {
  const packageJsonPath = path.join(rootDir, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return [];
  }
  const pkg = readJson(packageJsonPath) as {
    workspaces?: string[];
  };
  return pkg.workspaces || [];
}

export function getAllWorkspacePaths(rootDir: string): string[] {
  const workspaces = getWorkspaces(rootDir);
  const paths: string[] = [];

  for (const workspace of workspaces) {
    if (workspace.includes("*")) {
      const baseDir = workspace.replace("/*", "");
      const basePath = path.join(rootDir, baseDir);
      if (fs.existsSync(basePath)) {
        const dirs = fs
          .readdirSync(basePath)
          .filter((file) =>
            fs.statSync(path.join(basePath, file)).isDirectory(),
          )
          .map((dir) => path.join(basePath, dir));
        paths.push(...dirs);
      }
    } else {
      paths.push(path.join(rootDir, workspace));
    }
  }

  return paths.filter((p) => {
    const pkgPath = path.join(p, "package.json");
    return fs.existsSync(pkgPath);
  });
}
