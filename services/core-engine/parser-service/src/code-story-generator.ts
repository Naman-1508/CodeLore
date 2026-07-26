import { GeminiAdapter } from './gemini-adapter';

export class CodeStoryGenerator {
  static async generateBaselineStories(
    repoId: string, 
    entryPoints: any[], 
    callEdges: any[], 
    functionsDbMap: Map<string, any>, 
    aiAdapter: GeminiAdapter
  ) {
    console.log(`[CodeStoryGenerator] Generating deterministic Code Stories for repo ${repoId}...`);
    const stories = [];

    // Create an adjacency list from the callEdges
    const graph = new Map<string, string[]>();
    for (const edge of callEdges) {
      if (!graph.has(edge.callerFunctionId)) {
        graph.set(edge.callerFunctionId, []);
      }
      graph.get(edge.callerFunctionId)!.push(edge.calleeFunctionId);
    }

    for (const entryPoint of entryPoints) {
      // Traverse call graph using BFS/DFS (let's do BFS for sequence up to depth 4)
      const storySteps: { order: number, functionId: string, narration: string }[] = [];
      const visited = new Set<string>();
      const queue: { id: string, depth: number }[] = [{ id: entryPoint.id, depth: 0 }];
      
      let order = 1;
      const MAX_DEPTH = 3; // Keep stories concise for MVP

      while (queue.length > 0 && order <= 5) { // Cap at 5 steps per story
        const { id, depth } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const fnData = functionsDbMap.get(id);
        if (fnData) {
          // Generate a narrative for this step using AI
          const codeSnippet = fnData.signature || fnData.name;
          const contextFacts = [
            `This function is part of a flow starting at ${entryPoint.name}.`,
            `The depth of this execution is ${depth}.`,
            `Function Name: ${fnData.name}`
          ];

          // Use AI to generate step narration
          const narration = await aiAdapter.generateDocstring(codeSnippet, contextFacts);

          storySteps.push({
            order,
            functionId: id,
            narration
          });
          order++;
        }

        if (depth < MAX_DEPTH) {
          const neighbors = graph.get(id) || [];
          for (const n of neighbors) {
            queue.push({ id: n, depth: depth + 1 });
          }
        }
      }

      stories.push({
        title: `${entryPoint.name} Flow`,
        description: `Auto-generated sequence starting at ${entryPoint.name}`,
        entryFunctionId: entryPoint.id,
        steps: storySteps
      });
    }

    return stories;
  }
}
