export interface LLMProvider {
  generateDocstring(codeSnippet: string, contextFacts: string[]): Promise<string>;
  chat(messages: any[], contextFacts: string[]): Promise<string>;
}
