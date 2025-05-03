"use client";

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import axiosInstance from "../utils/axiosInstance";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface User {
  id: number;
  username: string;
  profilePicture?: string;
  email?: string;
}

interface FriendRequest {
  id: number;
  status: string;
  sender?: {
    id: number;
  };
  receiver?: {
    id: number;
  };
}

export default function UsersPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [friends, setFriends] = useState<number[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      loadData();
    } else {
      router.push("/");
    }
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load all users
      const response = await axiosInstance.get("/auth/users");
      const currentUserId = localStorage.getItem("userId");
      
      // Filter out current user
      const filteredResponse = response.data.filter(
        (user: User) => user.id.toString() !== currentUserId
      );
      
      setUsers(filteredResponse);
      setFilteredUsers(filteredResponse);

      // Load friend requests
      const sentRequestsResponse = await axiosInstance.get("/api/friendrequests/sent");
      setSentRequests(sentRequestsResponse.data);

      // Load friends
      const friendsResponse = await axiosInstance.get("/api/messages/conversations");
      setFriends(friendsResponse.data.map((conversation: any) => conversation.userId));
      
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    
    if (!value.trim()) {
      setFilteredUsers(users);
    } else {
      const filtered = users.filter(user => 
        user.username.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredUsers(filtered);
    }
  };

  const handleSendRequest = async (receiverId: number) => {
    try {
      await axiosInstance.post(`/api/friendrequests/${receiverId}`);
      // Refresh sent requests data
      const response = await axiosInstance.get("/api/friendrequests/sent");
      setSentRequests(response.data);
    } catch (error) {
      console.error("Error sending friend request:", error);
      setError("Failed to send friend request. Please try again.");
    }
  };

  const hasSentRequest = (userId: number) => {
    return sentRequests.some(request => request.receiver?.id === userId);
  };

  const isFriend = (userId: number) => {
    return friends.includes(userId);
  };

  return (
    <Layout userId={userId || ""}>
      <div className="max-w-4xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Danh sách người dùng</h1>
          <Link href="/friends">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded transition">
              Xem bạn bè
            </button>
          </Link>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 20 20">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m19 19-4-4m0-7A7 7 0 1 1 1 8a7 7 0 0 1 14 0Z"/>
              </svg>
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearch}
              className="block w-full p-3 pl-10 text-sm text-gray-900 border border-gray-300 rounded-lg bg-white focus:ring-blue-500 focus:border-blue-500"
              placeholder="Tìm kiếm theo tên người dùng..."
            />
          </div>
        </div>

        {/* Users List */}
        {loading ? (
          <div className="flex justify-center items-center py-10">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredUsers.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredUsers.map((user) => (
              <div 
                key={user.id} 
                className="flex items-center justify-between p-4 bg-white rounded-lg shadow hover:shadow-md transition"
              >
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center mr-4">
                    {user.profilePicture ? (
                      <img src={user.profilePicture} alt={user.username} className="w-12 h-12 rounded-full" />
                    ) : (
                      <span className="text-xl font-bold">{user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-medium text-lg">{user.username}</h3>
                    {user.email && (
                      <p className="text-gray-500 text-sm">{user.email}</p>
                    )}
                  </div>
                </div>

                <div>
                  {isFriend(user.id) ? (
                    <div className="flex space-x-2">
                      <Link href={`/messages/${user.id}`}>
                        <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-md text-sm transition">
                          Nhắn tin
                        </button>
                      </Link>
                      <span className="bg-blue-100 text-blue-800 text-xs font-medium px-2.5 py-0.5 rounded-full flex items-center">
                        Bạn bè
                      </span>
                    </div>
                  ) : hasSentRequest(user.id) ? (
                    <span className="bg-gray-100 text-gray-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                      Đã gửi lời mời
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendRequest(user.id)}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-md text-sm transition"
                    >
                      Kết bạn
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center p-6 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Không tìm thấy người dùng phù hợp</p>
          </div>
        )}
      </div>
    </Layout>
  );
} 