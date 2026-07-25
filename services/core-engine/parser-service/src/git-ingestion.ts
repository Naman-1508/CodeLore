import { exec } from 'child_process';
import util from 'util';

const execPromise = util.promisify(exec);

export interface GitCommit {
  sha: string;
  authorEmail: string;
  authorName: string;
  committedAt: Date;
  message: string;
  fileChanges: {
    path: string;
    changeType: 'added' | 'modified' | 'deleted' | 'renamed';
    linesAdded: number;
    linesRemoved: number;
  }[];
}

export class GitIngester {
  private repoPath: string;

  constructor(repoPath: string) {
    this.repoPath = repoPath;
  }

  async ingestHistory(): Promise<GitCommit[]> {
    // In a real scenario, we'd use 'git log --numstat --format=...' and parse stdout.
    // For this stub, we return mock data representing parsed commits.
    console.log(`[GitIngester] Simulating git log parse for ${this.repoPath}...`);
    
    return [
      {
        sha: 'b380616b23a',
        authorEmail: 'alice@example.com',
        authorName: 'Alice',
        committedAt: new Date(),
        message: 'Initial commit',
        fileChanges: [
          { path: 'src/index.ts', changeType: 'added', linesAdded: 50, linesRemoved: 0 },
          { path: 'package.json', changeType: 'added', linesAdded: 15, linesRemoved: 0 }
        ]
      },
      {
        sha: 'a1b2c3d4e5f',
        authorEmail: 'bob@example.com',
        authorName: 'Bob',
        committedAt: new Date(Date.now() - 86400000), // 1 day ago
        message: 'Refactor index.ts',
        fileChanges: [
          { path: 'src/index.ts', changeType: 'modified', linesAdded: 10, linesRemoved: 5 }
        ]
      }
    ];
  }
}
