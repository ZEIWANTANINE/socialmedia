"use client";
import React, { useState, useEffect, useRef } from "react";
import axiosInstance from "../utils/axiosInstance";
import { apiEndpoints } from "../utils/api";
import Layout from "../components/Layout";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useRouter, useSearchParams } from "next/navigation";
import webSocketService from "../utils/webSocketService";

interface Friend {
  id: number;
  username: string;
  profilePicture: string | null;
  lastMessage?: string;
  unreadCount?: number;
}

interface Message {
  id: number;
  content: string;
  createdAt: string;
  isRead: boolean;
  isFromCurrentUser: boolean;
}

interface ChatData {
  messages: Message[];
  user: {
    id: number;
    username: string;
    profilePicture: string | null;
  };
}

const ChatPage: React.FC = () => {
  const [conversations, setConversations] = useState<Friend[]>([]);
  const [selectedFriend, setSelectedFriend] = useState<Friend | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const friendId = searchParams.get('id');

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Load user ID from localStorage
  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else {
      router.push("/login");
    }

    // Connect to WebSocket
    const token = localStorage.getItem("jwtToken");
    if (token) {
      webSocketService.connect(token);
    }

    // Debug: Check friendships for current user
    if (storedUserId) {
      checkFriendships(storedUserId);
    }

    return () => {
      // Optional: Disconnect WebSocket when component unmounts
      // webSocketService.disconnect();
    };
  }, [router]);

  // Debug function to check if friendships are properly set up
  const checkFriendships = async (userId: string) => {
    try {
      // Fetch friend list to debug
      const response = await axiosInstance.get(`/api/friends/user1/${userId}`);
      console.log("Friends for user1:", response.data);
      
      // Also check user2 friends
      const response2 = await axiosInstance.get(`/api/friends/user2/${userId}`);
      console.log("Friends for user2:", response2.data);
    } catch (error) {
      console.error("Error checking friendships:", error);
    }
  };

  // Load conversations
  useEffect(() => {
    if (currentUserId) {
      loadConversations();
    }
  }, [currentUserId]);

  // Load friend from URL param
  useEffect(() => {
    if (friendId && conversations.length > 0) {
      const friend = conversations.find(f => f.id.toString() === friendId);
      if (friend) {
        setSelectedFriend(friend);
      }
    }
  }, [friendId, conversations]);

  // Load messages when selected friend changes
  useEffect(() => {
    if (selectedFriend) {
      // First verify friendship status directly before trying to load chat
      verifyFriendship(selectedFriend.id.toString())
        .then(isFriend => {
          if (isFriend) {
            loadChatDataFixed(selectedFriend.id.toString());
          } else {
            toast.error("You are not friends with this user. Please add them as a friend first.");
            setSelectedFriend(null);
          }
        })
        .catch(err => {
          console.error("Error verifying friendship:", err);
          loadChatDataFixed(selectedFriend.id.toString());
        });
    }
  }, [selectedFriend]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Register WebSocket handlers
  useEffect(() => {
    const unregister = webSocketService.registerNotificationHandler((notification) => {
      if (notification.type === "NEW_MESSAGE" && selectedFriend) {
        // Add new message to state if it's from the currently selected friend
        if (notification.senderId === selectedFriend.id) {
          const newMsg = notification.message;
          setMessages(prev => [...prev, {
            id: newMsg.id,
            content: newMsg.content,
            createdAt: newMsg.createdAt,
            isRead: newMsg.isRead,
            isFromCurrentUser: newMsg.isFromCurrentUser
          }]);

          // Mark message as read
          axiosInstance.put(apiEndpoints.markMessagesAsRead(notification.senderId.toString()))
            .catch(error => console.error("Error marking message as read:", error));
        } else {
          // Update conversations to show new message indicator
          setConversations(prev => prev.map(conv => {
            if (conv.id === notification.senderId) {
              return {
                ...conv,
                lastMessage: notification.message.content,
                unreadCount: (conv.unreadCount || 0) + 1
              };
            }
            return conv;
          }));

          // Show toast notification
          toast.info(`New message from ${notification.senderUsername}`);
        }
      }
    });

    return () => {
      unregister();
    };
  }, [selectedFriend]);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(apiEndpoints.conversations);
      setConversations(response.data);
      setIsLoading(false);
      
      // If friendId is specified, select that friend
      if (friendId) {
        const friend = response.data.find((f: Friend) => f.id.toString() === friendId);
        if (friend) {
          setSelectedFriend(friend);
        }
      }
    } catch (error) {
      console.error("Error loading conversations:", error);
      setIsLoading(false);
    }
  };

  // Helper function to make API calls with correct token handling
  const fixedApiCall = async (url: string, options: RequestInit = {}) => {
    const token = localStorage.getItem('jwtToken');
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    // Ensure headers are properly set
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    headers.set('Content-Type', 'application/json');
    
    // Make the request with proper credentials
    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include'
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API error (${response.status}): ${errorText}`);
      throw new Error(`API error: ${errorText || response.statusText}`);
    }
    
    return response.json();
  };
  
  // Fixed function to load chat data with proper token handling
  const loadChatDataFixed = async (friendId: string) => {
    try {
      console.log(`Loading chat data for friend ID: ${friendId}`);
      
      if (!friendId || friendId === 'undefined' || friendId === 'null') {
        console.error('Invalid friend ID');
        toast.error('Cannot load chat: Invalid friend ID');
        return;
      }
      
      // First check if the users are friends using the conversations endpoint
      const conversations = await fixedApiCall('http://localhost:6789/api/messages/conversations');
      console.log("Available conversations:", conversations);
      
      // Check if friend is in conversations list
      const friendConversation = conversations.find((c: any) => c.userId && c.userId.toString() === friendId);
      
      if (!friendConversation) {
        console.warn(`Friend ${friendId} not found in conversations list`);
        toast.error('You need to add this user as a friend first.');
        setSelectedFriend(null);
        return;
      }
      
      // Load chat data using the correct API endpoint
      const chatData = await fixedApiCall(`http://localhost:6789/api/messages/chat/${friendId}`);
      console.log("Chat data loaded successfully:", chatData);
      
      // Process the response
      if (chatData && chatData.messages) {
        setMessages(chatData.messages);
        
        // Update URL with selected friend ID
        const url = new URL(window.location.href);
        url.searchParams.set('id', friendId);
        window.history.pushState({}, '', url.toString());
        
        // Reset unread count in conversations list
        setConversations(prev => prev.map(conv => {
          if (conv.id && conv.id.toString() === friendId) {
            return { ...conv, unreadCount: 0 };
          }
          return conv;
        }));
      } else {
        console.error('Invalid response format:', chatData);
        toast.error('Error loading messages: Invalid data format');
      }
    } catch (error: any) {
      console.error("Error in loadChatDataFixed:", error);
      toast.error(error.message || "Failed to load chat messages");
    }
  };

  // Function to directly verify friendship
  const verifyFriendship = async (friendId: string): Promise<boolean> => {
    try {
      const currentUserId = localStorage.getItem('userId');
      if (!currentUserId) return false;
      
      console.log(`Verifying friendship between user ${currentUserId} and ${friendId}`);
      
      // Specifically check if you can successfully get conversations,
      // which might indicate the backend friendship is properly set up
      try {
        const conversationsResponse = await axiosInstance.get('/api/messages/conversations');
        const conversations = conversationsResponse.data || [];
        
        // Check if the friend is in the conversations list
        const friendInConversations = conversations.some((conv: any) => 
          conv.userId && conv.userId.toString() === friendId
        );
        
        if (friendInConversations) {
          console.log("Friend found in conversations list - friendship verified indirectly");
          return true;
        }
      } catch (convError) {
        console.error("Error checking conversations:", convError);
      }
      
      // Direct friendship checks as backup
      // Check as user1
      const response1 = await axiosInstance.get(`/api/friends/user1/${currentUserId}`);
      const friends1 = response1.data || [];
      const isFriend1 = friends1.some((f: any) => f.user2?.id.toString() === friendId);
      
      if (isFriend1) {
        console.log("Friendship verified: Current user is user1");
        return true;
      }
      
      // Check as user2
      const response2 = await axiosInstance.get(`/api/friends/user2/${currentUserId}`);
      const friends2 = response2.data || [];
      const isFriend2 = friends2.some((f: any) => f.user1?.id.toString() === friendId);
      
      if (isFriend2) {
        console.log("Friendship verified: Current user is user2");
        return true;
      }
      
      console.log("No friendship found between these users");
      return false;
    } catch (error) {
      console.error("Error verifying friendship:", error);
      return false; // Assume not friends on error
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFriend || newMessage.trim() === "") return;

    try {
      const response = await axiosInstance.post(
        apiEndpoints.sendMessage(selectedFriend.id.toString()),
        { content: newMessage }
      );

      // Add new message to chat
      setMessages(prev => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    }
  };

  useEffect(() => {
    // Direct test of the API endpoint to debug the issue
    const testApiEndpoint = async () => {
      const token = localStorage.getItem('jwtToken');
      if (!token) return;
      
      // Remove Bearer prefix if present
      const cleanToken = token.startsWith('Bearer ') ? token.substring(7) : token;
      
      try {
        // Test the endpoint with direct fetch
        const response = await fetch('http://localhost:6789/api/messages/conversations', {
          headers: {
            'Authorization': `Bearer ${cleanToken}`
          },
          credentials: 'include'
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Conversations API test successful:", data);
          
          // If we can fetch conversations, let's try a direct chat message fetch
          if (data.length > 0 && data[0].userId) {
            const userId = data[0].userId;
            console.log(`Testing direct chat API with user ${userId}`);
            
            const chatResponse = await fetch(`http://localhost:6789/api/messages/chat/${userId}`, {
              headers: {
                'Authorization': `Bearer ${cleanToken}`
              },
              credentials: 'include'
            });
            
            if (chatResponse.ok) {
              console.log("Chat API test successful:", await chatResponse.json());
            } else {
              console.error("Chat API test failed:", await chatResponse.text());
            }
          }
        } else {
          console.error("Conversations API test failed:", await response.text());
        }
      } catch (error) {
        console.error("API test error:", error);
      }
    };
    
    testApiEndpoint();
  }, []);

  // Add a fallback function with the original name to avoid breaking existing code
  const loadChatData = loadChatDataFixed;

  if (!currentUserId) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <Layout userId={currentUserId}>
      <div className="flex h-[calc(100vh-64px)]">
        {/* Friends/Conversations Sidebar */}
        <div className="w-1/4 bg-white border-r overflow-y-auto">
          <div className="p-4 border-b">
            <h2 className="text-lg font-bold">Conversations</h2>
          </div>
          {isLoading ? (
            <div className="flex justify-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              No conversations yet. Add friends to start chatting.
            </div>
          ) : (
            <ul>
              {conversations.map((friend) => (
                <li
                  key={friend.id}
                  onClick={() => setSelectedFriend(friend)}
                  className={`p-4 cursor-pointer hover:bg-gray-100 ${
                    selectedFriend?.id === friend.id ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 rounded-full bg-gray-300 flex-shrink-0 mr-3">
                      {friend.profilePicture && (
                        <img
                          src={friend.profilePicture}
                          alt={friend.username}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <span className="font-medium">{friend.username}</span>
                        {friend.unreadCount ? (
                          <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                            {friend.unreadCount}
                          </span>
                        ) : null}
                      </div>
                      {friend.lastMessage && (
                        <p className="text-sm text-gray-500 truncate">{friend.lastMessage}</p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedFriend ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-white flex items-center">
                <div className="w-10 h-10 rounded-full bg-gray-300 mr-3">
                  {selectedFriend.profilePicture && (
                    <img
                      src={selectedFriend.profilePicture}
                      alt={selectedFriend.username}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  )}
                </div>
                <h2 className="text-lg font-bold">{selectedFriend.username}</h2>
              </div>

              {/* Messages */}
              <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
                {messages.length === 0 ? (
                  <div className="text-center text-gray-500 mt-8">
                    No messages yet. Say hello!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.isFromCurrentUser ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`max-w-3/4 p-3 rounded-lg ${
                            message.isFromCurrentUser
                              ? "bg-blue-500 text-white rounded-br-none"
                              : "bg-gray-200 rounded-bl-none"
                          }`}
                        >
                          <p>{message.content}</p>
                          <div
                            className={`text-xs mt-1 ${
                              message.isFromCurrentUser ? "text-blue-100" : "text-gray-500"
                            }`}
                          >
                            {new Date(message.createdAt).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                            {message.isFromCurrentUser && (
                              <span className="ml-1">
                                {message.isRead ? "✓✓" : "✓"}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="p-4 bg-white border-t">
                <form className="flex" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 p-2 border rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={newMessage.trim() === ""}
                  >
                    Send
                  </button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center text-gray-500">
                <p className="mb-4">Select a conversation to start chatting</p>
                {conversations.length === 0 && !isLoading && (
                  <button
                    onClick={() => router.push("/friend")}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
                    Find Friends
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
      <ToastContainer position="bottom-right" />
    </Layout>
  );
};

export default ChatPage;