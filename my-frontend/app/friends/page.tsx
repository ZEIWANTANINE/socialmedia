"use client";

import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import axiosInstance from "../utils/axiosInstance";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface FriendRequest {
  id: number;
  status: string;
  createdAt: string;
  sender?: {
    id: number;
    username: string;
    profilePicture?: string;
  };
  receiver?: {
    id: number;
    username: string;
    profilePicture?: string;
  };
}

interface Friend {
  id: number;
  username: string;
  profilePicture?: string;
}

export default function FriendsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchUsername, setSearchUsername] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      loadData();
      loadAllUsers();
    } else {
      router.push("/");
    }
  }, [router]);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch received friend requests
      const receivedResponse = await axiosInstance.get("/api/friendrequests/received");
      setReceivedRequests(receivedResponse.data);

      // Fetch sent friend requests
      const sentResponse = await axiosInstance.get("/api/friendrequests/sent");
      setSentRequests(sentResponse.data);

      // Fetch friends list
      const friendsResponse = await axiosInstance.get("/api/messages/conversations");
      setFriends(friendsResponse.data.map((conversation: any) => ({
        id: conversation.userId,
        username: conversation.username,
        profilePicture: conversation.profilePicture
      })));
    } catch (error) {
      console.error("Error loading friend data:", error);
      setError("Failed to load friend data. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const loadAllUsers = async () => {
    try {
      console.log("Starting to load all users");
      const response = await axiosInstance.get("/auth/users");
      console.log("Users API response:", response);
      
      // Lọc ra chính người dùng hiện tại từ danh sách
      const currentUserId = localStorage.getItem("userId");
      console.log("Current user ID:", currentUserId);
      
      const filteredUsers = response.data.filter((user: any) => 
        user.id.toString() !== currentUserId
      );
      
      console.log("Filtered users count:", filteredUsers.length);
      console.log("Filtered users:", filteredUsers);
      
      setAllUsers(filteredUsers);
      setSearchResults(filteredUsers); // Hiển thị tất cả người dùng mặc định
    } catch (error) {
      console.error("Error loading users:", error);
      setError("Failed to load users. Please try again.");
    }
  };

  const handleAcceptRequest = async (requestId: number) => {
    try {
      await axiosInstance.put(`/api/friendrequests/${requestId}/accept`);
      // Refresh data
      loadData();
    } catch (error) {
      console.error("Error accepting friend request:", error);
      setError("Failed to accept friend request. Please try again.");
    }
  };

  const handleRejectRequest = async (requestId: number) => {
    try {
      await axiosInstance.put(`/api/friendrequests/${requestId}/reject`);
      // Refresh data
      loadData();
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      setError("Failed to reject friend request. Please try again.");
    }
  };

  const handleCancelRequest = async (requestId: number) => {
    try {
      await axiosInstance.delete(`/api/friendrequests/${requestId}`);
      // Refresh data
      loadData();
    } catch (error) {
      console.error("Error cancelling friend request:", error);
      setError("Failed to cancel friend request. Please try again.");
    }
  };

  const handleSearch = async () => {
    if (!searchUsername.trim()) {
      // Nếu ô tìm kiếm trống, hiển thị tất cả người dùng
      setSearchResults(allUsers);
      return;
    }

    setSearchLoading(true);
    try {
      // Tìm kiếm local từ danh sách đã tải
      const filteredUsers = allUsers.filter(user => 
        user.username.toLowerCase().includes(searchUsername.toLowerCase())
      );
      
      setSearchResults(filteredUsers);
    } catch (error) {
      console.error("Error searching users:", error);
      setError("Failed to search users. Please try again.");
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSendRequest = async (receiverId: number) => {
    try {
      console.log("Sending friend request to:", receiverId);
      const response = await axiosInstance.post(`/api/friendrequests/${receiverId}`);
      console.log("Friend request response:", response.data);
      
      // Refresh data after sending request
      await loadData();
      // Show user still in search results
      const updatedResults = [...searchResults];
      setSearchResults(updatedResults);
    } catch (error) {
      console.error("Error sending friend request:", error);
      setError("Failed to send friend request. Please try again.");
    }
  };

  // Kiểm tra xem người dùng đã gửi lời mời kết bạn chưa
  const hasSentRequest = (userId: number) => {
    return sentRequests.some(request => request.receiver?.id === userId);
  };

  // Kiểm tra xem người dùng đã là bạn bè chưa
  const isFriend = (userId: number) => {
    return friends.some(friend => friend.id === userId);
  };

  return (
    <Layout userId={userId || ""}>
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-2xl font-bold mb-6">Bạn bè</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Search for users */}
        <div className="mb-8 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Tìm bạn bè</h2>
          <div className="flex mb-4">
            <input
              type="text"
              value={searchUsername}
              onChange={(e) => {
                setSearchUsername(e.target.value);
                // Auto search when typing
                if (!e.target.value.trim()) {
                  setSearchResults(allUsers); // Show all users when input is empty
                } else {
                  // Tìm kiếm ngay khi gõ
                  const filteredUsers = allUsers.filter(user => 
                    user.username.toLowerCase().includes(e.target.value.toLowerCase())
                  );
                  setSearchResults(filteredUsers);
                }
              }}
              placeholder="Tìm kiếm theo tên người dùng"
              className="flex-grow p-2 border rounded-l"
            />
            <button
              onClick={handleSearch}
              disabled={searchLoading}
              className="bg-blue-500 text-white px-4 py-2 rounded-r"
            >
              {searchLoading ? "Đang tìm..." : "Tìm kiếm"}
            </button>
          </div>

          <h3 className="font-medium mb-2">Danh sách người dùng: {searchResults.length} người</h3>
          {searchResults.length > 0 ? (
            <div className="mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 border rounded hover:bg-gray-50">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                        {user.profilePicture ? (
                          <img src={user.profilePicture} alt={user.username} className="w-10 h-10 rounded-full" />
                        ) : (
                          <span>{user.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="font-medium">{user.username}</span>
                    </div>
                    {isFriend(user.id) ? (
                      <div className="flex space-x-2">
                        <Link href={`/messages/${user.id}`}>
                          <button className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded-full text-sm transition">
                            Nhắn tin
                          </button>
                        </Link>
                        <span className="text-green-500 px-3 py-1 text-sm bg-green-50 rounded-full">
                          Bạn bè
                        </span>
                      </div>
                    ) : hasSentRequest(user.id) ? (
                      <span className="text-gray-500 px-3 py-1 text-sm bg-gray-50 rounded-full">
                        Đã gửi lời mời
                      </span>
                    ) : (
                      <button
                        onClick={() => handleSendRequest(user.id)}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-full text-sm transition"
                      >
                        Kết bạn
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-gray-500 text-center py-4 border rounded">
              <p>Không tìm thấy người dùng phù hợp</p>
            </div>
          )}
        </div>

        {/* Friend requests received */}
        <div className="mb-8 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Lời mời kết bạn</h2>
          {loading ? (
            <p>Đang tải lời mời kết bạn...</p>
          ) : receivedRequests.length > 0 ? (
            <div className="space-y-4">
              {receivedRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      {request.sender?.profilePicture ? (
                        <img src={request.sender.profilePicture} alt={request.sender?.username} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span>{request.sender?.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{request.sender?.username}</span>
                  </div>
                  <div className="space-x-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="bg-green-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Chấp nhận
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded text-sm"
                    >
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Không có lời mời kết bạn nào</p>
          )}
        </div>

        {/* Sent friend requests */}
        <div className="mb-8 bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Lời mời đã gửi</h2>
          {loading ? (
            <p>Đang tải lời mời đã gửi...</p>
          ) : sentRequests.length > 0 ? (
            <div className="space-y-4">
              {sentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      {request.receiver?.profilePicture ? (
                        <img src={request.receiver.profilePicture} alt={request.receiver?.username} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span>{request.receiver?.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <div>
                      <div>{request.receiver?.username}</div>
                      <div className="text-xs text-gray-500">Trạng thái: {request.status === 'pending' ? 'Đang chờ' : request.status}</div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleCancelRequest(request.id)}
                    className="bg-gray-500 text-white px-3 py-1 rounded text-sm"
                  >
                    Hủy
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <p>Không có lời mời đã gửi</p>
          )}
        </div>

        {/* Friends list */}
        <div className="bg-white p-4 rounded shadow">
          <h2 className="text-xl font-semibold mb-4">Danh sách bạn bè</h2>
          {loading ? (
            <p>Đang tải danh sách bạn bè...</p>
          ) : friends.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center mr-3">
                      {friend.profilePicture ? (
                        <img src={friend.profilePicture} alt={friend.username} className="w-10 h-10 rounded-full" />
                      ) : (
                        <span>{friend.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <span>{friend.username}</span>
                  </div>
                  <div className="space-x-2">
                    <Link href={`/messages/${friend.id}`}>
                      <button className="bg-blue-500 text-white px-3 py-1 rounded text-sm">
                        Nhắn tin
                      </button>
                    </Link>
                    <Link href={`/profile/${friend.id}`}>
                      <button className="bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm">
                        Trang cá nhân
                      </button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>Chưa có bạn bè</p>
          )}
        </div>
      </div>
    </Layout>
  );
} 