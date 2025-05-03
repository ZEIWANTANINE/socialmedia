package com.social.socialmedia.controller;

import java.util.HashMap;
import java.util.Map;
import java.time.LocalDateTime;

import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.security.core.Authentication;
import org.springframework.beans.factory.annotation.Autowired;

@Controller
public class PingController {

    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/ping")
    public void handlePing(@Payload Map<String, Object> payload, Authentication authentication) {
        if (authentication != null) {
            String email = authentication.getName();
            
            // Tạo response PONG
            Map<String, Object> response = new HashMap<>();
            response.put("type", "PONG");
            response.put("timestamp", LocalDateTime.now().toString());
            response.put("receivedTimestamp", payload.get("timestamp"));
            
            // Gửi lại cho client
            messagingTemplate.convertAndSendToUser(
                email,
                "/queue/notifications",
                response
            );
            
            System.out.println("Ping received from " + email + ", responded with PONG");
        }
    }
} 