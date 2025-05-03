"use client";

import React, { useState, useEffect } from "react";
import { FaHome, FaEnvelope, FaUser, FaUsers, FaSignOutAlt, FaBell, FaCog } from "react-icons/fa";
import Link from "next/link";
import NotificationBell from './NotificationBell';
import axiosInstance from '../utils/axiosInstance';

interface LayoutProps {
  userId: string;
  children: React.ReactNode;
  disableWebSocket?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ userId, children, disableWebSocket = false }) => {
  const [unreadMessageCount, setUnreadMessageCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMessagesDropdown, setShowMessagesDropdown] = useState(false);
  const [conversations, setConversations] = useState<any[]>([]);

  useEffect(() => {
    if (userId) {
      // Validate token là hợp lệ
      const validateToken = async () => {
        try {
          await axiosInstance.get('/auth/check-auth');
          console.log('Token is valid');
          fetchUnreadMessageCount();
          fetchConversations();
        } catch (error) {
          console.error('Token validation failed:', error);
          // Token không hợp lệ, chuyển về trang login
          localStorage.removeItem('jwtToken');
          localStorage.removeItem('userId');
          localStorage.removeItem('username');
          window.location.href = '/';
        }
      };
      
      validateToken();
      
      // Định kỳ cập nhật số tin nhắn chưa đọc
      const interval = setInterval(() => {
        fetchUnreadMessageCount();
        fetchConversations();
      }, 30000);
      
      return () => clearInterval(interval);
    }
  }, [userId]);
  
  const fetchUnreadMessageCount = async () => {
    try {
      const response = await axiosInstance.get('/api/messages/unread-count');
      setUnreadMessageCount(response.data.count);
    } catch (error) {
      console.error('Error fetching unread message count:', error);
    }
  };

  const fetchConversations = async () => {
    try {
      const response = await axiosInstance.get('/api/messages/conversations');
      // Lấy 5 cuộc trò chuyện gần nhất
      setConversations(response.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching conversations:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('jwtToken');
    localStorage.removeItem('userId');
    localStorage.removeItem('username');
    window.location.href = '/';
  };

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="bg-gray-800 text-white w-64 flex-shrink-0 hidden md:block">
        <div className="p-4">
          <h1 className="text-2xl font-bold mb-8">Social Media</h1>
          <nav className="space-y-4">
            <Link href="/home" className="flex items-center space-x-3 p-3 rounded hover:bg-gray-700 transition">
              <FaHome className="text-xl" />
              <span className="font-medium">Trang chủ</span>
            </Link>
            <Link href="/messages" className="flex items-center space-x-3 p-3 rounded hover:bg-gray-700 transition">
              <FaEnvelope className="text-xl" />
              <span className="font-medium">Tin nhắn</span>
              {unreadMessageCount > 0 && (
                <span className="bg-red-500 text-white rounded-full text-xs px-2 py-1 ml-auto">
                  {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                </span>
              )}
            </Link>
            <Link href="/friends" className="flex items-center space-x-3 p-3 rounded hover:bg-gray-700 transition">
              <FaUsers className="text-xl" />
              <span className="font-medium">Bạn bè</span>
            </Link>
            <Link href={`/profile/${userId}`} className="flex items-center space-x-3 p-3 rounded hover:bg-gray-700 transition">
              <FaUser className="text-xl" />
              <span className="font-medium">Trang cá nhân</span>
            </Link>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="container mx-auto flex items-center justify-between h-14 px-4">
            {/* Left: Logo */}
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Social Media</h1>
            </div>

            {/* Right: Icons */}
            <div className="flex items-center space-x-4">
              {/* Messages Icon */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMessagesDropdown(!showMessagesDropdown);
                    setShowProfileDropdown(false);
                  }}
                  className="p-2 text-gray-700 hover:text-blue-500 relative"
                >
                  <FaEnvelope className="text-xl" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                      {unreadMessageCount > 9 ? '9+' : unreadMessageCount}
                    </span>
                  )}
                </button>

                {/* Messages Dropdown Menu */}
                {showMessagesDropdown && (
                  <div className="absolute right-0 mt-2 w-80 bg-white border rounded-md shadow-lg z-10">
                    <div className="p-3 border-b">
                      <h3 className="font-semibold">Tin nhắn</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {conversations.length > 0 ? (
                        conversations.map((conv) => (
                          <Link 
                            key={conv.userId} 
                            href={`/messages/${conv.userId}`}
                            className="flex items-center p-3 hover:bg-gray-50 border-b"
                            onClick={() => setShowMessagesDropdown(false)}
                          >
                            <div className="w-10 h-10 bg-gray-300 rounded-full mr-3 flex items-center justify-center overflow-hidden">
                              {conv.profilePicture ? (
                                <img src={conv.profilePicture} alt={conv.username} className="w-full h-full object-cover" />
                              ) : (
                                <span className="text-lg font-semibold">{conv.username.charAt(0).toUpperCase()}</span>
                              )}
                            </div>
                            <div className="flex-1">
                              <p className="font-medium">{conv.username}</p>
                              {conv.lastMessage && (
                                <p className="text-sm text-gray-500 truncate">
                                  {conv.lastMessage.content.length > 30 
                                    ? conv.lastMessage.content.substring(0, 30) + '...' 
                                    : conv.lastMessage.content}
                                </p>
                              )}
                            </div>
                            {conv.unreadCount > 0 && (
                              <span className="bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs">
                                {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                              </span>
                            )}
                          </Link>
                        ))
                      ) : (
                        <div className="p-4 text-center text-gray-500">
                          Không có tin nhắn nào
                        </div>
                      )}
                    </div>
                    <div className="p-3 border-t text-center">
                      <Link 
                        href="/messages" 
                        className="text-blue-500 hover:underline text-sm"
                        onClick={() => setShowMessagesDropdown(false)}
                      >
                        Xem tất cả tin nhắn
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Notification Bell */}
              <div className="p-2">
                <NotificationBell userId={userId} disableWebSocket={disableWebSocket} />
              </div>

              {/* Profile Icon */}
              <div className="relative">
                <button
                  onClick={() => {
                    setShowProfileDropdown(!showProfileDropdown);
                    setShowMessagesDropdown(false);
                  }}
                  className="p-2 flex items-center focus:outline-none"
                >
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center">
                    <FaUser className="text-gray-600" />
                  </div>
                </button>

                {/* Profile Dropdown Menu */}
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white border rounded-md shadow-lg z-10">
                    <Link 
                      href={`/profile/${userId}`}
                      className="block px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center space-x-2"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <FaUser className="text-gray-600" />
                      <span>Trang cá nhân</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 flex items-center space-x-2"
                    >
                      <FaSignOutAlt className="text-gray-600" />
                      <span>Đăng xuất</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-grow overflow-auto bg-gray-100 p-4">
          {children}
      </main>

      {/* Footer */}
        <footer className="bg-white border-t border-gray-200 p-2 text-center text-gray-500 text-xs">
        &copy; {new Date().getFullYear()} Social Media App
      </footer>
      </div>
    </div>
  );
};

export default Layout;