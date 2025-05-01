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
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Lấy ID người dùng hiện tại từ localStorage
    const storedUserId = localStorage.getItem("userId");
    if (!storedUserId) {
      console.error("User ID not found. Redirecting to login...");
      window.location.href = "/login";
      return;
    }

    setCurrentUserId(storedUserId);

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
        
        const response = await axiosInstance.get(`/auth/usersettings/${userId}`);
        console.log("User profile response:", response.data);
        setUser(response.data);
        setError(null);
      } catch (error: any) {
        console.error("Error fetching user profile:", error);
        if (error.response?.status === 403) {
          // Token expired or invalid
          localStorage.removeItem("jwtToken");
          localStorage.removeItem("userId");
          window.location.href = "/login";
        } else {
          setError("Failed to load user profile");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [profileId]);

  // Nếu profileId là undefined hoặc không hợp lệ, chuyển hướng đến profile của người dùng hiện tại
  useEffect(() => {
    if ((!profileId || profileId === "undefined") && currentUserId) {
      router.push(`/profile/${currentUserId}`);
    }
  }, [profileId, currentUserId, router]);

  if (error) {
    return (
      <Layout userId={currentUserId || ""} disableWebSocket={true}>
        <div className="max-w-4xl mx-auto p-4">
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            <p>{error}</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout userId={currentUserId || ""} disableWebSocket={true}>
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center p-8">Loading profile...</div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="bg-white shadow rounded-lg mb-6">
              {/* Cover Photo */}
              <div className="h-64 bg-gray-300 rounded-t-lg"></div>
              
              {/* Profile Info */}
              <div className="p-6">
                <div className="flex items-center space-x-6">
                  <div className="h-32 w-32 -mt-16 bg-white rounded-full border-4 border-white">
                    {user?.profilePicture ? (
                      <img
                        src={user.profilePicture}
                        alt={user.username}
                        className="h-32 w-32 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-32 w-32 rounded-full bg-gray-200 flex items-center justify-center">
                        <span className="text-4xl text-gray-400">{user?.username?.[0]?.toUpperCase()}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <h1 className="text-2xl font-bold">{user?.fullName || user?.username}</h1>
                    <p className="text-gray-600">@{user?.username}</p>
                    <p className="text-gray-500">ID: {user?.id}</p>
                    {user?.bio && <p className="mt-2">{user.bio}</p>}
                    <p className="text-sm text-gray-500 mt-1">
                      Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </div>
                </div>
                
                {/* Profile Actions */}
                <div className="mt-6 flex space-x-4">
                  {!isCurrentUser && (
                    <>
                      <button 
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                      >
                        Add Friend
                      </button>
                      <Link 
                        href={`/chat/${user?.id}`}
                        className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
                      >
                        Message
                      </Link>
                    </>
                  )}
                  {isCurrentUser && (
                    <Link 
                      href="/settings"
                      className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
                    >
                      Edit Profile
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Content */}
            <div className="grid grid-cols-3 gap-6">
              {/* Left Column */}
              <div className="col-span-2">
                {/* About Section */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4">About</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Username</h3>
                      <p className="text-gray-600">@{user?.username}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Email</h3>
                      <p className="text-gray-600">{user?.email}</p>
                    </div>
                    {user?.bio && (
                      <div>
                        <h3 className="font-semibold">Bio</h3>
                        <p className="text-gray-600">{user.bio}</p>
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold">Account Settings</h3>
                      <p className="text-gray-600">
                        {user?.settings?.isPrivate ? 'Private Account' : 'Public Account'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Column */}
              <div>
                {/* Profile Settings */}
                <div className="bg-white shadow rounded-lg p-6 mb-6">
                  <h2 className="text-xl font-bold mb-4">Profile Settings</h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="font-semibold">Theme</h3>
                      <p className="text-gray-600 capitalize">{user?.settings?.theme || 'Light'}</p>
                    </div>
                    <div>
                      <h3 className="font-semibold">Notifications</h3>
                      <p className="text-gray-600">
                        {user?.settings?.notificationsEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage; 