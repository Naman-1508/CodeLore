export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  generateDocstringsBatch(tasks: { id: string, codeSnippet: string, contextFacts: string[] }[]): Promise<{ id: string, narration: string }[]>;
  chat(messages: ChatMessage[], contextFacts: string[]): Promise<string>;
  generateEmbedding?(text: string): Promise<number[]>;
}
