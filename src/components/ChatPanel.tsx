'use client';

import { useStore } from '@/lib/store';
import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Shield, Users } from 'lucide-react';

export function ChatPanel() {
  const { user, chatMessages, sendMessage, loadMessages, subscribeToMessages } = useStore();
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'chat' | 'rules'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadMessages();
    const unsubscribe = subscribeToMessages();
    return unsubscribe;
  }, [loadMessages, subscribeToMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !user) return;
    
    await sendMessage(message);
    setMessage('');
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <aside className="w-80 bg-[#161b22] border-l border-[#30363d] flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-[#30363d]">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'chat'
              ? 'text-green-400 border-b-2 border-green-400 bg-green-400/5'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Users className="w-4 h-4" />
          Chat
        </button>
        <button
          onClick={() => setActiveTab('rules')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            activeTab === 'rules'
              ? 'text-green-400 border-b-2 border-green-400 bg-green-400/5'
              : 'text-gray-500 hover:text-gray-300'
          }`}
        >
          <Shield className="w-4 h-4" />
          Rules
        </button>
      </div>

      {activeTab === 'chat' ? (
        <>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {chatMessages.length === 0 ? (
              <div className="text-center py-8">
                <Users className="w-12 h-12 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">No messages yet</p>
                <p className="text-gray-600 text-xs">Be the first to say hello!</p>
              </div>
            ) : (
              chatMessages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-white">
                        {(msg.username || msg.wallet_address).slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-green-400 font-medium text-sm truncate">
                          {msg.username || formatAddress(msg.wallet_address)}
                        </span>
                        <span className="text-gray-600 text-xs">
                          {formatTime(msg.created_at)}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm break-words">{msg.message}</p>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-[#30363d]">
            {user ? (
              <form onSubmit={handleSend} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Enter message..."
                  maxLength={200}
                  className="flex-1 px-4 py-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-green-500 transition-colors"
                />
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  type="submit"
                  disabled={!message.trim()}
                  className="px-4 py-2.5 bg-green-600 hover:bg-green-500 rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </motion.button>
              </form>
            ) : (
              <div className="text-center py-3 px-4 bg-[#21262d] rounded-lg">
                <p className="text-gray-400 text-sm">Connect wallet to chat</p>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Rules Tab */
        <div className="flex-1 overflow-y-auto p-4">
          <div className="space-y-4">
            <div className="p-4 bg-[#21262d] rounded-lg border border-[#30363d]">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-green-400">1.</span> Fair Play
              </h3>
              <p className="text-gray-400 text-sm">All games are provably fair. You can verify any bet using the server seed after it&apos;s revealed.</p>
            </div>
            <div className="p-4 bg-[#21262d] rounded-lg border border-[#30363d]">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-green-400">2.</span> Bet Responsibly
              </h3>
              <p className="text-gray-400 text-sm">Only bet what you can afford to lose. Set limits and stick to them.</p>
            </div>
            <div className="p-4 bg-[#21262d] rounded-lg border border-[#30363d]">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-green-400">3.</span> Be Respectful
              </h3>
              <p className="text-gray-400 text-sm">Keep chat friendly. No spam, harassment, or inappropriate content.</p>
            </div>
            <div className="p-4 bg-[#21262d] rounded-lg border border-[#30363d]">
              <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                <span className="text-green-400">4.</span> House Edge
              </h3>
              <p className="text-gray-400 text-sm">The house has a 2% edge on all games. This ensures the casino can continue operating.</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}


