import { GroqAdapter } from './groq-adapter';

export class PostgresQueueWorker {
  private llm: GroqAdapter;
  private isRunning: boolean = false;

  constructor(llm: GroqAdapter) {
    this.llm = llm;
  }

  startPolling() {
    this.isRunning = true;
    console.log('[QueueWorker] Started polling Postgres background_job table...');
    this.poll();
  }

  stopPolling() {
    this.isRunning = false;
  }

  private async poll() {
    if (!this.isRunning) return;

    // Simulate querying database: SELECT * FROM background_job WHERE status = 'pending' LIMIT 1 FOR UPDATE SKIP LOCKED
    // console.log('[QueueWorker] Polling for jobs...');
    
    // Process job if found...
    
    setTimeout(() => this.poll(), 5000);
  }

  async processDocstringJob(jobId: string, functionId: string, codeSnippet: string) {
    console.log(`[QueueWorker] Processing docstring generation for function ${functionId}`);
    try {
      const docstring = await this.llm.generateDocstring(codeSnippet, []);
      // Simulate updating database: UPDATE function SET docstring = $1 WHERE id = $2
      console.log(`[QueueWorker] Saved docstring: ${docstring}`);
      // Simulate UPDATE background_job SET status = 'completed' WHERE id = jobId
    } catch (e) {
      console.error(`[QueueWorker] Job failed:`, e);
      // Simulate UPDATE background_job SET status = 'failed' WHERE id = jobId
    }
  }

  async processAiNarrationJob(jobId: string, targetType: string, targetId: string, contextFacts: string[]) {
    console.log(`[QueueWorker] Processing AI narration for ${targetType} ${targetId}`);
    let narrationText = '';
    let fallbackUsed = false;
    try {
      const messages = [{ role: 'user', content: `Narrate this ${targetType} clearly.` }];
      narrationText = await this.llm.chat(messages, contextFacts);
    } catch (e) {
      console.error(`[QueueWorker] LLM failed, using deterministic fallback for ${targetId}`, e);
      fallbackUsed = true;
      narrationText = `Deterministic Fallback: This is a ${targetType}.`;
    }
    
    // Simulate inserting into ai_narration table
    console.log(`[QueueWorker] Saved narration (fallback=${fallbackUsed}): ${narrationText}`);
  }
}
