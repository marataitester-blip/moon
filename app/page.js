'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- НАСТРОЙКИ ---
const PIN_CODE = '7019';
const SESSION_KEY = 'luna_session_token'; 
const INACTIVITY_LIMIT = 3 * 60 * 1000; // 3 минуты

const GOLD_COLOR = '#C5A059'; 

// Инициализация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LunaApp() {
  const [currentView, setCurrentView] = useState('landing'); 
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [onlineCount, setOnlineCount] = useState(0);

  // Состояния для генерации
  const [visionPrompt, setVisionPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  // --- ТАЙМЕР БЕЗОПАСНОСТИ ---
  const logout = () => {
    sessionStorage.removeItem(SESSION_KEY);
    setCurrentView('landing');
    setPin('');
  };

  const resetTimer = () => {
    if (currentView === 'landing') return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(logout, INACTIVITY_LIMIT);
  };

  useEffect(() => {
    if (currentView !== 'landing') {
      const events = ['mousemove', 'keydown', 'click', 'touchstart', 'scroll'];
      events.forEach(event => window.addEventListener(event, resetTimer));
      resetTimer();
      return () => {
        events.forEach(event => window.removeEventListener(event, resetTimer));
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }
  }, [currentView]);

  // --- ВХОД ---
  useEffect(() => {
    const session = sessionStorage.getItem(SESSION_KEY);
    if (session === 'active') setCurrentView('chat');
  }, []);

  const handlePinChange = (value) => {
    if (value.length > 4) return;
    setPin(value);
    setIsError(false);
    resetTimer();

    if (value.length === 4) {
      if (value === PIN_CODE) {
        sessionStorage.setItem(SESSION_KEY, 'active');
        setCurrentView('chat');
      } else {
        setIsError(true);
        setTimeout(() => setPin(''), 500);
      }
    }
  };

  const focusInput = () => inputRef.current?.focus();

  // --- ЧАТ ---
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

    const channel = supabase.channel('luna_room');

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => [...prev, payload.new]);
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'messages' }, () => {
         setMessages([]); 
      })
      .on('presence', { event: 'sync' }, () => {
        const newState = channel.presenceState();
        setOnlineCount(Object.keys(newState).length);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ online_at: new Date().toISOString() });
        }
      });

    return () => supabase.removeChannel(channel);
  }, [currentView]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Отправка обычного текста
  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    
    const textToSend = newMessage;
    setNewMessage('');
    resetTimer();
    
    await supabase.from('messages').insert([{ content: textToSend, is_mine: true }]);
  };

  const clearHistory = async () => {
    resetTimer();
    if (!confirm('LUNA: Удалить воспоминания навсегда?')) return;
    setIsDeleting(true);
    const { error } = await supabase.from('messages').delete().neq('id', 0);
    if (error) alert('Ошибка удаления');
    setMessages([]);
    setIsDeleting(false);
  };

  // Отправка запроса на картинку
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!visionPrompt.trim()) return;
    
    const promptText = visionPrompt;
    setVisionPrompt('');
    setIsGenerating(true);
    resetTimer();

    try {
      // 1. Отправляем сам запрос в чат (чтобы было видно, что просили)
      await supabase.from('messages').insert([{ 
        content: `✨ Vision: ${promptText}`, 
        is_mine: true 
      }]);

      // 2. Делаем запрос к твоему route.js
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      
      const data = await response.json();
      
      // 3. Записываем картинку в базу как ВХОДЯЩЕЕ сообщение (is_mine: false)
      if (data.imageUrl) {
        await supabase.from('messages').insert([{ 
          content: '', 
          is_mine: false, 
          image_url: data.imageUrl 
        }]);
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setIsGenerating(false); 
    }
  };

  // --- UI ---
  if (currentView === 'landing') {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center bg-black text-white font-sans animate-fade-in">
        <button onClick={() => setCurrentView('login')} className="group flex flex-col items-center focus:outline-none appearance-none">
           <div className="w-48 h-48 rounded-full bg-black shadow-[0_0_50px_-10px_rgba(197,160,89,0.3)] border border-[#333] flex items-center justify-center mb-8 group-hover:shadow-[0_0_70px_-5px_rgba(197,160,89,0.5)] transition-all duration-700">
              <div className="w-44 h-44 rounded-full bg-gradient-to-br from-[#222] to-[#000] relative overflow-hidden">
                 <div className="absolute top-8 left-10 w-8 h-8 rounded-full bg-[#1a1a1a] opacity-50"></div>
                 <div className="absolute bottom-12 right-12 w-12 h-12 rounded-full bg-[#1a1a1a] opacity-40"></div>
                 <div className="absolute top-20 right-8 w-4 h-4 rounded-full bg-[#1a1a1a] opacity-60"></div>
              </div>
           </div>
           <h1 style={{ color: GOLD_COLOR }} className="text-2xl font-bold tracking-[0.5em] opacity-80 group-hover:opacity-100 transition-opacity">Л У Н А</h1>
        </button>
      </div>
    );
  }

  if (currentView === 'login') {
    return (
      <div className="flex flex-col h-[100dvh] items-center justify-center bg-black" onClick={focusInput}>
        <input ref={inputRef} type="tel" pattern="[0-9]*" maxLength={4} value={pin} onChange={(e) => handlePinChange(e.target.value)} autoComplete="off" className="opacity-0 absolute w-1 h-1" autoFocus />
        <div className="flex gap-6">
          {[0, 1, 2, 3].map((index) => (
            <div key={index} style={{ borderColor: isError ? 'red' : GOLD_COLOR, backgroundColor: pin.length > index ? (isError ? 'red' : GOLD_COLOR) : 'transparent' }} className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${isError ? 'animate-shake' : ''}`} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans relative">
      <header className="p-4 bg-black/90 border-b border-gray-900 flex justify-between items-center sticky top-0 z-10 backdrop-blur shrink-0">
        <div className="w-8 flex items-center justify-center">
          {onlineCount > 1 && (
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
          )}
        </div>
        <h1 style={{ color: GOLD_COLOR }} className="text-xl font-bold tracking-[0.3em]">LUNA</h1>
        <div className="flex gap-4 w-8 justify-end">
          <button onClick={clearHistory} disabled={isDeleting} className="text-gray-600 hover:text-red-900 transition-colors appearance-none">🗑️</button>
          <button onClick={logout} style={{ color: GOLD_COLOR }} className="text-xl hover:opacity-50 transition-opacity font-bold appearance-none">✕</button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id || Math.random()} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div 
              style={{ 
                // ВАШИ СООБЩЕНИЯ: Золотой оттенок
                // ЧУЖИЕ СООБЩЕНИЯ (вкл. картинки): Темно-серый
                backgroundColor: msg.is_mine ? 'rgba(197, 160, 89, 0.2)' : '#0f0f0f', 
                borderColor: msg.is_mine ? GOLD_COLOR : '#333',
                borderWidth: '1px'
              }}
              className={`max-w-[85%] p-3 rounded-2xl border ${msg.is_mine ? 'rounded-br-none' : 'rounded-bl-none text-gray-300'}`}
            >
              {msg.image_url && (
                <div className="mb-3 rounded-lg overflow-hidden border border-gray-800">
                  <img src={msg.image_url} alt="Vision" className="w-full h-auto" />
                </div>
              )}
              {msg.content && <p className="leading-relaxed text-sm md:text-base">{msg.content}</p>}
              <p className="text-[10px] opacity-40 mt-1 text-right font-mono">
                {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute:'2-digit', timeZone: 'Europe/Moscow' })}
              </p>
            </div>
          </div>
        ))}
        {isGenerating && <div style={{ color: GOLD_COLOR }} className="text-right text-xs animate-pulse">Vision is manifesting...</div>}
        <div ref={messagesEndRef} />
      </div>

      {/* Обновленная панель с ДВУМЯ полями ввода */}
      <div className="p-4 bg-black border-t border-gray-900 flex flex-col gap-3 shrink-0 pb-safe">
        
        {/* Поле для текста */}
        <form onSubmit={sendMessage} className="flex gap-3 max-w-3xl w-full mx-auto items-center">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => { setNewMessage(e.target.value); resetTimer(); }} 
            placeholder="Сообщение..." 
            className="appearance-none flex-1 bg-[#111] rounded-full px-5 py-3 outline-none border border-gray-800 focus:border-[#C5A059] text-gray-200 transition-all placeholder-gray-700 text-lg"
          />
          <button type="submit" disabled={!newMessage.trim()} style={{ color: GOLD_COLOR }} className="appearance-none text-2xl hover:scale-110 transition-transform disabled:opacity-30">
            ➤
          </button>
        </form>

        {/* Поле для генерации картинок */}
        <form onSubmit={handleGenerate} className="flex gap-3 max-w-3xl w-full mx-auto items-center">
          <input 
            type="text" 
            value={visionPrompt} 
            onChange={(e) => { setVisionPrompt(e.target.value); resetTimer(); }} 
            placeholder="Что нарисовать?..." 
            className="appearance-none flex-1 bg-[#111] rounded-full px-5 py-3 outline-none border border-gray-800 focus:border-[#C5A059] text-gray-200 transition-all placeholder-gray-700 text-lg"
          />
          <button type="submit" disabled={isGenerating || !visionPrompt.trim()} style={{ color: GOLD_COLOR }} className="appearance-none text-2xl hover:scale-110 transition-transform disabled:opacity-30 flex items-center justify-center">
            {isGenerating ? <span className="animate-spin text-lg inline-block">⏳</span> : '✨'}
          </button>
        </form>

      </div>
    </div>
  );
}
