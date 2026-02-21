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
        
      if (error) console.error("Ошибка загрузки сообщений:", error);
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
      // Строго только те колонки, что есть в БД
      const { error } = await supabase.from('messages').insert([{
        content: messageText,
        is_mine: true
      }]); 
      
      if (error) {
        console.error('СУПЕР-ОШИБКА БАЗЫ (Текст):', error);
      }
    } catch (error) {
      console.error('Сетевая ошибка:', error);
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
      // 1. Отправляем текст запроса в базу
      const { error: err1 } = await supabase.from('messages').insert([{
        content: `🎨 Запрос: ${userPrompt}`,
        is_mine: true
      }]); 
      if (err1) console.error('СУПЕР-ОШИБКА БАЗЫ (Пропмт):', err1);

      // 2. Идем за картинкой
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userPrompt })
      });

      if (!response.ok) throw new Error('Ошибка связи с сервером генерации');
      const data = await response.json();
      
      if (data.imageUrl) {
        // 3. Отправляем картинку как чужое сообщение (влево)
        const { error: err2 } = await supabase.from('messages').insert([{
          content: '', 
          is_mine: false,
          image_url: data.imageUrl
        }]);
        if (err2) console.error('СУПЕР-ОШИБКА БАЗЫ (Картинка):', err2);
      }
      
    } catch (error) {
      console.error('Ошибка процесса генерации:', error);
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

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-black to-[#050505]">
        {messages.map((msg, index) => (
          <div key={msg.id || index} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm border ${
              msg.is_mine
                ? 'bg-[#1a1a1a] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                : 'bg-[#0a0a0a] border-[#333] text-gray-300'
            }`}>
              {msg.image_url && (
                <img 
                  src={msg.image_url} 
                  alt="Generated" 
                  className="rounded-md border border-[#D4AF37] w-full object-cover" 
                  style={{ marginBottom: msg.content ? '8px' : '0' }}
                />
              )}
              {msg.content && <p>{msg.content}</p>}
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
            placeholder="Введите сообщение..."
            className="appearance-none flex-1 bg-[#0a0a0a] border border-[#333] text-[#D4AF37] p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-700 font-sans text-sm"
          />
          <button type="submit" disabled={isTextLoading} className="appearance-none bg-[#1a1a1a] border border-[#333] hover:border-[#D4AF37] text-[#D4AF37] p-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center">
            {isTextLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        <form onSubmit={handleSendImage} className="flex gap-2">
          <input
            type="text"
            value={newImagePrompt}
            onChange={(e) => setNewImagePrompt(e.target.value)}
            placeholder="Что нарисовать? (опишите сцену)..."
            className="appearance-none flex-1 bg-[#0a0a0a] border border-[#333] text-[#D4AF37] p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-700 font-sans text-sm"
          />
          <button type="submit" disabled={isImageLoading} className="appearance-none bg-[#D4AF37] text-black p-3 rounded-lg hover:bg-[#b5952f] transition-all disabled:opacity-50 flex items-center justify-center">
            {isImageLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </form>
      </div>
    </div>
  );
}
