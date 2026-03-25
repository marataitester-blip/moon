'use client';
import { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import { Send, Sparkles, Loader2, Trash2, X } from 'lucide-react';

// --- НАСТРОЙКИ ---
const PIN_CODE = '7019';
const SESSION_KEY = 'luna_session_token'; 
const DEVICE_KEY = 'luna_device_id'; 
const INACTIVITY_LIMIT = 3 * 60 * 1000; 
const GOLD_COLOR = '#C5A059'; 

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Обновленный компонент: добавлена защита от битых ссылок (onError)
const ImageWithSkeleton = ({ src }) => {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className="relative min-h-[200px] w-full bg-[#111] rounded-xl overflow-hidden border border-[#222]">
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#1a1a1a]" />}
      <img 
        src={src} 
        alt="Vision" 
        onLoad={() => setLoaded(true)} 
        onError={() => { setLoaded(true); console.error("Ошибка загрузки изображения по ссылке:", src); }}
        className={`w-full h-auto relative z-10 transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`} 
      />
    </div>
  );
};

export default function LunaApp() {
  const [currentView, setCurrentView] = useState('landing'); 
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  
  const [deviceId, setDeviceId] = useState('');
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [visionPrompt, setVisionPrompt] = useState('');
  
  const [onlineCount, setOnlineCount] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    setDeviceId(id);
  }, []);

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

  useEffect(() => {
    if (currentView !== 'chat' || !deviceId) return;

    const fetchMessages = async () => {
      const { data } = await supabase.from('messages').select('*').order('created_at', { ascending: true });
      if (data) setMessages(data);
    };
    fetchMessages();

    const channel = supabase.channel('luna_room');

    channel
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        setMessages((prev) => {
          if (prev.some(m => m.id === payload.new.id)) return prev;
          return [...prev, payload.new];
        });
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

    return () => { supabase.removeChannel(channel); };
  }, [currentView, deviceId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e) => {
    if (e) e.preventDefault();
    if (!newMessage.trim()) return;
    
    const textToSend = newMessage;
    setNewMessage('');
    resetTimer();
    
    const tempId = crypto.randomUUID();
    const optimisticMsg = { 
      id: tempId, 
      content: textToSend, 
      sender: deviceId, 
      is_mine: true,
      created_at: new Date().toISOString() 
    };
    setMessages(prev => [...prev, optimisticMsg]);
    
    await supabase.from('messages').insert([{
      content: optimisticMsg.content,
      sender: optimisticMsg.sender,
      is_mine: optimisticMsg.is_mine
    }]);
  };

  const clearHistory = async () => {
    resetTimer();
    if (!confirm('LUNA: Удалить воспоминания навсегда?')) return;
    setIsDeleting(true);
    const { error } = await supabase.from('messages').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) alert('Ошибка удаления');
    setMessages([]);
    setIsDeleting(false);
  };

  // --- ОБНОВЛЕННАЯ ЛОГИКА ГЕНЕРАЦИИ (ОПТИМИСТИЧНЫЙ UI ДЛЯ КАРТИНОК) ---
  const handleGenerate = async (e) => {
    e.preventDefault();
    if (!visionPrompt.trim()) return;
    
    const promptText = visionPrompt;
    setVisionPrompt('');
    setIsGenerating(true);
    resetTimer();

    try {
      // 1. Показываем промпт в чате
      const tempPromptId = crypto.randomUUID();
      const promptMsg = { 
        id: tempPromptId, 
        content: `✨ Vision: ${promptText}`, 
        sender: deviceId, 
        is_mine: true,
        created_at: new Date().toISOString() 
      };
      setMessages(prev => [...prev, promptMsg]);
      
      await supabase.from('messages').insert([{
        content: promptMsg.content,
        sender: promptMsg.sender,
        is_mine: true
      }]);

      // 2. Делаем запрос к API
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: promptText }),
      });
      
      const data = await response.json();
      
      // 3. Если получили картинку — МГНОВЕННО её рисуем
      if (data.imageUrl) {
        const tempImgId = crypto.randomUUID();
        const imgMsg = {
          id: tempImgId,
          content: '',
          sender: 'ai',
          image_url: data.imageUrl,
          is_mine: false,
          created_at: new Date().toISOString()
        };
        
        // Рисуем на экране до сохранения в базу
        setMessages(prev => [...prev, imgMsg]);

        // Сохраняем в Supabase и выводим ошибку, если база отклонила запись
        const { error } = await supabase.from('messages').insert([{ 
          content: '', 
          sender: 'ai', 
          image_url: data.imageUrl,
          is_mine: false 
        }]);

        if (error) {
          console.error("Ошибка сохранения картинки в Supabase:", error);
        }
      } else {
        console.error("Сервер не вернул imageUrl:", data);
      }
    } catch (err) { 
      console.error("Ошибка сети или сервера:", err); 
    } finally { 
      setIsGenerating(false); 
    }
  };

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
    <div className="flex flex-col h-[100dvh] bg-black text-white font-sans relative max-w-2xl mx-auto border-x border-[#111]">
      <header className="p-4 bg-black/95 border-b border-[#1f1f1f] flex justify-between items-center sticky top-0 z-10 backdrop-blur shrink-0">
        <div className="w-8 flex items-center justify-center">
          {onlineCount > 1 && (
            <div className="w-2 h-2 bg-green-500 rounded-full shadow-[0_0_10px_#22c55e] animate-pulse"></div>
          )}
        </div>
        <h1 style={{ color: GOLD_COLOR }} className="text-xl font-serif tracking-[0.3em]">LUNA</h1>
        <div className="flex gap-4 w-12 justify-end">
          <button onClick={clearHistory} disabled={isDeleting} className="text-gray-600 hover:text-red-900 transition-colors">
            <Trash2 size={18} />
          </button>
          <button onClick={logout} style={{ color: GOLD_COLOR }} className="hover:opacity-50 transition-opacity">
            <X size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {messages.map((msg) => {
          const isMe = msg.sender === deviceId;
          const isAi = msg.sender === 'ai';

          return (
            <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[85%] p-3 border transition-all ${
                  isMe 
                    ? 'bg-[#1a150b] border-[#C5A059]/50 text-[#e8d4a6] rounded-2xl rounded-tr-none' 
                    : isAi 
                      ? 'bg-[#050505] border-[#C5A059]/30 shadow-[0_0_15px_rgba(197,160,89,0.1)] text-white rounded-2xl rounded-tl-none' 
                      : 'bg-[#0a0a0a] border-zinc-800 text-zinc-300 rounded-2xl rounded-tl-none' 
                }`}
              >
                {msg.image_url && <ImageWithSkeleton src={msg.image_url} />}
                {msg.content && <p className="leading-relaxed text-sm font-light whitespace-pre-wrap">{msg.content}</p>}
                
                <p className={`text-[10px] opacity-40 mt-1 font-mono ${isMe ? 'text-right' : 'text-left'}`}>
                  {new Date(msg.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute:'2-digit', timeZone: 'Europe/Moscow' })}
                </p>
              </div>
            </div>
          );
        })}
        {isGenerating && (
          <div className="flex justify-start">
             <div className="bg-[#050505] border border-[#C5A059]/30 rounded-2xl rounded-tl-none p-3 shadow-[0_0_15px_rgba(197,160,89,0.1)]">
                <Loader2 className="animate-spin text-[#C5A059]" size={20} />
             </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 bg-black border-t border-[#1f1f1f] flex flex-col gap-3 pb-safe shrink-0">
        <form onSubmit={sendMessage} className="flex gap-2 items-center">
          <input 
            type="text" 
            value={newMessage} 
            onChange={(e) => { setNewMessage(e.target.value); resetTimer(); }} 
            placeholder="Сообщение..." 
            className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
          />
          <button type="submit" disabled={!newMessage.trim()} className="p-3 text-[#D4AF37] hover:scale-105 transition-transform disabled:opacity-30">
            <Send size={20} />
          </button>
        </form>

        <form onSubmit={handleGenerate} className="flex gap-2 items-center">
          <input 
            type="text" 
            value={visionPrompt} 
            onChange={(e) => { setVisionPrompt(e.target.value); resetTimer(); }} 
            placeholder="Опишите видение..." 
            className="flex-1 bg-[#121212] border border-zinc-800 text-[#D4AF37] px-4 py-3 rounded-xl text-sm focus:outline-none focus:border-[#C5A059]/50 transition-colors"
          />
          <button type="submit" disabled={isGenerating || !visionPrompt.trim()} className="bg-[#1a150b] border border-[#C5A059]/30 text-[#D4AF37] p-3 rounded-xl min-w-[50px] flex items-center justify-center disabled:opacity-50">
            {isGenerating ? <Loader2 className="animate-spin w-5 h-5" /> : <Sparkles size={20} />}
          </button>
        </form>
      </div>
    </div>
  );
}
