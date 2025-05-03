package com.social.socialmedia.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Controller;

@Controller
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
            System.out.println("Received PING from " + username + " at " + message.get("timestamp"));
            
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
            
            System.out.println("Sent PONG to " + username);
        } else {
            System.out.println("Authentication is null for ping message");
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
        
        System.out.println("Sent connection test to " + username);
    }
} 