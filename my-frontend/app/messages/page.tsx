"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Layout from "../components/Layout";
import axiosInstance from "../utils/axiosInstance";
import Link from "next/link";
import webSocketService from "../utils/webSocketService";

interface Conversation {
  userId: number;
  username: string;
  profilePicture?: string;
  lastMessage?: {
    id: number;
    content: string;
    createdAt: string;
    isRead: boolean;
    isFromCurrentUser: boolean;
  };
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [userId, setUserId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("jwtToken");
    
    if (!storedUserId || !token) {
      router.push("/");
      return;
    }
    
    setUserId(storedUserId);
    
    // Connect to WebSocket
    webSocketService.connect(token);
    
    // Register notification handler for new messages
    const unregister = webSocketService.registerNotificationHandler((notification) => {
      if (notification.type === "NEW_MESSAGE") {
        // Refresh conversations when receiving a new message
        loadConversations();
      } else if (notification.type === "FRIEND_REQUEST_ACCEPTED") {
        // Refresh conversations when a friend request is accepted
        loadConversations();
      }
    });
    
    // Load initial data
    loadConversations();
    
    return () => {
      unregister(); // Unregister notification handler when component unmounts
    };
  }, [router]);

  const loadConversations = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axiosInstance.get("/api/messages/conversations");
      setConversations(response.data);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setError("Failed to load conversations. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return "";
    
    const date = new Date(dateStr);
    const now = new Date();
    
    // If same day, show time
    if (date.toDateString() === now.toDateString()) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    
    // If within last week, show day name
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    if (date > oneWeekAgo) {
      return date.toLocaleDateString([], { weekday: 'short' });
    }
    
    // Otherwise show date
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <Layout userId={userId || ""} disableWebSocket={false}>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Messages</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-8">Loading conversations...</div>
        ) : conversations.length === 0 ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-4">No conversations yet</h2>
            <p className="mb-4">You don't have any conversations yet. Add friends to start chatting!</p>
            <Link href="/friends">
              <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                Find Friends
              </button>
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded shadow">
            <ul className="divide-y">
              {conversations.map((conversation) => (
                <li key={conversation.userId}>
                  <Link href={`/messages/${conversation.userId}`}>
                    <div className="flex items-center p-4 hover:bg-gray-50 transition-colors relative">
                      {/* Avatar */}
                      <div className="relative">
                        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                          {conversation.profilePicture ? (
                            <img 
                              src={conversation.profilePicture} 
                              alt={conversation.username} 
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <span className="text-xl font-semibold">{conversation.username.charAt(0).toUpperCase()}</span>
                          )}
                        </div>
                        
                        {/* Unread indicator */}
                        {conversation.unreadCount > 0 && (
                          <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
                            {conversation.unreadCount}
                          </div>
                        )}
                      </div>
                      
                      {/* Content */}
                      <div className="flex-grow min-w-0">
                        <div className="flex justify-between items-baseline">
                          <h3 className="font-semibold truncate">{conversation.username}</h3>
                          {conversation.lastMessage && (
                            <span className="text-xs text-gray-500 ml-2">
                              {formatTime(conversation.lastMessage.createdAt)}
                            </span>
                          )}
                        </div>
                        <p className="text-gray-600 truncate text-sm">
                          {conversation.lastMessage ? (
                            <>
                              {conversation.lastMessage.isFromCurrentUser && "You: "}
                              {conversation.lastMessage.content}
                            </>
                          ) : (
                            <span className="text-gray-400 italic">No messages yet</span>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Layout>
  );
} 