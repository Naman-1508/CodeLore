import { useState } from 'react';

export default function WorkspaceSettings() {
  const [provider, setProvider] = useState('groq');
  
  return (
    <div className="p-8 max-w-4xl mx-auto" role="main" aria-label="Workspace Settings">
      <h1 className="text-3xl font-bold text-slate-50 mb-6">Workspace Settings</h1>
      
      <div className="bg-white/60 border border-slate-200 rounded-lg p-6 shadow-sm backdrop-blur-md">
        <h2 className="text-xl font-bold text-slate-50 mb-4">AI Provider Configuration</h2>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            Select Provider
            <select 
              value={provider} 
              onChange={(e) => setProvider(e.target.value)} 
              className="border border-slate-200 p-2 rounded bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
            >
              <option value="groq">Groq (Llama-3-70b)</option>
              <option value="gemini">Google Gemini (Gemini-1.5-Pro)</option>
              <option value="openai">OpenAI (GPT-4o)</option>
            </select>
          </label>
          <label className="flex flex-col gap-2 text-sm font-medium text-slate-300">
            API Key
            <input 
              type="password" 
              placeholder={`Enter your ${provider === 'groq' ? 'Groq' : provider === 'gemini' ? 'Gemini' : 'OpenAI'} API Key...`} 
              className="border border-slate-200 bg-white text-slate-900 p-2 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono text-sm placeholder-slate-400"
              aria-label={`${provider} API Key input`}
            />
          </label>
          <button className="bg-slate-50 text-slate-950 px-4 py-2 rounded-md hover:bg-slate-200 transition-colors mt-4 self-start font-semibold text-sm">
            Save Settings
          </button>
        </div>
      </div>
    </div>
  );
}
