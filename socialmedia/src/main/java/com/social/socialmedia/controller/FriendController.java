package com.social.socialmedia.controller;

import java.util.List;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.socialmedia.model.Friend;
import com.social.socialmedia.model.FriendId;
import com.social.socialmedia.service.FriendService;

@RestController
@RequestMapping("/api/friends")
public class FriendController {
     @Autowired
    private FriendService friendService;

    @GetMapping
    public ResponseEntity<List<Friend>> getAllFriends() {
        List<Friend> friends = friendService.getAllFriends();
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/user1/{user1Id}")
    public ResponseEntity<List<Friend>> getFriendsByUser1Id(@PathVariable Long user1Id) {
        List<Friend> friends = friendService.getFriendsByUser1Id(user1Id);
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/user2/{user2Id}")
    public ResponseEntity<List<Friend>> getFriendsByUser2Id(@PathVariable Long user2Id) {
        List<Friend> friends = friendService.getFriendsByUser2Id(user2Id);
        return ResponseEntity.ok(friends);
    }

    @GetMapping("/{friendId}")
    public ResponseEntity<Friend> getFriendById(@PathVariable FriendId friendId) {
        Optional<Friend> friend = friendService.getFriendById(friendId);
        return friend.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Friend> createFriend(@RequestBody Friend friend, Authentication authentication) {
        // Assuming the username is stored in the JWT token
        String username = authentication.getName();
        // Set the user1 or user2 of the friend based on the authenticated user
        // You need to fetch the User entity based on the username
        // For example:
        // User user = userService.findByUsername(username);
        // friend.setUser1(user);
        Friend savedFriend = friendService.saveFriend(friend);
        return ResponseEntity.ok(savedFriend);
    }

    @DeleteMapping("/{friendId}")
    public ResponseEntity<Void> deleteFriend(@PathVariable FriendId friendId) {
        friendService.deleteFriend(friendId);
        return ResponseEntity.noContent().build();
    }
}
