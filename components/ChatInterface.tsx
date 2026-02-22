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

    const messageText = newMessage;
    setNewMessage('');
    setIsTextLoading(true);

    try {
      await supabase.from('messages').insert([{
        content: messageText,
        is_mine: true
      }] as any); 
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsTextLoading(false);
    }
  };

  const handleSendImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImagePrompt.trim()) return;

    const userPrompt = newImagePrompt;
    setNewImagePrompt('');
    setIsImageLoading(true);

    try {
      await supabase.from('messages').insert([{
        content: `🎨 Видение: ${userPrompt}`,
        is_mine: true
      }] as any); 

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
      });

      if (!response.ok) throw new Error('Ошибка генерации');
      const data = await response.json();
      
      if (data.imageUrl) {
        await supabase.from('messages').insert([{
          content: '', 
          is_mine: false,
          image_url: data.imageUrl
        }] as any);
      }
      
    } catch (error) {
      console.error('Ошибка:', error);
    } finally {
      setIsImageLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[100dvh] w-full sm:h-[90vh] sm:max-w-md mx-auto bg-black text-[#D4AF37] sm:border sm:border-[#1F1F1F] sm:rounded-2xl overflow-hidden shadow-2xl">
      <div className="p-4 border-b border-[#1F1F1F] bg-[#050505] text-center shrink-0">
        <h2 className="font-serif text-xl tracking-widest text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
          LUNA
        </h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest">Secure Uplink</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-b from-black to-[#050505]">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-xl text-sm border shadow-xl transition-all ${
              msg.is_mine
                ? 'bg-[#1a1a1a] border-[#D4AF37]/40 text-[#D4AF37] rounded-tr-none'
                : 'bg-[#0a0a0a] border-[#333] text-gray-300 rounded-tl-none'
            }`}>
              {msg.image_url && (
                <div className="relative min-h-[200px] w-full mb-2">
                  <img 
                    src={msg.image_url} 
                    alt="Generated" 
                    className="rounded-lg border border-[#D4AF37]/20 w-full h-auto block"
                    style={{ display: 'block', minHeight: '100px' }}
                    onLoad={(e) => console.log("Картинка загружена успешно")}
                    onError={(e) => console.error("Ошибка отрисовки картинки")}
                  />
                </div>
              )}
              {msg.content && (
                <p className="font-light whitespace-pre-wrap leading-relaxed">{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-[#050505] border-t border-[#1F1F1F] flex flex-col gap-3 shrink-0 pb-safe">
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Сообщение..."
            className="flex-1 bg-[#0a0a0a] border border-[#333] text-[#D4AF37] p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] text-sm"
          />
          <button type="submit" disabled={isTextLoading} className="bg-[#1a1a1a] border border-[#333] text-[#D4AF37] p-3 rounded-lg disabled:opacity-50">
            {isTextLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        <form onSubmit={handleSendImage} className="flex gap-2">
          <input
            type="text"
            value={newImagePrompt}
            onChange={(e) => setNewImagePrompt(e.target.value)}
            placeholder="Опишите видение..."
            className="flex-1 bg-[#0a0a0a] border border-[#333] text-[#D4AF37] p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] text-sm"
          />
          <button type="submit" disabled={isImageLoading} className="bg-[#D4AF37] text-black p-3 rounded-lg disabled:opacity-50">
            {isImageLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
