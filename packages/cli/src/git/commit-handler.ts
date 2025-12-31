import simpleGit, { type SimpleGit } from "simple-git";

export class CommitHandler {
  private git: SimpleGit;

  constructor(cwd?: string) {
    this.git = simpleGit(cwd);
  }

  async stageFiles(files: string[] = ["."]): Promise<void> {
    await this.git.add(files);
  }

  async commit(message: string): Promise<void> {
    await this.git.commit(message);
  }

  async push(branch: string, setUpstream = true): Promise<void> {
    if (setUpstream) {
      await this.git.push("origin", branch, ["--set-upstream"]);
    } else {
      await this.git.push("origin", branch);
    }
  }

  async pull(branch?: string): Promise<void> {
    if (branch) {
      await this.git.pull("origin", branch);
    } else {
      await this.git.pull();
    }
  }

  async getStatus(): Promise<{
    modified: string[];
    added: string[];
    deleted: string[];
    untracked: string[];
  }> {
    const status = await this.git.status();

    return {
      modified: status.modified,
      added: status.created,
      deleted: status.deleted,
      untracked: status.not_added,
    };
  }

  async getDiff(staged = false): Promise<string> {
    if (staged) {
      return await this.git.diff(["--cached"]);
    }
    return await this.git.diff();
  }

  async getLastCommit(): Promise<{
    hash: string;
    message: string;
    author: string;
  }> {
    const log = await this.git.log({ maxCount: 1 });
    const latest = log.latest;

    if (!latest) {
      throw new Error("No commits found");
    }

    return {
      hash: latest.hash,
      message: latest.message,
      author: latest.author_name,
    };
  }

  async getCommitLog(maxCount = 10): Promise<
    Array<{
      hash: string;
      message: string;
      author: string;
      date: string;
    }>
  > {
    const log = await this.git.log({ maxCount });

    return log.all.map((commit) => ({
      hash: commit.hash,
      message: commit.message,
      author: commit.author_name,
      date: commit.date,
    }));
  }

  async hasUncommittedChanges(): Promise<boolean> {
    const status = await this.git.status();
    return status.files.length > 0;
  }

  async stageAndCommit(
    message: string,
    files: string[] = ["."],
  ): Promise<void> {
    await this.stageFiles(files);
    await this.commit(message);
  }
}
