import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Bot, User, Database, Loader2, ChevronDown } from "lucide-react";
import { API_ENDPOINTS } from "../../config/apis";

export default function AICopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hi! I'm your AssetFlow AI Copilot. You can ask me questions about your inventory, like 'How many assets are overdue?' or 'What is our total asset value?'" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const token = localStorage.getItem("assetflow_token");
      const res = await fetch(API_ENDPOINTS.AI.ASK, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: userMessage })
      });
      const result = await res.json();
      
      if (result.success) {
        setMessages(prev => [...prev, { 
          role: "assistant", 
          content: result.data.answer,
          sql: result.data.generated_sql
        }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "Sorry, I encountered an error processing that request." }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 text-white"
        >
          <Sparkles size={24} />
        </button>
      )}

      {/* Copilot Drawer / Modal */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[600px] w-[400px] flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-slate-200">
          
          {/* Header */}
          <div className="flex items-center justify-between bg-[#31232e] px-4 py-4 text-white">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 backdrop-blur">
                <Sparkles size={16} className="text-purple-300" />
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-wide">NL2SQL Copilot</h3>
                <p className="text-[10px] text-purple-200">AI Database Assistant</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="rounded p-1 text-white/60 hover:bg-white/10 hover:text-white transition-colors">
              <ChevronDown size={20} />
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-slate-50">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  
                  {/* Avatar */}
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${msg.role === 'user' ? 'bg-slate-200' : 'bg-purple-100 text-purple-600'}`}>
                    {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                  </div>
                  
                  {/* Message Bubble */}
                  <div className="flex flex-col gap-1 text-[13px]">
                    <div className={`rounded-2xl px-4 py-2.5 ${msg.role === 'user' ? 'bg-[#31232e] text-white rounded-tr-sm' : 'bg-white shadow-sm border border-slate-100 rounded-tl-sm text-slate-700'}`}>
                      {msg.content.split('\\n').map((line, i) => <p key={i} className="leading-relaxed">{line}</p>)}
                    </div>
                    
                    {/* Expose the "Magic" generated SQL to judges! */}
                    {msg.sql && (
                      <div className="mt-2 rounded bg-slate-800 p-2 text-left">
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 mb-1">
                          <Database size={10} /> GENERATED SQL
                        </div>
                        <code className="text-[10px] text-green-400 font-mono break-all leading-tight">
                          {msg.sql.trim()}
                        </code>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            ))}
            
            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-[85%] gap-3">
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                    <Bot size={14} />
                  </div>
                  <div className="flex items-center gap-2 rounded-2xl bg-white shadow-sm border border-slate-100 rounded-tl-sm px-4 py-2.5">
                     <Loader2 size={14} className="animate-spin text-purple-500" />
                     <span className="text-[13px] text-slate-500 font-medium">Translating to SQL...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-slate-100 bg-white p-3">
            <form onSubmit={handleSubmit} className="flex items-center gap-2 relative">
              <input 
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask a question about your data..."
                className="w-full rounded-full border border-slate-200 bg-slate-50 py-3 pl-4 pr-12 text-sm focus:border-purple-400 focus:outline-none focus:ring-1 focus:ring-purple-400 placeholder-slate-400"
                disabled={loading}
              />
              <button 
                type="submit" 
                disabled={!input.trim() || loading}
                className="absolute right-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#4f3448] text-white transition-colors hover:bg-[#31232e] disabled:opacity-50 disabled:bg-slate-300 disabled:text-slate-500"
              >
                <Send size={14} />
              </button>
            </form>
            <p className="mt-2 text-center text-[10px] text-slate-400">Powered by NL2SQL Heuristics</p>
          </div>
        </div>
      )}
    </>
  );
}
