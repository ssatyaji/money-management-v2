'use client';
import { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { aiAdvisorApi, ChatMessage } from '@/lib/api/ai-advisor.api';
import { toast } from 'sonner';

const SUGGESTIONS = [
  'Bagaimana kondisi keuanganku bulan ini?',
  'Kategori apa yang paling boros?',
  'Apakah aku bisa capai goal tabunganku?',
  'Berapa uang yang aman kupakai minggu ini?',
];

export function ChatInterface({
  initialMessage = '',
  context = 'GENERAL',
  contextId,
}: {
  initialMessage?: string;
  context?: string;
  contextId?: string;
}) {
  const [sid, setSid] = useState<string | null>(null);
  const [msgs, setMsgs] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState(initialMessage);
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [msgs]);

  useEffect(() => {
    if (initialMessage) {
      setInput(initialMessage);
    }
  }, [initialMessage]);

  const init = async (): Promise<string> => {
    if (sid) return sid;
    const s = await aiAdvisorApi.createSession(context, contextId);
    setSid(s.id);
    return s.id;
  };

  const send = async (content: string = input) => {
    if (!content.trim() || loading) return;
    setInput('');
    setMsgs((p) => [
      ...p,
      {
        id: Date.now().toString(),
        role: 'user',
        content,
        createdAt: new Date().toISOString(),
      },
    ]);
    setLoading(true);
    try {
      const id = await init();
      const r = await aiAdvisorApi.sendMessage(id, content);
      setMsgs((p) => [
        ...p,
        {
          ...r,
          id: Date.now().toString() + '-ai',
          createdAt: new Date().toISOString(),
        },
      ]);
    } catch {
      toast.error('Gagal menghubungi AI. Coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] rounded-2xl border border-border/60 bg-card/30 overflow-hidden">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {!msgs.length && (
          <div className="space-y-2">
            <p className="text-xs text-muted-foreground text-center py-4">Tanya apa saja tentang keuanganmu</p>
            {SUGGESTIONS.map((q) => (
              <button
                key={q}
                onClick={() => send(q)}
                className="block w-full text-left text-xs text-muted-foreground hover:text-foreground border border-border/40 hover:border-border rounded-xl px-3 py-2 transition-all cursor-pointer"
              >
                {q}
              </button>
            ))}
          </div>
        )}
        {msgs.map((m) => (
          <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {m.role === 'assistant' && <Bot className="w-5 h-5 text-indigo-400 shrink-0 mt-1" />}
            <div
              className={`max-w-[80%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap ${m.role === 'user' ? 'bg-indigo-600 text-white' : 'bg-muted/60'}`}
            >
              {m.content}
            </div>
            {m.role === 'user' && <User className="w-5 h-5 text-muted-foreground shrink-0 mt-1" />}
          </div>
        ))}
        {loading && (
          <div className="flex gap-2">
            <Bot className="w-5 h-5 text-indigo-400 shrink-0" />
            <div className="bg-muted/60 rounded-2xl px-3 py-2">
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <div className="border-t border-border/40 p-3">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className="flex gap-2"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya AI tentang keuanganmu..."
            disabled={loading}
            className="flex-1 bg-muted/40 border border-border/40 rounded-xl px-3 py-2 text-sm outline-none focus:border-indigo-500/60 transition-colors"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-xl px-3 py-2 transition-colors cursor-pointer"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
