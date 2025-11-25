'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { socketClient } from '@/lib/socket';
import { useUserStore } from '@/stores/useUserStore';
import { cn } from '@/lib/utils';

interface ChatMessage {
  id: string;
  user: {
    id: string;
    username: string | null;
    avatar: string | null;
    level: number;
    isVip: boolean;
    vipTier: number;
  };
  content: string;
  createdAt: string;
}

export function ChatPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [room, setRoom] = useState('general');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { isAuthenticated, user } = useUserStore();

  useEffect(() => {
    const socket = socketClient.getSocket();
    if (!socket) return;

    // Join chat room
    socketClient.joinChat(room);

    // Listen for messages
    socket.on('chat:message', (message: ChatMessage) => {
      setMessages((prev) => [...prev.slice(-99), message]);
    });

    return () => {
      socket.off('chat:message');
    };
  }, [room]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim() || !isAuthenticated) return;
    socketClient.sendChatMessage(room, input.trim());
    setInput('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const getLevelColor = (level: number) => {
    if (level >= 50) return 'text-rarity-mythic';
    if (level >= 30) return 'text-rarity-legendary';
    if (level >= 20) return 'text-rarity-epic';
    if (level >= 10) return 'text-rarity-rare';
    if (level >= 5) return 'text-rarity-uncommon';
    return 'text-text-secondary';
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'fixed right-4 bottom-4 z-50 p-3 rounded-xl transition-all duration-200',
          'bg-bg-elevated border border-white/10 hover:border-primary-500/50',
          'shadow-lg hover:shadow-primary-500/20',
          isOpen && 'hidden'
        )}
      >
        <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
      </button>

      {/* Chat Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-80 z-50 bg-bg-secondary border-l border-white/5 flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/5">
              <div className="flex items-center gap-3">
                <h3 className="font-display font-semibold text-white">Chat</h3>
                <div className="flex gap-1">
                  {['general', 'vip'].map((r) => (
                    <button
                      key={r}
                      onClick={() => setRoom(r)}
                      className={cn(
                        'px-2 py-1 text-xs rounded-lg transition-colors capitalize',
                        room === r
                          ? 'bg-primary-500/20 text-primary-400'
                          : 'text-text-secondary hover:text-white hover:bg-white/5'
                      )}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-text-secondary hover:text-white rounded-lg hover:bg-white/5"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((message) => (
                <div key={message.id} className="group">
                  <div className="flex items-start gap-2">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-secondary-500 to-primary-500 flex-shrink-0 flex items-center justify-center overflow-hidden">
                      {message.user.avatar ? (
                        <img src={message.user.avatar} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold">
                          {message.user.username?.[0]?.toUpperCase() || '?'}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          'text-sm font-medium',
                          message.user.isVip ? 'text-warning-400' : 'text-white'
                        )}>
                          {message.user.username || 'Anonymous'}
                        </span>
                        <span className={cn(
                          'text-xs font-mono',
                          getLevelColor(message.user.level)
                        )}>
                          Lv.{message.user.level}
                        </span>
                        {message.user.isVip && (
                          <span className="px-1.5 py-0.5 text-[10px] font-bold bg-warning-500/20 text-warning-400 rounded">
                            VIP
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-text-secondary break-words">
                        {message.content}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/5">
              {isAuthenticated ? (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    maxLength={500}
                    className="flex-1 px-3 py-2 bg-bg-tertiary border border-white/10 rounded-xl text-sm text-white placeholder-text-muted focus:outline-none focus:border-primary-500/50"
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!input.trim()}
                    className="px-4 py-2 bg-primary-500 hover:bg-primary-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                  </button>
                </div>
              ) : (
                <p className="text-sm text-text-muted text-center">
                  Connect wallet to chat
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

