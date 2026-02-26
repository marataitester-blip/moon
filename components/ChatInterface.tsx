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
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel('realtime').on('postgres_changes', { 
      event: 'INSERT', schema: 'public', table: 'messages' 
    }, (payload) => {
      setMessages((prev) => {
        if (prev.find(m => m.id === payload.new.id)) return prev;
        return [...prev, payload.new];
      });
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
    const { data } = await supabase.from('messages').insert([{ content: txt, is_mine: true }]).select();
    if (data) setMessages(prev => [...prev, data[0]]);
    setIsTextLoading(false);
  };

  const handleSendImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImagePrompt.trim()) return;
    const prompt = newImagePrompt;
    setNewImagePrompt('');
    setIsImageLoading(true);

    try {
      // 1. Показываем запрос на экране сразу
      const { data: pMsg } = await supabase.from('messages').insert([{ 
        content: `✨ Vision: ${prompt}`, is_mine: true 
      }]).select();
      if (pMsg) setMessages(prev => [...prev, pMsg[0]]);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });

      const data = await response.json();
      if (data.imageUrl) {
        // 2. Сохраняем и ТУТ ЖЕ добавляем картинку в список на экране
        const { data: imgMsg } = await supabase.from('messages').insert([{ 
          content: '', is_mine: false, image_url: data.imageUrl 
        }]).select();
        
        if (imgMsg) {
          setMessages(prev => [...prev, imgMsg[0]]); // МГНОВЕННОЕ ПОЯВЛЕНИЕ
        }
      }
    } catch (e) { 
      console.error(e); 
    } finally { 
      setIsImageLoading(false); 
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-black text-[#D4AF37] font-sans overflow-hidden border-x border-[#1F1F1F]">
      
      {/* HEADER (без лишних кнопок) */}
      <div className="p-4 border-b border-[#1F1F1F] bg-black text-center shrink-0">
        <h2 className="font-serif text-2xl tracking-[0.3em] text-[#D4AF37]">LUNA</h2>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] p-3 rounded-2xl border transition-all ${
              msg.is_mine ? 'bg-[#151515] border-[#D4AF37]/30 text-[#D4AF37] rounded-tr-none' : 'bg-[#0A0A0A] border-zinc-800 text-zinc-300 rounded-tl-none'
            }`}>
              {msg.image_url && (
                <div className="w-full mb-2 overflow-hidden rounded-lg bg-zinc-900">
                  <img src={msg.image_url} alt="Vision" className="w-full h-auto block min-h-[100px]" />
                </div>
              )}
              {msg.content && <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">{msg.content}</p>}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUTS */}
      <div className="p-4 bg-black border-t border-[#1F1F1F] flex flex-col gap-3 pb-safe">
        <form onSubmit={handleSendText} className="flex gap-2">
          <input type="text" value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="Сообщение..." className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] p-3 rounded-xl text-sm focus:outline-none" />
          <button type="submit" disabled={isTextLoading} className="p-2 text-[#D4AF37]">
            {isTextLoading ? <Loader2 className="animate-spin" /> : <Send size={20} />}
          </button>
        </form>

        <form onSubmit={handleSendImage} className="flex gap-2">
          <input type="text" value={newImagePrompt} onChange={(e) => setNewImagePrompt(e.target.value)} placeholder="Опишите видение..." className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] p-3 rounded-xl text-sm focus:outline-none" />
          <button type="submit" disabled={isImageLoading} className="bg-[#D4AF37] text-black p-3 rounded-xl min-w-[50px] flex items-center justify-center">
            {isImageLoading ? <Loader2 className="animate-spin w-5" /> : <Sparkles size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
