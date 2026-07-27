import { LLMProvider, ChatMessage } from './llm-provider';
import { GoogleGenAI } from '@google/genai';

export class GeminiAdapter implements LLMProvider {
  private ai: GoogleGenAI;
  
  constructor(apiKey: string) {
    this.ai = new GoogleGenAI({ apiKey });
  }

  async generateDocstringsBatch(tasks: { id: string, codeSnippet: string, contextFacts: string[] }[]): Promise<{ id: string, narration: string }[]> {
    console.log(`[GeminiAdapter] Generating docstrings in batch for ${tasks.length} snippets`);
    
    if (tasks.length === 0) return [];

    let prompt = `You are a strict technical code assistant. I will provide multiple code snippets. For each snippet, generate a highly descriptive, architectural summary. Focus ONLY on its purpose and its role in the larger system. Do NOT include filler language or hallucinate dependencies. Keep it strictly to 1-2 sentences.\n\n`;
    prompt += `Return ONLY a valid JSON array of objects. Each object MUST have exactly two keys: "id" (the string ID provided) and "narration" (your summary string).\n\nSnippets:\n\n`;

    tasks.forEach(t => {
      prompt += `ID: ${t.id}\nContext: ${t.contextFacts.join(', ')}\nCode:\n\`\`\`\n${t.codeSnippet}\n\`\`\`\n\n`;
    });

    try {
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: prompt,
      });
      
      const text = response.text || "[]";
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return [];
    } catch (e) {
      console.error('[GeminiAdapter] Batch generation failed:', e);
      throw e;
    }
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
