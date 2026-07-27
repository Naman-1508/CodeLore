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
      // Traverse call graph using BFS
      const visited = new Set<string>();
      const queue: { id: string, depth: number }[] = [{ id: entryPoint.id, depth: 0 }];
      
      const MAX_DEPTH = 3; // Keep stories concise for MVP
      const pendingAiTasks = [];
      let order = 1;

      while (queue.length > 0 && order <= 5) {
        const { id, depth } = queue.shift()!;
        if (visited.has(id)) continue;
        visited.add(id);

        const fnData = functionsDbMap.get(id);
        if (fnData) {
          const codeSnippet = fnData.signature || fnData.name;
          const contextFacts = [
            `This function is part of a flow starting at ${entryPoint.name}.`,
            `The depth of this execution is ${depth}.`,
            `Function Name: ${fnData.name}`
          ];

          pendingAiTasks.push({
            order: order,
            id: id,
            codeSnippet,
            contextFacts
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

      // Execute AI generation in a single batch to avoid hitting RPM/Request quotas (429)
      let batchResults: {id: string, narration: string}[] = [];
      try {
        batchResults = await aiAdapter.generateDocstringsBatch(pendingAiTasks);
      } catch (err: any) {
        console.error("AI generation failed for stories due to quota or error. Using fallback.", err.message);
        // Smart AST Fallback: generate a detailed summary based purely on function data and call edges
        batchResults = pendingAiTasks.map(t => {
          const fnData = functionsDbMap.get(t.id);
          const name = fnData?.name || 'unknown';
          
          // Get called functions (outgoing edges)
          const outEdges = graph.get(t.id) || [];
          const outCalls = outEdges
            .map(calleeId => functionsDbMap.get(calleeId)?.name)
            .filter(Boolean) as string[];
          
          // Construct deterministic narrative
          let narration = `The function \`${name}\` begins execution.`;
          
          if (outCalls.length > 0) {
            const uniqueCalls = [...new Set(outCalls)];
            if (uniqueCalls.length === 1) {
              narration += ` It makes a downstream call to \`${uniqueCalls[0]}\`.`;
            } else {
              const displayCalls = uniqueCalls.slice(0, 3).map(c => `\`${c}\``).join(', ');
              const extras = uniqueCalls.length > 3 ? ' and others' : '';
              narration += ` Execution branches out to internal calls: ${displayCalls}${extras}.`;
            }
          } else {
            narration += ` It computes and completes its task without delegating to other known functions.`;
          }

          return {
            id: t.id,
            narration
          };
        });
      }
      const storySteps = pendingAiTasks.map(t => {
        const result = batchResults.find(r => r.id === t.id);
        return {
          order: t.order,
          functionId: t.id,
          narration: result ? result.narration : "No narration available."
        };
      }).sort((a, b) => a.order - b.order);

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
