'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- НАСТРОЙКИ ---
const PIN_CODE = '7019';
const SESSION_KEY = 'luna_session_token'; 

// Цвет: Матовое золото (используем через style, так как в Tailwind его нет по умолчанию)
const GOLD_COLOR = '#C5A059'; 

// Инициализация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LunaApp() {
  // Состояния экранов: 'landing' | 'login' | 'chat'
  const [currentView, setCurrentView] = useState('landing');
  
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [showVision, setShowVision] = useState(false);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null); // Фокус для ввода пин-кода

  // --- 1. ЛОГИКА ВХОДА И СЕССИИ ---
  
  useEffect(() => {
    // Проверяем, открыта ли сессия (sessionStorage умирает при закрытии вкладки)
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === 'active') {
      setCurrentView('chat');
    }
  }, []);

  // Обработка ввода ПИН-кода
  const handlePinChange = (value) => {
    if (value.length > 4) return;
    
    setPin(value);
    setIsError(false);

    // Авто-вход при 4 цифрах
    if (value.length === 4) {
      if (value === PIN_CODE) {
        sessionStorage.setItem(SESSION_KEY, 'active');
        setCurrentView('chat');
      } else {
        setIsError(true);
        setTimeout(() => setPin(''), 500); // Сброс при ошибке
      }
    }
  };

  // Фокус на скрытое поле ввода при клике на точки
  const focusInput = () => {
    inputRef.current?.focus();
  };

  // --- 2. ЛОГИКА ЧАТА ---

  useEffect(() => {
    if (currentView !== 'chat') return;

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
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, () => {
         setMessages([]); // Очищаем экран если база очищена
      })
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, [currentView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    await supabase.from('messages').insert([{ content: newMessage, is_mine: true }]);
    setNewMessage('');
  };

  // Удаление переписки
  const clearHistory = async () => {
    if (!confirm('LUNA: Удалить воспоминания навсегда?')) return;
    setIsDeleting(true);
    
    // Удаляем все сообщения (так как RLS отключен, это сработает)
    const { error } = await supabase
      .from('messages')
      .delete()
      .neq('id', 0); // Удалить всё, где ID не 0 (то есть всё)

    if (error) alert('Ошибка удаления');
    setMessages([]);
    setIsDeleting(false);
  };

  // --- 3. ЛОГИКА ГЕНЕРАЦИИ (POLLINATIONS) ---
  
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!visionPrompt.trim()) return;
    
    setIsGenerating(true);
    setShowVision(false);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: visionPrompt }),
      });

      const data = await response.json();

      if (data.imageUrl) {
        await supabase.from('messages').insert([{ 
          content: `Vision: ${visionPrompt}`, 
          is_mine: true,
          image_url: data.imageUrl
        }]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
      setVisionPrompt('');
    }
  };

  // --- ЭКРАН 1: ЛУНА (LANDING) ---
  if (currentView === 'landing') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black text-white font-sans animate-fade-in">
        <button 
          onClick={() => setCurrentView('login')}
          className="group flex flex-col items-center transition-transform active:scale-95 focus:outline-none"
        >
           {/* Изображение Луны (SVG) */}
           <div className="w-48 h-48 rounded-full bg-black shadow-[0_0_50px_-10px_rgba(197,160,89,0.3)] border border-[#333] flex items-center justify-center mb-8 group-hover:shadow-[0_0_70px_-5px_rgba(197,160,89,0.5)] transition-all duration-700">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-[#222] to-[#000] relative overflow-hidden">
                 {/* Кратеры */}
                 <div className="absolute top-8 left-10 w-8 h-8 rounded-full bg-[#1a1a1a] opacity-50"></div>
                 <div className="absolute bottom-12 right-12 w-12 h-12 rounded-full bg-[#1a1a1a] opacity-40"></div>
                 <div className="absolute top-20 right-8 w-4 h-4 rounded-full bg-[#1a1a1a] opacity-60"></div>
              </div>
           </div>
           
           <h1 style={{ color: GOLD_COLOR }} className="text-2xl font-bold tracking-[0.5em] opacity-80 group-hover:opacity-100 transition-opacity">
             LUNA
           </h1>
        </button>
      </div>
    );
  }

  // --- ЭКРАН 2: ПИН-КОД (LOGIN) ---
  if (currentView === 'login') {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black" onClick={focusInput}>
        {/* Скрытый инпут для клавиатуры */}
        <input 
          ref={inputRef}
          type="tel" // Цифровая клавиатура на мобильном
          pattern="[0-9]*"
          maxLength={4}
          value={pin}
          onChange={(e) => handlePinChange(e.target.value)}
          autoComplete="off"
          className="opacity-0 absolute w-1 h-1"
          autoFocus
        />

        {/* 4 Точки */}
        <div className="flex gap-6">
          {[0, 1, 2, 3].map((index) => (
            <div 
              key={index}
              style={{ 
                borderColor: isError ? 'red' : GOLD_COLOR,
                backgroundColor: pin.length > index ? (isError ? 'red' : GOLD_COLOR) : 'transparent'
              }}
              className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${isError ? 'animate-shake' : ''}`}
            />
          ))}
        </div>
      </div>
    );
  }

  // --- ЭКРАН 3: ЧАТ (MAIN) ---
  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans relative">
      {/* Хедер */}
      <header className="p-4 bg-black/90 border-b border-gray-900 flex justify-between items-center sticky top-0 z-10 backdrop-blur">
        <h1 style={{ color: GOLD_COLOR }} className="text-xl font-bold tracking-widest">LUNA</h1>
        <div className="flex gap-4">
          <button onClick={clearHistory} disabled={isDeleting} className="text-gray-600 hover:text-red-500 transition-colors" title="Delete History">
            🗑️
          </button>
          <button onClick={() => { sessionStorage.removeItem(SESSION_KEY); setCurrentView('landing'); setPin(''); }} className="text-xs text-gray-600 hover:text-white uppercase tracking-widest">
            Exit
          </button>
        </div>
      </header>

      {/* Список сообщений */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div 
              style={{ backgroundColor: msg.is_mine ? 'rgba(197, 160, 89, 0.2)' : '#1f2937', borderColor: msg.is_mine ? GOLD_COLOR : 'transparent' }}
              className={`max-w-[85%] p-3 rounded-2xl border ${msg.is_mine ? 'rounded-br-none' : 'rounded-bl-none text-gray-300'}`}
            >
              {msg.image_url && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-800">
                  <img src={msg.image_url} alt="Vision" className="w-full h-auto" />
                </div>
              )}
              <p className="leading-relaxed text-sm md:text-base">{msg.content}</p>
            </div>
          </div>
        ))}
        {isGenerating && <div style={{ color: GOLD_COLOR }} className="text-right text-xs animate-pulse">Vision is manifesting...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Ввод */}
      <div className="p-4 bg-black border-t border-gray-900">
        <form onSubmit={sendMessage} className="flex gap-3 max-w-3xl mx-auto items-center">
          <button type="button" onClick={() => setShowVision(true)} className="text-xl opacity-70 hover:opacity-100 transition">👁️</button>
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="..." 
            className="flex-1 bg-[#111] rounded-full px-5 py-3 outline-none border border-gray-800 focus:border-[#C5A059] text-gray-200 transition-all placeholder-gray-700"
          />
          <button type="submit" style={{ color: GOLD_COLOR }} className="text-2xl hover:scale-110 transition-transform">➤</button>
        </form>
      </div>

      {/* Модальное окно Vision */}
      {showVision && (
        <div className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-6">
          <div className="w-full max-w-md bg-[#0a0a0a] p-8 rounded-2xl border border-[#333] shadow-2xl">
            <h2 style={{ color: GOLD_COLOR }} className="mb-6 tracking-[0.2em] text-center text-sm font-bold uppercase">Luna Vision</h2>
            <textarea 
              value={visionPrompt} 
              onChange={(e) => setVisionPrompt(e.target.value)} 
              placeholder="Describe the dream..." 
              className="w-full bg-black border border-gray-800 rounded p-4 h-32 mb-6 text-gray-300 outline-none focus:border-[#C5A059] resize-none"
            />
            <div className="flex gap-4">
              <button onClick={() => setShowVision(false)} className="flex-1 py-3 text-gray-500 hover:text-white transition">Close</button>
              <button onClick={handleGenerate} style={{ color: GOLD_COLOR, borderColor: GOLD_COLOR }} className="flex-1 py-3 border rounded hover:bg-[#C5A059] hover:text-black transition font-bold uppercase text-xs tracking-widest">Manifest</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
        }
