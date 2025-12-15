'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// 1. Инициализация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Chat() {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // 2. Загрузка сообщений и подписка на Realtime
  useEffect(() => {
    // Сначала загрузим существующие сообщения
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true });
      
      if (data) setMessages(data);
    };

    fetchMessages();

    // Подключаем "слушателя" (Realtime)
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

  // Авто-прокрутка вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 3. Отправка сообщения
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase
      .from('messages')
      .insert([{ content: newMessage, is_mine: true }]); // Отправляем как "своё"

    if (error) console.error('Ошибка отправки:', error);
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white p-4 font-sans">
      <h1 className="text-2xl font-bold mb-4 text-center tracking-widest text-yellow-500">LUNA CHAT</h1>
      
      {/* Область сообщений */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4 pr-2">
        {messages.length === 0 && (
          <p className="text-gray-500 text-center mt-10">История пуста... Напишите первое слово.</p>
        )}
        
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs md:max-w-md px-4 py-2 rounded-2xl text-sm md:text-base shadow-md ${
                msg.is_mine
                  ? 'bg-yellow-600 text-white rounded-br-none' // Золотой пузырь (Мой)
                  : 'bg-gray-800 text-gray-200 rounded-bl-none' // Темно-серый пузырь (Чужой)
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Поле ввода */}
      <form onSubmit={sendMessage} className="flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Введите сообщение..."
          className="flex-1 bg-gray-900 border border-gray-700 rounded-full px-4 py-3 focus:outline-none focus:border-yellow-500 transition-colors"
        />
        <button
          type="submit"
          className="bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-2 px-6 rounded-full transition-transform transform active:scale-95"
        >
          ➤
        </button>
      </form>
    </div>
  );
}
