import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Send, ArrowLeft, Heart, MessageCircle } from 'lucide-react';

interface Message {
  id: number;
  sender_id: number;
  receiver_id: number;
  content: string;
  created_at: string;
}

interface Profile {
  id: number;
  name: string;
  profile_pic_url?: string;
}

export function ChatPage({ user }: { user: any }) {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [otherUser, setOtherUser] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const otherUserId = parseInt(userId || '0');

  useEffect(() => {
    if (!otherUserId) return;

    // Fetch other user's profile
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile/${otherUserId}`);
        const data = await res.json();
        setOtherUser(data);
      } catch (error) {
        console.error("Failed to fetch profile", error);
      }
    };

    // Fetch message history
    const fetchMessages = async () => {
      try {
        const res = await fetch(`/api/messages/${otherUserId}?userId=${user.id}`);
        const data = await res.json();
        setMessages(data);
      } catch (error) {
        console.error("Failed to fetch messages", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
    fetchMessages();

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}?userId=${user.id}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('Connected to chat server');
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          // Only add if it belongs to this conversation
          if (
            (data.senderId === otherUserId && data.receiverId === user.id) ||
            (data.senderId === user.id && data.receiverId === otherUserId)
          ) {
            setMessages((prev) => [...prev, {
              id: data.id,
              sender_id: data.senderId,
              receiver_id: data.receiverId,
              content: data.content,
              created_at: data.createdAt
            }]);
          }
        }
      } catch (e) {
        console.error('WS error', e);
      }
    };

    return () => {
      ws.close();
    };
  }, [otherUserId, user.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !wsRef.current) return;

    const messageContent = newMessage.trim();
    
    // Send via WebSocket
    wsRef.current.send(JSON.stringify({
      type: 'chat',
      receiverId: otherUserId,
      content: messageContent
    }));

    // Optimistically add to UI
    const tempMsg: Message = {
      id: Date.now(), // temporary ID
      sender_id: user.id,
      receiver_id: otherUserId,
      content: messageContent,
      created_at: new Date().toISOString()
    };
    
    setMessages((prev) => [...prev, tempMsg]);
    setNewMessage('');
  };

  if (loading) {
    return <div className="flex h-screen items-center justify-center">Loading chat...</div>;
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col bg-slate-50">
      {/* Chat Header */}
      <div className="flex items-center gap-4 border-b border-slate-200 bg-white px-4 py-3 shadow-sm">
        <button onClick={() => navigate('/dashboard')} className="rounded-full p-2 text-slate-500 hover:bg-slate-100">
          <ArrowLeft size={20} />
        </button>
        
        <div className="relative h-10 w-10 overflow-hidden rounded-full bg-slate-200">
          {otherUser?.profile_pic_url ? (
            <img src={otherUser.profile_pic_url} alt={otherUser.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-slate-400">
              <Heart size={20} />
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-lg font-semibold text-slate-900">{otherUser?.name || 'User'}</h2>
          <p className="text-xs text-slate-500">Online</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-slate-400">
            <MessageCircle size={48} className="mb-2 opacity-20" />
            <p>No messages yet. Say hi!</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.sender_id === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${
                    isMe
                      ? 'bg-rose-600 text-white rounded-br-none'
                      : 'bg-white text-slate-900 rounded-bl-none'
                  }`}
                >
                  <p className="text-sm">{msg.content}</p>
                  <span className={`mt-1 block text-[10px] ${isMe ? 'text-rose-100' : 'text-slate-400'}`}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-200 bg-white p-4">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <input
            type="text"
            placeholder="Type a message..."
            className="flex-1 rounded-full border border-slate-300 bg-slate-50 px-4 py-2 text-sm focus:border-rose-500 focus:outline-none focus:ring-1 focus:ring-rose-500"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-600 text-white shadow-md hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send size={18} />
          </button>
        </form>
      </div>
    </div>
  );
}


