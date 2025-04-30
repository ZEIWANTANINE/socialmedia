"use client";

import React, { useState, useEffect, useRef } from 'react';
import { FaBell } from 'react-icons/fa';
import Link from 'next/link';
import axiosInstance from '../utils/axiosInstance';
import { apiEndpoints } from '../utils/api';
import webSocketService from '../utils/webSocketService';

interface Notification {
  id: number;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

interface NotificationBellProps {
  userId: string;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsRetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications and set up WebSocket connection
  useEffect(() => {
    if (!userId || userId === "") return;

    const setupNotifications = async () => {
      try {
        await fetchNotifications();
        await fetchUnreadCount();
        setupWebSocket();
      } catch (error) {
        console.error('Error setting up notifications:', error);
      }
    };

    setupNotifications();

    // Clean up on unmount
    return () => {
      if (wsRetryIntervalRef.current) {
        clearInterval(wsRetryIntervalRef.current);
      }
      if (webSocketService.isConnected()) {
        webSocketService.disconnect();
      }
    };
  }, [userId]);

  const setupWebSocket = () => {
    // Get token from localStorage
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      console.error('No JWT token found, cannot connect to WebSocket');
      return;
    }

    try {
      // Connect to WebSocket
      webSocketService.connect(token);

      // Check WebSocket connection status
      const checkConnection = () => {
        const isConnected = webSocketService.isConnected();
        setWsConnected(isConnected);
        
        if (!isConnected && !wsRetryIntervalRef.current) {
          // Set up retry mechanism for WebSocket connection
          wsRetryIntervalRef.current = setInterval(() => {
            console.log('Attempting to reconnect WebSocket...');
            webSocketService.connect(token);
            if (webSocketService.isConnected()) {
              console.log('WebSocket reconnected successfully');
              clearInterval(wsRetryIntervalRef.current!);
              wsRetryIntervalRef.current = null;
            }
          }, 5000); // Try to reconnect every 5 seconds
        }
      };

      // Check connection initially and then periodically
      checkConnection();
      const connectionCheckInterval = setInterval(checkConnection, 10000);

      // Register handler for new notifications
      const unregister = webSocketService.registerNotificationHandler((newNotification: Notification) => {
        console.log('Received notification in component:', newNotification);
        setNotifications(prev => [newNotification, ...prev]);
        setUnreadCount(prevCount => prevCount + 1);
      });

      // Cleanup function
      return () => {
        clearInterval(connectionCheckInterval);
        unregister();
        webSocketService.disconnect();
        if (wsRetryIntervalRef.current) {
          clearInterval(wsRetryIntervalRef.current);
          wsRetryIntervalRef.current = null;
        }
      };
    } catch (error) {
      console.error('Error setting up WebSocket:', error);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.notifications}/me`);
      setNotifications(response.data);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.notifications}/me/count`);
      setUnreadCount(response.data);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axiosInstance.put(`${apiEndpoints.notifications}/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ));
      setUnreadCount(prevCount => Math.max(0, prevCount - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setShowDropdown(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        className="p-2 relative" 
        onClick={() => setShowDropdown(!showDropdown)}
        aria-label="Notifications"
      >
        <FaBell size={20} className={!wsConnected ? "text-gray-400" : ""} />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg z-20 max-h-96 overflow-y-auto">
          <div className="p-2 border-b flex justify-between items-center">
            <h3 className="font-bold">Notifications</h3>
            {!wsConnected && (
              <span className="text-xs text-yellow-600">Offline mode</span>
            )}
          </div>
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No notifications
            </div>
          ) : (
            <div>
              {notifications.map((notification) => (
                <Link 
                  key={notification.id}
                  href={notification.link || "#"}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <div className={`p-4 border-b hover:bg-gray-100 ${!notification.isRead ? 'bg-blue-50' : ''}`}>
                    <p className="font-medium">{notification.message}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(notification.createdAt).toLocaleString()}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
          <div className="p-2 border-t text-center">
            <Link href="/notifications" onClick={() => setShowDropdown(false)}>
              View all
            </Link>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 