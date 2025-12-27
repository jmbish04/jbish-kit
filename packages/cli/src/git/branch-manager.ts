import simpleGit, { type SimpleGit } from "simple-git";

export class BranchManager {
  private git: SimpleGit;

  constructor(cwd?: string) {
    this.git = simpleGit(cwd);
  }

  async createFeatureBranch(name: string): Promise<string> {
    // Ensure we're on latest main/master
    await this.ensureCleanWorkingDirectory();

    const branchName = this.formatBranchName(name);

    // Check if branch already exists
    const branches = await this.git.branchLocal();
    if (branches.all.includes(branchName)) {
      throw new Error(`Branch ${branchName} already exists`);
    }

    // Create and checkout new branch
    await this.git.checkoutLocalBranch(branchName);

    return branchName;
  }

  async switchToBranch(branchName: string): Promise<void> {
    await this.git.checkout(branchName);
  }

  async getCurrentBranch(): Promise<string> {
    const branch = await this.git.branch();
    return branch.current;
  }

  async getRemoteUrl(): Promise<string> {
    const remotes = await this.git.getRemotes(true);
    const origin = remotes.find((r) => r.name === "origin");

    if (!origin || !origin.refs.push) {
      throw new Error("No origin remote found");
    }

    // Convert SSH to HTTPS format
    let url = origin.refs.push;
    if (url.startsWith("git@github.com:")) {
      url = url.replace("git@github.com:", "https://github.com/");
    }
    if (url.endsWith(".git")) {
      url = url.slice(0, -4);
    }

    return url;
  }

  async getRepoInfo(): Promise<{ owner: string; repo: string }> {
    const url = await this.getRemoteUrl();
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);

    if (!match) {
      throw new Error("Invalid GitHub URL");
    }

    return {
      owner: match[1],
      repo: match[2],
    };
  }

  private formatBranchName(name: string): string {
    // Convert to kebab-case and add feature/ prefix
    const kebab = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    return `feature/${kebab}`;
  }

  private async ensureCleanWorkingDirectory(): Promise<void> {
    const status = await this.git.status();

    if (status.files.length > 0) {
      throw new Error(
        "Working directory has uncommitted changes. Please commit or stash them first.",
      );
    }
  }

  async deleteBranch(branchName: string, force = false): Promise<void> {
    await this.git.branch([force ? "-D" : "-d", branchName]);
  }

  async listBranches(): Promise<string[]> {
    const branches = await this.git.branchLocal();
    return branches.all;
  }
}
