import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [connected, setConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    // Only connect if user is authenticated
    if (!user) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    // Step 9: connect to Render backend in production; Vite proxy in local dev when VITE_API_URL is unset
    const socketInstance = io(import.meta.env.VITE_API_URL || window.location.origin, {
      transports: ['websocket', 'polling'],
      autoConnect: true
    });

    socketInstance.on('connect', () => {
      console.log('Real-time connection active:', socketInstance.id);
      setConnected(true);
    });

    socketInstance.on('disconnect', () => {
      console.log('Real-time connection dropped');
      setConnected(false);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, [user]);

  // Helper to join a specific project channel
  const joinProject = (projectId) => {
    if (socket && user) {
      socket.emit('join-project', {
        projectId,
        userId: user._id,
        username: user.name
      });
    }
  };

  // Helper to leave project channel
  const leaveProject = (projectId) => {
    if (socket && user) {
      socket.emit('leave-project', {
        projectId,
        userId: user._id,
        username: user.name
      });
    }
  };

  const value = {
    socket,
    connected,
    joinProject,
    leaveProject
  };

  return (
    <SocketContext.Provider value={value}>{children}</SocketContext.Provider>
  );
};
