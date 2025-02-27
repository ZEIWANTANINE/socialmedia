package com.social.socialmedia.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.social.socialmedia.model.FriendRequest;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.repository.FriendRequestRepository;
@Service
public class FriendRequestService {
    @Autowired
    private FriendRequestRepository friendRequestRepository;

    public List<FriendRequest> getAllFriendRequests() {
        return friendRequestRepository.findAll();
    }

    public List<FriendRequest> getFriendRequestsBySenderId(Long senderId) {
        UserInfo sender = new UserInfo();
        sender.setId(senderId);//long to Long
        return friendRequestRepository.findBySenderId(sender);
    }

    public List<FriendRequest> getFriendRequestsByReceiverId(Long receiverId) {
        UserInfo receiver = new UserInfo();
        receiver.setId(receiverId);
        return friendRequestRepository.findByReceiverId(receiver);
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
