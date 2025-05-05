package com.social.socialmedia.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ResponseBody;

import lombok.extern.slf4j.Slf4j;

@Controller
@Slf4j
public class WebSocketController {

    private final SimpMessagingTemplate messagingTemplate;

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
} 