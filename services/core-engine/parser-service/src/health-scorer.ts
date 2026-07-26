export class HealthScorer {
  static calculateScore(repoId: string, files: any[], functions: any[], callEdges: any[]) {
    console.log(`[HealthScorer] Calculating deterministic health score for repo ${repoId}...`);
    
    let modularityScore = 100;
    let couplingIndex = 0;

    const fileMap = new Map<string, any>();
    for (const f of files) fileMap.set(f.id, f);

    const fnToFileMap = new Map<string, string>();
    for (const fn of functions) fnToFileMap.set(fn.id, fn.fileId);

    let internalCalls = 0;
    let crossModuleCalls = 0;

    for (const edge of callEdges) {
      const callerFile = fnToFileMap.get(edge.callerFunctionId);
      const calleeFile = fnToFileMap.get(edge.calleeFunctionId);

      if (callerFile === calleeFile) {
        internalCalls++;
      } else {
        crossModuleCalls++;
      }
    }

    // Dead Code Detection (FR-6)
    // Find functions with 0 incoming edges that are not likely entry points (e.g. exports)
    const calleeIds = new Set(callEdges.map(e => e.calleeFunctionId));
    const deadFunctions = functions.filter(fn => !calleeIds.has(fn.id) && !fn.signature.includes('export'));
    
    const deadCodeCount = deadFunctions.length;
    if (deadCodeCount > 0) {
      console.log(`[HealthScorer] Found ${deadCodeCount} potentially dead functions.`);
    }

    const totalCalls = internalCalls + crossModuleCalls;
    if (totalCalls > 0) {
      // Coupling Index: ratio of cross-module calls to total calls (0 to 1), scale to 100
      couplingIndex = (crossModuleCalls / totalCalls) * 100;
      // Modularity: 100 minus penalty for high coupling and dead code
      modularityScore = Math.max(0, 100 - couplingIndex - (deadCodeCount * 2));
    }

    return {
      modularityScore: Math.round(modularityScore),
      couplingIndex: parseFloat(couplingIndex.toFixed(2)),
      metricsJson: JSON.stringify({
        totalFiles: files.length,
        totalFunctions: functions.length,
        totalCalls,
        internalCalls,
        crossModuleCalls,
        deadCodeCount
      })
    };
  }
}
