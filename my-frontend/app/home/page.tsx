"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "../utils/axiosInstance";
import Layout from "../components/Layout";
import { apiEndpoints } from "../utils/api";
import axios from "axios";

interface Comment {
  id: number;
  content: string;
  user: {
    username: string;
  };
  createdAt: string;
}

interface Post {
  id: number;
  content: string;
  mediaUrlBase64?: string;
  mediaType?: string;
  likes: number;
  comments: Comment[];
  hasLiked: boolean;
  username?: string;
  createdAt?: string;
}

const HomePage: React.FC = () => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [newPost, setNewPost] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [newComment, setNewComment] = useState("");
  const [showCommentModal, setShowCommentModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setUserId(storedUserId);
      fetchPosts();
    } else {
      console.error("User ID not found. Redirecting to login...");
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    fetchPosts();
    
    const intervalId = setInterval(() => {
      fetchPosts();
    }, 30000);
    
    return () => clearInterval(intervalId);
  }, [userId]);

    const fetchPosts = async () => {
    setLoading(true);
    setError(null);
    
      try {
      const token = localStorage.getItem("jwtToken");
      const username = localStorage.getItem("username");
      if (!token || !username) {
        console.error("Token or username not found in localStorage");
        window.location.href = "/"; // Redirect to login page
        return;
      }

      console.log(`Fetching posts for user: ${username} with token: ${token.substring(0, 10)}...`);
      const response = await axiosInstance.get(`${apiEndpoints.posts}/user/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      console.log("Raw response data:", response.data);

      if (!Array.isArray(response.data)) {
        console.error("Expected array of posts but got:", typeof response.data);
        setError("Invalid data format received from server");
        setPosts([]);
        setLoading(false);
        return;
      }

      // Process and validate each post
      const validPosts = response.data
        .filter((item: any) => {
          const isValid = typeof item === 'object' && item !== null && 'id' in item;
          if (!isValid) {
            console.warn("Invalid post item:", item);
          }
          return isValid;
        })
        .map((post: any) => {
          // Ensure mediaUrlBase64 is properly formatted
          if (post.mediaUrlBase64 && !post.mediaUrlBase64.startsWith('data:')) {
            console.log("Fixing mediaUrlBase64 format for post", post.id);
            post.mediaUrlBase64 = `data:${post.mediaType || 'image/jpeg'};base64,${post.mediaUrlBase64}`;
          }
          
          // Ensure all required properties are present
          return {
            ...post,
            content: post.content || "",
            likes: typeof post.likes === 'number' ? post.likes : 0,
            comments: Array.isArray(post.comments) ? post.comments : [],
            username: post.username || "Unknown User"
          };
        });

      console.log(`Processed ${validPosts.length} valid posts:`, validPosts);
      setPosts(validPosts);
      
      if (validPosts.length === 0) {
        setError("No posts found. Create your first post!");
      }
    } catch (error) {
      console.error("Error fetching posts by user:", error);
      setError("Error loading posts. Please try again later.");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  };
  

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

      const response = await axiosInstance.post(apiEndpoints.posts, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          "Authorization": `Bearer ${token}`
        }
      });
      
      if (response.data && typeof response.data === 'object' && 'id' in response.data) {
        await fetchPosts(); // Load lại dữ liệu từ server
      }
      setNewPost("");
      setFile(null);
    } catch (error) {
      console.error("Error creating post:", error);
    }
  };

  const handleLike = async (postId: number) => {
    try {
      const token = localStorage.getItem("jwtToken");
      if (!token) {
        console.error("JWT token not found in localStorage");
        window.location.href = "/login";
        return;
      }

      console.log(`Sending like request for post ID: ${postId}`);
      const response = await axiosInstance.post(
        `${apiEndpoints.posts}/${postId}/like`,
        {},
        {
          headers: {
            "Authorization": `Bearer ${token}`
          }
        }
      );

      console.log("Like response:", response.data);
      
      // Cập nhật trạng thái like trong danh sách posts
      setPosts(posts.map(post => 
        post.id === postId 
          ? { 
              ...post, 
              likes: response.data.likeCount,
              hasLiked: response.data.liked 
            }
          : post
      ));
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId: number) => {
    setSelectedPostId(postId);
    setShowCommentModal(true);
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPostId || !newComment.trim()) return;

    try {
      const response = await axiosInstance.post(
        `${apiEndpoints.posts}/${selectedPostId}/comments`,
        { content: newComment }
      );

      setPosts(posts.map(post => 
        post.id === selectedPostId 
          ? { 
              ...post, 
              comments: post.comments ? [...post.comments, response.data] : [response.data] 
            }
          : post
      ));

      setNewComment("");
      setShowCommentModal(false);
    } catch (error) {
      console.error("Error adding comment:", error);
    }
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

          {/* Loading state */}
          {loading && (
            <div className="text-center py-4">
              <p className="text-gray-600">Loading posts...</p>
            </div>
          )}
          
          {/* Error state */}
          {error && !loading && (
            <div className="text-center py-4">
              <p className="text-red-500">{error}</p>
            </div>
          )}

          {/* List Posts */}
          {!loading && !error && Array.isArray(posts) && posts.length > 0 ? (
            posts.map((post) => (
              <div
                key={post.id}
                className="p-4 border rounded mb-4 bg-white shadow"
              >
                <div className="flex items-center mb-2">
                  <div className="font-semibold">{post.username || 'Unknown User'}</div>
                  <div className="text-xs text-gray-500 ml-2">
                    {post.createdAt ? new Date(post.createdAt).toLocaleString() : 'Unknown date'}
                  </div>
                </div>
                
                <p className="my-2">{post.content || ""}</p>

                {/* Display media */}
                {post.mediaUrlBase64 && (
                  <div className="mt-2">
                    {post.mediaType && post.mediaType.startsWith("image/") ? (
                      <img
                        src={post.mediaUrlBase64}
                        alt="Post media"
                        className="max-w-full h-auto rounded"
                        onError={(e) => {
                          console.error("Image failed to load:", post.mediaUrlBase64?.substring(0, 50) + "...");
                          e.currentTarget.src = "https://via.placeholder.com/400x300?text=Image+Error";
                        }}
                      />
                    ) : post.mediaType && post.mediaType.startsWith("video/") ? (
                      <video
                        src={post.mediaUrlBase64}
                        controls
                        className="max-w-full h-auto rounded"
                        onError={(e) => console.error("Video failed to load:", e)}
                      >
                        Your browser does not support the video tag.
                      </video>
                    ) : (
                      <div className="bg-gray-200 p-4 rounded text-center">
                        Media attachment (type: {post.mediaType || "unknown"})
                      </div>
                    )}
                  </div>
                )}

                <div className="flex justify-between mt-2 border-t pt-2">
                  <button
                    onClick={() => handleLike(post.id)}
                    className={`text-gray-600 hover:text-blue-500 ${post.hasLiked ? 'text-blue-500' : ''}`}
                  >
                    Like ({typeof post.likes === 'number' ? post.likes : 0})
                  </button>
                  <button
                    onClick={() => handleComment(post.id)}
                    className="text-gray-600 hover:text-blue-500"
                  >
                    Comment ({Array.isArray(post.comments) ? post.comments.length : 0})
                  </button>
                </div>

                {/* Comments Section */}
                {Array.isArray(post.comments) && post.comments.length > 0 && (
                  <div className="mt-2 border-t pt-2">
                    {post.comments.map((comment) => (
                      <div key={comment.id} className="mb-2">
                        <p className="text-sm font-semibold">{comment.user?.username || 'Unknown User'}</p>
                        <p className="text-sm">{comment.content}</p>
                        <p className="text-xs text-gray-500">
                          {comment.createdAt ? new Date(comment.createdAt).toLocaleString() : 'Unknown date'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          ) : !loading && !error ? (
            <p className="text-center py-4 text-gray-600">No posts available</p>
          ) : null}

          {/* Comment Modal */}
          {showCommentModal && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
              <div className="bg-white p-4 rounded-lg w-full max-w-md">
                <h2 className="text-xl font-bold mb-4">Add Comment</h2>
                <form onSubmit={handleCommentSubmit}>
                  <textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Write a comment..."
                    className="w-full p-2 border rounded mb-2"
                  />
                  <div className="flex justify-end space-x-2">
                    <button
                      type="button"
                      onClick={() => setShowCommentModal(false)}
                      className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    >
                      Comment
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
};

export default HomePage;
