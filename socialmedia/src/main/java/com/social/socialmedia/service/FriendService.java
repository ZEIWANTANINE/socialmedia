package com.social.socialmedia.service;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import com.social.socialmedia.model.Friend;
import com.social.socialmedia.model.FriendId;
import com.social.socialmedia.repository.FriendRepository;
@Service
public class FriendService {
    @Autowired
    private FriendRepository friendRepository;

    public List<Friend> getAllFriends() {
        return friendRepository.findAll();
    }

    public List<Friend> getFriendsByUser1Id(Long user1Id) {
        return friendRepository.findByUser1Id(user1Id);
    }

    public List<Friend> getFriendsByUser2Id(Long user2Id) {
        return friendRepository.findByUser2Id(user2Id);
    }

    public Optional<Friend> getFriendById(FriendId friendId) {
        if (friendId == null || friendId.getUser1Id() == null || friendId.getUser2Id() == null) {
            System.err.println("Invalid FriendId: " + (friendId == null ? "null" : 
                "user1Id=" + friendId.getUser1Id() + ", user2Id=" + friendId.getUser2Id()));
            return Optional.empty();
        }
        
        try {
            return friendRepository.findById(friendId);
        } catch (Exception e) {
            System.err.println("Error finding friend by ID: " + e.getMessage());
            e.printStackTrace();
            return Optional.empty();
        }
    }

    public Friend saveFriend(Friend friend) {
        return friendRepository.save(friend);
    }

    public void deleteFriend(FriendId friendId) {
        friendRepository.deleteById(friendId);
    }
}
