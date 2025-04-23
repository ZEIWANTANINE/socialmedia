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
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    // Lấy userId từ localStorage
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      console.log("Stored userId:", storedUserId);
    } else {
      console.error("User ID not found. Redirecting to login...");
      window.location.href = "/login"; // Điều hướng đến trang đăng nhập nếu userId không tồn tại
    }

    const fetchPosts = async () => {
      try {
        const response = await axiosInstance.get(apiEndpoints.posts);
        console.log("Posts fetched from backend:", response.data);
        
        // Lọc các bài viết hợp lệ (loại bỏ các phần tử không phải là đối tượng bài viết)
        const validPosts = response.data.filter((post: any) => post && post.id);
        console.log("Valid posts:", validPosts);
        
        setPosts(validPosts); // Cập nhật state với các bài viết hợp lệ
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
      if (!token) {
        throw new Error("JWT token not found in localStorage");
      }

      const response = await axios.post("http://localhost:6789/posts", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
      console.log("Post created:", response.data);
      setPosts([response.data, ...posts]);
      setNewPost("");
      setFile(null);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLike = (postId: number) => {
    console.log(`Liked post with ID: ${postId}`);
  };

  const handleComment = (postId: number) => {
    console.log(`Commented on post with ID: ${postId}`);
  };

  return (
    <Layout userId={userId || ""}>
      <div className="flex justify-center">
        <div className="w-full max-w-2xl">
          {/* Create Post Form */}
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
          {Array.isArray(posts) && posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id} // Sử dụng post.id nếu có, đảm bảo không trùng lặp
                className="p-4 border rounded mb-4 bg-white shadow"
              >
                <p className="my-2">{post.content || ""}</p>

                {/* Display media */}
                {post.mediaUrlBase64 && post.mediaType && (
                  <div className="mt-2">
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

                <div className="flex justify-between mt-2 border-t pt-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className="text-gray-600 hover:text-blue-500"
                  >
                    Like
                  </button>
                  <button
                    onClick={() => handleComment(post.id)}
                    className="text-gray-600 hover:text-blue-500"
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
