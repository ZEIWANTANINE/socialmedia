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
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.social.socialmedia.model.FriendRequest;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.FriendRequestService;
import com.social.socialmedia.service.UserInfoService;
import com.social.socialmedia.service.WebSocketNotificationService;

@RestController
@RequestMapping("/api/friendrequests")
public class FriendRequestController {
    @Autowired
    private FriendRequestService friendRequestService;
    
    @Autowired
    private UserInfoService userInfoService;
    
    @Autowired
    private WebSocketNotificationService notificationService;

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
        // Lấy thông tin người dùng đang đăng nhập từ token
        String email = authentication.getName();
        UserInfo sender = userInfoService.findByEmail(email);
        
        // Đảm bảo sender được thiết lập chính xác
        friendRequest.setSender(sender);
        
        // Lấy thông tin người nhận
        UserInfo receiver = userInfoService.findById(friendRequest.getReceiver().getId());
        if (receiver == null) {
            return ResponseEntity.badRequest().build();
        }
        
        // Kiểm tra xem đã gửi lời mời kết bạn cho người dùng này chưa
        List<FriendRequest> existingRequests = friendRequestService.getFriendRequestsBySenderId(sender.getId());
        for (FriendRequest req : existingRequests) {
            if (req.getReceiver().getId().equals(friendRequest.getReceiver().getId()) && 
                req.getStatus().equals("pending")) {
                return ResponseEntity.badRequest().build(); // Đã có lời mời tồn tại
            }
        }
        
        FriendRequest savedFriendRequest = friendRequestService.saveFriendRequest(friendRequest);
        
        // Gửi thông báo qua WebSocket
        notificationService.sendFriendRequestNotification(sender, receiver, savedFriendRequest.getId());
        
        return ResponseEntity.ok(savedFriendRequest);
    }
    
    @PutMapping("/{friendRequestId}/accept")
    public ResponseEntity<FriendRequest> acceptFriendRequest(@PathVariable Long friendRequestId, Authentication authentication) {
        // Lấy thông tin người dùng đang đăng nhập từ token
        String email = authentication.getName();
        UserInfo currentUser = userInfoService.findByEmail(email);
        
        Optional<FriendRequest> friendRequestOpt = friendRequestService.getFriendRequestById(friendRequestId);
        if (friendRequestOpt.isPresent()) {
            FriendRequest friendRequest = friendRequestOpt.get();
            
            // Kiểm tra xem người dùng hiện tại có phải là người nhận lời mời không
            if (friendRequest.getReceiver().getId().equals(currentUser.getId())) {
                friendRequest.setStatus("accepted");
                FriendRequest acceptedRequest = friendRequestService.saveFriendRequest(friendRequest);
                
                // TODO: Tạo kết bạn giữa hai người dùng
                
                // Gửi thông báo cho người gửi lời mời
                notificationService.sendFriendRequestAcceptedNotification(
                    currentUser, 
                    friendRequest.getSender(),
                    acceptedRequest.getId()
                );
                
                return ResponseEntity.ok(acceptedRequest);
            }
        }
        
        return ResponseEntity.notFound().build();
    }
    
    @PutMapping("/{friendRequestId}/reject")
    public ResponseEntity<FriendRequest> rejectFriendRequest(@PathVariable Long friendRequestId, Authentication authentication) {
        // Tương tự như acceptFriendRequest nhưng thay đổi trạng thái thành "rejected"
        String email = authentication.getName();
        UserInfo currentUser = userInfoService.findByEmail(email);
        
        Optional<FriendRequest> friendRequestOpt = friendRequestService.getFriendRequestById(friendRequestId);
        if (friendRequestOpt.isPresent()) {
            FriendRequest friendRequest = friendRequestOpt.get();
            
            if (friendRequest.getReceiver().getId().equals(currentUser.getId())) {
                friendRequest.setStatus("rejected");
                FriendRequest rejectedRequest = friendRequestService.saveFriendRequest(friendRequest);
                return ResponseEntity.ok(rejectedRequest);
            }
        }
        
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{friendRequestId}")
    public ResponseEntity<Void> deleteFriendRequest(@PathVariable Long friendRequestId) {
        friendRequestService.deleteFriendRequest(friendRequestId);
        return ResponseEntity.noContent().build();
    }
}
