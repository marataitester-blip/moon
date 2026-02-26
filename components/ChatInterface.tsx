'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Sparkles, Loader2, Zap, Image as ImageIcon } from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ChatInterface() {
  const [messages, setMessages] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [newImagePrompt, setNewImagePrompt] = useState('');
  const [quality, setQuality] = useState<'standard' | 'premium'>('standard');
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel('realtime').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (p) => {
      setMessages((prev) => [...prev, p.new]);
    }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const txt = newMessage;
    setNewMessage('');
    setIsTextLoading(true);
    await supabase.from('messages').insert([{ content: txt, is_mine: true }] as any);
    setIsTextLoading(false);
  };

  const handleSendImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImagePrompt.trim()) return;
    const prompt = newImagePrompt;
    const currentQuality = quality;
    setNewImagePrompt('');
    setIsImageLoading(true);

    try {
      const modeText = currentQuality === 'premium' ? 'Шедевр (DALL-E 3)' : 'Эскиз (DALL-E 2)';
      await supabase.from('messages').insert([{ content: `✨ Видение [${modeText}]: ${prompt}`, is_mine: true }] as any); 

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, quality: currentQuality })
      });

      const data = await response.json();
      if (data.imageUrl) {
        await supabase.from('messages').insert([{ content: '', is_mine: false, image_url: data.imageUrl }] as any);
      }
    } catch (e) { console.error(e); } finally { setIsImageLoading(false); }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-black text-[#D4AF37] font-sans overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-[#1F1F1F] bg-black text-center shrink-0">
        <h2 className="font-serif text-2xl tracking-[0.2em] text-[#D4AF37]">LUNA</h2>
        <div className="flex justify-center gap-4 mt-2">
          <button 
            onClick={() => setQuality('standard')}
            className={`flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${quality === 'standard' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-zinc-800 text-zinc-500'}`}
          >
            <Zap size={10} /> Эскиз
          </button>
          <button 
            onClick={() => setQuality('premium')}
            className={`flex items-center gap-1 text-[10px] uppercase tracking-widest px-2 py-1 rounded border ${quality === 'premium' ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-zinc-800 text-zinc-500'}`}
          >
            <ImageIcon size={10} /> Шедевр
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] p-3 rounded-2xl border ${msg.is_mine ? 'bg-[#151515] border-[#D4AF37]/30 text-[#D4AF37] rounded-tr-none' : 'bg-[#0A0A0A] border-zinc-800 text-zinc-300 rounded-tl-none'}`}>
              {msg.image_url && <img src={msg.image_url} alt="Vision" className="w-full h-auto rounded-lg mb-2" />}
              {msg.content && <p className="text-sm font-light leading-relaxed">{msg.content}</p>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Inputs */}
      <div className="p-4 bg-black border-t border-[#1F1F1F] flex flex-col gap-3 pb-safe">
        <form onSubmit={handleSendText} className="flex gap-2">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Сообщение..." className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] p-3 rounded-xl text-sm focus:outline-none" />
          <button type="submit" disabled={isTextLoading} className="p-2">{isTextLoading ? <Loader2 className="animate-spin" /> : <Send />}</button>
        </form>
        <form onSubmit={handleSendImage} className="flex gap-2">
          <input type="text" value={newImagePrompt} onChange={(e) => setNewImagePrompt(e.target.value)} placeholder={`Видение (${quality === 'premium' ? 'Шедевр' : 'Эскиз'})...`} className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] p-3 rounded-xl text-sm focus:outline-none" />
          <button type="submit" disabled={isImageLoading} className="bg-[#D4AF37] text-black p-3 rounded-xl">{isImageLoading ? <Loader2 className="animate-spin" /> : <Sparkles />}</button>
        </form>
      </div>
    </div>
  );
}
