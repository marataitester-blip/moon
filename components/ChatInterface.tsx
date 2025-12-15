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
  const [newMessage, setNewMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage;
    setNewMessage(''); // Очищаем поле сразу

    try {
      // ВАЖНО: "as any" отключает строгую проверку типов, из-за которой падал Vercel
      await supabase.from('messages').insert([
        {
          content: messageText,
          sender: 'user',
          type: 'text',
          is_generated: false
        }
      ] as any); 
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="flex flex-col h-[90vh] max-w-md mx-auto bg-black text-[#D4AF37] border border-[#1F1F1F] rounded-2xl overflow-hidden shadow-2xl">
      {/* Заголовок */}
      <div className="p-4 border-b border-[#1F1F1F] bg-[#050505] text-center">
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
            className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg text-sm border ${
                msg.sender === 'user'
                  ? 'bg-[#1a1a1a] border-[#D4AF37] text-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.1)]'
                  : 'bg-[#0a0a0a] border-[#333] text-gray-300'
              }`}
            >
              {msg.type === 'image' ? (
                <img src={msg.image_url} alt="Generated" className="rounded-md border border-[#D4AF37]" />
              ) : (
                <p>{msg.content}</p>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <form onSubmit={handleSendMessage} className="p-4 bg-[#050505] border-t border-[#1F1F1F] flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Enter message..."
          className="flex-1 bg-[#0a0a0a] border border-[#333] text-[#D4AF37] p-3 rounded-lg focus:outline-none focus:border-[#D4AF37] transition-colors placeholder-gray-700 font-sans"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="bg-[#D4AF37] text-black p-3 rounded-lg hover:bg-[#b5952f] transition-all disabled:opacity-50"
        >
          {isLoading ? <Loader2 className="animate-spin w-5 h-5" /> : <Send className="w-5 h-5" />}
        </button>
      </form>
    </div>
  );
}
