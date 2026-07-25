import { GroqAdapter } from './groq-adapter';

export class MentorOrchestrator {
  private llm: GroqAdapter;

  constructor(llm: GroqAdapter) {
    this.llm = llm;
  }

  async handleChat(userMessage: string, repositoryId: string) {
    // 1. Semantic Search or Keyword Search to find relevant facts
    const mockContextFacts = [
      "File src/auth.ts contains function login(email, password)",
      "Function login calls db.query and returns a session token",
      "Function login is highly coupled with src/session.ts"
    ];

    // 2. Format messages for LLM
    const messages = [{ role: 'user', content: userMessage }];

    // 3. Call LLM with strict context
    const response = await this.llm.chat(messages, mockContextFacts);

    // 4. Return response and Fact Chips used
    return {
      text: response,
      factChips: [
        { type: 'file', name: 'src/auth.ts' },
        { type: 'function', name: 'login' }
      ]
    };
  }
}
