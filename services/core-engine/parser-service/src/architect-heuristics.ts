import { GitCommit } from './git-ingestion';

export class ArchitectHeuristics {
  static calculateCoChange(commits: GitCommit[]) {
    // Simulated co-change clustering (files modified in the same commit)
    const coChangeMap: Record<string, Record<string, number>> = {};
    
    commits.forEach(commit => {
      const files = commit.fileChanges.map(f => f.path);
      for (let i = 0; i < files.length; i++) {
        for (let j = i + 1; j < files.length; j++) {
          const f1 = files[i];
          const f2 = files[j];
          if (!coChangeMap[f1]) coChangeMap[f1] = {};
          if (!coChangeMap[f2]) coChangeMap[f2] = {};
          coChangeMap[f1][f2] = (coChangeMap[f1][f2] || 0) + 1;
          coChangeMap[f2][f1] = (coChangeMap[f2][f1] || 0) + 1;
        }
      }
    });
    
    return coChangeMap;
  }

  static calculateOwnership(commits: GitCommit[], targetPath: string) {
    const ownership: Record<string, number> = {};
    
    commits.forEach(commit => {
      const changed = commit.fileChanges.find(f => f.path === targetPath);
      if (changed) {
        ownership[commit.authorName] = (ownership[commit.authorName] || 0) + changed.linesAdded + changed.linesRemoved;
      }
    });

    // Normalize to percentage
    const totalLines = Object.values(ownership).reduce((sum, val) => sum + val, 0);
    if (totalLines === 0) return {};
    
    for (const author in ownership) {
      ownership[author] = (ownership[author] / totalLines) * 100;
    }

    return ownership;
  }
}
