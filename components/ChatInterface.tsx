'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Sparkles, Loader2 } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ChatInterface() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newImagePrompt, setNewImagePrompt] = useState('');
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
        
      if (error) console.error("Ошибка загрузки:", error);
      if (data) setMessages(data);
    };

    fetchMessages();

    const channel = supabase
      .channel('realtime messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const txt = newMessage;
    setNewMessage('');
    setIsTextLoading(true);
    try {
      await supabase.from('messages').insert([{ content: txt, is_mine: true }] as any); 
    } catch (e) { console.error(e); } finally { setIsTextLoading(false); }
  };

  const handleSendImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImagePrompt.trim()) return;
    const prompt = newImagePrompt;
    setNewImagePrompt('');
    setIsImageLoading(true);

    try {
      await supabase.from('messages').insert([{ content: `✨ Vision: ${prompt}`, is_mine: true }] as any); 
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.imageUrl) {
        await supabase.from('messages').insert([{ content: '', is_mine: false, image_url: data.imageUrl }] as any);
      }
    } catch (e) { console.error(e); } finally { setIsImageLoading(false); }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-black text-[#D4AF37] font-sans overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="p-4 border-b border-[#1F1F1F] bg-black text-center shrink-0">
        <h2 className="font-serif text-2xl tracking-[0.2em] text-[#D4AF37] drop-shadow-glow">LUNA</h2>
        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mt-1">Secure Uplink</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] p-3 rounded-2xl border transition-all ${
              msg.is_mine
                ? 'bg-[#151515] border-[#D4AF37]/30 text-[#D4AF37] rounded-tr-none'
                : 'bg-[#0A0A0A] border-zinc-800 text-zinc-300 rounded-tl-none'
            }`}>
              
              {msg.image_url && (
                <div className="w-full mb-2 overflow-hidden rounded-lg border border-white/5">
                  <img 
                    src={msg.image_url} 
                    alt="Materialized Vision" 
                    className="w-full h-auto block object-contain"
                    loading="eager"
                  />
                </div>
              )}

              {msg.content && (
                <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">{msg.content}</p>
              )}
              
              <div className="text-[8px] opacity-30 mt-1 text-right font-mono">
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs */}
      <div className="p-4 bg-black border-t border-[#1F1F1F] flex flex-col gap-3 pb-safe">
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] p-3 rounded-xl focus:outline-none focus:border-[#D4AF37]/50 text-sm"
          />
          <button type="submit" disabled={isTextLoading} className="p-3 text-[#D4AF37] disabled:opacity-30">
            {isTextLoading ? <Loader2 className="animate-spin w-5" /> : <Send className="w-5" />}
          </button>
        </form>

        <form onSubmit={handleSendImage} className="flex gap-2">
          <input
            type="text"
            value={newImagePrompt}
            onChange={(e) => setNewImagePrompt(e.target.value)}
            placeholder="Опишите видение..."
            className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] p-3 rounded-xl focus:outline-none focus:border-[#D4AF37]/50 text-sm"
          />
          <button type="submit" disabled={isImageLoading} className="bg-[#D4AF37] text-black p-3 rounded-xl disabled:opacity-50">
            {isImageLoading ? <Loader2 className="animate-spin w-5" /> : <Sparkles className="w-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
