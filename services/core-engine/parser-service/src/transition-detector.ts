import { GroqAdapter } from './groq-adapter';

export class TransitionDetector {
  private llm: GroqAdapter;

  constructor(llm: GroqAdapter) {
    this.llm = llm;
  }

  async detectAndNarrateTransitions(snapshotA: any, snapshotB: any) {
    const modulesA = new Set(snapshotA.moduleMapJson.modules);
    const modulesB = new Set(snapshotB.moduleMapJson.modules);
    
    const addedModules = [...modulesB].filter(m => !modulesA.has(m));
    const removedModules = [...modulesA].filter(m => !modulesB.has(m));

    if (addedModules.length === 0 && removedModules.length === 0) {
      return null;
    }

    const contextFacts = [
      `Modules present at Time A: ${[...modulesA].join(', ')}`,
      `Modules present at Time B: ${[...modulesB].join(', ')}`,
      `Added modules: ${addedModules.join(', ')}`,
      `Removed modules: ${removedModules.join(', ')}`
    ];

    const messages = [{
      role: 'user', 
      content: 'Explain the architectural transition between these two points in time based strictly on the modules added and removed.'
    }];

    try {
      const narration = await this.llm.chat(messages, contextFacts);
      return narration;
    } catch (e) {
      return `Deterministic Fallback: Added modules: ${addedModules.join(', ')}. Removed modules: ${removedModules.join(', ')}.`;
    }
  }
}
