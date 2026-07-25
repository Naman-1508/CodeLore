export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface LLMProvider {
  generateDocstring(codeSnippet: string, contextFacts: string[]): Promise<string>;
  chat(messages: ChatMessage[], contextFacts: string[]): Promise<string>;
  generateEmbedding?(text: string): Promise<number[]>;
}
