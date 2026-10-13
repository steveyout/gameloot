import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [activeToast, setActiveToast] = useState(null);

  useEffect(() => {
    // Connect to same origin (single port)
    const socketClient = io(window.location.origin, {
      transports: ['websocket', 'polling']
    });

    socketClient.on('connect', () => {
      console.log('⚡ [Socket.IO] Connected to GameLoot Live Engine:', socketClient.id);
      socketClient.emit('join_admin');
    });

    socketClient.on('new_notification', (notif) => {
      console.log('🔔 [Instant Notification Received]:', notif);
      setNotifications((prev) => [notif, ...prev.slice(0, 49)]);
      setUnreadCount((prev) => prev + 1);

      // Trigger pop-up toast
      setActiveToast(notif);
      setTimeout(() => {
        setActiveToast((current) => (current?.id === notif.id ? null : current));
      }, 5000);
    });

    setSocket(socketClient);

    return () => {
      socketClient.disconnect();
    };
  }, []);

  const markAllRead = () => {
    setUnreadCount(0);
  };

  const clearNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
  };

  return (
    <SocketContext.Provider value={{ socket, notifications, unreadCount, markAllRead, clearNotifications, activeToast, setActiveToast }}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
