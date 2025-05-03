"use client";

import React, { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import Layout from "../../components/Layout";
import axiosInstance from "../../utils/axiosInstance";
import webSocketService from "../../utils/webSocketService";
import Link from "next/link";

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  isFromCurrentUser: boolean;
}

interface User {
  id: number;
  username: string;
  profilePicture?: string;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.userId as string;
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFriend, setIsFriend] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    const token = localStorage.getItem("jwtToken");

    if (!storedUserId || !token) {
      router.push("/");
      return;
    }

    setCurrentUserId(storedUserId);

    // Connect to WebSocket
    webSocketService.connect(token);

    // Register notification handler for new messages
    const unregister = webSocketService.registerNotificationHandler((notification) => {
      if (notification.type === "NEW_MESSAGE" && notification.senderId.toString() === userId) {
        // Add the new message to the messages list
        const newMsg = {
          id: notification.message.id,
          content: notification.message.content,
          createdAt: notification.message.createdAt,
          isRead: false,
          isFromCurrentUser: false
        };
        
        setMessages(prev => [...prev, newMsg]);
        
        // Mark message as read
        markMessageAsRead(userId);
      }
    });

    // Load chat data
    loadChatData();

    return () => {
      unregister(); // Unregister notification handler when component unmounts
    };
  }, [userId, router]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadChatData = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await axiosInstance.get(`/api/messages/chat/${userId}`);
      
      setMessages(response.data.messages || []);
      setUser(response.data.user || null);
      setIsFriend(true);
    } catch (error: any) {
      console.error("Error loading chat:", error);
      if (error.response?.status === 400 && error.response?.data?.includes("not friends")) {
        setIsFriend(false);
      } else {
        setError("Error loading chat. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const markMessageAsRead = async (senderId: string) => {
    try {
      await axiosInstance.put(`/api/messages/read/${senderId}`);
    } catch (error) {
      console.error("Error marking messages as read:", error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isFriend) return;

    try {
      const response = await axiosInstance.post(`/api/messages/send/${userId}`, {
        content: newMessage
      });

      // Add new message to list
      setMessages(prevMessages => [...prevMessages, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      setError("Failed to send message. Please try again.");
    }
  };

  const handleSendFriendRequest = async () => {
    try {
      await axiosInstance.post(`/api/friendrequests/${userId}`);
      alert("Friend request sent!");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      if (error.response?.data === "Friend request already sent") {
        alert("You've already sent a friend request to this user.");
      } else if (error.response?.data === "Already friends") {
        alert("You are already friends with this user.");
        setIsFriend(true);
        loadChatData();
      } else {
        setError("Failed to send friend request. Please try again.");
      }
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Layout userId={currentUserId || ""} disableWebSocket={false}>
      <div className="max-w-4xl mx-auto p-4">
        {loading ? (
          <div className="text-center py-8">Loading...</div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        ) : !isFriend ? (
          <div className="bg-white p-6 rounded shadow text-center">
            <h2 className="text-xl font-semibold mb-4">You are not friends with this user</h2>
            <p className="mb-4">Send a friend request to start chatting</p>
            <button
              onClick={handleSendFriendRequest}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
              Send Friend Request
            </button>
          </div>
        ) : (
          <div className="bg-white rounded shadow overflow-hidden">
            {/* Chat header */}
            <div className="bg-blue-500 text-white p-4 flex items-center">
              <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center mr-3 text-blue-500">
                {user?.profilePicture ? (
                  <img src={user.profilePicture} alt={user.username} className="w-10 h-10 rounded-full" />
                ) : (
                  <span>{user?.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
              <div className="font-semibold">{user?.username}</div>
            </div>

            {/* Messages */}
            <div className="h-96 overflow-y-auto p-4 bg-gray-50">
              {messages.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No messages yet. Send a message to start the conversation!
                </div>
              ) : (
                messages.map(message => (
                  <div
                    key={message.id}
                    className={`mb-4 max-w-xs ${
                      message.isFromCurrentUser
                        ? "ml-auto bg-blue-500 text-white rounded-tl-lg rounded-tr-lg rounded-bl-lg"
                        : "mr-auto bg-gray-200 text-gray-800 rounded-tr-lg rounded-tl-lg rounded-br-lg"
                    } p-3`}
                  >
                    <div>{message.content}</div>
                    <div className={`text-xs mt-1 ${message.isFromCurrentUser ? "text-blue-100" : "text-gray-500"}`}>
                      {formatTime(message.createdAt)}
                      {message.isFromCurrentUser && (
                        <span className="ml-2">
                          {message.isRead ? "✓✓" : "✓"}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t">
              <div className="flex">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-grow p-2 border rounded-l focus:outline-none focus:ring-2 focus:ring-blue-200"
                />
                <button
                  type="submit"
                  className="bg-blue-500 text-white px-4 py-2 rounded-r hover:bg-blue-600"
                >
                  Send
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </Layout>
  );
} 