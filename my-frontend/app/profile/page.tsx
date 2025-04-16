"use client";
import React, { useState, useEffect } from "react";
import Layout from "../components/Layout";
import axiosInstance from "../utils/axiosInstance";

const ProfilePage: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");

  useEffect(() => {
    // Fetch user profile data
    const fetchUser = async () => {
      try {
        const response = await axiosInstance.get("/api/user/profile");
        setUser(response.data);
      } catch (error) {
        console.error("Error fetching user profile:", error);
      }
    };

    // Fetch user posts
    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get("/api/user/posts");
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching user posts:", error);
      }
    };

    fetchUser();
    fetchPosts();
  }, []);

  const handlePostSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      setPosts([{ id: posts.length + 1, content: newPost, likes: 0, comments: 0 }, ...posts]);
      setNewPost("");
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Profile Header */}
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          {user ? (
            <>
              <div className="flex items-center space-x-4">
                <img
                  src={user.profilePicture || "/default-profile.png"}
                  alt="Profile"
                  className="w-24 h-24 rounded-full"
                />
                <div>
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-gray-600">{user.bio || "No bio available"}</p>
                </div>
              </div>
              <div className="mt-4 flex space-x-4">
                <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                  Add Friend
                </button>
                <button className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                  Message
                </button>
              </div>
            </>
          ) : (
            <p>Loading profile...</p>
          )}
        </div>

        {/* Create Post */}
        <div className="bg-white shadow rounded-lg p-4 mb-4">
          <form onSubmit={handlePostSubmit}>
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 border rounded mb-2"
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
              Post
            </button>
          </form>
        </div>

        {/* User Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white shadow rounded-lg p-4">
              <p>{post.content}</p>
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <button className="text-blue-500">Like ({post.likes})</button>
                <button className="text-blue-500">Comment ({post.comments})</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;