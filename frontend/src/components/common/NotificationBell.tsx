import React, { useState, useEffect, useRef } from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useAppContext } from '../../context/AppContext';
import { Link } from 'react-router-dom';

interface NotificationBellProps {
  className?: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ className = '' }) => {
  const { isAuthenticated } = useAppContext();
  const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [bellAnimated, setBellAnimated] = useState(false);

  // Initial fetch notifications only once when component mounts
  useEffect(() => {
    if (isAuthenticated) {
      // Only fetch when the component mounts, further updates come from context
      fetchNotifications();
    }
  }, [isAuthenticated]);

  // Animate bell when unread count changes
  useEffect(() => {
    if (unreadCount > 0) {
      setBellAnimated(true);
      const timer = setTimeout(() => setBellAnimated(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [unreadCount]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleDropdown = () => {
    // Only fetch notifications when opening the dropdown if it's been closed
    if (!isOpen) {
      fetchNotifications();
    }
    setIsOpen(!isOpen);
  };

  const handleMarkAllAsRead = (e: React.MouseEvent) => {
    e.stopPropagation();
    markAllAsRead();
  };

  const handleNotificationClick = (id: string, type: string, entityId?: string | null) => {
    markAsRead(id);
    setIsOpen(false);
    
    // Handle navigation based on notification type
    // This can be expanded as needed for different notification types
  };

  // Format notification date to relative time (e.g., "2 hours ago")
  const formatNotificationDate = (dateString: string) => {
    return formatDistanceToNow(new Date(dateString), { addSuffix: true, locale: es });
  };

  // Get link destination based on notification type
  const getNotificationLink = (type: string, entityId: string | null) => {
    if (!entityId) return '#';
    
    switch (type) {
      case 'CERTIFICATION_STATUS':
        return '/certificados';
      case 'PRODUCT_CREATED':
      case 'PRODUCT_REVIEW':
      case 'LOW_STOCK':
        return `/product/${entityId}`;
      case 'ORDER_STATUS':
      case 'ORDER_PLACED':
      case 'PAYMENT_RECEIVED':
      case 'NEW_ORDER':
        return `/pedido/${entityId}`;
      case 'NEW_CERTIFICATION':
        return '/admin/certificaciones';
      default:
        return '#';
    }
  };

  // Obtener texto en español para el tipo de notificación
  const getNotificationTypeLabel = (type: string): string => {
    switch (type) {
      case 'CERTIFICATION_STATUS': return 'Estado de certificación';
      case 'PRODUCT_CREATED': return 'Producto creado';
      case 'PRODUCT_REVIEW': return 'Nueva reseña';
      case 'LOW_STOCK': return 'Stock bajo';
      case 'ORDER_STATUS': return 'Estado de pedido';
      case 'ORDER_PLACED': return 'Pedido realizado';
      case 'PAYMENT_RECEIVED': return 'Pago recibido';
      case 'NEW_ORDER': return 'Nuevo pedido';
      case 'NEW_CERTIFICATION': return 'Nueva certificación';
      default: return 'Notificación';
    }
  };

  // No mostrar si el usuario no está autenticado
  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Notification Bell Icon */}
      <button
        className={`relative p-2 rounded-full hover:bg-gray-100 transition-colors focus:outline-none ${bellAnimated ? 'animate-bell' : ''}`}
        onClick={toggleDropdown}
        aria-label="Notificaciones"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-6 w-6 ${unreadCount > 0 ? 'text-green-1' : 'text-gray-700'} ${bellAnimated ? 'animate-wiggle' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        
        {/* Badge for unread count */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 h-5 w-5 text-xs bg-red-500 text-white rounded-full flex items-center justify-center font-bold animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown with notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl overflow-hidden z-50 max-h-[70vh] overflow-y-auto border border-gray-200">
          <div className="py-3 px-4 bg-green-1 text-white flex justify-between items-center">
            <span className="font-medium text-lg">Notificaciones</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="text-xs text-white hover:text-gray-200 bg-green-0-8 py-1 px-2 rounded-md hover:bg-green-0-9 transition-colors"
              >
                Marcar todas como leídas
              </button>
            )}
          </div>
          <div className="divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="font-medium">No tienes notificaciones</p>
                <p className="text-sm text-gray-400 mt-1">Las notificaciones aparecerán aquí</p>
              </div>
            ) : (
              notifications.map((notification) => {
                const notificationLink = getNotificationLink(notification.type, notification.relatedEntityId);
                
                return (
                  <Link
                    key={notification.id}
                    to={notificationLink}
                    className={`block px-4 py-3.5 hover:bg-gray-50 transition duration-150 ease-in-out ${
                      !notification.isRead ? 'bg-blue-50 hover:bg-blue-50/80' : ''
                    }`}
                    onClick={() => handleNotificationClick(notification.id, notification.type, notification.relatedEntityId)}
                  >
                    <div className="flex items-start">
                      <div className="flex-shrink-0 mr-3">
                        {/* Icon based on notification type with improved styling */}
                        {notification.type === 'PRODUCT_CREATED' && (
                          <span className="bg-green-1 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'ORDER_STATUS' && (
                          <span className="bg-blue-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'CERTIFICATION_STATUS' && (
                          <span className="bg-purple-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'PRODUCT_REVIEW' && (
                          <span className="bg-yellow-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'PAYMENT_RECEIVED' && (
                          <span className="bg-green-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'LOW_STOCK' && (
                          <span className="bg-orange-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'ORDER_PLACED' && (
                          <span className="bg-indigo-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'NEW_ORDER' && (
                          <span className="bg-pink-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                            </svg>
                          </span>
                        )}
                        {notification.type === 'NEW_CERTIFICATION' && (
                          <span className="bg-teal-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                            </svg>
                          </span>
                        )}
                        {!['PRODUCT_CREATED', 'ORDER_STATUS', 'CERTIFICATION_STATUS', 'PRODUCT_REVIEW', 'PAYMENT_RECEIVED', 'LOW_STOCK', 'ORDER_PLACED', 'NEW_ORDER', 'NEW_CERTIFICATION'].includes(notification.type) && (
                          <span className="bg-gray-500 p-2.5 rounded-full text-white inline-flex items-center justify-center shadow-sm">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900 mb-0.5">
                          {notification.title || getNotificationTypeLabel(notification.type)}
                        </p>
                        <p className="text-sm text-gray-600 mb-1">
                          {notification.message}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatNotificationDate(notification.createdAt)}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="flex-shrink-0 ml-2">
                          <span className="inline-block w-3 h-3 bg-blue-500 rounded-full"></span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 