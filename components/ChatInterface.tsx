import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../services/supabaseClient';
import { Message } from '../types';
import MessageCard from './MessageCard';
import { Send, Sparkles, Loader2, Image as ImageIcon } from 'lucide-react';
import { generateTextResponse, generateImage } from '../services/aiService';

interface ChatInterfaceProps {
  onLogout: () => void;
}

const ChatInterface: React.FC<ChatInterfaceProps> = ({ onLogout }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom helper
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initial Fetch & Realtime Subscription
  useEffect(() => {
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })
        .limit(50);
      
      if (!error && data) {
        setMessages(data as Message[]);
      }
    };

    fetchMessages();

    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        const newMessage = payload.new as Message;
        setMessages((prev) => [...prev, newMessage]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleSendMessage = async (isImageRequest: boolean = false) => {
    if (!inputText.trim()) return;
    
    const content = inputText;
    setInputText('');
    setIsProcessing(true);

    try {
      // 1. Save User Message
      await supabase.from('messages').insert({
        content: content,
        sender: 'user',
        type: 'text',
        image_url: null,
      });

      // 2. AI Processing
      if (isImageRequest) {
        // Image Generation Mode
        // Insert a temporary "Thinking" placeholder or just wait? 
        // We'll just wait for the AI response to be inserted.
        const base64Image = await generateImage(content);
        
        if (base64Image) {
           await supabase.from('messages').insert({
            content: content, // The prompt
            sender: 'ai',
            type: 'image',
            image_url: base64Image,
          });
        } else {
           // Fallback if image gen fails
           await supabase.from('messages').insert({
            content: "I could not materialize that vision.",
            sender: 'ai',
            type: 'text',
          });
        }

      } else {
        // Text Chat Mode
        const responseText = await generateTextResponse(content);
        await supabase.from('messages').insert({
          content: responseText,
          sender: 'ai',
          type: 'text',
        });
      }

    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-void text-gray-200 overflow-hidden font-sans">
      {/* Header */}
      <header className="flex-none h-16 border-b border-white/5 bg-void/80 backdrop-blur-md flex items-center justify-between px-6 z-10">
        <div className="flex items-center gap-3">
           <div className="w-2 h-2 rounded-full bg-gold animate-pulse-slow"></div>
           <h1 className="text-xl font-serif text-gold tracking-widest">LUNA</h1>
        </div>
        <button 
          onClick={onLogout}
          className="text-xs text-zinc-600 hover:text-gold transition-colors uppercase tracking-wider"
        >
          Disconnect
        </button>
      </header>

      {/* Messages Area */}
      <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        {messages.map((msg) => (
          <MessageCard key={msg.id} message={msg} isOwn={msg.sender === 'user'} />
        ))}
        {isProcessing && (
           <div className="flex justify-start animate-pulse">
             <div className="flex items-center gap-2 p-3 rounded-lg border border-gold/10 bg-void">
               <Loader2 className="w-4 h-4 text-gold animate-spin" />
               <span className="text-xs text-gold/50 font-serif">Thinking...</span>
             </div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </main>

      {/* Input Area */}
      <footer className="flex-none p-4 pb-8 sm:pb-4 bg-gradient-to-t from-void via-void to-transparent">
        <div className="max-w-4xl mx-auto relative flex items-end gap-2 p-2 rounded-2xl border border-white/10 bg-surface/50 backdrop-blur-lg shadow-[0_0_20px_rgba(0,0,0,0.5)]">
          
          {/* Text Input */}
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(false);
              }
            }}
            placeholder="Whisper to the void..."
            className="flex-1 bg-transparent border-none text-sm text-gray-200 placeholder-zinc-600 focus:ring-0 resize-none max-h-32 py-3 px-2 scrollbar-hide"
            rows={1}
          />

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pb-2 pr-2">
            
            {/* Image Gen Button */}
            <button
              onClick={() => handleSendMessage(true)}
              disabled={!inputText.trim() || isProcessing}
              className="p-2 rounded-full text-gold hover:bg-gold/10 hover:text-white transition-all disabled:opacity-30 group relative"
              title="Materialize (Generate Image)"
            >
              <Sparkles size={20} className="stroke-[1.5]" />
              {/* Tooltip */}
              <span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-zinc-800 text-gold text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                Materialize
              </span>
            </button>

            {/* Send Text Button */}
            <button
              onClick={() => handleSendMessage(false)}
              disabled={!inputText.trim() || isProcessing}
              className="p-2 rounded-full bg-gold/10 text-gold border border-gold/20 hover:bg-gold hover:text-void transition-all disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-gold"
            >
              <Send size={20} className="stroke-[1.5]" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatInterface;