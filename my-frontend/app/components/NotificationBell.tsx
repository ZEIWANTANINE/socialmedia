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
  requestId?: number;
  senderId?: number;
  senderUsername?: string;
  accepterId?: number;
  accepterUsername?: string;
  senderProfilePicture?: string;
  accepterProfilePicture?: string;
}

interface NotificationBellProps {
  userId: string;
  disableWebSocket?: boolean;
}

const NotificationBell: React.FC<NotificationBellProps> = ({ userId, disableWebSocket = false }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const [wsConnected, setWsConnected] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wsRetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Fetch notifications and set up WebSocket connection
  useEffect(() => {
    // Fetch ban đầu cho tất cả các trường hợp
    if (userId) {
      fetchNotifications();
    }

    // Chỉ kết nối WebSocket nếu không bị vô hiệu hóa
    if (userId && !disableWebSocket) {
      const token = localStorage.getItem('jwtToken');
      if (token) {
        console.log("Attempting to connect WebSocket...");
        webSocketService.connect(token);
        
        // Đăng ký để nhận thông báo
        const unsubscribe = webSocketService.registerNotificationHandler(handleNewNotification);
        
        // Đặt interval để kiểm tra lại kết nối
        const reconnectInterval = setInterval(() => {
          if (!webSocketService.isConnected()) {
            console.log("Attempting to reconnect WebSocket...");
            webSocketService.connect(token);
          }
        }, 30000); // Kiểm tra lại mỗi 30 giây
        
        return () => {
          unsubscribe();
          webSocketService.disconnect();
          clearInterval(reconnectInterval);
        };
      }
    }
  }, [userId, disableWebSocket]);

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

  // Thêm useEffect để kiểm tra và yêu cầu quyền thông báo
  useEffect(() => {
    // Kiểm tra xem browser có hỗ trợ thông báo không
    if ('Notification' in window) {
      // Kiểm tra trạng thái quyền thông báo
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        // Hiển thị UI yêu cầu quyền thông báo
        Notification.requestPermission()
          .then(permission => {
            console.log('Notification permission:', permission);
          })
          .catch(err => {
            console.error('Error requesting notification permission:', err);
          });
      }
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.notifications}/me`);
      setNotifications(response.data);
      
      // Calculate unread count
      const unread = response.data.filter((notification: Notification) => !notification.isRead).length;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
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

  const markAllAsRead = async () => {
    try {
      await axiosInstance.put(`${apiEndpoints.notifications}/me/read-all`);
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    setShowDropdown(false);
  };

  const handleNewNotification = (notification: any) => {
    console.log('Received notification in component:', notification);
    
    // Handle different notification types
    if (notification.type === "FRIEND_REQUEST") {
      const newNotif: Notification = {
        id: Date.now(), // Temporary ID for UI
        type: "FRIEND_REQUEST",
        message: notification.message || `${notification.senderUsername} đã gửi cho bạn một lời mời kết bạn`,
        link: `/friends`,
        isRead: false,
        createdAt: new Date().toISOString(),
        // Additional data for friend requests
        requestId: notification.id,
        senderId: notification.senderId,
        senderUsername: notification.senderUsername,
        senderProfilePicture: notification.senderProfilePicture
      };
      
      // Kiểm tra thông báo trùng lặp
      const isDuplicate = notifications.some(n => 
        n.type === "FRIEND_REQUEST" && 
        n.requestId === notification.id &&
        n.senderId === notification.senderId
      );
      
      if (!isDuplicate) {
        console.log("Thêm thông báo mới: Lời mời kết bạn từ", notification.senderUsername);
        setNotifications(prev => [newNotif, ...prev]);
        setUnreadCount(prevCount => prevCount + 1);
        
        // Hiển thị thông báo trên trình duyệt nếu được hỗ trợ
        if ("Notification" in window && Notification.permission === "granted") {
          try {
            new Notification("Lời mời kết bạn mới", {
              body: `${notification.senderUsername} đã gửi cho bạn một lời mời kết bạn`,
              icon: notification.senderProfilePicture || "/favicon.ico"
            });
          } catch (e) {
            console.error("Không thể hiển thị thông báo trình duyệt:", e);
          }
        }
      } else {
        console.log("Bỏ qua thông báo trùng lặp");
      }
    } 
    else if (notification.type === "FRIEND_REQUEST_ACCEPTED") {
      const newNotif: Notification = {
        id: Date.now(), // Temporary ID for UI
        type: "FRIEND_REQUEST_ACCEPTED",
        message: notification.message || `${notification.accepterUsername} đã chấp nhận lời mời kết bạn của bạn`,
        link: `/profile/${notification.accepterId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        // Additional data
        accepterId: notification.accepterId,
        accepterUsername: notification.accepterUsername,
        accepterProfilePicture: notification.accepterProfilePicture
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prevCount => prevCount + 1);
      
      // Hiển thị thông báo trên trình duyệt
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Lời mời kết bạn được chấp nhận", {
            body: `${notification.accepterUsername} đã chấp nhận lời mời kết bạn của bạn`,
            icon: notification.accepterProfilePicture || "/favicon.ico"
          });
        } catch (e) {
          console.error("Không thể hiển thị thông báo trình duyệt:", e);
        }
      }
    }
    else if (notification.type === "NEW_MESSAGE") {
      const newNotif: Notification = {
        id: Date.now(), // Temporary ID for UI
        type: "NEW_MESSAGE",
        message: `Tin nhắn mới từ ${notification.senderUsername}`,
        link: `/messages/${notification.senderId}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        // Additional data
        senderId: notification.senderId,
        senderUsername: notification.senderUsername,
        senderProfilePicture: notification.senderProfilePicture
      };
      
      setNotifications(prev => [newNotif, ...prev]);
      setUnreadCount(prevCount => prevCount + 1);
      
      // Hiển thị thông báo trên trình duyệt
      if ("Notification" in window && Notification.permission === "granted") {
        try {
          new Notification("Tin nhắn mới", {
            body: `Tin nhắn mới từ ${notification.senderUsername}`,
            icon: notification.senderProfilePicture || "/favicon.ico"
          });
        } catch (e) {
          console.error("Không thể hiển thị thông báo trình duyệt:", e);
        }
      }
    }
  };

  const handleAcceptFriendRequest = async (requestId: number | undefined) => {
    if (!requestId) return;
    
    try {
      await axiosInstance.put(`/api/friendrequests/${requestId}/accept`);
      
      // Update notifications list
      setNotifications(prev => prev.map(notif => 
        notif.type === "FRIEND_REQUEST" && notif.requestId === requestId
          ? { ...notif, type: "FRIEND_REQUEST_ACCEPTED", message: "Friend request accepted", isRead: true }
          : notif
      ));
      
      // Update unread count based on read status
      const updatedNotifications = notifications.map(notif => 
        notif.type === "FRIEND_REQUEST" && notif.requestId === requestId
          ? { ...notif, isRead: true }
          : notif
      );
      const newUnreadCount = updatedNotifications.filter(notif => !notif.isRead).length;
      setUnreadCount(newUnreadCount);
      
      // Close dropdown
      setShowDropdown(false);
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleRejectFriendRequest = async (requestId: number | undefined) => {
    if (!requestId) return;
    
    try {
      await axiosInstance.put(`/api/friendrequests/${requestId}/reject`);
      
      // Update notifications list
      setNotifications(prev => prev.map(notif => 
        notif.type === "FRIEND_REQUEST" && notif.requestId === requestId
          ? { ...notif, type: "FRIEND_REQUEST_REJECTED", message: "Friend request rejected", isRead: true }
          : notif
      ));
      
      // Update unread count based on read status
      const updatedNotifications = notifications.map(notif => 
        notif.type === "FRIEND_REQUEST" && notif.requestId === requestId
          ? { ...notif, isRead: true }
          : notif
      );
      const newUnreadCount = updatedNotifications.filter(notif => !notif.isRead).length;
      setUnreadCount(newUnreadCount);
      
      // Close dropdown
      setShowDropdown(false);
    } catch (error) {
      console.error('Error rejecting friend request:', error);
    }
  };

  // Hàm yêu cầu quyền thông báo thủ công
  const requestNotificationPermission = () => {
    if ('Notification' in window) {
      Notification.requestPermission()
        .then(permission => {
          if (permission === 'granted') {
            // Gửi thông báo thử nghiệm
            try {
              new Notification('Thông báo đã được bật', {
                body: 'Bạn sẽ nhận được thông báo khi có lời mời kết bạn mới hoặc tin nhắn',
                icon: '/favicon.ico'
              });
            } catch (e) {
              console.error('Không thể hiển thị thông báo thử nghiệm:', e);
            }
          }
        });
    }
  };

  // Hiển thị thông báo với UI cải tiến
  const renderNotificationItem = (notification: Notification) => {
    // Xử lý giới hạn độ dài tin nhắn
    const truncateMessage = (message: string, maxLength: number = 60) => {
      return message.length > maxLength ? message.substring(0, maxLength) + '...' : message;
    };

    // Định dạng thời gian
    const formatTime = (dateString: string) => {
      const date = new Date(dateString);
      const now = new Date();
      const diffInMs = now.getTime() - date.getTime();
      const diffInMin = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

      if (diffInMin < 1) return 'Vừa xong';
      if (diffInMin < 60) return `${diffInMin} phút trước`;
      if (diffInHours < 24) return `${diffInHours} giờ trước`;
      if (diffInDays < 7) return `${diffInDays} ngày trước`;
      return date.toLocaleDateString('vi-VN');
    };

    // Lấy avatar mặc định dựa trên tên người dùng
    const getDefaultAvatar = (username: string = '') => {
      if (!username) return null;
      return (
        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
          {username.charAt(0).toUpperCase()}
        </div>
      );
    };

    // UI khác nhau cho từng loại thông báo
    switch (notification.type) {
      case 'FRIEND_REQUEST':
        return (
          <div 
            className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-start ${!notification.isRead ? 'bg-blue-50' : ''}`}
          >
            <div className="flex-shrink-0 mr-3">
              {notification.senderProfilePicture ? (
                <img 
                  src={notification.senderProfilePicture} 
                  alt={notification.senderUsername || 'User'} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : getDefaultAvatar(notification.senderUsername)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-semibold">{notification.senderUsername}</span>
                <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700">{truncateMessage(notification.message)}</p>
              <div className="mt-2 flex space-x-2">
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAcceptFriendRequest(notification.requestId);
                  }}
                  className="bg-blue-500 text-white text-xs px-3 py-1 rounded hover:bg-blue-600"
                >
                  Chấp nhận
                </button>
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRejectFriendRequest(notification.requestId);
                  }}
                  className="bg-gray-300 text-gray-700 text-xs px-3 py-1 rounded hover:bg-gray-400"
                >
                  Từ chối
                </button>
              </div>
            </div>
          </div>
        );
      
      case 'FRIEND_REQUEST_ACCEPTED':
        return (
          <Link
            href={notification.link}
            onClick={() => handleNotificationClick(notification)}
            className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-start ${!notification.isRead ? 'bg-blue-50' : ''}`}
          >
            <div className="flex-shrink-0 mr-3">
              {notification.accepterProfilePicture ? (
                <img 
                  src={notification.accepterProfilePicture} 
                  alt={notification.accepterUsername || 'User'} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : getDefaultAvatar(notification.accepterUsername)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-semibold">{notification.accepterUsername}</span>
                <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700">{truncateMessage(notification.message)}</p>
              <div className="mt-2">
                <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                  Đã trở thành bạn bè
                </span>
              </div>
            </div>
          </Link>
        );
      
      case 'NEW_MESSAGE':
        return (
          <Link
            href={notification.link}
            onClick={() => handleNotificationClick(notification)}
            className={`p-3 border-b hover:bg-gray-50 cursor-pointer flex items-start ${!notification.isRead ? 'bg-blue-50' : ''}`}
          >
            <div className="flex-shrink-0 mr-3">
              {notification.senderProfilePicture ? (
                <img 
                  src={notification.senderProfilePicture} 
                  alt={notification.senderUsername || 'User'} 
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : getDefaultAvatar(notification.senderUsername)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between">
                <span className="font-semibold">{notification.senderUsername}</span>
                <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
              </div>
              <p className="text-sm text-gray-700">{truncateMessage(notification.message)}</p>
            </div>
          </Link>
        );
      
      default:
        return (
          <Link
            href={notification.link}
            onClick={() => handleNotificationClick(notification)}
            className={`p-3 border-b hover:bg-gray-50 cursor-pointer ${!notification.isRead ? 'bg-blue-50' : ''}`}
          >
            <div className="flex justify-between">
              <span className="font-semibold">{notification.type}</span>
              <span className="text-xs text-gray-500">{formatTime(notification.createdAt)}</span>
            </div>
            <p className="text-sm text-gray-700">{truncateMessage(notification.message)}</p>
          </Link>
        );
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setShowDropdown(!showDropdown)}
        className="text-gray-700 hover:text-blue-500 relative"
      >
        <FaBell className="text-xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {showDropdown && (
        <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-10">
          <div className="p-3 border-b flex justify-between items-center">
            <h3 className="font-semibold">Thông báo</h3>
            <div className="flex">
              {/* Nút bật thông báo */}
              {'Notification' in window && Notification.permission !== 'granted' && (
                <button 
                  onClick={requestNotificationPermission}
                  className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded mr-2"
                  title="Bật thông báo trên trình duyệt"
                >
                  Bật thông báo
                </button>
              )}
              <button
                onClick={markAllAsRead}
                className="text-blue-500 hover:text-blue-700 text-sm"
              >
                Đánh dấu đã đọc
              </button>
            </div>
          </div>
          
          <div className="overflow-y-auto max-h-80">
            {notifications.length > 0 ? (
              notifications.map(notification => (
                <React.Fragment key={notification.id}>
                  {renderNotificationItem(notification)}
                </React.Fragment>
              ))
            ) : (
              <div className="p-4 text-center text-gray-500">
                Không có thông báo nào
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell; 