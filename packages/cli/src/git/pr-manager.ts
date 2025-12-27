import { type BranchManager } from "./branch-manager";

export class PRManager {
  constructor(
    private branchManager: BranchManager,
    private githubToken: string,
  ) {}

  async createPR(args: {
    title: string;
    body: string;
    head: string;
    base: string;
  }): Promise<string> {
    const { owner, repo } = await this.branchManager.getRepoInfo();

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          title: args.title,
          body: args.body,
          head: args.head,
          base: args.base,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to create PR: ${error}`);
    }

    const data = (await response.json()) as { html_url: string };
    return data.html_url;
  }

  async mergePR(prNumber: number, mergeMethod: "merge" | "squash" | "rebase" = "squash"): Promise<void> {
    const { owner, repo } = await this.branchManager.getRepoInfo();

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}/merge`,
      {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          "Content-Type": "application/json",
          Accept: "application/vnd.github.v3+json",
        },
        body: JSON.stringify({
          merge_method: mergeMethod,
        }),
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to merge PR: ${error}`);
    }
  }

  async getPRStatus(prNumber: number): Promise<{
    state: string;
    mergeable: boolean;
    checks: { status: string; conclusion: string }[];
  }> {
    const { owner, repo } = await this.branchManager.getRepoInfo();

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls/${prNumber}`,
      {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get PR status: ${error}`);
    }

    const data = (await response.json()) as any;

    return {
      state: data.state,
      mergeable: data.mergeable,
      checks: [], // TODO: Implement check status fetching
    };
  }

  async listPRs(state: "open" | "closed" | "all" = "open"): Promise<
    Array<{
      number: number;
      title: string;
      state: string;
      url: string;
    }>
  > {
    const { owner, repo } = await this.branchManager.getRepoInfo();

    const response = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/pulls?state=${state}`,
      {
        headers: {
          Authorization: `Bearer ${this.githubToken}`,
          Accept: "application/vnd.github.v3+json",
        },
      },
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to list PRs: ${error}`);
    }

    const data = (await response.json()) as any[];

    return data.map((pr) => ({
      number: pr.number,
      title: pr.title,
      state: pr.state,
      url: pr.html_url,
    }));
  }
}
