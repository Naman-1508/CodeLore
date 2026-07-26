export default function WorkspaceSettings() {
  
  return (
    <div className="p-8 max-w-4xl mx-auto" role="main" aria-label="Workspace Settings">
      <h1 className="text-3xl font-bold text-slate-50 mb-6">Workspace Settings</h1>
      
      <div className="bg-midnight-100/10 border border-white/10 rounded-lg p-6 shadow-sm backdrop-blur-md">
        <h2 className="text-xl font-bold text-slate-50 mb-4">AI Provider Configuration</h2>
        <div className="flex flex-col gap-4">
          <p className="text-sm text-slate-400">
            AI features are currently configured globally via the server environment variables (<code className="text-mint-400 bg-midnight-50 px-1 py-0.5 rounded">.env</code>). 
            CodeLore uses your designated API key to generate code narrations and semantic embeddings.
          </p>
          <p className="text-sm text-slate-400">
            No further configuration is required.
          </p>
        </div>
      </div>
    </div>
  );
}
