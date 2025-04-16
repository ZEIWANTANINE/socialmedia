"use client";

import React, { useState } from "react";
import Modal from "react-modal";

interface CommentModalProps {
  isOpen: boolean;
  onRequestClose: () => void;
  post: { id: number; content: string; likes: number; comments: number };
  setPage: React.Dispatch<React.SetStateAction<string>>;
}

const CommentModal: React.FC<CommentModalProps> = ({ isOpen, onRequestClose, post, setPage }) => {
  const [comment, setComment] = useState("");

  // Set the app element for accessibility
  Modal.setAppElement("#__next");

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Comment submitted:", comment);
    setComment("");
    onRequestClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      className="bg-white p-4 rounded shadow-lg max-w-md mx-auto mt-20"
      overlayClassName="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center"
    >
      <div>
        <div className="mb-4">
          <p>{post.content}</p>
          <img src="path/to/image.jpg" alt="Post" className="w-full h-auto rounded" />
        </div>
        <div className="flex justify-between mb-4">
          <button className="text-blue-500">Like ({post.likes})</button>
          <button className="text-blue-500">Comment ({post.comments})</button>
          <button className="text-blue-500">Share</button>
        </div>
        <form onSubmit={handleCommentSubmit} className="space-y-2">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
            className="w-full p-2 border rounded"
          />
          <button type="submit" className="w-full bg-blue-500 text-white p-2 rounded">
            Comment
          </button>
        </form>
      </div>
    </Modal>
  );
};

export default CommentModal;