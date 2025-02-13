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

import com.social.socialmedia.model.FriendRequest;
import com.social.socialmedia.service.FriendRequestService;

@RestController
@RequestMapping("/api/friendrequests")
public class FriendRequestController {
    @Autowired
    private FriendRequestService friendRequestService;

    @GetMapping
    public ResponseEntity<List<FriendRequest>> getAllFriendRequests() {
        List<FriendRequest> friendRequests = friendRequestService.getAllFriendRequests();
        return ResponseEntity.ok(friendRequests);
    }

    @GetMapping("/sender/{senderId}")
    public ResponseEntity<List<FriendRequest>> getFriendRequestsBySenderId(@PathVariable Long senderId) {
        List<FriendRequest> friendRequests = friendRequestService.getFriendRequestsBySenderId(senderId);
        return ResponseEntity.ok(friendRequests);
    }

    @GetMapping("/receiver/{receiverId}")
    public ResponseEntity<List<FriendRequest>> getFriendRequestsByReceiverId(@PathVariable Long receiverId) {
        List<FriendRequest> friendRequests = friendRequestService.getFriendRequestsByReceiverId(receiverId);
        return ResponseEntity.ok(friendRequests);
    }

    @GetMapping("/{friendRequestId}")
    public ResponseEntity<FriendRequest> getFriendRequestById(@PathVariable Long friendRequestId) {
        Optional<FriendRequest> friendRequest = friendRequestService.getFriendRequestById(friendRequestId);
        return friendRequest.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<FriendRequest> createFriendRequest(@RequestBody FriendRequest friendRequest, Authentication authentication) {
        // Assuming the username is stored in the JWT token
        String username = authentication.getName();
        // Set the sender of the friend request based on the authenticated user
        // You need to fetch the User entity based on the username
        // For example:
        // User sender = userService.findByUsername(username);
        // friendRequest.setSender(sender);
        FriendRequest savedFriendRequest = friendRequestService.saveFriendRequest(friendRequest);
        return ResponseEntity.ok(savedFriendRequest);
    }

    @DeleteMapping("/{friendRequestId}")
    public ResponseEntity<Void> deleteFriendRequest(@PathVariable Long friendRequestId) {
        friendRequestService.deleteFriendRequest(friendRequestId);
        return ResponseEntity.noContent().build();
    }
}
