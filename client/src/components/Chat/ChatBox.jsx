import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { 
  Send, Check, CheckCheck, MessageSquare, Search, Hash, Users, Volume2, Reply, Smile, MoreHorizontal, Crown, Sparkles 
} from 'lucide-react';

export default function ChatBox({ projectId }) {
  const { user } = useAuth();
  const { socket, connected } = useSocket();
  const [newMessage, setNewMessage] = useState('');
  const [typingUsers, setTypingUsers] = useState({});
  const [loading, setLoading] = useState(true);
  const [activeUsers, setActiveUsers] = useState([]); // Real-time active in room
  const [projectMembers, setProjectMembers] = useState([]);
  const [projectOwner, setProjectOwner] = useState(null);
  
  const [activeChannel, setActiveChannel] = useState('general');
  const [memberSearchQuery, setMemberSearchQuery] = useState('');
  const [messageSearchQuery, setMessageSearchQuery] = useState('');

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // High fidelity Channels list
  const CHANNELS = [
    { id: 'general', name: 'general', description: 'Main project-wide conversation thread' },
    { id: 'tasks', name: 'tasks-discussion', description: 'Coordinate deliverables, priorities, and deadlines' },
    { id: 'whiteboard', name: 'whiteboard-collab', description: 'Design reviews, UI mockups, and layout wireframing' },
    { id: 'infrastructure', name: 'infrastructure-cost', description: 'Cloud node configurations and database allocations' },
  ];

  // Channel message streams
  const [channelMessages, setChannelMessages] = useState({
    general: [],
    tasks: [
      { _id: 't1', message: "Hey team, let's discuss deliverables, priorities, and deadlines in this thread.", sender: { name: 'CollabMind Bot' }, createdAt: new Date(Date.now() - 3600000 * 3).toISOString() },
      { _id: 't2', message: "Good idea, keeping this separate from main chat keeps it focused.", sender: { name: 'Developer Sync' }, createdAt: new Date(Date.now() - 3600000 * 2).toISOString() }
    ],
    whiteboard: [
      { _id: 'w1', message: "Welcome to the whiteboard collaboration space. Share screenshots or discuss wireframe configurations here.", sender: { name: 'UI Architect' }, createdAt: new Date(Date.now() - 3600000 * 4).toISOString() }
    ],
    infrastructure: [
      { _id: 'i1', message: "AWS hosting allocations and DB instance records will be reviewed next week.", sender: { name: 'DevOps Lead' }, createdAt: new Date(Date.now() - 3600000 * 1).toISOString() }
    ]
  });

  // Fetch project members and owner for sidebar directory
  useEffect(() => {
    const fetchProjectMembers = async () => {
      try {
        const res = await axios.get(`/api/projects/${projectId}`);
        if (res.data.success) {
          setProjectMembers(res.data.data.members || []);
          setProjectOwner(res.data.data.owner || null);
        }
      } catch (err) {
        console.error('Failed to load project members directory:', err.message);
      }
    };
    if (projectId) {
      fetchProjectMembers();
    }
  }, [projectId]);

  // Load chat history (General channel)
  useEffect(() => {
    const fetchChatHistory = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`/api/projects/${projectId}/chats`);
        if (res.data.success) {
          setChannelMessages((prev) => ({
            ...prev,
            general: res.data.data
          }));
          
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

    if (projectId && user && socket) {
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
      setChannelMessages((prev) => ({
        ...prev,
        general: [...prev.general, message]
      }));
      
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
      setChannelMessages((prev) => ({
        ...prev,
        general: prev.general.map((msg) => {
          if (msg._id === messageId) {
            const updatedReadBy = msg.readBy || [];
            if (!updatedReadBy.includes(readByUserId)) {
              return { ...msg, readBy: [...updatedReadBy, readByUserId] };
            }
          }
          return msg;
        })
      }));
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
  }, [channelMessages, typingUsers, activeChannel]);

  // Handle typing event triggers
  const handleMessageChange = (e) => {
    setNewMessage(e.target.value);

    if (activeChannel !== 'general' || !socket) return;
    socket.emit('typing', { projectId, username: user.name });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      socket.emit('stop-typing', { projectId, username: user.name });
    }, 1500);
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    if (activeChannel === 'general') {
      if (!socket) return;
      socket.emit('send-message', {
        projectId,
        senderId: user._id,
        senderName: user.name,
        message: newMessage.trim()
      });
      socket.emit('stop-typing', { projectId, username: user.name });
    } else {
      // Local append for mock channels
      const newMsgObj = {
        _id: `mock-${Date.now()}`,
        message: newMessage.trim(),
        sender: { _id: user._id, name: user.name },
        createdAt: new Date().toISOString(),
        readBy: [user._id]
      };
      setChannelMessages(prev => ({
        ...prev,
        [activeChannel]: [...prev[activeChannel], newMsgObj]
      }));

      // Auto reply from simulated chatbot
      const channelName = CHANNELS.find(c => c.id === activeChannel)?.name;
      setTimeout(() => {
        const replyObj = {
          _id: `reply-${Date.now()}`,
          message: `This is a sandbox response in #${channelName}. Live server database records are linked on #general.`,
          sender: { name: 'CollabMind Bot' },
          createdAt: new Date().toISOString()
        };
        setChannelMessages(prev => ({
          ...prev,
          [activeChannel]: [...prev[activeChannel], replyObj]
        }));
      }, 1000);
    }
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

  // Filter messages based on search
  const currentMsgs = channelMessages[activeChannel] || [];
  const filteredMsgs = currentMsgs.filter(m => 
    m.message.toLowerCase().includes(messageSearchQuery.toLowerCase())
  );

  // Filter project members based on search
  const filteredMembers = projectMembers.filter(m => {
    const name = m.user?.name || 'Unknown Contributor';
    return name.toLowerCase().includes(memberSearchQuery.toLowerCase());
  });

  // Render message thread with Date Separators, Avatars, and Hover Actions
  const renderMessages = () => {
    let lastDate = null;
    return filteredMsgs.map((msg, i) => {
      const isMe = msg.sender?._id === user._id;
      const msgDate = new Date(msg.createdAt).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      
      const dateSeparator = lastDate !== msgDate ? (
        <div key={`date-${msg._id || i}`} className="flex items-center justify-center my-6 select-none">
          <div className="flex-1 border-t border-slate-800/80"></div>
          <span className="px-4 py-1 rounded-full bg-slate-950 border border-slate-850 text-[9px] font-extrabold uppercase tracking-widest text-slate-500 mx-4">
            {msgDate}
          </span>
          <div className="flex-1 border-t border-slate-800/80"></div>
        </div>
      ) : null;
      
      lastDate = msgDate;
      const initial = (msg.sender?.name || 'Anonymous User').charAt(0).toUpperCase();

      return (
        <React.Fragment key={msg._id || i}>
          {dateSeparator}
          <div className={`flex ${isMe ? 'justify-end' : 'justify-start'} group py-1.5 hover:bg-slate-800/10 transition-colors rounded-xl px-2.5 -mx-2.5 relative`}>
            
            {/* Avatar block */}
            <div className={`flex items-start gap-3 max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
              
              {/* Initials Avatar */}
              <div className="w-8 h-8 rounded-full bg-slate-950 border border-slate-800 flex items-center justify-center text-[10px] font-extrabold text-[var(--gold-primary)] shrink-0 uppercase shadow-md select-none mt-0.5">
                {initial}
              </div>

              <div className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                
                {/* Sender Title and Time */}
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[10px] font-bold text-slate-350">
                    {msg.sender?.name || 'Anonymous User'}
                  </span>
                  <span className="text-[8px] text-slate-500 font-mono">
                    {formatTime(msg.createdAt)}
                  </span>
                </div>

                {/* Bubble */}
                <div className={`px-4 py-2.5 rounded-2xl text-xs relative ${
                  isMe 
                    ? 'bg-slate-950 border border-[var(--gold-primary)]/30 text-slate-100 rounded-tr-none hover:border-[var(--gold-primary)]/50 shadow-md transition' 
                    : 'bg-slate-800/80 text-slate-200 border border-slate-750 rounded-tl-none hover:border-slate-700 transition'
                }`}>
                  <p className="break-words leading-relaxed whitespace-pre-wrap">{msg.message}</p>
                </div>
                
                {/* Receipts */}
                {isMe && (
                  <div className="mt-0.5 px-1">
                    {isMessageReadByOthers(msg) ? (
                      <CheckCheck className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Check className="w-3 h-3 text-slate-500" />
                    )}
                  </div>
                )}
              </div>

            </div>

            {/* Hover micro-action panel */}
            <div className="absolute right-4 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 bg-slate-950 border border-slate-850 p-1 rounded-lg shadow-xl z-20">
              <button type="button" className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-[var(--gold-primary)] transition cursor-pointer" title="Reply">
                <Reply className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-[var(--gold-primary)] transition cursor-pointer" title="React">
                <Smile className="w-3.5 h-3.5" />
              </button>
              <button type="button" className="p-1 hover:bg-slate-850 rounded text-slate-400 hover:text-slate-200 transition cursor-pointer" title="Options">
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        </React.Fragment>
      );
    });
  };

  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] bg-slate-900/60 backdrop-blur-md rounded-2xl border border-slate-800/80 overflow-hidden shadow-2xl relative text-left">
      
      {/* Top Header */}
      <div className="px-6 py-4 bg-slate-900/85 border-b border-slate-800/80 flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-950 flex items-center justify-center border border-[var(--gold-primary)]/20 shadow-[0_0_15px_var(--gold-glow)]">
            <MessageSquare className="w-5 h-5 text-[var(--gold-primary)]" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              <span>#{CHANNELS.find(c => c.id === activeChannel)?.name || activeChannel}</span>
              <span className="text-[10px] text-slate-500 font-normal hidden md:inline">| {CHANNELS.find(c => c.id === activeChannel)?.description}</span>
            </h2>
            <p className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full ${connected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
              {connected ? 'Sync Active' : 'Connecting...'}
            </p>
          </div>
        </div>

        {/* Online Contributors counter */}
        <div className="flex items-center gap-1.5 text-[9px] uppercase font-extrabold tracking-wider text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-full border border-slate-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[var(--gold-primary)] font-extrabold">{activeUsers.length + 1}</span> active
        </div>
      </div>

      {/* Main 3-Pane split layout */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* PANE 1: Channels Navigation Panel (Left Sidebar) */}
        <div className="w-[200px] bg-slate-950/40 border-r border-slate-800/80 flex flex-col p-3 overflow-y-auto shrink-0 select-none scrollbar-thin">
          
          {/* Search Messages */}
          <div className="relative mb-4">
            <input
              type="text"
              value={messageSearchQuery}
              onChange={(e) => setMessageSearchQuery(e.target.value)}
              placeholder="Search discussions..."
              className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] text-[10px] text-slate-200 placeholder-slate-600 rounded-lg pl-8 pr-2.5 py-1.5 focus:outline-none transition-all"
            />
            <Search className="w-3.5 h-3.5 text-slate-650 absolute left-2.5 top-2" />
          </div>

          {/* Text Channels List */}
          <div className="space-y-4">
            <div>
              <h4 className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest px-2 mb-2">Text Channels</h4>
              <div className="space-y-0.5">
                {CHANNELS.map((chan) => {
                  const isActive = activeChannel === chan.id;
                  return (
                    <button
                      key={chan.id}
                      type="button"
                      onClick={() => setActiveChannel(chan.id)}
                      className={`w-full flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                        isActive
                          ? 'bg-[var(--gold-primary)]/10 text-[var(--gold-primary)] font-bold border-l-2 border-[var(--gold-primary)]'
                          : 'text-slate-400 hover:bg-slate-900/50 hover:text-slate-200'
                      }`}
                    >
                      <Hash className="w-3.5 h-3.5 opacity-60" />
                      <span className="truncate">{chan.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Voice Channels List */}
            <div>
              <h4 className="text-[8px] font-extrabold text-slate-500 uppercase tracking-widest px-2 mb-2">Voice Channels</h4>
              <div className="space-y-0.5">
                <div className="w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs text-slate-500 hover:bg-slate-900/30 cursor-pointer transition">
                  <div className="flex items-center gap-1.5">
                    <Volume2 className="w-3.5 h-3.5 opacity-60 text-slate-650" />
                    <span className="truncate">Huddle Room</span>
                  </div>
                  <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-500 px-1 py-0.2 rounded font-bold uppercase scale-90 select-none">Mock</span>
                </div>
              </div>
            </div>
          </div>

          {/* User profile card bottom */}
          <div className="mt-auto border-t border-slate-850 pt-3 flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[var(--gold-primary)] to-[var(--gold-secondary)] text-slate-950 font-bold flex items-center justify-center text-[10px] uppercase shadow shadow-[0_0_10px_var(--gold-glow)] shrink-0">
              {(user?.name || 'U').charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-slate-200 truncate leading-none">{user?.name}</p>
              <span className="text-[8px] text-slate-500 uppercase tracking-wider font-extrabold mt-0.5 block">Online</span>
            </div>
          </div>

        </div>

        {/* PANE 2: Center Message Feed area */}
        <div className="flex-1 flex flex-col min-w-0 bg-slate-950/10">
          
          {/* Scrollable messages container */}
          <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scrollbar-thin">
            {loading && activeChannel === 'general' ? (
              <div className="h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-4 border-[var(--gold-primary)]/30 border-t-[var(--gold-primary)] rounded-full animate-spin" />
                  <p className="text-xs text-slate-400">Syncing discussion stream...</p>
                </div>
              </div>
            ) : filteredMsgs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 select-none">
                <MessageSquare className="w-12 h-12 text-slate-800 mb-3" />
                <h3 className="text-slate-450 font-bold mb-1 uppercase tracking-wider text-xs">No discussions yet</h3>
                <p className="text-[9px] text-slate-650 max-w-xs font-semibold uppercase">No messages match search filters or have been shared by the team yet.</p>
              </div>
            ) : (
              renderMessages()
            )}

            {/* Typing Indicators */}
            {activeChannel === 'general' && Object.entries(typingUsers).map(([username, isTyping]) => {
              if (!isTyping) return null;
              return (
                <div key={username} className="flex justify-start">
                  <div className="bg-slate-900/60 text-slate-400 px-3.5 py-1.5 rounded-full text-[10px] border border-slate-850 flex items-center gap-2">
                    <span className="font-extrabold text-slate-350">{username}</span>
                    <span className="flex items-center gap-0.5">
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                      <span className="w-1 h-1 bg-slate-400 rounded-full animate-bounce" />
                    </span>
                  </div>
                </div>
              );
            })}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input panel bottom */}
          <form onSubmit={handleSend} className="p-4 bg-slate-900/95 border-t border-slate-800/80 flex gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={handleMessageChange}
              placeholder={`Message #${CHANNELS.find(c => c.id === activeChannel)?.name || activeChannel}...`}
              className="flex-1 bg-slate-950/70 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] text-slate-100 placeholder-slate-500 rounded-xl px-4 py-2.5 text-xs focus:outline-none transition-all h-[38px] focus:ring-1 focus:ring-[var(--gold-primary)]/15"
            />
            <button
              type="submit"
              disabled={!newMessage.trim()}
              className="btn-gold-grad px-5 h-[38px] rounded-xl transition-all shadow-md disabled:opacity-50 disabled:brightness-75 flex items-center justify-center shrink-0 cursor-pointer text-slate-950"
            >
              <Send className="w-4 h-4 text-slate-950 stroke-[3px]" />
            </button>
          </form>

        </div>

        {/* PANE 3: Team Directory Sidebar (Right Sidebar) */}
        <div className="w-[220px] bg-slate-950/40 border-l border-slate-800/80 flex flex-col p-4 overflow-y-auto shrink-0 select-none scrollbar-thin">
          
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-[9px] font-extrabold uppercase tracking-widest text-slate-500">Contributors</h3>
            <span className="text-[8px] bg-slate-900 border border-slate-800 text-slate-400 px-2 py-0.5 rounded-full font-extrabold tracking-wider">{filteredMembers.length}</span>
          </div>

          {/* Member Directory Search */}
          <div className="relative mb-4">
            <input
              type="text"
              value={memberSearchQuery}
              onChange={(e) => setMemberSearchQuery(e.target.value)}
              placeholder="Filter contributors..."
              className="w-full bg-slate-950/80 border border-slate-850 hover:border-slate-800 focus:border-[var(--gold-primary)] text-[9px] text-slate-200 placeholder-slate-600 rounded-lg pl-7 pr-2 py-1.5 focus:outline-none transition-all"
            />
            <Users className="w-3 h-3 text-slate-650 absolute left-2.5 top-2" />
          </div>
          
          <div className="space-y-3">
            {filteredMembers.map((member) => {
              const memberId = member.user?._id || member.user;
              const name = member.user?.name || 'Unknown Contributor';
              const role = member.role || 'Member';
              
              // Sockets connectivity state mapping
              const isOnline = memberId === user._id || activeUsers.some((u) => u.userId === memberId);
              
              // Initials avatar character
              const initial = name.charAt(0).toUpperCase();

              const ownerId = typeof projectOwner === 'object' ? projectOwner?._id : projectOwner;
              const isOwner = memberId === ownerId;

              return (
                <div key={memberId} className="flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    {/* Circle initials avatar */}
                    <div className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-[9px] font-extrabold text-[var(--gold-primary)] shrink-0 uppercase shadow">
                      {initial}
                    </div>

                    <div className="min-w-0">
                      <p className="font-bold text-slate-200 truncate flex items-center gap-1.5" title={name}>
                        <span className="truncate">{name}</span>
                        {isOwner && (
                          <span className="text-[var(--gold-primary)] shrink-0" title="Project Owner">
                            <Crown className="w-3 h-3 stroke-[2.5px]" />
                          </span>
                        )}
                      </p>
                      <p className="text-[8px] uppercase tracking-wide text-slate-500 font-bold mt-0.5">{isOwner ? 'Project Lead' : role}</p>
                    </div>
                  </div>

                  {/* Dynamic socket indicator dot */}
                  <div className="relative shrink-0">
                    <span className={`block w-2 h-2 rounded-full ${
                      isOnline 
                        ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_#10b981]' 
                        : 'bg-slate-750'
                    }`} />
                  </div>
                </div>
              );
            })}
          </div>

        </div>

      </div>

    </div>
  );
}
