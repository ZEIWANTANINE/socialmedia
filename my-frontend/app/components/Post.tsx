"use client";
import React, { useState, useEffect } from 'react';
import axiosInstance from '../utils/axiosInstance';
import { apiEndpoints } from '../utils/api';

interface PostProps {
  post: {
    id: number;
    content: string;
    user: {
      username: string;
    };
  };
  onDelete: (postId: number) => void;
}

interface Comment {
  id: number;
  content: string;
  user: {
    username: string;
  };
  createdAt: string;
}

export default function Post({ post, onDelete }: PostProps) {
  const [likes, setLikes] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [showComments, setShowComments] = useState(false);

  useEffect(() => {
    fetchLikes();
    fetchComments();
  }, [post.id]);

  const fetchLikes = async () => {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.posts}/${post.id}/likes`);
      setLikes(response.data.length);
      // Check if current user has liked the post
      const hasLiked = response.data.some((like: any) => 
        like.user.username === localStorage.getItem('username')
      );
      setIsLiked(hasLiked);
    } catch (error) {
      console.error('Error fetching likes:', error);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await axiosInstance.get(`${apiEndpoints.posts}/${post.id}/comments`);
      setComments(response.data);
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };

  const handleLike = async () => {
    try {
      await axiosInstance.post(`${apiEndpoints.posts}/${post.id}/like`);
      fetchLikes();
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await axiosInstance.post(`${apiEndpoints.posts}/${post.id}/comment`, newComment);
      setNewComment('');
      fetchComments();
    } catch (error) {
      console.error('Error adding comment:', error);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold">{post.user.username}</h3>
          <p className="mt-2">{post.content}</p>
        </div>
        <button
          onClick={() => onDelete(post.id)}
          className="text-red-500 hover:text-red-700"
        >
          Delete
        </button>
      </div>
      
      <div className="mt-4 flex items-center space-x-4">
        <button
          onClick={handleLike}
          className={`flex items-center space-x-1 ${
            isLiked ? 'text-blue-500' : 'text-gray-500'
          }`}
        >
          <span>❤️</span>
          <span>{likes}</span>
        </button>
        
        <button
          onClick={() => setShowComments(!showComments)}
          className="text-gray-500 hover:text-gray-700"
        >
          💬 {comments.length}
        </button>
      </div>

      {showComments && (
        <div className="mt-4">
          <form onSubmit={handleComment} className="mb-4">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="w-full p-2 border rounded"
            />
            <button
              type="submit"
              className="mt-2 bg-blue-500 text-white px-4 py-2 rounded"
            >
              Comment
            </button>
          </form>

          <div className="space-y-2">
            {comments.map((comment) => (
              <div key={comment.id} className="bg-gray-50 p-2 rounded">
                <div className="font-bold">{comment.user.username}</div>
                <div>{comment.content}</div>
                <div className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
} 