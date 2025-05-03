package com.social.socialmedia.controller;

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

@RestController
@RequestMapping("/api/friendrequests")
@CrossOrigin(origins = "http://localhost:3000")
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
    @GetMapping("/sent/{userId}")
    public ResponseEntity<List<Map<String, Object>>> getSentFriendRequests(Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        UserInfo sender = new UserInfo();
        sender.setId(currentUser.getId());
        
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
    public ResponseEntity<?> createFriendRequest(@PathVariable Long receiverId, Authentication authentication) {
        try {
            // Log để debug
            System.out.println("Đang xử lý yêu cầu kết bạn từ " + authentication.getName() + " đến người dùng ID: " + receiverId);
            
            // Get current user
            UserInfo sender = userInfoService.findByEmail(authentication.getName());
            UserInfo receiver = userInfoService.findById(receiverId);
            
            if (sender == null) {
                System.out.println("Người gửi không tìm thấy: " + authentication.getName());
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("User not found");
            }
            
            if (receiver == null) {
                System.out.println("Người nhận không tìm thấy: ID " + receiverId);
                return ResponseEntity.badRequest().body("Receiver not found");
            }
            
            System.out.println("Người gửi: " + sender.getUsername() + " (ID: " + sender.getId() + ")");
            System.out.println("Người nhận: " + receiver.getUsername() + " (ID: " + receiver.getId() + ")");
            
            // Check if already friends
            FriendId friendId1 = new FriendId();
            friendId1.setUser1Id(sender.getId());
            friendId1.setUser2Id(receiver.getId());
            
            FriendId friendId2 = new FriendId();
            friendId2.setUser1Id(receiver.getId());
            friendId2.setUser2Id(sender.getId());
            
            if (friendService.getFriendById(friendId1).isPresent() || friendService.getFriendById(friendId2).isPresent()) {
                System.out.println("Đã là bạn bè");
                return ResponseEntity.badRequest().body("Already friends");
            }
            
            // Check if a request already exists
            List<FriendRequest> existingRequests = friendRequestService.getFriendRequestsBySenderId(sender.getId());
            for (FriendRequest req : existingRequests) {
                if (req.getReceiver().getId().equals(receiverId) && req.getStatus().equals("pending")) {
                    System.out.println("Lời mời kết bạn đã tồn tại, ID: " + req.getId());
                    return ResponseEntity.badRequest().body("Friend request already sent");
                }
            }
            
            // Create and save the friend request
            FriendRequest friendRequest = new FriendRequest();
            friendRequest.setSender(sender);
            friendRequest.setReceiver(receiver);
            friendRequest.setStatus("pending");
            
            FriendRequest savedRequest = friendRequestService.saveFriendRequest(friendRequest);
            System.out.println("Đã lưu lời mời kết bạn, ID: " + savedRequest.getId());
            
            // Send notification via WebSocket
            try {
                Map<String, Object> notification = new HashMap<>();
                notification.put("type", "FRIEND_REQUEST");
                notification.put("id", savedRequest.getId());
                notification.put("senderId", sender.getId());
                notification.put("senderUsername", sender.getUsername());
                notification.put("senderProfilePicture", sender.getProfilePicture());
                notification.put("message", sender.getUsername() + " đã gửi cho bạn một lời mời kết bạn");
                notification.put("timestamp", System.currentTimeMillis());
                
                System.out.println("Gửi thông báo qua WebSocket đến: " + receiver.getEmail());
                System.out.println("Nội dung thông báo: " + notification);
                
                messagingTemplate.convertAndSendToUser(
                    receiver.getEmail(),
                    "/queue/notifications",
                    notification
                );
                
                System.out.println("Đã gửi thông báo thành công");
            } catch (Exception e) {
                System.err.println("Lỗi khi gửi thông báo WebSocket: " + e.getMessage());
                e.printStackTrace();
            }
            
            // Trả về thông tin chi tiết cho frontend
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
            System.err.println("Lỗi khi xử lý yêu cầu kết bạn: " + e.getMessage());
            e.printStackTrace();
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
