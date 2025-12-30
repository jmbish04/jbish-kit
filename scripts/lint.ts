import fs from "node:fs";
import path from "node:path";
import {
  getAllWorkspacePaths,
  readJson,
  readJsonC,
  readToml,
  writeJson,
  writeJsonC,
  type PackageJson,
  type WranglerConfig,
} from "./util";
import MarkdownError from "./MarkdownError";

export type LintConfig = {
  projectDirectory: string;
  fix: boolean;
};

const TARGET_COMPATIBILITY_DATE = "2025-10-08";

type FileDiagnostic = {
  filePath: string;
  problems: string[];
};

export function lint(config: LintConfig) {
  const workspacePaths = getAllWorkspacePaths(config.projectDirectory);
  const results: FileDiagnostic[] = [];

  for (const workspacePath of workspacePaths) {
    results.push(...lintWorkspace(workspacePath, config.fix));
  }

  if (results.length > 0) {
    throw new MarkdownError(
      "Linting failed. Run with --fix to fix automatically fixable issues.",
      results
        .flatMap(({ filePath, problems }) => {
          return [`- ${filePath}`, problems.map((problem) => `  - ${problem}`)];
        })
        .join("\n"),
    );
  }

  return "✅ All checks passed!";
}

const CHECKS: Record<
  string,
  Array<(workspacePath: string, filePath: string, fix: boolean) => string[]>
> = {
  "wrangler.toml": [lintWranglerToml],
  "wrangler.jsonc": [lintWranglerJsonC],
  "wrangler.json": [lintWranglerJson],
  "package.json": [lintPackageJson],
};

function lintWorkspace(workspacePath: string, fix: boolean): FileDiagnostic[] {
  const allProblems = Object.entries(CHECKS).flatMap(([file, linters]) => {
    const filePath = path.join(workspacePath, file);
    const problems = linters.flatMap((linter) =>
      linter(workspacePath, filePath, fix),
    );
    return problems.length > 0 ? [{ filePath, problems }] : [];
  });

  return allProblems;
}

function lintWranglerToml(
  workspacePath: string,
  filePath: string,
  fix: boolean,
): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const jsonPath = filePath.replace(/\.toml$/, ".json");
  if (fix && !fs.existsSync(jsonPath)) {
    writeJson(jsonPath, readToml(filePath));
    fs.unlinkSync(filePath);
    return [];
  }
  return [`Found ${filePath}. Please convert wrangler.toml to wrangler.json.`];
}

function lintWranglerJsonC(
  workspacePath: string,
  filePath: string,
  fix: boolean,
): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const wrangler = readJsonC(filePath) as WranglerConfig;

  const packageJsonPath = path.join(path.dirname(filePath), "package.json");
  const packageJson = fs.existsSync(packageJsonPath)
    ? (readJson(packageJsonPath) as PackageJson)
    : null;

  if (fix) {
    wrangler.compatibility_date = TARGET_COMPATIBILITY_DATE;
    wrangler.observability = { enabled: true };
    wrangler.upload_source_maps = true;
    if (packageJson?.name) {
      wrangler.name = packageJson.name.replace("@repo/", "");
    }
    writeJsonC(filePath, wrangler);
    return [];
  }

  const problems = [];
  if (wrangler.compatibility_date !== TARGET_COMPATIBILITY_DATE) {
    problems.push(
      `"compatibility_date" should be set to "${TARGET_COMPATIBILITY_DATE}"`,
    );
  }
  if (wrangler.observability?.enabled !== true) {
    problems.push(`"observability" should be set to { "enabled": true }`);
  }
  if (wrangler.upload_source_maps !== true) {
    problems.push(`"upload_source_maps" should be set to true`);
  }

  if (packageJson?.name) {
    const expectedName = packageJson.name.replace("@repo/", "");
    if (wrangler.name !== expectedName) {
      problems.push(`"name" should be set to "${expectedName}"`);
    }
  }

  return problems;
}

function lintWranglerJson(
  workspacePath: string,
  filePath: string,
  fix: boolean,
): string[] {
  if (!fs.existsSync(filePath)) {
    return [];
  }
  const wrangler = readJson(filePath) as WranglerConfig;

  const packageJsonPath = path.join(path.dirname(filePath), "package.json");
  const packageJson = fs.existsSync(packageJsonPath)
    ? (readJson(packageJsonPath) as PackageJson)
    : null;

  if (fix) {
    wrangler.compatibility_date = TARGET_COMPATIBILITY_DATE;
    wrangler.observability = { enabled: true };
    wrangler.upload_source_maps = true;
    if (packageJson?.name) {
      wrangler.name = packageJson.name.replace("@repo/", "");
    }
    writeJson(filePath, wrangler);
    return [];
  }

  const problems = [];
  if (wrangler.compatibility_date !== TARGET_COMPATIBILITY_DATE) {
    problems.push(
      `"compatibility_date" should be set to "${TARGET_COMPATIBILITY_DATE}"`,
    );
  }
  if (wrangler.observability?.enabled !== true) {
    problems.push(`"observability" should be set to { "enabled": true }`);
  }
  if (wrangler.upload_source_maps !== true) {
    problems.push(`"upload_source_maps" should be set to true`);
  }

  if (packageJson?.name) {
    const expectedName = packageJson.name.replace("@repo/", "");
    if (wrangler.name !== expectedName) {
      problems.push(`"name" should be set to "${expectedName}"`);
    }
  }

  return problems;
}

function lintPackageJson(
  workspacePath: string,
  filePath: string,
  fix: boolean,
): string[] {
  if (!fs.existsSync(filePath)) {
    return [`Expected ${filePath} to exist.`];
  }

  const pkg = readJson(filePath) as PackageJson;
  const problems: string[] = [];

  if (!pkg.private && pkg.name?.startsWith("@repo/")) {
    problems.push('"private" should be set to true for workspace packages');
  }

  if (pkg.version && pkg.private) {
    problems.push(
      '"version" should not be set for private workspace packages (or should be "0.0.0")',
    );
  }

  return problems;
}
