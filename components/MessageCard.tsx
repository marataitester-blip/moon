import React from 'react';
import { Message } from '../types';
import { Bot, User as UserIcon } from 'lucide-react';

interface MessageCardProps {
  message: Message;
  isOwn: boolean;
}

const MessageCard: React.FC<MessageCardProps> = ({ message, isOwn }) => {
  const isAi = message.sender === 'ai';
  
  // Base classes for the card
  const cardClasses = `
    relative p-4 rounded-xl max-w-[85%] sm:max-w-[70%] break-words shadow-lg border
    transition-all duration-300 animate-fade-in
    ${isOwn 
      ? 'ml-auto bg-surface border-gold/30 text-gold-100 rounded-tr-none' 
      : 'mr-auto bg-void border-zinc-800 text-gray-300 rounded-tl-none'}
  `;

  // Glow effect for AI messages
  const glowStyle = isAi 
    ? { boxShadow: '0 0 15px rgba(212, 175, 55, 0.05)' } 
    : {};

  return (
    <div className={`flex w-full mb-4 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {!isOwn && (
        <div className="flex-shrink-0 mr-2 mt-1">
          <div className="w-8 h-8 rounded-full bg-surface border border-gold/40 flex items-center justify-center">
            <Bot size={16} className="text-gold" />
          </div>
        </div>
      )}
      
      <div className={cardClasses} style={glowStyle}>
        {/* Header Name */}
        <div className={`text-[10px] font-serif uppercase tracking-widest mb-1 opacity-70 ${isOwn ? 'text-right text-gold' : 'text-left text-zinc-500'}`}>
          {isOwn ? 'Traveler' : 'LUNA'}
        </div>

        {/* Content */}
        {message.type === 'text' ? (
          <p className="text-sm font-light leading-relaxed whitespace-pre-wrap">{message.content}</p>
        ) : (
          <div className="space-y-2">
             <p className="text-xs italic text-zinc-500 border-l border-gold/20 pl-2 mb-2">
               "{message.content}"
             </p>
             {message.image_url && (
               <img 
                 src={message.image_url} 
                 alt="Materialized content" 
                 className="w-full rounded-lg border border-gold/10"
                 loading="lazy"
               />
             )}
          </div>
        )}
        
        {/* Timestamp */}
        <div className="text-[9px] text-right mt-2 opacity-40 font-mono">
          {new Date(message.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </div>
      </div>

      {isOwn && (
         <div className="flex-shrink-0 ml-2 mt-1">
           <div className="w-8 h-8 rounded-full bg-surface border border-zinc-800 flex items-center justify-center">
             <UserIcon size={16} className="text-zinc-500" />
           </div>
         </div>
      )}
    </div>
  );
};

export default MessageCard;