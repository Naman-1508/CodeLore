import { LLMProvider } from './llm-provider';

const SYSTEM_PROMPT = `You are CodeLore, a deterministic Engineering Mentor and structural code analyzer.
CRITICAL INSTRUCTION: You must provide STRICT, FACTUAL answers based ONLY on the provided context facts.
DO NOT hallucinate. DO NOT guess. DO NOT add conversational filler, feed talking, or "buttering up" (e.g., "That's a great question", "I'd be happy to help", "Here is the answer").
If the provided context does not contain the answer, you must reply exactly with: "I do not have enough context to answer this question."
Provide straight, clear facts and nothing else.`;

export class GroqAdapter implements LLMProvider {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async generateDocstring(codeSnippet: string, contextFacts: string[]): Promise<string> {
    console.log('[GroqAdapter] Simulating API call for docstring generation...');
    // Simulated fetch to Groq API
    const prompt = `${SYSTEM_PROMPT}\n\nTask: Generate a 1-sentence technical docstring for this code.\nCode:\n${codeSnippet}`;
    return Promise.resolve("Simulated Groq Docstring: Validates the incoming payload against the schema.");
  }

  async chat(messages: any[], contextFacts: string[]): Promise<string> {
    console.log('[GroqAdapter] Simulating API call for chat...');
    // Simulated fetch to Groq API
    const contextStr = contextFacts.join('\n');
    const userMessage = messages[messages.length - 1]?.content || "";
    const prompt = `${SYSTEM_PROMPT}\n\nContext Facts:\n${contextStr}\n\nUser Question:\n${userMessage}`;
    return Promise.resolve("Based on the context: The function processData handles the initial request and calls validatePayload.");
  }
}
