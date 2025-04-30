"use client";
import React, { useState, useEffect } from "react";
import axiosInstance from "../../utils/axiosInstance";
import { apiEndpoints } from "../../utils/api";
import Layout from "../../components/Layout";
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Link from "next/link";

interface FriendRequest {
  id: number;
  sender: {
    id: number;
    username: string;
    fullName: string | null;
    profilePicture: string | null;
  };
  receiver: {
    id: number;
  };
  status: string;
  createdAt: string;
}

const FriendRequestsPage: React.FC = () => {
  const [receivedRequests, setReceivedRequests] = useState<FriendRequest[]>([]);
  const [sentRequests, setSentRequests] = useState<FriendRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'received' | 'sent'>('received');

  useEffect(() => {
    // Lấy userId từ localStorage
    const storedUserId = localStorage.getItem("userId");
    if (storedUserId) {
      setCurrentUserId(storedUserId);
    } else {
      console.error("User ID not found. Redirecting to login...");
      window.location.href = "/login";
      return;
    }

    // Fetch các yêu cầu kết bạn đã nhận
    const fetchReceivedRequests = async () => {
      try {
        const response = await axiosInstance.get(`${apiEndpoints.friendRequests}/receiver/${storedUserId}`);
        setReceivedRequests(response.data.filter((req: FriendRequest) => req.status === 'pending'));
      } catch (error) {
        console.error("Error fetching received friend requests:", error);
      }
    };

    // Fetch các yêu cầu kết bạn đã gửi
    const fetchSentRequests = async () => {
      try {
        const response = await axiosInstance.get(`${apiEndpoints.friendRequests}/sender/${storedUserId}`);
        setSentRequests(response.data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching sent friend requests:", error);
        setLoading(false);
      }
    };

    fetchReceivedRequests();
    fetchSentRequests();
  }, []);

  // Chấp nhận lời mời kết bạn
  const acceptFriendRequest = async (requestId: number) => {
    try {
      await axiosInstance.put(`${apiEndpoints.friendRequests}/${requestId}/accept`);
      
      // Cập nhật danh sách yêu cầu
      setReceivedRequests(receivedRequests.filter(req => req.id !== requestId));
      toast.success("Friend request accepted!");
    } catch (error) {
      console.error("Error accepting friend request:", error);
      toast.error("Failed to accept friend request.");
    }
  };

  // Từ chối lời mời kết bạn
  const rejectFriendRequest = async (requestId: number) => {
    try {
      await axiosInstance.put(`${apiEndpoints.friendRequests}/${requestId}/reject`);
      
      // Cập nhật danh sách yêu cầu
      setReceivedRequests(receivedRequests.filter(req => req.id !== requestId));
      toast.info("Friend request rejected.");
    } catch (error) {
      console.error("Error rejecting friend request:", error);
      toast.error("Failed to reject friend request.");
    }
  };

  // Hủy yêu cầu kết bạn đã gửi
  const cancelFriendRequest = async (requestId: number) => {
    try {
      await axiosInstance.delete(`${apiEndpoints.friendRequests}/${requestId}`);
      
      // Cập nhật danh sách yêu cầu
      setSentRequests(sentRequests.filter(req => req.id !== requestId));
      toast.info("Friend request canceled.");
    } catch (error) {
      console.error("Error canceling friend request:", error);
      toast.error("Failed to cancel friend request.");
    }
  };

  return (
    <Layout userId={currentUserId || ""}>
      <div className="p-4">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Friend Requests</h1>
          <Link href="/friend" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
            Find Friends
          </Link>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b mb-4">
          <button
            className={`px-4 py-2 ${activeTab === 'received' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
            onClick={() => setActiveTab('received')}
          >
            Received ({receivedRequests.length})
          </button>
          <button
            className={`px-4 py-2 ${activeTab === 'sent' ? 'border-b-2 border-blue-500 font-bold' : ''}`}
            onClick={() => setActiveTab('sent')}
          >
            Sent ({sentRequests.length})
          </button>
        </div>
        
        {loading ? (
          <p>Loading friend requests...</p>
        ) : (
          <div>
            {activeTab === 'received' && (
              <div className="space-y-4">
                {receivedRequests.length === 0 ? (
                  <p>No pending friend requests.</p>
                ) : (
                  receivedRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded shadow">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-300 rounded-full mr-4">
                          {request.sender.profilePicture && (
                            <img
                              src={request.sender.profilePicture}
                              alt={request.sender.username}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold">{request.sender.fullName || request.sender.username}</h3>
                          <p className="text-gray-600 text-sm">@{request.sender.username}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => acceptFriendRequest(request.id)}
                          className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                        >
                          Accept
                        </button>
                        <button
                          onClick={() => rejectFriendRequest(request.id)}
                          className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
            
            {activeTab === 'sent' && (
              <div className="space-y-4">
                {sentRequests.length === 0 ? (
                  <p>No sent friend requests.</p>
                ) : (
                  sentRequests.map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 border rounded shadow">
                      <div className="flex items-center">
                        <div className="h-12 w-12 bg-gray-300 rounded-full mr-4">
                          {request.sender.profilePicture && (
                            <img
                              src={request.sender.profilePicture}
                              alt={request.sender.username}
                              className="h-12 w-12 rounded-full object-cover"
                            />
                          )}
                        </div>
                        <div>
                          <h3 className="font-bold">{request.sender.fullName || request.sender.username}</h3>
                          <p className="text-gray-600 text-sm">Status: {request.status}</p>
                        </div>
                      </div>
                      {request.status === 'pending' && (
                        <button
                          onClick={() => cancelFriendRequest(request.id)}
                          className="bg-gray-500 text-white px-3 py-1 rounded hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        )}
      </div>
      <ToastContainer position="bottom-right" />
    </Layout>
  );
};

export default FriendRequestsPage; 