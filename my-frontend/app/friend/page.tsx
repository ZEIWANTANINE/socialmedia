"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import { apiEndpoints } from "../utils/api";
import Layout from "../components/Layout";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";

interface User {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  profilePicture: string | null;
}

const FriendsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [pendingRequests, setPendingRequests] = useState<number[]>([]); // Lưu id của những người đã gửi lời mời kết bạn

  useEffect(() => {
    // Lấy userId từ localStorage
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else {
      console.error("User ID not found. Redirecting to login...");
      window.location.href = "/login";
    }

    // Fetch danh sách người dùng
    const fetchUsers = async () => {
      try {
        const response = await axiosInstance.get(apiEndpoints.users);
        setUsers(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching users:", error);
        setLoading(false);
      }
    };

    // Fetch danh sách lời mời kết bạn đã gửi
    const fetchSentRequests = async () => {
      try {
        if (currentUserId) {
          const response = await axiosInstance.get(apiEndpoints.sentFriendRequests);
          console.log("Sent friend requests:", response.data);
          // Lưu danh sách id của người nhận lời mời kết bạn
          const pendingIds = response.data.map((request: any) => request.receiver.id);
          setPendingRequests(pendingIds);
        }
      } catch (error) {
        console.error("Error fetching sent friend requests:", error);
      }
    };

    fetchUsers();
    fetchSentRequests();
  }, [currentUserId]);

  const sendFriendRequest = async (receiverId: number) => {
    try {
      console.log(`Sending friend request to user with ID: ${receiverId}`);
      
      // Đảm bảo token được thêm vào request
      const token = localStorage.getItem('jwtToken');
      if (!token) {
        toast.error("Không có thông tin đăng nhập. Vui lòng đăng nhập lại.");
        return;
      }
      
      // Tạo request để gửi lời mời kết bạn với token cụ thể
      const response = await axiosInstance.post(
        `${apiEndpoints.friendRequests}/${receiverId}`,
        {}, // empty body
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      console.log("Friend request response:", response.data);
      
      // Cập nhật UI để hiển thị đã gửi lời mời
      setPendingRequests([...pendingRequests, receiverId]);
      toast.success("Friend request sent successfully!");
    } catch (error: any) {
      console.error("Error sending friend request:", error);
      
      // Hiển thị thông báo lỗi chi tiết hơn
      if (error.response) {
        // Server trả về response với status code khác 2xx
        console.error("Server response error:", error.response.data);
        toast.error(`Failed to send friend request: ${error.response.data || error.response.statusText}`);
      } else if (error.request) {
        // Request đã được gửi nhưng không nhận được response
        console.error("No response received:", error.request);
        toast.error("Failed to send friend request: No response from server");
      } else {
        // Lỗi khi thiết lập request
        toast.error(`Failed to send friend request: ${error.message}`);
      }
    }
  };

  const filteredUsers = users.filter((user) => {
    // Không hiển thị chính người dùng hiện tại
    if (user.id.toString() === currentUserId) return false;
    
    // Lọc theo từ khóa tìm kiếm
    return (
      user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullName && user.fullName.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  });

  return (
    <Layout userId={currentUserId || ""}>
    <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold mb-4">Find Friends</h1>
          <Link href="/friend/requests" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Friend Requests
          </Link>
        </div>
      <input
        type="text"
          placeholder="Search users..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full p-2 border rounded mb-4"
      />
        {loading ? (
          <p>Loading users...</p>
        ) : (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredUsers.map((user) => (
              <div key={user.id} className="p-4 border rounded shadow">
                <div className="flex items-center mb-2">
                  <div className="h-16 w-16 bg-gray-300 rounded-full mr-4">
                    {user.profilePicture && (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="h-16 w-16 rounded-full object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">{user.fullName || user.username}</h3>
                    <p className="text-gray-600">@{user.username}</p>
                    {user.bio && <p className="text-sm text-gray-500">{user.bio}</p>}
                  </div>
                </div>
                
                {pendingRequests.includes(user.id) ? (
                  <button className="w-full mt-2 bg-gray-400 text-white px-4 py-2 rounded cursor-not-allowed" disabled>
                    Request Sent
                  </button>
                ) : (
                  <button
                    onClick={() => sendFriendRequest(user.id)}
                    className="w-full mt-2 bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                  >
              Add Friend
            </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" />
    </Layout>
  );
};

export default FriendsPage;