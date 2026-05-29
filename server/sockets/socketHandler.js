const Chat = require('../models/Chat');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Join project room
    socket.on('join-project', ({ projectId, userId, username }) => {
      socket.join(projectId);
      socket.projectId = projectId;
      socket.userId = userId;
      socket.username = username;
      console.log(`User ${username} (${userId}) joined project room: ${projectId}`);
      
      // Notify other users in room
      socket.to(projectId).emit('user-joined', { userId, username });
    });

    // Leave project room
    socket.on('leave-project', ({ projectId, userId, username }) => {
      socket.leave(projectId);
      console.log(`User ${username} left project room: ${projectId}`);
      socket.to(projectId).emit('user-left', { userId, username });
    });

    // Chat messaging
    socket.on('send-message', async (data) => {
      const { projectId, senderId, senderName, message } = data;
      
      try {
        // Save chat to DB
        const newChat = await Chat.create({
          project: projectId,
          sender: senderId,
          message,
          readBy: [senderId]
        });

        // Format message payload for broadcasting
        const messagePayload = {
          _id: newChat._id,
          project: projectId,
          sender: {
            _id: senderId,
            name: senderName
          },
          message,
          readBy: [senderId],
          createdAt: newChat.createdAt
        };

        // Emit to all users in the project room
        io.to(projectId).emit('receive-message', messagePayload);
      } catch (err) {
        console.error('Socket send-message error:', err.message);
      }
    });

    // Typing indicators
    socket.on('typing', ({ projectId, username }) => {
      socket.to(projectId).emit('user-typing', { username, isTyping: true });
    });

    socket.on('stop-typing', ({ projectId, username }) => {
      socket.to(projectId).emit('user-typing', { username, isTyping: false });
    });

    // Read receipts
    socket.on('read-receipt', async ({ projectId, userId, messageId }) => {
      try {
        const chat = await Chat.findById(messageId);
        if (chat && !chat.readBy.map(id => id.toString()).includes(userId.toString())) {
          chat.readBy.push(userId);
          await chat.save();
          
          io.to(projectId).emit('message-read', { messageId, readByUserId: userId });
        }
      } catch (err) {
        console.error('Socket read-receipt error:', err.message);
      }
    });

    // Collaborative Whiteboard updates
    // Data contains latest list of canvas drawing paths/elements
    socket.on('whiteboard-draw', (data) => {
      const { projectId, elements } = data;
      // Broadcast drawings to all other users in project
      socket.to(projectId).emit('whiteboard-update', { elements });
    });

    socket.on('whiteboard-clear', ({ projectId }) => {
      socket.to(projectId).emit('whiteboard-cleared');
    });

    // Real-time Kanban board updates
    socket.on('task-move', (data) => {
      const { projectId, taskId, status, order } = data;
      // Broadcast task reordering/column movement to others
      socket.to(projectId).emit('task-moved', { taskId, status, order });
    });

    // Collaborative Note edits
    socket.on('note-edit', (data) => {
      const { projectId, noteId, content, title, editorName } = data;
      // Broadcast typing updates for notes
      socket.to(projectId).emit('note-updated', { noteId, content, title, editorName });
    });

    // Collaborative Code workspace edits
    socket.on('code-edit', (data) => {
      const { projectId, fileId, content, filename, language, editorName } = data;
      // Broadcast coding updates to other project members
      socket.to(projectId).emit('code-updated', { fileId, content, filename, language, editorName });
    });

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.projectId && socket.userId) {
        socket.to(socket.projectId).emit('user-left', {
          userId: socket.userId,
          username: socket.username
        });
      }
    });
  });
};
