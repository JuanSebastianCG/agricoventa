import React, { createContext, useContext, useState, useEffect, ReactNode, useRef, useCallback } from 'react';
import notificationService, { Notification } from '../services/notificationService';
import { useAppContext } from './AppContext';
import playNotificationSound, { initAudioContext } from '../utils/notificationSound';

interface NotificationContextState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: (page?: number, limit?: number) => Promise<void>;
  markAsRead: (notificationId: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
}

const NotificationContext = createContext<NotificationContextState | undefined>(undefined);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

// Use a longer polling interval to reduce backend load
const UNREAD_COUNT_POLL_INTERVAL = 60000; // Check unread count every 60 seconds
const FULL_REFRESH_INTERVAL = 180000; // Full refresh every 3 minutes

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const { isAuthenticated } = useAppContext();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const previousUnreadCount = useRef<number>(0);
  const lastFetchTime = useRef<number>(0);
  const isPolling = useRef<boolean>(false);
  
  // Initialize audio context on user interaction to enable sound
  useEffect(() => {
    const initAudio = () => {
      initAudioContext();
      window.removeEventListener('click', initAudio);
    };
    
    window.addEventListener('click', initAudio);
    return () => {
      window.removeEventListener('click', initAudio);
    };
  }, []);

  // Debounced fetch function to avoid multiple calls
  const debouncedFetch = useCallback(async (page = 1, limit = 10) => {
    const now = Date.now();
    if (now - lastFetchTime.current < 2000) {
      // If it's been less than 2 seconds since last fetch, skip this fetch
      return;
    }
    
    lastFetchTime.current = now;
    if (!isAuthenticated) return;
    
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getUserNotifications(page, limit);
      setNotifications(data.notifications);
      setUnreadCount(data.notifications.filter(n => !n.isRead).length);
      previousUnreadCount.current = data.notifications.filter(n => !n.isRead).length;
    } catch (err) {
      setError('Error fetching notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Optimized fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    if (!isAuthenticated || isPolling.current) return;
    
    isPolling.current = true;
    try {
      const count = await notificationService.getUnreadCount();
      
      // Only if count increased, we need to refresh notifications list
      if (count > unreadCount) {
        await debouncedFetch();
      } else {
        setUnreadCount(count);
      }
    } catch (err) {
      console.error('Error fetching unread count:', err);
    } finally {
      isPolling.current = false;
    }
  }, [isAuthenticated, unreadCount, debouncedFetch]);

  // Fetch notifications when user is authenticated
  useEffect(() => {
    if (isAuthenticated) {
      // Initial fetch
      debouncedFetch();
      
      // Set up polling at reasonable intervals
      const countIntervalId = setInterval(fetchUnreadCount, UNREAD_COUNT_POLL_INTERVAL);
      const fullRefreshIntervalId = setInterval(() => debouncedFetch(), FULL_REFRESH_INTERVAL);
      
      return () => {
        clearInterval(countIntervalId);
        clearInterval(fullRefreshIntervalId);
      };
    }
  }, [isAuthenticated, debouncedFetch, fetchUnreadCount]);
  
  // Play sound when new notifications arrive
  useEffect(() => {
    if (unreadCount > previousUnreadCount.current) {
      try {
        playNotificationSound();
      } catch (error) {
        console.error('Failed to play notification sound:', error);
      }
    }
    previousUnreadCount.current = unreadCount;
  }, [unreadCount]);

  // Public fetch function that uses debouncing
  const fetchNotifications = useCallback(async (page = 1, limit = 10) => {
    await debouncedFetch(page, limit);
  }, [debouncedFetch]);

  const markAsRead = async (notificationId: string) => {
    try {
      await notificationService.markAsRead(notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true } 
            : notification
        )
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
      previousUnreadCount.current = Math.max(0, previousUnreadCount.current - 1);
    } catch (err) {
      setError('Error marking notification as read');
      console.error('Error marking notification as read:', err);
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => ({ ...notification, isRead: true }))
      );
      setUnreadCount(0);
      previousUnreadCount.current = 0;
    } catch (err) {
      setError('Error marking all notifications as read');
      console.error('Error marking all notifications as read:', err);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      await notificationService.deleteNotification(notificationId);
      const deletedNotification = notifications.find(n => n.id === notificationId);
      setNotifications(prevNotifications => 
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
      
      // Update unread count if the notification was unread
      if (deletedNotification && !deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
        previousUnreadCount.current = Math.max(0, previousUnreadCount.current - 1);
      }
    } catch (err) {
      setError('Error deleting notification');
      console.error('Error deleting notification:', err);
    }
  };

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}; 