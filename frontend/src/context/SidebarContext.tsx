import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '@/context/authContext'; // Adjust import path as needed

interface SidebarContextType {
  unreadCount: number;
  setUnreadCount: React.Dispatch<React.SetStateAction<number>>;
  markMessageAsRead: (messageId: string, userId: string) => Promise<void>;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};

export const SidebarProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth(); // Get user from auth context
  const [unreadCount, setUnreadCount] = useState(0);

  // Initialize Socket.IO
  useEffect(() => {
    const socket = io('http://localhost:5000'); // Replace with your Socket.IO server URL

    socket.on('message-read', () => {
      fetchUnreadCount();
    });

    socket.on('receive-message', () => {
      fetchUnreadCount();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  // Fetch unread message count for the current user
  const fetchUnreadCount = async () => {
  try {
    const response = await fetch('/api/messages/unread', {
      headers: {
        Authorization: `Bearer ${localStorage.getItem('token')}`, // Vérifie que le token est valide
        'Content-Type': 'application/json',
      },
    });
    const data = await response.json();
    if (data.success) {
      setUnreadCount(data.unreadCount || 0);
    }
  } catch (error) {
    console.error('Erreur lors de la récupération des messages non lus:', error);
  }
};

  // Initialize unreadCount on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [user?.id]); // Re-fetch if user changes

  // Mark a message as read
  const markMessageAsRead = async (messageId: string, userId: string) => {
    try {
      const response = await fetch(`/api/messages/${messageId}/read`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ userId }),
      });
      if (response.ok) {
        setUnreadCount((prev) => (prev > 0 ? prev - 1 : 0));
      } else {
        console.error('Erreur lors de la mise à jour du message');
      }
    } catch (error) {
      console.error('Erreur lors de la mise à jour du message:', error);
    }
  };

  return (
    <SidebarContext.Provider value={{ unreadCount, setUnreadCount, markMessageAsRead }}>
      {children}
    </SidebarContext.Provider>
  );
};