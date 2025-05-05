package com.social.socialmedia.controller;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.CrossOrigin;

import com.social.socialmedia.model.Friend;
import com.social.socialmedia.model.FriendId;
import com.social.socialmedia.model.Message;
import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.FriendService;
import com.social.socialmedia.service.MessageService;
import com.social.socialmedia.service.UserInfoService;

@RestController
@RequestMapping("/api/messages")
@CrossOrigin(origins = "http://localhost:3000", allowedHeaders = "*", allowCredentials = "true")
public class MessageController {
    @Autowired
    private MessageService messageService;

    @Autowired
    private UserInfoService userInfoService;
    
    @Autowired
    private FriendService friendService;
    
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // Get user's conversations (grouped by friend)
    @GetMapping("/conversations")
    public ResponseEntity<List<Map<String, Object>>> getConversations(Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        
        // Find all friends
        List<Friend> friendsAsUser1 = friendService.getFriendsByUser1Id(currentUser.getId());
        List<Friend> friendsAsUser2 = friendService.getFriendsByUser2Id(currentUser.getId());
        
        List<UserInfo> friends = new ArrayList<>();
        
        // Add friends where current user is user1
        friendsAsUser1.forEach(f -> friends.add(f.getUser2()));
        
        // Add friends where current user is user2
        friendsAsUser2.forEach(f -> friends.add(f.getUser1()));
        
        List<Map<String, Object>> conversations = new ArrayList<>();
        
        for (UserInfo friend : friends) {
            Map<String, Object> conversation = new HashMap<>();
            
            // Get last message between users
            List<Message> sentMessages = messageService.getMessagesBySenderIdAndReceiverId(currentUser.getId(), friend.getId());
            List<Message> receivedMessages = messageService.getMessagesBySenderIdAndReceiverId(friend.getId(), currentUser.getId());
            
            // Combine all messages and sort by timestamp (most recent first)
            List<Message> allMessages = new ArrayList<>();
            allMessages.addAll(sentMessages);
            allMessages.addAll(receivedMessages);
            allMessages.sort((m1, m2) -> m2.getCreatedAt().compareTo(m1.getCreatedAt()));
            
            Message lastMessage = allMessages.isEmpty() ? null : allMessages.get(0);
            
            // Build conversation object
            conversation.put("userId", friend.getId());
            conversation.put("username", friend.getUsername());
            conversation.put("profilePicture", friend.getProfilePicture());
            
            if (lastMessage != null) {
                Map<String, Object> lastMessageMap = new HashMap<>();
                lastMessageMap.put("id", lastMessage.getId());
                lastMessageMap.put("content", lastMessage.getContent());
                lastMessageMap.put("createdAt", lastMessage.getCreatedAt());
                lastMessageMap.put("isRead", lastMessage.getIsRead());
                lastMessageMap.put("isFromCurrentUser", lastMessage.getSender().getId().equals(currentUser.getId()));
                
                conversation.put("lastMessage", lastMessageMap);
                
                // Count unread messages
                long unreadCount = receivedMessages.stream()
                    .filter(m -> !m.getIsRead())
                    .count();
                
                conversation.put("unreadCount", unreadCount);
            } else {
                conversation.put("lastMessage", null);
                conversation.put("unreadCount", 0);
            }
            
            conversations.add(conversation);
        }
        
        // Sort by last message time (most recent first)
        conversations.sort((c1, c2) -> {
            Map<String, Object> lastMessage1 = (Map<String, Object>) c1.get("lastMessage");
            Map<String, Object> lastMessage2 = (Map<String, Object>) c2.get("lastMessage");
            
            if (lastMessage1 == null && lastMessage2 == null) return 0;
            if (lastMessage1 == null) return 1;
            if (lastMessage2 == null) return -1;
            
            return ((java.time.LocalDateTime) lastMessage2.get("createdAt"))
                .compareTo((java.time.LocalDateTime) lastMessage1.get("createdAt"));
        });
        
        return ResponseEntity.ok(conversations);
    }

    // Get messages between current user and another user
    @GetMapping("/chat/{userId}")
    public ResponseEntity<?> getChat(@PathVariable Long userId, Authentication authentication) {
        try {
            UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
            if (currentUser == null) {
                return ResponseEntity.badRequest().body("Current user not found");
            }
            
            // Xác nhận rằng userId là số hợp lệ và khác currentUserId
            if (userId == null || userId.equals(currentUser.getId())) {
                return ResponseEntity.badRequest().body("Invalid user ID");
            }
            
            UserInfo otherUser = userInfoService.findById(userId);
            if (otherUser == null) {
                return ResponseEntity.badRequest().body("User not found");
            }
            
            // Log để debug
            System.out.println("Getting chat between " + currentUser.getUsername() + " (ID: " + currentUser.getId() + ") and " + otherUser.getUsername() + " (ID: " + otherUser.getId() + ")");
            
            // Check if they are friends - sử dụng try-catch để xử lý lỗi nếu có
            boolean areFriends = false;
            try {
                FriendId friendId1 = new FriendId();
                friendId1.setUser1Id(currentUser.getId());
                friendId1.setUser2Id(userId);
                
                FriendId friendId2 = new FriendId();
                friendId2.setUser1Id(userId);
                friendId2.setUser2Id(currentUser.getId());
                
                areFriends = friendService.getFriendById(friendId1).isPresent() || 
                            friendService.getFriendById(friendId2).isPresent();
                            
                if (!areFriends) {
                    System.out.println("Users are not friends. Current user: " + currentUser.getId() + ", Other user: " + userId);
                    return ResponseEntity.badRequest().body("You are not friends with this user");
                }
            } catch (Exception e) {
                System.err.println("Error checking friendship: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.badRequest().body("Error checking friendship: " + e.getMessage());
            }
            
            // Get all messages between users
            List<Message> sentMessages;
            List<Message> receivedMessages;
            
            try {
                sentMessages = messageService.getMessagesBySenderIdAndReceiverId(currentUser.getId(), userId);
                receivedMessages = messageService.getMessagesBySenderIdAndReceiverId(userId, currentUser.getId());
            } catch (Exception e) {
                System.err.println("Error fetching messages: " + e.getMessage());
                e.printStackTrace();
                return ResponseEntity.badRequest().body("Error fetching messages: " + e.getMessage());
            }
            
            // Mark received messages as read
            for (Message message : receivedMessages) {
                if (!message.getIsRead()) {
                    message.setIsRead(true);
                    messageService.saveMessage(message);
                }
            }
            
            // Combine all messages
            List<Message> allMessages = new ArrayList<>();
            allMessages.addAll(sentMessages);
            allMessages.addAll(receivedMessages);
            
            // Sort by timestamp (oldest first)
            allMessages.sort((m1, m2) -> m1.getCreatedAt().compareTo(m2.getCreatedAt()));
            
            // Convert to DTO
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
                "profilePicture", otherUser.getProfilePicture()
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error getting chat: " + e.getMessage());
            e.printStackTrace();
            return ResponseEntity.badRequest().body("Error getting chat: " + e.getMessage());
        }
    }

    // Send a message
    @PostMapping("/send/{receiverId}")
    public ResponseEntity<?> sendMessage(@PathVariable Long receiverId, 
                                         @RequestBody Map<String, String> request,
                                         Authentication authentication) {
        String content = request.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body("Message content cannot be empty");
        }
        
        UserInfo sender = userInfoService.findByEmail(authentication.getName());
        UserInfo receiver = userInfoService.findById(receiverId);
        
        if (receiver == null) {
            return ResponseEntity.badRequest().body("Receiver not found");
        }
        
        // Check if they are friends
        FriendId friendId1 = new FriendId();
        friendId1.setUser1Id(sender.getId());
        friendId1.setUser2Id(receiverId);
        
        FriendId friendId2 = new FriendId();
        friendId2.setUser1Id(receiverId);
        friendId2.setUser2Id(sender.getId());
        
        if (friendService.getFriendById(friendId1).isEmpty() && friendService.getFriendById(friendId2).isEmpty()) {
            return ResponseEntity.badRequest().body("You are not friends with this user");
        }
        
        // Create and save the message
        Message message = new Message();
        message.setSender(sender);
        message.setReceiver(receiver);
        message.setContent(content);
        message.setIsRead(false);
        
        Message savedMessage = messageService.saveMessage(message);
        
        // Create DTO for response
        Map<String, Object> messageDto = new HashMap<>();
        messageDto.put("id", savedMessage.getId());
        messageDto.put("content", savedMessage.getContent());
        messageDto.put("createdAt", savedMessage.getCreatedAt());
        messageDto.put("isRead", savedMessage.getIsRead());
        messageDto.put("isFromCurrentUser", true);
        messageDto.put("senderId", sender.getId());
        messageDto.put("senderUsername", sender.getUsername());
        
        // Send notification via WebSocket
        Map<String, Object> notification = new HashMap<>();
        notification.put("type", "NEW_MESSAGE");
        notification.put("message", messageDto);
        notification.put("senderId", sender.getId());
        notification.put("senderUsername", sender.getUsername());
        
        messagingTemplate.convertAndSendToUser(
            receiver.getEmail(),
            "/queue/notifications",
            notification
        );
        
        return ResponseEntity.ok(messageDto);
    }

    // Mark messages as read
    @PutMapping("/read/{senderId}")
    public ResponseEntity<?> markMessagesAsRead(@PathVariable Long senderId, Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        
        // Get unread messages from sender
        List<Message> unreadMessages = messageService.getMessagesBySenderIdAndReceiverId(senderId, currentUser.getId())
            .stream()
            .filter(m -> !m.getIsRead())
            .collect(Collectors.toList());
        
        // Mark as read
        for (Message message : unreadMessages) {
            message.setIsRead(true);
            messageService.saveMessage(message);
        }
        
        return ResponseEntity.ok(Map.of("count", unreadMessages.size()));
    }

    // Delete a message (mark as deleted)
    @DeleteMapping("/{messageId}")
    public ResponseEntity<?> deleteMessage(@PathVariable Long messageId, Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        
        Optional<Message> messageOpt = messageService.getMessageById(messageId);
        if (messageOpt.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        
        Message message = messageOpt.get();
        
        // Only the sender can delete their message
        if (!message.getSender().getId().equals(currentUser.getId())) {
            return ResponseEntity.badRequest().body("You can only delete your own messages");
        }
        
        message.setIsDeleted(true);
        messageService.saveMessage(message);
        
        // TODO: Consider saving a copy in DeletedMessage table if needed
        
        return ResponseEntity.ok(Map.of("messageId", messageId));
    }

    // Get total unread message count for current user
    @GetMapping("/unread-count")
    public ResponseEntity<?> getUnreadMessageCount(Authentication authentication) {
        UserInfo currentUser = userInfoService.findByEmail(authentication.getName());
        
        // Find all friends
        List<Friend> friendsAsUser1 = friendService.getFriendsByUser1Id(currentUser.getId());
        List<Friend> friendsAsUser2 = friendService.getFriendsByUser2Id(currentUser.getId());
        
        List<UserInfo> friends = new ArrayList<>();
        
        // Add friends where current user is user1
        friendsAsUser1.forEach(f -> friends.add(f.getUser2()));
        
        // Add friends where current user is user2
        friendsAsUser2.forEach(f -> friends.add(f.getUser1()));
        
        // Count unread messages from all friends
        long totalUnreadCount = 0;
        
        for (UserInfo friend : friends) {
            List<Message> receivedMessages = messageService.getMessagesBySenderIdAndReceiverId(friend.getId(), currentUser.getId());
            
            // Count unread messages
            long unreadCount = receivedMessages.stream()
                .filter(m -> !m.getIsRead())
                .count();
            
            totalUnreadCount += unreadCount;
        }
        
        return ResponseEntity.ok(Map.of("count", totalUnreadCount));
    }
}
