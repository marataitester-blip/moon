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

  // Загрузка истории
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    // Слушаем базу, но теперь это только для "чужих" сообщений
    const channel = supabase.channel('realtime').on('postgres_changes', { 
      event: 'INSERT', 
      schema: 'public', 
      table: 'messages' 
    }, (payload) => {
      // Чтобы не дублировать свои же сообщения, которые мы добавим вручную
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
    
    const { data } = await supabase.from('messages').insert([{ content: txt, is_mine: true }] as any).select();
    if (data) setMessages(prev => [...prev, data[0]]); // Мгновенное обновление экрана
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
      const modeText = currentQuality === 'premium' ? 'Шедевр' : 'Эскиз';
      // Добавляем сообщение-запрос визуально
      const { data: promptMsg } = await supabase.from('messages').insert([{ 
        content: `✨ Видение [${modeText}]: ${prompt}`, 
        is_mine: true 
      }] as any).select();
      if (promptMsg) setMessages(prev => [...prev, promptMsg[0]]);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, quality: currentQuality })
      });

      const data = await response.json();
      if (data.imageUrl) {
        // Сохраняем в базу и ТУТ ЖЕ добавляем на экран
        const { data: imgMsg } = await supabase.from('messages').insert([{ 
          content: '', 
          is_mine: false, 
          image_url: data.imageUrl 
        }] as any).select();
        
        if (imgMsg) {
          setMessages(prev => [...prev, imgMsg[0]]); // КАРТИНКА ПОЯВИТСЯ МГНОВЕННО
        }
      }
    } catch (e) { 
      console.error("Ошибка генерации:", e); 
    } finally { 
      setIsImageLoading(false); 
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full max-w-md mx-auto bg-black text-[#D4AF37] font-sans overflow-hidden border-x border-[#1F1F1F]">
      
      {/* HEADER */}
      <div className="p-4 border-b border-[#1F1F1F] bg-black shrink-0">
        <h2 className="font-serif text-2xl tracking-[0.3em] text-[#D4AF37] text-center mb-4">LUNA</h2>
        
        {/* КНОПКИ ПЕРЕКЛЮЧЕНИЯ */}
        <div className="flex bg-[#121212] p-1 rounded-xl border border-zinc-800">
          <button 
            onClick={() => setQuality('standard')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${
              quality === 'standard' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-zinc-500'
            }`}
          >
            <Zap size={12} /> Эскиз
          </button>
          <button 
            onClick={() => setQuality('premium')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[10px] uppercase tracking-widest transition-all ${
              quality === 'premium' ? 'bg-[#D4AF37] text-black shadow-lg' : 'text-zinc-500'
            }`}
          >
            <ImageIcon size={12} /> Шедевр
          </button>
        </div>
      </div>

      {/* MESSAGES */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-black">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`relative max-w-[85%] p-3 rounded-2xl border transition-all ${
              msg.is_mine ? 'bg-[#151515] border-[#D4AF37]/30 text-[#D4AF37] rounded-tr-none' : 'bg-[#0A0A0A] border-zinc-800 text-zinc-300 rounded-tl-none'
            }`}>
              {msg.image_url && (
                <div className="w-full mb-2 overflow-hidden rounded-lg">
                  <img src={msg.image_url} alt="Vision" className="w-full h-auto block bg-zinc-900 min-h-[100px]" />
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
          <input type="text" value={newImagePrompt} onChange={(e) => setNewImagePrompt(e.target.value)} placeholder={`Запрос для ${quality === 'premium' ? 'Шедевра' : 'Эскиза'}...`} className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] p-3 rounded-xl text-sm focus:outline-none" />
          <button type="submit" disabled={isImageLoading} className="bg-[#D4AF37] text-black p-3 rounded-xl min-w-[50px] flex items-center justify-center">
            {isImageLoading ? <Loader2 className="animate-spin w-5" /> : <Sparkles size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
