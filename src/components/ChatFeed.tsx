'use client';

import React, { useState, useEffect, useRef } from 'react';

export interface ChatMessage {
  id: string;
  type: 'subscription' | 'comment' | 'like' | 'enemy_destroyed' | 'upgrade' | 'life_lost';
  message: string;
  timestamp: number;
  userName?: string;
  level?: number;
}

interface ChatFeedProps {
  messages: ChatMessage[];
  className?: string;
}

export const ChatFeed: React.FC<ChatFeedProps> = ({ messages, className = '' }) => {
  const [displayMessages, setDisplayMessages] = useState<ChatMessage[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Mantener solo los últimos 50 mensajes para rendimiento
    const recentMessages = messages.slice(-50);
    setDisplayMessages(recentMessages);
  }, [messages]);

  useEffect(() => {
    // Auto-scroll al último mensaje
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [displayMessages]);

  const getMessageIcon = (type: ChatMessage['type']): string => {
    switch (type) {
      case 'subscription': return '⭐';
      case 'comment': return '💬';
      case 'like': return '👍';
      case 'enemy_destroyed': return '💥';
      case 'upgrade': return '🚀';
      case 'life_lost': return '💔';
      default: return '📢';
    }
  };

  const getMessageColor = (type: ChatMessage['type']): string => {
    switch (type) {
      case 'subscription': return 'text-red-400';
      case 'comment': return 'text-blue-400';
      case 'like': return 'text-yellow-400';
      case 'enemy_destroyed': return 'text-green-400';
      case 'upgrade': return 'text-purple-400';
      case 'life_lost': return 'text-red-500';
      default: return 'text-gray-300';
    }
  };

  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { 
      hour12: false, 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  return (
    <div className={`bg-gray-900 rounded-lg border border-gray-700 ${className}`}>
      <div className="p-3 border-b border-gray-700">
        <h3 className="text-white font-semibold flex items-center gap-2">
          <span className="text-green-400">●</span>
          Chat del Juego
        </h3>
      </div>
      
      <div 
        ref={scrollRef}
        className="h-80 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {displayMessages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Esperando actividad del stream...
          </div>
        ) : (
          displayMessages.map((msg) => (
            <div 
              key={msg.id} 
              className="flex items-start gap-2 text-sm animate-fade-in"
            >
              <span className="text-lg flex-shrink-0">
                {getMessageIcon(msg.type)}
              </span>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  <span>{formatTime(msg.timestamp)}</span>
                  {msg.userName && (
                    <>
                      <span>•</span>
                      <span className="font-medium">
                        {msg.userName}
                        {msg.level && (
                          <span className="ml-1 text-yellow-400">
                            Lv.{msg.level}
                          </span>
                        )}
                      </span>
                    </>
                  )}
                </div>
                
                <div className={`${getMessageColor(msg.type)} break-words`}>
                  {msg.message}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ChatFeed;