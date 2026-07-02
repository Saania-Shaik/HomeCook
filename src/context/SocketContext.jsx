import React, { createContext, useState, useEffect, useContext } from 'react';
import { io } from 'socket.io-client';
import axios from 'axios';
import { AuthContext } from './AuthContext';

export const SocketContext = createContext();

const SOCKET_URL = 'http://localhost:5000';

export const SocketProvider = ({ children }) => {
  const { user, API_BASE_URL } = useContext(AuthContext);
  const [socket, setSocket] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch initial notifications
  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/notifications`);
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.read).length);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  useEffect(() => {
    if (user) {
      // Connect to socket.io
      const newSocket = io(SOCKET_URL);
      setSocket(newSocket);

      // Register user ID
      newSocket.emit('register', user._id);

      fetchNotifications();

      // Listen for incoming notifications
      newSocket.on('notification', (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);

        // Display global alert if possible (can be handled by custom toast/popups)
        const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
        audio.volume = 0.4;
        audio.play().catch(() => {}); // catch autoplay blocks
      });

      return () => {
        newSocket.disconnect();
      };
    } else {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setNotifications([]);
      setUnreadCount(0);
    }
  }, [user]);

  const markRead = async (id) => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification read:', error);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_BASE_URL}/notifications/read-all`);
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications read:', error);
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        notifications,
        unreadCount,
        markRead,
        markAllRead,
        fetchNotifications,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};
