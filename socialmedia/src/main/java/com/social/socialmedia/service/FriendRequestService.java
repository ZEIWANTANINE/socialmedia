package com.social.socialmedia.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.social.socialmedia.model.FriendRequest;
import com.social.socialmedia.repository.FriendRequestRepository;

@Service
public class FriendRequestService {
    @Autowired
    private FriendRequestRepository friendRequestRepository;

    public List<FriendRequest> getAllFriendRequests() {
        return friendRequestRepository.findAll();
    }

    public List<FriendRequest> getFriendRequestsBySenderId(Long senderId) {
        return friendRequestRepository.findBySenderId(senderId);
    }

    public List<FriendRequest> getFriendRequestsByReceiverId(Long receiverId) {
        return friendRequestRepository.findByReceiverId(receiverId);
    }
    
    public List<FriendRequest> getPendingFriendRequestsByReceiverId(Long receiverId) {
        return friendRequestRepository.findByReceiverIdAndStatus(receiverId, "pending");
    }

    public Optional<FriendRequest> getFriendRequestById(Long friendRequestId) {
        return friendRequestRepository.findById(friendRequestId);
    }

    public FriendRequest saveFriendRequest(FriendRequest friendRequest) {
        return friendRequestRepository.save(friendRequest);
    }

    public void deleteFriendRequest(Long friendRequestId) {
        friendRequestRepository.deleteById(friendRequestId);
    }
}
