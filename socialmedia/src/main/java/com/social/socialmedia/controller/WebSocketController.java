package com.social.socialmedia.controller;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.ArrayList;
import java.util.stream.Collectors;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.ResponseBody;
import org.springframework.http.ResponseEntity;
import org.springframework.beans.factory.annotation.Autowired;

import com.social.socialmedia.model.Friend;
import com.social.socialmedia.model.FriendId;
import com.social.socialmedia.model.Message;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.UserInfoService;
import com.social.socialmedia.service.FriendService;
import com.social.socialmedia.service.MessageService;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

    @Autowired
    private UserInfoService userInfoService;

    @Autowired
    private FriendService friendService;

    @Autowired
    private MessageService messageService;

    public WebSocketController(SimpMessagingTemplate messagingTemplate) {
        this.messagingTemplate = messagingTemplate;
    }

    /**
     * Xử lý tin nhắn PING từ client
     * Phản hồi lại với một tin nhắn PONG để kiểm tra kết nối
     */
    @MessageMapping("/ws-ping")
    public void handlePing(@Payload Map<String, Object> message, Authentication authentication) {
        if (authentication != null) {
            String username = authentication.getName();
            log.info("Received PING from {} at {}", username, message.get("timestamp"));
            
            // Tạo phản hồi PONG
            Map<String, Object> response = new HashMap<>();
            response.put("type", "PONG");
            response.put("timestamp", System.currentTimeMillis());
            response.put("message", "Connection active");
            
            // Gửi phản hồi đến client cụ thể
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                response
            );
            
            log.info("Sent PONG to {}", username);
        } else {
            log.warn("Authentication is null for ping message");
        }
    }

    /**
     * Simple ping endpoint to match the one in the test page
     */
    @MessageMapping("/test-ping")
    public void handleSimplePing(@Payload Map<String, Object> message, Authentication authentication) {
        log.info("Received TEST-PING message: {}", message);
        
        if (authentication != null) {
            String username = authentication.getName();
            
            // Create PONG response
            Map<String, Object> response = new HashMap<>();
            response.put("type", "PONG");
            response.put("timestamp", System.currentTimeMillis());
            response.put("message", "PONG response");
            response.put("originalMessage", message);
            
            // Send response to the specific user
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                response
            );
            
            log.info("Sent PONG response to {}", username);
        } else {
            log.warn("Authentication is null for ping message");
        }
    }

    /**
     * Debug endpoint to test WebSocket connectivity
     */
    @GetMapping("/api/ws-test")
    @ResponseBody
    public Map<String, Object> testWebSocket(Authentication authentication) {
        if (authentication != null) {
            String username = authentication.getName();
            log.info("Testing WebSocket for user: {}", username);
            
            // Create test notification
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "TEST_NOTIFICATION");
            notification.put("timestamp", System.currentTimeMillis());
            notification.put("message", "This is a test notification via WebSocket");
            
            // Send notification via WebSocket
            messagingTemplate.convertAndSendToUser(
                username,
                "/queue/notifications",
                notification
            );
            
            log.info("Test notification sent to {}", username);
            return Map.of(
                "status", "success", 
                "message", "Test notification sent via WebSocket",
                "user", username
            );
        } else {
            log.warn("Authentication required for WebSocket test");
            return Map.of(
                "status", "error", 
                "message", "Authentication required"
            );
        }
    }

    /**
     * Kiểm tra kết nối thủ công (có thể gọi từ API riêng)
     */
    public void sendConnectionTest(String username) {
        Map<String, Object> message = new HashMap<>();
        message.put("type", "CONNECTION_TEST");
        message.put("timestamp", System.currentTimeMillis());
        message.put("message", "Testing WebSocket connection");
        
        messagingTemplate.convertAndSendToUser(
            username,
            "/queue/notifications",
            message
        );
        
        log.info("Sent connection test to {}", username);
    }

    @GetMapping("/api/ws-chat/{userId}")
    @ResponseBody
    public ResponseEntity<?> getChat(@PathVariable Long userId, Authentication authentication) {
        try {
            // Ghi nhận thao tác debug
            log.info("Đang xử lý yêu cầu chat cho userId: {}", userId);
            
            UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
            if (currentUser == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy thông tin người dùng hiện tại");
            }
            
            // Xác nhận rằng userId là số hợp lệ và khác currentUserId
            if (userId == null || userId.equals(currentUser.getId())) {
                return ResponseEntity.badRequest().body("ID người dùng không hợp lệ");
            }
            
            UserInfo otherUser = userInfoService.findById(userId);
            if (otherUser == null) {
                return ResponseEntity.badRequest().body("Không tìm thấy người dùng với ID: " + userId);
            }
            
            log.info("Kiểm tra bạn bè giữa {} và {}", currentUser.getId(), userId);
            
            // Kiểm tra bạn bè đầy đủ thông qua service
            List<Friend> friendsAsUser1 = friendService.getFriendsByUser1Id(currentUser.getId());
            List<Friend> friendsAsUser2 = friendService.getFriendsByUser2Id(currentUser.getId());
            
            boolean areFriends = false;
            
            for (Friend friend : friendsAsUser1) {
                if (friend.getUser2().getId().equals(userId)) {
                    areFriends = true;
                    log.info("Tìm thấy quan hệ bạn bè: user1={}, user2={}", currentUser.getId(), userId);
                    break;
                }
            }
            
            if (!areFriends) {
                for (Friend friend : friendsAsUser2) {
                    if (friend.getUser1().getId().equals(userId)) {
                        areFriends = true;
                        log.info("Tìm thấy quan hệ bạn bè: user1={}, user2={}", userId, currentUser.getId());
                        break;
                    }
                }
            }
                
            if (!areFriends) {
                log.warn("Users are not friends. Current user: {}, Other user: {}", currentUser.getId(), userId);
                return ResponseEntity.status(403).body("Bạn chưa kết bạn với người dùng này");
            }
            
            // Lấy tin nhắn
            List<Message> sentMessages = messageService.getMessagesBySenderIdAndReceiverId(currentUser.getId(), userId);
            List<Message> receivedMessages = messageService.getMessagesBySenderIdAndReceiverId(userId, currentUser.getId());
            
            log.info("Số tin nhắn đã gửi: {}", sentMessages.size());
            log.info("Số tin nhắn đã nhận: {}", receivedMessages.size());
            
            // Kiểm tra nếu không có tin nhắn nào, trả về danh sách trống
            if (sentMessages.isEmpty() && receivedMessages.isEmpty()) {
                log.info("Không tìm thấy tin nhắn. Trả về danh sách trống.");
                
                Map<String, Object> emptyResponse = new HashMap<>();
                emptyResponse.put("messages", new ArrayList<>());
                emptyResponse.put("user", Map.of(
                    "id", otherUser.getId(),
                    "username", otherUser.getUsername(),
                    "profilePicture", otherUser.getProfilePicture() != null ? otherUser.getProfilePicture() : ""
                ));
                
                return ResponseEntity.ok(emptyResponse);
            }
            
            // Đánh dấu đã đọc cho tin nhắn đã nhận
            for (Message message : receivedMessages) {
                if (!message.getIsRead()) {
                    message.setIsRead(true);
                    messageService.saveMessage(message);
                }
            }
            
            // Kết hợp tất cả tin nhắn
            List<Message> allMessages = new ArrayList<>();
            allMessages.addAll(sentMessages);
            allMessages.addAll(receivedMessages);
            
            // Sắp xếp theo thời gian (cũ nhất trước)
            allMessages.sort((m1, m2) -> m1.getCreatedAt().compareTo(m2.getCreatedAt()));
            
            // Chuyển sang DTO
            List<Map<String, Object>> messagesDto = allMessages.stream()
                .map(message -> {
                    Map<String, Object> messageDto = new HashMap<>();
                    messageDto.put("id", message.getId());
                    messageDto.put("content", message.getContent());
                    messageDto.put("createdAt", message.getCreatedAt());
                    messageDto.put("isRead", message.getIsRead());
                    messageDto.put("isFromCurrentUser", message.getSender().getId().equals(currentUser.getId()));
                    
                    return messageDto;
                })
                .collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("messages", messagesDto);
            response.put("user", Map.of(
                "id", otherUser.getId(),
                "username", otherUser.getUsername(),
                "profilePicture", otherUser.getProfilePicture() != null ? otherUser.getProfilePicture() : ""
            ));
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Lỗi khi lấy dữ liệu chat: ", e);
            return ResponseEntity.status(500).body("Lỗi server: " + 
                (e.getMessage() != null ? e.getMessage() : "Không xác định"));
        }
    }

    /**
     * Xử lý tin nhắn chat qua WebSocket
     * Chỉ cho phép gửi tin nhắn giữa những người đã kết bạn
     */
    @MessageMapping("/chat")
    public void handleChatMessage(@Payload Map<String, Object> messageData, Authentication authentication) {
        if (authentication == null) {
            log.warn("Authentication is null for chat message");
            return;
        }
        
        String senderUsername = authentication.getName();
        log.info("Received chat message from {}: {}", senderUsername, messageData);
        
        try {
            // Lấy thông tin người gửi và người nhận
            Long receiverId = Long.valueOf(messageData.get("receiverId").toString());
            String content = (String) messageData.get("content");
            
            // Kiểm tra dữ liệu đầu vào
            if (receiverId == null || content == null || content.trim().isEmpty()) {
                log.warn("Invalid chat message data: receiverId={}, content={}", receiverId, content);
                return;
            }
            
            // Lấy thông tin người dùng
            UserInfo sender = userInfoService.findByEmail(senderUsername);
            UserInfo receiver = userInfoService.findById(receiverId);
            
            if (sender == null || receiver == null) {
                log.warn("Sender or receiver not found. Sender={}, Receiver={}", senderUsername, receiverId);
                return;
            }
            
            // Kiểm tra xem họ có phải là bạn bè không
            FriendId friendId1 = new FriendId();
            friendId1.setUser1Id(sender.getId());
            friendId1.setUser2Id(receiverId);
            
            FriendId friendId2 = new FriendId();
            friendId2.setUser1Id(receiverId);
            friendId2.setUser2Id(sender.getId());
            
            boolean areFriends = friendService.getFriendById(friendId1).isPresent() || 
                                 friendService.getFriendById(friendId2).isPresent();
            
            if (!areFriends) {
                log.warn("Cannot send message: Users are not friends. Sender={}, Receiver={}", 
                         sender.getId(), receiverId);
                
                // Gửi thông báo lỗi cho người gửi
                Map<String, Object> errorResponse = new HashMap<>();
                errorResponse.put("type", "CHAT_ERROR");
                errorResponse.put("message", "Bạn chưa kết bạn với người này");
                errorResponse.put("timestamp", System.currentTimeMillis());
                
                messagingTemplate.convertAndSendToUser(
                    senderUsername,
                    "/queue/notifications",
                    errorResponse
                );
                return;
            }
            
            // Tạo và lưu tin nhắn
            Message message = new Message();
            message.setSender(sender);
            message.setReceiver(receiver);
            message.setContent(content);
            message.setIsRead(false);
            
            Message savedMessage = messageService.saveMessage(message);
            
            // Tạo DTO cho phản hồi
            Map<String, Object> messageDto = new HashMap<>();
            messageDto.put("id", savedMessage.getId());
            messageDto.put("content", savedMessage.getContent());
            messageDto.put("createdAt", savedMessage.getCreatedAt());
            messageDto.put("isRead", savedMessage.getIsRead());
            messageDto.put("senderId", sender.getId());
            messageDto.put("senderUsername", sender.getUsername());
            
            // Gửi tin nhắn cho người nhận qua WebSocket
            Map<String, Object> notification = new HashMap<>();
            notification.put("type", "NEW_MESSAGE");
            notification.put("message", messageDto);
            notification.put("senderId", sender.getId());
            notification.put("senderUsername", sender.getUsername());
            
            // Gửi tin nhắn đến người nhận
            messagingTemplate.convertAndSendToUser(
                receiver.getEmail(),
                "/queue/notifications",
                notification
            );
            
            // Gửi xác nhận đến người gửi
            Map<String, Object> confirmation = new HashMap<>();
            confirmation.put("type", "MESSAGE_SENT");
            confirmation.put("message", messageDto);
            confirmation.put("receiverId", receiver.getId());
            confirmation.put("receiverUsername", receiver.getUsername());
            
            messagingTemplate.convertAndSendToUser(
                sender.getEmail(),
                "/queue/notifications",
                confirmation
            );
            
            log.info("Chat message sent from {} to {}", sender.getUsername(), receiver.getUsername());
            
        } catch (Exception e) {
            log.error("Error processing chat message: {}", e.getMessage(), e);
            
            // Gửi thông báo lỗi cho người gửi
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("type", "CHAT_ERROR");
            errorResponse.put("message", "Lỗi khi gửi tin nhắn: " + e.getMessage());
            
            messagingTemplate.convertAndSendToUser(
                senderUsername,
                "/queue/notifications",
                errorResponse
            );
        }
    }
} 