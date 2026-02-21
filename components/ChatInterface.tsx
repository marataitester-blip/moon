'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Sparkles, Loader2 } from 'lucide-react';

// Инициализируем клиент прямо здесь, чтобы избежать путаницы с типами
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export default function ChatInterface() {
  const [messages, setMessages] = useState<any[]>([]);
  
  // Разделяем состояния для двух разных полей ввода
  const [newMessage, setNewMessage] = useState('');
  const [newImagePrompt, setNewImagePrompt] = useState('');
  
  // Разделяем индикаторы загрузки, чтобы крутилась нужная кнопка
  const [isTextLoading, setIsTextLoading] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Подписка на новые сообщения
  useEffect(() => {
    const fetchMessages = async () => {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
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

  // Автопрокрутка вниз
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Функция для отправки обычного текста
  const handleSendText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage('');
    setIsTextLoading(true);

    try {
      await supabase.from('messages').insert([
        {
          content: messageText,
          is_mine: true,
          sender: 'user',
          type: 'text',
          is_generated: false
        }
      ] as any); 
    } catch (error) {
      console.error('Error sending text:', error);
    } finally {
      setIsTextLoading(false);
    }
  };

  // Функция для отправки запроса на картинку
  const handleSendImage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newImagePrompt.trim()) return;

    const userPrompt = newImagePrompt;
    setNewImagePrompt('');
    setIsImageLoading(true);

    try {
      // 1. Отправляем запрос пользователя в чат (чтобы видеть, что просили)
      await supabase.from('messages').insert([
        {
          content: `🎨 Запрос: ${userPrompt}`,
          is_mine: true,
          sender: 'user',
          type: 'text',
          is_generated: false
        }
      ] as any); 

      // 2. Формируем запрос с твоими стилями
      const styleTags = "soft realism, aesthetic, beautiful, mild erotica, masterpiece, highly detailed, soft lighting";
      const fullPrompt = `${userPrompt}, ${styleTags}`;
      const encodedPrompt = encodeURIComponent(fullPrompt);
      const randomSeed = Math.floor(Math.random() * 1000000);
      
      const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${randomSeed}`;

      // 3. Отправляем результат (картинку) от имени системы
      await supabase.from('messages').insert([
        {
          content: '', // Текст не нужен, показываем только картинку
          is_mine: false,
          sender: 'system',
          type: 'image',
          image_url: imageUrl,
          is_generated: true
        }
      ] as any);
      
    } catch (error) {
      console.error('Error sending image request:', error);
    } finally {
      setIsImageLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] max-w-md mx-auto bg-black text-[#D4AF37] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-2xl">
      {/* Заголовок */}
      <div className="p-4 border-b border-[#1F1F1F] bg-[#050505] text-center shrink-0">
        <h2 className="font-serif text-xl tracking-widest text-[#D4AF37] drop-shadow-[0_0_8px_rgba(212,175,55,0.3)]">
          LUNA
        </h2>
        <p className="text-xs text-gray-500 uppercase tracking-widest">Secure Uplink</p>
      </div>

      {/* Окно сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gradient-to-b from-black to-[#050505]">
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm border ${
                msg.is_mine
                  ? 'bg-[#1a1a1a] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                  : 'bg-[#0a0a0a] border-[#333] text-gray-300'
              }`}
            >
              {msg.image_url && (
                <img 
                  src={msg.image_url} 
                  alt="Generated content" 
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

      {/* Панель ввода с двумя отдельными формами */}
      <div className="p-4 bg-[#050505] border-t border-[#1F1F1F] flex flex-col gap-3 shrink-0">
        
        {/* Форма 1: Обычный текст */}
        <form onSubmit={handleSendText} className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Введите сообщение..."
            className="flex-1 bg-[#0a0a0a] border border-[#333] text-[#D4AF37] p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-700 font-sans text-sm"
          />
          <button
            type="submit"
            disabled={isTextLoading}
            // Кнопка отправки текста сделана чуть темнее, чтобы выделить золотую кнопку картинок
            className="bg-[#1a1a1a] border border-[#333] hover:border-[#D4AF37] text-[#D4AF37] p-3 rounded-lg transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isTextLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
          </button>
        </form>

        {/* Форма 2: Генерация картинок */}
        <form onSubmit={handleSendImage} className="flex gap-2">
          <input
            type="text"
            value={newImagePrompt}
            onChange={(e) => setNewImagePrompt(e.target.value)}
            placeholder="Что нарисовать? (опишите сцену)..."
            className="flex-1 bg-[#0a0a0a] border border-[#333] text-[#D4AF37] p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-700 font-sans text-sm"
          />
          <button
            type="submit"
            disabled={isImageLoading}
            // Кнопка картинок залита золотым цветом
            className="bg-[#D4AF37] text-black p-3 rounded-lg hover:bg-[#b5952f] transition-all disabled:opacity-50 flex items-center justify-center"
          >
            {isImageLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
          </button>
        </form>
        
      </div>
    </div>
  );
}
