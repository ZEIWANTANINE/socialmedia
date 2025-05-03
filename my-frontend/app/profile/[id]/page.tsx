"use client";
import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../utils/axiosInstance";
import { useParams, useRouter } from "next/navigation";
import { apiEndpoints } from "../../utils/api";
import Link from "next/link";

interface UserProfile {
  id: number;
  username: string;
  email: string;
  fullName: string | null;
  bio: string | null;
  profilePicture: string | null;
  createdAt: string;
  settings: {
    isPrivate: boolean;
    notificationsEnabled: boolean;
    theme: string;
  };
}

const ProfilePage: React.FC = () => {
  const params = useParams();
  const router = useRouter();
  const profileId = params?.id as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [friendStatus, setFriendStatus] = useState<'none' | 'friend' | 'pending' | 'received'>('none');
  const [friendRequestId, setFriendRequestId] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    // Lấy thông tin người dùng hiện tại từ localStorage
    const storedUserId = localStorage.getItem("userId");
    const storedUsername = localStorage.getItem("username");
    const storedToken = localStorage.getItem("jwtToken");
    
    if (!storedUserId || !storedToken) {
      console.error("User ID or token not found. Redirecting to login...");
      window.location.href = "/";
      return;
    }

    setCurrentUserId(storedUserId);
    setCurrentUsername(storedUsername);
    console.log("Current user from localStorage:", { userId: storedUserId, username: storedUsername });

    // Nếu profileId là undefined hoặc không hợp lệ, sử dụng ID của người dùng hiện tại
    let targetUserId = storedUserId;
    if (profileId && profileId !== "undefined") {
      const parsedId = parseInt(profileId);
      if (!isNaN(parsedId)) {
        targetUserId = profileId;
      }
    }
    
    setIsCurrentUser(storedUserId === targetUserId);

    const fetchUserProfile = async () => {
      try {
        const userId = parseInt(targetUserId);
        if (isNaN(userId)) {
          setError("Invalid user ID");
          setLoading(false);
          return;
        }
        
        console.log(`Fetching user profile for ID: ${userId}, current token: ${storedToken.substring(0, 15)}...`);
        
        // Create a fallback user profile from localStorage if this is the current user
        let fallbackUserProfile: Partial<UserProfile> | null = null;
        if (isCurrentUser && storedUsername) {
          fallbackUserProfile = {
            id: parseInt(storedUserId),
            username: storedUsername,
            email: storedUsername, // Assuming email is used as username
            fullName: null,
            bio: null,
            profilePicture: null,
            settings: {
              isPrivate: false,
              notificationsEnabled: true,
              theme: 'light'
            }
          };
          console.log("Created fallback profile from localStorage:", fallbackUserProfile);
        }
        
        try {
          // Try to get detailed user information
          const userResponse = await axiosInstance.get(`/auth/users/${userId}`);
          console.log("User info raw response:", userResponse);
          
          if (!userResponse.data) {
            throw new Error("No user data returned from primary API");
          }
          
          // Then try to get user settings
          let userSettings = null;
          try {
            const settingsResponse = await axiosInstance.get(`/auth/usersettings/${userId}`);
            console.log("User settings response:", settingsResponse.data);
            userSettings = settingsResponse.data;
          } catch (settingsError) {
            console.error("Error fetching user settings:", settingsError);
            // Continue without settings
          }
          
          // Combine user info and settings
          const userInfo = userResponse.data;
          
          console.log("Combined user profile data:", {
            ...userInfo,
            settings: userSettings || {
              isPrivate: false,
              notificationsEnabled: true,
              theme: 'light'
            }
          });
          
          setUser({
            ...userInfo,
            settings: userSettings || {
              isPrivate: false,
              notificationsEnabled: true,
              theme: 'light'
            }
          });
          setError(null);
        } catch (userInfoError) {
          console.error("Error fetching from primary API, trying backup method:", userInfoError);
          
          try {
            // Backup method: try to get user profile from the settings endpoint
            const settingsResponse = await axiosInstance.get(`/auth/usersettings/${userId}`);
            if (settingsResponse.data && settingsResponse.data.user) {
              console.log("Got user data from settings endpoint:", settingsResponse.data);
              setUser({
                ...settingsResponse.data.user,
                settings: settingsResponse.data
              });
        setError(null);
              return;
            }
          } catch (settingsError) {
            console.error("Error fetching from settings endpoint:", settingsError);
          }
          
          // If we get here, both API attempts failed
          // Use the fallback profile if available (for current user only)
          if (isCurrentUser && fallbackUserProfile) {
            console.log("Using fallback profile from localStorage");
            setUser(fallbackUserProfile as UserProfile);
            setError("Hiển thị thông tin cơ bản từ dữ liệu đã lưu. Một số chi tiết có thể không đầy đủ.");
          } else {
            throw new Error("Failed to get user data from both APIs");
          }
        }
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        if (error.response?.status === 403) {
          // Token expired or invalid
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("userId");
          window.location.href = "/";
        } else {
          setError("Không thể tải thông tin người dùng. Vui lòng thử lại sau.");
        }
      } finally {
        setLoading(false);
      }
    };

    const checkFriendStatus = async () => {
      if (isCurrentUser) return;
      
      try {
        console.log(`Kiểm tra trạng thái kết bạn với người dùng ID: ${profileId}`);
        
        // 1. Kiểm tra danh sách bạn bè
        try {
          const friendsResponse = await axiosInstance.get("/api/messages/conversations");
          console.log("Danh sách cuộc trò chuyện:", friendsResponse.data);
          
          const isFriend = friendsResponse.data.some((friend: any) => 
            friend.userId && friend.userId.toString() === profileId
          );
          
          if (isFriend) {
            console.log("Đã là bạn bè");
            setFriendStatus('friend');
            return;
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra danh sách bạn bè:", error);
        }
        
        // 2. Kiểm tra lời mời đã gửi
        try {
          const sentResponse = await axiosInstance.get("/api/friendrequests/sent");
          console.log("Lời mời đã gửi:", sentResponse.data);
          
          const sentRequest = sentResponse.data.find((request: any) => 
            request.receiver && request.receiver.id && request.receiver.id.toString() === profileId
          );
          
          if (sentRequest) {
            console.log("Đã gửi lời mời kết bạn, ID:", sentRequest.id);
            setFriendStatus('pending');
            setFriendRequestId(sentRequest.id);
            return;
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra lời mời đã gửi:", error);
        }
        
        // 3. Kiểm tra lời mời đã nhận
        try {
          const receivedResponse = await axiosInstance.get("/api/friendrequests/received");
          console.log("Lời mời đã nhận:", receivedResponse.data);
          
          const receivedRequest = receivedResponse.data.find((request: any) => 
            request.sender && request.sender.id && request.sender.id.toString() === profileId
          );
          
          if (receivedRequest) {
            console.log("Đã nhận lời mời kết bạn, ID:", receivedRequest.id);
            setFriendStatus('received');
            setFriendRequestId(receivedRequest.id);
            return;
          }
        } catch (error) {
          console.error("Lỗi khi kiểm tra lời mời đã nhận:", error);
        }
        
        // Nếu không có mối quan hệ nào
        console.log("Không có mối quan hệ kết bạn");
        setFriendStatus('none');
      } catch (error) {
        console.error("Lỗi khi kiểm tra trạng thái kết bạn:", error);
        setFriendStatus('none');
      }
    };

      fetchUserProfile();
    checkFriendStatus();
  }, [profileId, isCurrentUser]);

  // Nếu profileId là undefined hoặc không hợp lệ, chuyển hướng đến profile của người dùng hiện tại
  useEffect(() => {
    if ((!profileId || profileId === "undefined") && currentUserId) {
      router.push(`/profile/${currentUserId}`);
    }
  }, [profileId, currentUserId, router]);

  // Đơn giản hóa hàm xử lý gửi lời mời kết bạn
  const handleSendFriendRequest = async () => {
    if (isCurrentUser || !profileId) return;
    
    setActionLoading(true);
    try {
      // Hiển thị thông tin gửi request
      console.log(`Đang gửi lời mời kết bạn đến user ID: ${profileId}`);
      
      // Gọi API với endpoint chính xác
      const response = await axiosInstance.post(`/api/friendrequests/${profileId}`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      console.log("Kết quả gửi lời mời kết bạn:", response.data);
      setFriendStatus('pending');
      setError(null);
    } catch (error: any) {
      console.error("Lỗi khi gửi lời mời kết bạn:", error);
      
      // Hiển thị thông báo lỗi cụ thể
      if (error.response) {
        console.error("Chi tiết lỗi:", error.response.data);
        console.error("Mã lỗi:", error.response.status);
        
        if (error.response.status === 403) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else if (error.response.status === 400) {
          if (error.response.data === "Already friends") {
            setError("Bạn đã là bạn bè với người này rồi.");
            setFriendStatus('friend');
          } else if (error.response.data === "Friend request already sent") {
            setError("Đã gửi lời mời kết bạn rồi.");
            setFriendStatus('pending');
          } else {
            setError("Không thể gửi lời mời kết bạn: " + error.response.data);
          }
        } else {
          setError("Không thể gửi lời mời kết bạn. Mã lỗi: " + error.response.status);
        }
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setActionLoading(false);
    }
  };
  
  // Đơn giản hóa hàm hủy lời mời kết bạn
  const handleCancelFriendRequest = async () => {
    if (!friendRequestId) return;
    
    setActionLoading(true);
    try {
      console.log(`Đang hủy lời mời kết bạn ID: ${friendRequestId}`);
      
      const response = await axiosInstance.delete(`/api/friendrequests/${friendRequestId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      console.log("Kết quả hủy lời mời:", response.data);
      setFriendStatus('none');
      setFriendRequestId(null);
      setError(null);
    } catch (error: any) {
      console.error("Lỗi khi hủy lời mời kết bạn:", error);
      
      if (error.response) {
        console.error("Chi tiết lỗi:", error.response.data);
        
        if (error.response.status === 403) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else if (error.response.status === 404) {
          setError("Không tìm thấy lời mời kết bạn.");
          setFriendStatus('none');
        } else {
          setError("Không thể hủy lời mời kết bạn. Mã lỗi: " + error.response.status);
        }
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setActionLoading(false);
    }
  };
  
  // Đơn giản hóa hàm chấp nhận lời mời kết bạn
  const handleAcceptFriendRequest = async () => {
    if (!friendRequestId) return;
    
    setActionLoading(true);
    try {
      console.log(`Đang chấp nhận lời mời kết bạn ID: ${friendRequestId}`);
      
      const response = await axiosInstance.put(`/api/friendrequests/${friendRequestId}/accept`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      console.log("Kết quả chấp nhận lời mời:", response.data);
      setFriendStatus('friend');
      setFriendRequestId(null);
      setError(null);
    } catch (error: any) {
      console.error("Lỗi khi chấp nhận lời mời kết bạn:", error);
      
      if (error.response) {
        console.error("Chi tiết lỗi:", error.response.data);
        
        if (error.response.status === 403) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else if (error.response.status === 404) {
          setError("Không tìm thấy lời mời kết bạn.");
          setFriendStatus('none');
        } else {
          setError("Không thể chấp nhận lời mời kết bạn. Mã lỗi: " + error.response.status);
        }
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setActionLoading(false);
    }
  };
  
  // Đơn giản hóa hàm từ chối lời mời kết bạn
  const handleRejectFriendRequest = async () => {
    if (!friendRequestId) return;
    
    setActionLoading(true);
    try {
      console.log(`Đang từ chối lời mời kết bạn ID: ${friendRequestId}`);
      
      const response = await axiosInstance.put(`/api/friendrequests/${friendRequestId}/reject`, {}, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('jwtToken')}`
        }
      });
      
      console.log("Kết quả từ chối lời mời:", response.data);
      setFriendStatus('none');
      setFriendRequestId(null);
      setError(null);
    } catch (error: any) {
      console.error("Lỗi khi từ chối lời mời kết bạn:", error);
      
      if (error.response) {
        console.error("Chi tiết lỗi:", error.response.data);
        
        if (error.response.status === 403) {
          setError("Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.");
        } else if (error.response.status === 404) {
          setError("Không tìm thấy lời mời kết bạn.");
          setFriendStatus('none');
        } else {
          setError("Không thể từ chối lời mời kết bạn. Mã lỗi: " + error.response.status);
        }
      } else {
        setError("Không thể kết nối đến máy chủ. Vui lòng thử lại sau.");
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Display error message if needed
  const renderErrorMessage = () => {
    if (!error) return null;
    
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p>{error}</p>
      </div>
    );
  };

  // Render user information with fallbacks for all fields
  const renderUserInfo = () => {
    // If we're viewing the current user's profile but API data is missing,
    // use the username from localStorage
    const displayUsername = user?.username || (isCurrentUser ? currentUsername : 'Không có tên người dùng');
    const displayFullName = user?.fullName || displayUsername || 'Không có tên hiển thị';
    
    return (
      <div className="flex items-center space-x-6">
        <div className="h-32 w-32 -mt-16 bg-white rounded-full border-4 border-white">
          {user?.profilePicture ? (
            <img
              src={user.profilePicture}
              alt={displayUsername || 'User avatar'}
              className="h-32 w-32 rounded-full object-cover"
            />
          ) : (
            <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-4xl text-gray-400">{displayUsername ? displayUsername[0]?.toUpperCase() : '?'}</span>
            </div>
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">{displayFullName}</h1>
            {renderFriendStatusBadge()}
            
            {/* Thêm nút làm mới trạng thái kết bạn */}
            {!isCurrentUser && (
              <button 
                onClick={() => {
                  setError(null);
                  checkFriendStatus();
                }}
                className="ml-2 text-blue-500 hover:text-blue-700"
                title="Làm mới trạng thái kết bạn"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                </svg>
              </button>
            )}
          </div>
          <p className="text-gray-600">@{displayUsername}</p>
          <p className="text-gray-500">ID: {user?.id || currentUserId || 'Không rõ'}</p>
          <p className="text-gray-500">Email: {user?.email || 'Không có email'}</p>
          {user?.bio && <p className="mt-2">{user.bio}</p>}
          <p className="text-sm text-gray-500 mt-1">
            Tham gia từ {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
          </p>
        </div>
      </div>
    );
  };

  // Thêm hàm để hiển thị nút kết bạn với giao diện cải tiến
  const renderFriendActionButton = () => {
    if (isCurrentUser) {
      return (
        <Link 
          href="/settings"
          className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
        >
          Chỉnh sửa thông tin
        </Link>
      );
    }

    switch (friendStatus) {
      case 'none':
        return (
          <button 
            onClick={handleSendFriendRequest}
            disabled={actionLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition disabled:opacity-50 flex items-center"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"></path>
                </svg>
                Kết bạn
              </>
            )}
          </button>
        );
      
      case 'pending':
        return (
          <button 
            onClick={handleCancelFriendRequest}
            disabled={actionLoading}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition disabled:opacity-50 flex items-center"
          >
            {actionLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Đang xử lý...
              </>
            ) : (
              <>
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
                Hủy lời mời
              </>
            )}
          </button>
        );
      
      case 'received':
        return (
          <div className="flex space-x-2">
            <button 
              onClick={handleAcceptFriendRequest}
              disabled={actionLoading}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition disabled:opacity-50 flex items-center"
            >
              {actionLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                  Chấp nhận
                </>
              )}
            </button>
            <button 
              onClick={handleRejectFriendRequest}
              disabled={actionLoading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition disabled:opacity-50 flex items-center"
            >
              {actionLoading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Đang xử lý...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                  Từ chối
                </>
              )}
            </button>
          </div>
        );
      
      case 'friend':
        return (
          <Link 
            href={`/messages/${user?.id}`}
            className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition flex items-center"
          >
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            Nhắn tin
          </Link>
        );
    }
  };

  // Hàm hiển thị trạng thái kết bạn 
  const renderFriendStatusBadge = () => {
    if (isCurrentUser || friendStatus === 'none') return null;
    
    switch (friendStatus) {
      case 'pending':
        return (
          <div className="mt-2 inline-flex items-center bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Đã gửi lời mời kết bạn
          </div>
        );
      case 'received':
        return (
          <div className="mt-2 inline-flex items-center bg-yellow-100 text-yellow-800 text-xs px-2 py-1 rounded">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path>
            </svg>
            Đã gửi lời mời kết bạn cho bạn
          </div>
        );
      case 'friend':
        return (
          <div className="mt-2 inline-flex items-center bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
            <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
            </svg>
            Bạn bè
          </div>
        );
    }
  };

  if (loading) {
    return (
      <Layout userId={currentUserId || ""} disableWebSocket={true}>
        <div className="max-w-4xl mx-auto">
          <div className="text-center p-8">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>Đang tải thông tin người dùng...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userId={currentUserId || ""} disableWebSocket={true}>
      <div className="max-w-4xl mx-auto">
        {/* Hiển thị thông báo lỗi nếu có */}
        {renderErrorMessage()}
          
            {/* Profile Header */}
            <div className="bg-white shadow rounded-lg mb-6">
              {/* Cover Photo */}
              <div className="h-64 bg-gray-300 rounded-t-lg"></div>
              
              {/* Profile Info */}
              <div className="p-6">
            {renderUserInfo()}
                  
                {/* Profile Actions */}
                <div className="mt-6 flex space-x-4">
              {renderFriendActionButton()}
                </div>
              </div>
            </div>

            {/* Profile Content */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="col-span-2">
                {/* About Section */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Thông tin cá nhân</h2>
                  <div className="space-y-4">
                    <div>
                  <h3 className="font-semibold">Tên người dùng</h3>
                  <p className="text-gray-600">@{user?.username || (isCurrentUser ? currentUsername : 'Chưa cập nhật')}</p>
                        </div>
                        <div>
                      <h3 className="font-semibold">Email</h3>
                  <p className="text-gray-600">{user?.email || 'Chưa cập nhật'}</p>
                </div>
                <div>
                  <h3 className="font-semibold">Họ và tên</h3>
                  <p className="text-gray-600">{user?.fullName || 'Chưa cập nhật'}</p>
                        </div>
                {user?.bio ? (
                      <div>
                    <h3 className="font-semibold">Tiểu sử</h3>
                        <p className="text-gray-600">{user.bio}</p>
                      </div>
                ) : (
                  <div>
                    <h3 className="font-semibold">Tiểu sử</h3>
                    <p className="text-gray-600 italic">Chưa cập nhật tiểu sử</p>
                  </div>
                    )}
                    <div>
                  <h3 className="font-semibold">Quyền riêng tư</h3>
                      <p className="text-gray-600">
                    {user?.settings?.isPrivate ? 'Tài khoản riêng tư' : 'Tài khoản công khai'}
                      </p>
                    </div>
                <div>
                  <h3 className="font-semibold">ID người dùng</h3>
                  <p className="text-gray-600">{user?.id || currentUserId || 'Không xác định'}</p>
                </div>
              </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* Profile Settings */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Cài đặt hệ thống</h2>
                  <div className="space-y-4">
                    <div>
                  <h3 className="font-semibold">Giao diện</h3>
                  <p className="text-gray-600 capitalize">
                    {user?.settings?.theme === 'dark' ? 'Tối' : 'Sáng'}
                  </p>
                </div>
                <div>
                  <h3 className="font-semibold">Thông báo</h3>
                  <p className="text-gray-600">
                    {user?.settings?.notificationsEnabled ? 'Đã bật' : 'Đã tắt'}
                  </p>
                    </div>
                    <div>
                  <h3 className="font-semibold">Ngày tham gia</h3>
                      <p className="text-gray-600">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Không rõ'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
      </div>
    </Layout>
  );
};

export default ProfilePage; 