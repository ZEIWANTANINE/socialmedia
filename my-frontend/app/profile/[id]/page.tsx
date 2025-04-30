"use client";
import React, { useState, useEffect } from "react";
import Layout from "../../components/Layout";
import axiosInstance from "../../utils/axiosInstance";
import { useParams } from "next/navigation";
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
}

interface Post {
  id: number;
  content: string;
  mediaUrlBase64: string | null;
  mediaType: string | null;
  createdAt: string;
}

const ProfilePage: React.FC = () => {
  const params = useParams();
  const profileId = params?.id as string;
  
  const [user, setUser] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isCurrentUser, setIsCurrentUser] = useState(false);

  useEffect(() => {
    // Lấy ID người dùng hiện tại từ localStorage
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCurrentUserId(storedUserId);
      // Kiểm tra xem profile đang xem có phải là của người dùng hiện tại
      setIsCurrentUser(storedUserId === profileId);
    } else {
      console.error("User ID not found. Redirecting to login...");
      window.location.href = "/login";
      return;
    }

    const fetchUserProfile = async () => {
      try {
        const response = await axiosInstance.get(`${apiEndpoints.users}/${profileId}`);
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    const fetchUserPosts = async () => {
      try {
        const response = await axiosInstance.get(`${apiEndpoints.posts}/user/${profileId}`);
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchUserProfile();
      fetchUserPosts();
    }
  }, [profileId]);

  const handleAddFriend = async () => {
    try {
      await axiosInstance.post(apiEndpoints.friendRequests, {
        sender: { id: parseInt(currentUserId || "0") },
        receiver: { id: parseInt(profileId) },
        status: "pending"
      });
      alert("Friend request sent!");
    } catch (error) {
      console.error("Error sending friend request:", error);
      alert("Failed to send friend request. Please try again.");
    }
  };

  return (
    <Layout userId={currentUserId || ""}>
      <div className="max-w-4xl mx-auto">
        {loading ? (
          <div className="text-center p-8">Loading profile...</div>
        ) : (
          <>
            {/* Profile Header */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              {user ? (
                <>
                  <div className="flex items-center space-x-6">
                    <div className="h-32 w-32 bg-gray-300 rounded-full">
                      {user.profilePicture && (
                        <img
                          src={user.profilePicture}
                          alt={user.username}
                          className="h-32 w-32 rounded-full object-cover"
                        />
                      )}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{user.fullName || user.username}</h1>
                      <p className="text-gray-600">@{user.username}</p>
                      {user.bio && <p className="mt-2">{user.bio}</p>}
                      <p className="text-sm text-gray-500 mt-1">
                        Member since {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  {!isCurrentUser && (
                    <div className="mt-6 flex space-x-4">
                      <button 
                        onClick={handleAddFriend}
                        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                      >
                        Add Friend
                      </button>
                      <Link 
                        href={`/chat/${user.id}`}
                        className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
                      >
                        Message
                      </Link>
                    </div>
                  )}
                </>
              ) : (
                <p>User not found</p>
              )}
            </div>

            {/* User Posts */}
            <div className="bg-white shadow rounded-lg p-6 mb-6">
              <h2 className="text-xl font-bold mb-4">Posts</h2>

              {posts.length === 0 ? (
                <p className="text-center py-4 text-gray-500">No posts yet</p>
              ) : (
                <div className="space-y-6">
                  {posts.map((post) => (
                    <div key={post.id} className="border-b pb-4 last:border-b-0">
                      <p className="mb-3">{post.content}</p>
                      
                      {post.mediaUrlBase64 && post.mediaType && (
                        <div className="mb-3">
                          {post.mediaType.startsWith("image/") && (
                            <img
                              src={post.mediaUrlBase64}
                              alt="Post media"
                              className="max-w-full h-auto rounded"
                            />
                          )}
                          {post.mediaType.startsWith("video/") && (
                            <video
                              src={post.mediaUrlBase64}
                              controls
                              className="max-w-full h-auto rounded"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      )}
                      
                      <div className="flex justify-between text-sm text-gray-500">
                        <span>{new Date(post.createdAt).toLocaleString()}</span>
                        <div>
                          <button className="mr-3 hover:text-blue-500">Like</button>
                          <button className="hover:text-blue-500">Comment</button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage; 