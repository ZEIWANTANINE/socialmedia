package com.social.socialmedia.controller;

import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.http.HttpStatus;

import com.social.socialmedia.model.Friend;
import com.social.socialmedia.model.FriendId;
import com.social.socialmedia.model.FriendRequest;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.FriendRequestService;
import com.social.socialmedia.service.FriendService;
import com.social.socialmedia.service.UserInfoService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/friendrequests")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
@Slf4j
public class FriendRequestController {
    @Autowired
    private FriendRequestService friendRequestService;

    @Autowired
    private UserInfoService userInfoService;
    
    @Autowired
    private FriendService friendService;

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Get all friend requests
    @GetMapping
    public ResponseEntity<List<FriendRequest>> getAllFriendRequests() {
        List<FriendRequest> friendRequests = friendRequestService.getAllFriendRequests();
        return ResponseEntity.ok(friendRequests);
    }

    // Get friend requests sent by a user
    @GetMapping("/sent")
    public ResponseEntity<List<Map<String, Object>>> getSentFriendRequests(Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        if (currentUser == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(null);
        }
        
        List<FriendRequest> requests = friendRequestService.getFriendRequestsBySenderId(currentUser.getId());
        List<Map<String, Object>> result = requests.stream()
            .map(req -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", req.getId());
                map.put("status", req.getStatus());
                map.put("createdAt", req.getCreatedAt());
                
                Map<String, Object> receiverMap = new HashMap<>();
                receiverMap.put("id", req.getReceiver().getId());
                receiverMap.put("username", req.getReceiver().getUsername());
                receiverMap.put("profilePicture", req.getReceiver().getProfilePicture());
                
                map.put("receiver", receiverMap);
                return map;
            })
            .toList();
        
        return ResponseEntity.ok(result);
    }

    // Get friend requests received by a user
    @GetMapping("/received")
    public ResponseEntity<List<Map<String, Object>>> getReceivedFriendRequests(Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        UserInfo receiver = new UserInfo();
        receiver.setId(currentUser.getId());
        
        List<FriendRequest> requests = friendRequestService.getPendingFriendRequestsByReceiverId(currentUser.getId());
        List<Map<String, Object>> result = requests.stream()
            .map(req -> {
                Map<String, Object> map = new HashMap<>();
                map.put("id", req.getId());
                map.put("status", req.getStatus());
                map.put("createdAt", req.getCreatedAt());
                
                Map<String, Object> senderMap = new HashMap<>();
                senderMap.put("id", req.getSender().getId());
                senderMap.put("username", req.getSender().getUsername());
                senderMap.put("profilePicture", req.getSender().getProfilePicture());
                
                map.put("sender", senderMap);
                return map;
            })
            .toList();
        
        return ResponseEntity.ok(result);
    }

    // Get a specific friend request
    @GetMapping("/{friendRequestId}")
    public ResponseEntity<FriendRequest> getFriendRequestById(@PathVariable Long friendRequestId) {
        Optional<FriendRequest> friendRequest = friendRequestService.getFriendRequestById(friendRequestId);
        return friendRequest.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    // Send a friend request
    @PostMapping("/{receiverId}")
    public ResponseEntity<?> sendFriendRequest(@PathVariable Long receiverId, Authentication authentication) {
        try {
            log.info("Processing friend request from {} to user ID: {}", authentication.getName(), receiverId);
            
            // Get current user
            UserInfo sender = userInfoService.findByEmail(authentication.getName());
            if (sender == null) {
                log.error("Sender not found: {}", authentication.getName());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            log.info("Sender found: {} (ID: {})", sender.getUsername(), sender.getId());
            
            // Check if receiver ID is the same as sender ID
            if (sender.getId().equals(receiverId)) {
                log.error("Cannot send friend request to yourself");
                return ResponseEntity.badRequest().body("Cannot send friend request to yourself");
            }
            
            // Get receiver user
            UserInfo receiver = userInfoService.findById(receiverId);
            if (receiver == null) {
                log.error("Receiver not found: ID {}", receiverId);
                return ResponseEntity.badRequest().body("Receiver not found");
            }
            
            log.info("Receiver found: {} (ID: {})", receiver.getUsername(), receiver.getId());
            
            // Check if already friends
            FriendId friendId1 = new FriendId();
            friendId1.setUser1Id(sender.getId());
            friendId1.setUser2Id(receiverId);
            
            FriendId friendId2 = new FriendId();
            friendId2.setUser1Id(receiverId);
            friendId2.setUser2Id(sender.getId());
            
            if (friendService.getFriendById(friendId1).isPresent() || friendService.getFriendById(friendId2).isPresent()) {
                log.info("Already friends");
                return ResponseEntity.badRequest().body("Already friends");
            }
            
            // Check if a request already exists
            List<FriendRequest> existingRequests = friendRequestService.getFriendRequestsBySenderId(sender.getId());
            for (FriendRequest req : existingRequests) {
                if (req.getReceiver().getId().equals(receiverId) && req.getStatus().equals("pending")) {
                    log.info("Friend request already exists, ID: {}", req.getId());
                    return ResponseEntity.badRequest().body("Friend request already sent");
                }
            }
            
            // Create and save the friend request
            FriendRequest friendRequest = new FriendRequest();
            friendRequest.setSender(sender);
            friendRequest.setReceiver(receiver);
            friendRequest.setStatus("pending");
            
            FriendRequest savedRequest = friendRequestService.saveFriendRequest(friendRequest);
            log.info("Saved friend request, ID: {}", savedRequest.getId());
            
            // Send notification via WebSocket
            try {
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "FRIEND_REQUEST");
                notification.put("id", savedRequest.getId());
                notification.put("senderId", sender.getId());
                notification.put("senderUsername", sender.getUsername());
                notification.put("senderProfilePicture", sender.getProfilePicture());
                notification.put("message", sender.getUsername() + " sent you a friend request");
                notification.put("timestamp", System.currentTimeMillis());
                
                log.info("Sending WebSocket notification to: {}", receiver.getEmail());
                
                messagingTemplate.convertAndSendToUser(
                    receiver.getEmail(),
                    "/queue/notifications",
                    notification
                );
                
                log.info("Notification sent successfully");
            } catch (Exception e) {
                log.error("Error sending WebSocket notification: {}", e.getMessage(), e);
            }
            
            // Return detailed response for frontend
            Map<String, Object> response = new HashMap<>();
            response.put("id", savedRequest.getId());
            response.put("status", savedRequest.getStatus());
            response.put("createdAt", savedRequest.getCreatedAt());
            response.put("receiver", Map.of(
                "id", receiver.getId(),
                "username", receiver.getUsername(),
                "profilePicture", receiver.getProfilePicture()
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error processing friend request: {}", e.getMessage(), e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body("Error processing friend request: " + e.getMessage());
        }
    }
    
    // Accept a friend request
    @PutMapping("/{requestId}/accept")
    public ResponseEntity<?> acceptFriendRequest(@PathVariable Long requestId, Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        
        Optional<FriendRequest> requestOpt = friendRequestService.getFriendRequestById(requestId);
        if (requestOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        FriendRequest request = requestOpt.get();
        
        // Verify the current user is the receiver
        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body("You can only accept requests sent to you");
        }
        
        // Update request status
        request.setStatus("accepted");
        friendRequestService.saveFriendRequest(request);
        
        // Create friendship
        Friend friendship = new Friend();
        FriendId friendId = new FriendId();
        friendId.setUser1Id(request.getSender().getId());
        friendId.setUser2Id(request.getReceiver().getId());
        
        friendship.setId(friendId);
        friendship.setUser1(request.getSender());
        friendship.setUser2(request.getReceiver());
        
        friendService.saveFriend(friendship);
        
        // Notify the sender via WebSocket
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "FRIEND_REQUEST_ACCEPTED");
        notification.put("id", request.getId());
        notification.put("accepterId", currentUser.getId());
        notification.put("accepterUsername", currentUser.getUsername());
        notification.put("message", currentUser.getUsername() + " accepted your friend request");
        
        messagingTemplate.convertAndSendToUser(
            request.getSender().getEmail(),
            "/queue/notifications",
            notification
        );
        
        return ResponseEntity.ok(Map.of("message", "Friend request accepted", "requestId", requestId));
    }
    
    // Reject a friend request
    @PutMapping("/{requestId}/reject")
    public ResponseEntity<?> rejectFriendRequest(@PathVariable Long requestId, Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        
        Optional<FriendRequest> requestOpt = friendRequestService.getFriendRequestById(requestId);
        if (requestOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        FriendRequest request = requestOpt.get();
        
        // Verify the current user is the receiver
        if (!request.getReceiver().getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body("You can only reject requests sent to you");
        }
        
        // Update request status
        request.setStatus("rejected");
        friendRequestService.saveFriendRequest(request);
        
        // Notify the sender via WebSocket
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "FRIEND_REQUEST_REJECTED");
        notification.put("id", request.getId());
        notification.put("rejecterId", currentUser.getId());
        notification.put("message", "Your friend request was rejected");
        
        messagingTemplate.convertAndSendToUser(
            request.getSender().getEmail(),
            "/queue/notifications",
            notification
        );
        
        return ResponseEntity.ok(Map.of("message", "Friend request rejected", "requestId", requestId));
    }

    // Delete/cancel a friend request
    @DeleteMapping("/{requestId}")
    public ResponseEntity<?> deleteFriendRequest(@PathVariable Long requestId, Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        
        Optional<FriendRequest> requestOpt = friendRequestService.getFriendRequestById(requestId);
        if (requestOpt.isEmpty()) {
        return ResponseEntity.notFound().build();
    }

        FriendRequest request = requestOpt.get();
        
        // Verify the current user is the sender
        if (!request.getSender().getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body("You can only cancel requests you sent");
        }
        
        friendRequestService.deleteFriendRequest(requestId);
        
        return ResponseEntity.ok(Map.of("message", "Friend request cancelled", "requestId", requestId));
    }
}
