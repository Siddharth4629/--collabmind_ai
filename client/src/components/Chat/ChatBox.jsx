import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { Send, Check, CheckCheck, MessageSquare } from 'lucide-react';

export default function ChatBox({ projectId }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]); // Real-time active in room
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Load chat history
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/projects/${projectId}/chats`);
        if (res.data.success) {
          setMessages(res.data.data);
          
          // Mark unread messages as read
          res.data.data.forEach((msg) => {
            const isRead = msg.readBy?.includes(user._id);
            if (!isRead && msg.sender?._id !== user._id) {
              socket?.emit('read-receipt', {
                projectId,
                userId: user._id,
                messageId: msg._id
              });
            }
          });
        }
      } catch (err) {
        console.error('Error fetching chat history:', err);
      } finally {
        setLoading(false);
      }
    };

    if (projectId && user) {
      fetchChatHistory();
    }
  }, [projectId, user, socket]);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    // Join room
    socket.emit('join-project', {
      projectId,
      userId: user._id,
      username: user.name
    });

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      
      // If we are not the sender, send read-receipt
      if (message.sender?._id !== user._id) {
        socket.emit('read-receipt', {
          projectId,
          userId: user._id,
          messageId: message._id
        });
      }
    };

    const handleUserTyping = ({ username, isTyping }) => {
      if (username === user.name) return;
      setTypingUsers((prev) => ({
        ...prev,
        [username]: isTyping
      }));
    };

    const handleMessageRead = ({ messageId, readByUserId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg._id === messageId) {
            const updatedReadBy = msg.readBy || [];
            if (!updatedReadBy.includes(readByUserId)) {
              return { ...msg, readBy: [...updatedReadBy, readByUserId] };
            }
          }
          return msg;
        })
      );
    };

    const handleUserJoined = ({ userId, username }) => {
      setActiveUsers((prev) => {
        if (prev.some((u) => u.userId === userId)) return prev;
        return [...prev, { userId, username }];
      });
    };

    const handleUserLeft = ({ userId, username }) => {
      setActiveUsers((prev) => prev.filter((u) => u.userId !== userId));
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('user-typing', handleUserTyping);
    socket.on('message-read', handleMessageRead);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);

    return () => {
      socket.emit('leave-project', {
        projectId,
        userId: user._id,
        username: user.name
      });
      socket.off('receive-message', handleReceiveMessage);
      socket.off('user-typing', handleUserTyping);
      socket.off('message-read', handleMessageRead);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
    };
  }, [socket, projectId, user]);

  // Scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUsers]);

  // Handle typing event triggers
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    if (!socket) return;
    socket.emit('typing', { projectId, username: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { projectId, username: user.name });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !socket) return;

    socket.emit('send-message', {
      projectId,
      senderId: user._id,
      senderName: user.name,
      message: newMessage.trim()
    });

    socket.emit('stop-typing', { projectId, username: user.name });
    setNewMessage('');
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isMessageReadByOthers = (msg) => {
    if (!msg.readBy) return false;
    // Read by someone other than the sender
    return msg.readBy.some((id) => id !== msg.sender?._id);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative">
      
      {/* Top Header */}
      <div className="px-6 py-4 bg-slate-900/80 border-b border-slate-800/80 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/30 shadow-[0_0_15px_rgba(99,102,241,0.15)]">
            <MessageSquare className="w-5 h-5 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-slate-100">Project Workspace Chat</h2>
            <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className={`w-2 h-2 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {connected ? 'Real-time synchronization active' : 'Connecting to socket server...'}
            </p>
          </div>
        </div>

        {/* Mini status indicator */}
        <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400 bg-slate-800/40 px-3 py-1 rounded-full border border-slate-700/50">
          <span className="font-semibold text-indigo-400">{activeUsers.length + 1}</span> online
        </div>
      </div>

      {/* Messages Panel */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
        {loading ? (
          <div className="h-full flex items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
              <p className="text-sm text-slate-400">Syncing chat history...</p>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6">
            <MessageSquare className="w-12 h-12 text-slate-700 mb-3" />
            <h3 className="text-slate-300 font-medium mb-1">No messages yet</h3>
            <p className="text-xs text-slate-500 max-w-xs">Send the first chat to start collaborating with your team in real-time!</p>
          </div>
        ) : (
          messages.map((msg, i) => {
            const isMe = msg.sender?._id === user._id;
            return (
              <div key={msg._id || i} className={`flex ${isMe ? 'justify-end' : 'justify-start'} group`}>
                <div className={`flex flex-col max-w-[75%] ${isMe ? 'items-end' : 'items-start'}`}>
                  
                  {/* Sender Name */}
                  {!isMe && (
                    <span className="text-[11px] font-medium text-slate-400 mb-1 px-1">
                      {msg.sender?.name || 'Anonymous User'}
                    </span>
                  )}
                  
                  {/* Bubble */}
                  <div className={`px-4 py-2.5 rounded-2xl text-sm relative ${
                    isMe 
                      ? 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-slate-50 rounded-tr-none shadow-[0_4px_15px_rgba(99,102,241,0.25)]' 
                      : 'bg-slate-800/80 text-slate-200 border border-slate-750 rounded-tl-none'
                  }`}>
                    <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                  </div>

                  {/* Timestamp & Receipts */}
                  <div className="flex items-center gap-1.5 mt-1 px-1">
                    <span className="text-[10px] text-slate-500">
                      {formatTime(msg.createdAt)}
                    </span>
                    {isMe && (
                      <span className="text-slate-400">
                        {isMessageReadByOthers(msg) ? (
                          <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <Check className="w-3.5 h-3.5 text-slate-500" />
                        )}
                      </span>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}

        {/* Typing Indicators */}
        {Object.entries(typingUsers).map(([username, isTyping]) => {
          if (!isTyping) return null;
          return (
            <div key={username} className="flex justify-start">
              <div className="bg-slate-800/40 text-slate-400 px-3 py-1.5 rounded-full text-xs border border-slate-800/60 flex items-center gap-2">
                <span className="font-semibold text-slate-300">{username}</span>
                <span className="flex items-center gap-0.5">
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                </span>
              </div>
            </div>
          );
        })}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Input panel */}
      <form onSubmit={handleSend} className="p-4 bg-slate-900/95 border-t border-slate-800/80 flex gap-2">
        <input
          type="text"
          value={newMessage}
          onChange={handleMessageChange}
          placeholder="Type message..."
          className="flex-1 bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-indigo-500/80 text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-sm focus:outline-none transition-all focus:ring-1 focus:ring-indigo-500/30"
        />
        <button
          type="submit"
          disabled={!newMessage.trim()}
          className="bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-850 text-white p-2.5 rounded-xl transition-all shadow-[0_0_15px_rgba(99,102,241,0.2)] disabled:shadow-none hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] flex items-center justify-center"
        >
          <Send className="w-4.5 h-4.5" />
        </button>
      </form>

    </div>
  );
}
