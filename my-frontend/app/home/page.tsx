"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import Layout from "../components/Layout";
import { apiEndpoints } from "../utils/api";
import axios from "axios";

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<any[]>([]);
  const [newPost, setNewPost] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get(apiEndpoints.posts);
        console.log("Posts fetched from backend:", response.data); // Log dữ liệu trả về
        setPosts(response.data);
      } catch (error) {
        console.error("Error fetching posts:", error);
        setPosts([]);
      }
    };

    fetchPosts();
  }, []);

  const handlePostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("content", newPost);
    if (file) {
      formData.append("file", file);
    }

    try {
      const token = localStorage.getItem("jwtToken");
      console.log("JWT Token ở frontend:", token);
      if (!token) {
        throw new Error("JWT token not found in localStorage");
      }

      const response = await axios.post("http://localhost:6789/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`, // Include the token in the Authorization header
        },
      });
      console.log("Post created:", response.data);
      setPosts([response.data, ...posts]); // Add the new post to the list
      setNewPost("");
      setFile(null);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLike = (postId: number) => {
    console.log(`Liked post with ID: ${postId}`);
    // Gửi request đến backend để xử lý like
    // axios.post(`${apiEndpoints.posts}/${postId}/like`);
  };

  const handleComment = (postId: number) => {
    console.log(`Commented on post with ID: ${postId}`);
    // Hiển thị modal hoặc input để nhập comment
  };

  return (
    <Layout>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          {/* Create Post */}
          <form onSubmit={handlePostSubmit} className="mb-4">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's on your mind?"
              className="w-full p-2 border rounded mb-2"
            />
            <input
              type="file"
              accept="image/*,video/*"
              onChange={(e) => setFile(e.target.files ? e.target.files[0] : null)}
              className="mb-2"
            />
            <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
              Post
            </button>
          </form>

          {/* List Posts */}
          {Array.isArray(posts) ? (
            posts.map((post,index) => (
              <div key={post.id||index} className="p-4 border rounded mb-4">
                <p>{post.content ? post.content : "No content available"}</p>
                {post.mediaUrlBase64 && (
                  post.mediaType === "image" ? (
                    <img
                      src={`data:image/jpeg;base64,${post.mediaUrlBase64}`}
                      alt="Post media"
                      className="w-full rounded"
                    />
                  ) : post.mediaType === "video" ? (
                    <video controls className="w-full rounded">
                      <source src={`data:video/mp4;base64,${post.mediaUrlBase64}`} type="video/mp4" />
                      Your browser does not support the video tag.
                    </video>
                  ) : (
                    <p>Unsupported media type</p>
                  )
                )}
                <div className="flex justify-between mt-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="text-blue-500 hover:underline"
                  >
                    Like
                  </button>
                  <button
                    onClick={() => handleComment(post.id)}
                    className="text-blue-500 hover:underline"
                  >
                    Comment
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p>No posts available</p>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;