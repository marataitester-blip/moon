'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';

// --- НАСТРОЙКИ ---
const SESSION_TIMEOUT = 3 * 60 * 1000; // 3 минуты
const PASSWORD = 'MOON2024';

// Инициализация Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function LunaApp() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [passwordInput, setPasswordInput] = useState('');
  const [loginError, setLoginError] = useState(false);
  
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  
  const [showVision, setShowVision] = useState(false);
  const [visionPrompt, setVisionPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const messagesEndRef = useRef(null);
  const activityTimerRef = useRef(null);

  // --- ЛОГИКА ЗАЩИТЫ ---
  const resetTimer = () => {
    if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    if (isLoggedIn) {
      activityTimerRef.current = setTimeout(() => {
        setIsLoggedIn(false);
        localStorage.removeItem('luna_auth');
      }, SESSION_TIMEOUT);
    }
  };

  useEffect(() => {
    const savedAuth = localStorage.getItem('luna_auth');
    if (savedAuth === 'true') setIsLoggedIn(true);

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      events.forEach(event => window.removeEventListener(event, resetTimer));
      if (activityTimerRef.current) clearTimeout(activityTimerRef.current);
    };
  }, [isLoggedIn]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (passwordInput === PASSWORD) {
      setIsLoggedIn(true);
      localStorage.setItem('luna_auth', 'true');
      setLoginError(false);
    } else {
      setLoginError(true);
      setTimeout(() => setLoginError(false), 500);
    }
  };

  // --- ЧАТ И ГЕНЕРАЦИЯ ---
  useEffect(() => {
    if (!isLoggedIn) return;

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

    return () => supabase.removeChannel(channel);
  }, [isLoggedIn]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;

    await supabase.from('messages').insert([{ content: newMessage, is_mine: true }]);
    setNewMessage('');
  };

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
      } else {
        alert('Ошибка: ' + (data.error || 'Не удалось создать образ'));
      }
    } catch (err) {
      console.error(err);
      alert('Ошибка связи с Луной');
    } finally {
      setIsGenerating(false);
      setVisionPrompt('');
    }
  };

  // --- ЭКРАНЫ ---
  if (!isLoggedIn) {
    return (
      <div className="flex flex-col h-screen items-center justify-center bg-black text-white font-sans p-4">
        <h1 className="text-3xl font-bold mb-8 text-yellow-500 tracking-[0.3em]">LUNA ACCESS</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-6 w-full max-w-xs">
          <input 
            type="password" 
            placeholder="PASSWORD"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className={`bg-black border-2 ${loginError ? 'border-red-600 animate-pulse' : 'border-yellow-600'} text-center text-yellow-500 text-xl py-3 outline-none placeholder-gray-800`}
          />
          <button type="submit" className="bg-yellow-600 text-black font-bold py-3 uppercase tracking-widest hover:bg-yellow-500 transition">
            Enter
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-black text-white font-sans relative">
      <header className="p-4 bg-black/90 border-b border-gray-900 flex justify-between items-center sticky top-0 z-10 backdrop-blur">
        <h1 className="text-xl font-bold tracking-widest text-yellow-500">LUNA</h1>
        <button onClick={() => { setIsLoggedIn(false); localStorage.removeItem('luna_auth'); }} className="text-xs text-gray-500 uppercase">Exit</button>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl ${msg.is_mine ? 'bg-yellow-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
              {msg.image_url && (
                <div className="mb-2 rounded-lg overflow-hidden">
                  <img src={msg.image_url} alt="Vision" className="w-full h-auto" />
                </div>
              )}
              <p>{msg.content}</p>
            </div>
          </div>
        ))}
        {isGenerating && <div className="text-right text-xs text-yellow-500 animate-pulse">Creating vision...</div>}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black border-t border-gray-900">
        <form onSubmit={sendMessage} className="flex gap-2 max-w-3xl mx-auto">
          <button type="button" onClick={() => setShowVision(true)} className="text-2xl px-2">👁️</button>
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => setNewMessage(e.target.value)} 
            placeholder="Write..." 
            className="flex-1 bg-gray-900 rounded-full px-4 outline-none border border-gray-800 focus:border-yellow-600"
          />
          <button type="submit" className="text-yellow-500 font-bold px-4">➤</button>
        </form>
      </div>

      {showVision && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-gray-900 p-6 rounded-xl border border-yellow-600/30">
            <h2 className="text-yellow-500 mb-4 tracking-widest text-center font-bold">LUNA VISION</h2>
            <textarea 
              value={visionPrompt} 
              onChange={(e) => setVisionPrompt(e.target.value)} 
              placeholder="What do you see?" 
              className="w-full bg-black border border-gray-700 rounded p-3 h-32 mb-4 text-white outline-none focus:border-yellow-500"
            />
            <div className="flex gap-2">
              <button onClick={() => setShowVision(false)} className="flex-1 py-3 border border-gray-700 rounded text-gray-400">Cancel</button>
              <button onClick={handleGenerate} className="flex-1 py-3 bg-yellow-600 text-black font-bold rounded">Dream</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
