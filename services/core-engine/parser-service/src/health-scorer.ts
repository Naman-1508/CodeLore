export class HealthScorer {
  static calculateScore(repoId: string, dependencies: any[], findings: any[]) {
    console.log(`[HealthScorer] Calculating health score for repo ${repoId}...`);
    // Start at 100
    let score = 100;

    // Deduct for circular dependencies
    const circularCount = dependencies.filter(d => d.isCircular).length;
    score -= circularCount * 5;

    // Deduct for high coupling
    const highlyCoupledCount = findings.filter(f => f.type === 'highly_coupled').length;
    score -= highlyCoupledCount * 3;

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      score,
      metricsJson: JSON.stringify({
        circularDependencies: circularCount,
        highlyCoupledModules: highlyCoupledCount,
        deadCodeFunctions: findings.filter(f => f.type === 'dead_code').length
      })
    };
  }
}
