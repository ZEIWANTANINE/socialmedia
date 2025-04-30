"use client";

import React, { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import axiosInstance from '../utils/axiosInstance';
import { apiEndpoints } from '../utils/api';
import Link from 'next/link';

interface Notification {
  id: number;
  type: string;
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

const NotificationsPage: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchNotifications();
    } else {
      console.error("User ID not found. Redirecting to login...");
      window.location.href = "/login";
    }
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get(`${apiEndpoints.notifications}/me`);
      setNotifications(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      await axiosInstance.put(`${apiEndpoints.notifications}/${notificationId}/read`);
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, isRead: true } : notif
      ));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      // Đánh dấu tất cả thông báo chưa đọc là đã đọc
      const unreadNotifications = notifications.filter(notif => !notif.isRead);
      await Promise.all(unreadNotifications.map(notif => 
        axiosInstance.put(`${apiEndpoints.notifications}/${notif.id}/read`)
      ));
      
      // Cập nhật state
      setNotifications(notifications.map(notif => ({ ...notif, isRead: true })));
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  return (
    <Layout userId={userId || ""}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Thông báo</h1>
          {notifications.some(notif => !notif.isRead) && (
            <button
              onClick={markAllAsRead}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Đánh dấu tất cả đã đọc
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center p-4">Đang tải thông báo...</div>
        ) : notifications.length === 0 ? (
          <div className="text-center p-8 bg-gray-100 rounded-lg">
            <p className="text-gray-500">Bạn không có thông báo nào</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map(notification => (
              <Link 
                key={notification.id} 
                href={notification.link}
                onClick={() => !notification.isRead && markAsRead(notification.id)}
              >
                <div 
                  className={`p-4 border rounded-lg hover:bg-gray-50 transition ${
                    !notification.isRead ? 'bg-blue-50 border-blue-200' : 'bg-white'
                  }`}
                >
                  <div className="flex justify-between">
                    <p className={`${!notification.isRead ? 'font-medium' : ''}`}>
                      {notification.message}
                    </p>
                    {!notification.isRead && (
                      <span className="h-2 w-2 bg-blue-500 rounded-full"></span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {new Date(notification.createdAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default NotificationsPage;

 