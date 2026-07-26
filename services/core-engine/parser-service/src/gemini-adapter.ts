import { LLMProvider, ChatMessage } from './llm-provider';
import { GoogleGenAI } from '@google/genai';

export class GeminiAdapter implements LLMProvider {
  private ai: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateDocstring(codeSnippet: string, contextFacts: string[]): Promise<string> {
    console.log(`[GeminiAdapter] Generating docstring for snippet of length ${codeSnippet.length}`);
    const prompt = `
Context Facts:
${contextFacts.map(f => `- ${f}`).join('\n')}

Code Snippet:
\`\`\`
${codeSnippet}
\`\`\`

Generate a highly descriptive, architectural summary for the above code snippet. Focus ONLY on its purpose and its role in the larger system. Do NOT include any filler language, pleasantries, or introductory phrases (e.g. "Here is the summary", "This code snippet..."). Do NOT hallucinate dependencies not present in the code. Keep it to strictly 1-2 sentences of raw, factual technical description.`;

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
    });
    
    return response.text || "No narration generated.";
  }

  async chat(messages: ChatMessage[], contextFacts: string[]): Promise<string> {
    console.log(`[GeminiAdapter] Chatting with Gemini API`);
    
    const contextPrompt = `You are a strict technical code assistant. Answer the user's questions based strictly on the provided Context Facts. Do not hallucinate logic, functions, or files not present in the context. Do not use filler words or pleasantries; provide direct, concise, factual answers.\n\nContext Facts:\n${contextFacts.map(f => `- ${f}`).join('\n')}\n\n`;
    
    // We append context to the last message if available
    const mappedMessages = messages.map(m => m.content);
    const fullPrompt = contextPrompt + mappedMessages.join('\n\n');

    const response = await this.ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: fullPrompt,
    });
    
    return response.text || "No response generated.";
  }
  
  async generateEmbedding(text: string): Promise<number[]> {
    console.log(`[GeminiAdapter] Generating semantic embedding for text of length: ${text.length}`);
    
    try {
      const response = await this.ai.models.embedContent({
        model: 'gemini-embedding-2',
        contents: text
      });
      // The response returns embeddings.values which is the array of floats
      // pgvector default dimension is 1536 but text-embedding-004 uses 768.
      const vec = response.embeddings?.[0]?.values || [];
      if (vec.length < 1536) {
        return [...vec, ...new Array(1536 - vec.length).fill(0)];
      }
      return vec.slice(0, 1536);
    } catch (e) {
      console.error('[GeminiAdapter] Failed to generate embedding', e);
      return new Array(1536).fill(0);
    }
  }
}
