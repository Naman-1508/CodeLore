import { useState, useRef, useEffect } from 'react';
import { Bot, User, Send, Loader2 } from 'lucide-react';
import { useUser } from '@clerk/clerk-react';

export default function EngineeringMentor() {
  // const { getToken } = useAuth();
  const { user } = useUser();
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant', content: string }[]>([
    { role: 'assistant', content: 'Hello! I am your engineering mentor. I can help you understand the codebase, review architectural decisions, or onboard you to new modules. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // const REPO_ID = 'repo-123';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      // const token = await getToken();
      // const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };

      // We hit a mock endpoint or real endpoint for chat.
      // Since we don't have a chat endpoint yet, we'll simulate a network request failure which falls back gracefully,
      // or we just set a mock response for now since the backend chat isn't implemented.
      
      setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: 'I am currently running in offline mode because the LLM provider configuration is not fully set up. However, I can tell you that this repository has no indexed functions to analyze yet.' }]);
        setLoading(false);
      }, 1000);

    } catch (e) {
      console.error("Chat failed", e);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error connecting to the intelligence layer.' }]);
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto h-full flex flex-col bg-midnight-100">
      <div className="mb-6 mt-2">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Engineering Mentor</h1>
        <p className="text-slate-400">Your AI pair programmer, powered by CodeLore's deep codebase understanding.</p>
      </div>

      <div className="flex-1 bg-midnight-100 border border-white/10 rounded-lg shadow-sm flex flex-col overflow-hidden mb-6">
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-100 text-cyan-400'
              }`}>
                {msg.role === 'user' ? (user?.imageUrl ? <img src={user.imageUrl} className="w-8 h-8 rounded-full object-cover" /> : <User size={16} />) : <Bot size={16} />}
              </div>
              <div className={`max-w-[75%] rounded-lg p-4 text-sm leading-relaxed ${
                msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-midnight-100 border border-white/10 text-slate-300 shadow-sm'
              }`}>
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="max-w-[75%] rounded-lg p-4 bg-midnight-100 border border-white/10 shadow-sm flex items-center gap-2 text-slate-500 text-sm">
                <Loader2 size={16} className="animate-spin" /> Thinking...
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
        <div className="p-4 bg-midnight-100 border-t border-white/10">
          <form onSubmit={handleSend} className="relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask a question about the architecture..." 
              className="w-full pl-4 pr-12 py-3 rounded-md bg-midnight-100 border border-white/10 text-white focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans text-sm placeholder-slate-400 shadow-sm"
            />
            <button 
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-cyan-600 text-white rounded-md hover:bg-cyan-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
