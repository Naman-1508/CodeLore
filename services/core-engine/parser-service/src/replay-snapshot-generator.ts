import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export class ReplaySnapshotGenerator {
  
  static async generateSnapshotsForRepo(repositoryId: string, repoPath: string) {
    console.log(`[ReplaySnapshotGenerator] Generating structural snapshots for ${repositoryId} at ${repoPath}`);
    
    // 1. Get chronological list of commits (e.g. 1 per week or significant tags)
    // For MVP, just get the last 5 commits for demonstration of real git parsing without taking hours
    const gitLogCmd = `git -C ${repoPath} log --pretty=format:"%H|%cI" -n 5`;
    let logOutput = '';
    try {
      logOutput = execSync(gitLogCmd).toString().trim();
    } catch (e) {
      console.error(`[ReplaySnapshotGenerator] Failed to get git log:`, e);
      return;
    }

    if (!logOutput) return;

    const commits = logOutput.split('\n').reverse(); // Process oldest first
    const originalBranch = execSync(`git -C ${repoPath} branch --show-current`).toString().trim();

    for (const commitLine of commits) {
      const [hash, timestamp] = commitLine.split('|');
      console.log(`[ReplaySnapshotGenerator] Processing commit ${hash} at ${timestamp}`);
      
      try {
        // 2. Checkout the commit
        execSync(`git -C ${repoPath} checkout ${hash} --quiet`);

        // 3. Generate a module map (in a real scenario, this would re-run Tree-sitter on the entire codebase)
        // Here we do a lightweight read of the directory structure to represent the module map at this commit
        const moduleMap = this.generateLightweightModuleMap(repoPath);

        // 4. Save to database (Simulated here)
        // INSERT INTO architecture_snapshot (repository_id, commit_hash, timestamp, module_map_json)
        console.log(`[ReplaySnapshotGenerator] Saved snapshot for ${hash}. Module count: ${moduleMap.modules.length}`);

      } catch (e) {
        console.error(`[ReplaySnapshotGenerator] Failed processing commit ${hash}:`, e);
      }
    }

    // Restore original branch
    execSync(`git -C ${repoPath} checkout ${originalBranch} --quiet`);
    console.log(`[ReplaySnapshotGenerator] Finished generating snapshots.`);
  }

  private static generateLightweightModuleMap(dirPath: string): any {
    const modules: string[] = [];
    
    // Read top level directories as 'modules'
    try {
      const items = fs.readdirSync(dirPath, { withFileTypes: true });
      for (const item of items) {
        if (item.isDirectory() && !item.name.startsWith('.') && item.name !== 'node_modules') {
          modules.push(item.name);
        }
      }
    } catch (e) {
      // Ignore
    }

    return { modules };
  }
}
