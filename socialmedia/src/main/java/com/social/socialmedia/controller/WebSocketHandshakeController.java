package com.social.socialmedia.controller;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.social.socialmedia.model.UserInfo;
import com.social.socialmedia.service.JwtService;
import com.social.socialmedia.service.UserInfoService;

import lombok.extern.slf4j.Slf4j;

@RestController
@RequestMapping("/api/ws-debug")
@Slf4j
public class WebSocketHandshakeController {

    @Autowired
    private JwtService jwtService;
    
    @Autowired
    private UserInfoService userInfoService;
    
    @Autowired
    private WebSocketController webSocketController;
    
    /**
     * Endpoint to verify token authentication for WebSocket
     */
    @GetMapping("/verify-token")
    public ResponseEntity<?> verifyToken(@RequestParam String token, Authentication currentAuth) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Check if token is valid and extract username
            String username = jwtService.extractUsername(token);
            log.info("Token verification - extracted username: {}", username);
            
            if (username == null) {
                log.warn("Token verification failed - no username extracted");
                response.put("status", "error");
                response.put("message", "Invalid token - no username extracted");
                return ResponseEntity.ok(response);
            }
            
            // Get user details
            UserInfo user = userInfoService.findByEmail(username);
            
            if (user == null) {
                log.warn("Token verification failed - user not found: {}", username);
                response.put("status", "error");
                response.put("message", "User not found: " + username);
                return ResponseEntity.ok(response);
            }
            
            // Check if current authentication matches token
            String currentUsername = currentAuth != null ? currentAuth.getName() : null;
            boolean matchesCurrentAuth = username.equals(currentUsername);
            
            response.put("status", "success");
            response.put("username", username);
            response.put("userId", user.getId());
            response.put("matchesCurrentAuth", matchesCurrentAuth);
            
            // Send test notification
            webSocketController.sendConnectionTest(username);
            response.put("testNotificationSent", true);
            
            log.info("Token verification successful for user: {}", username);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Token verification error: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Token verification error: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Debug endpoint to check WebSocket token from URL parameters
     */
    @GetMapping("/parse-url")
    public ResponseEntity<?> parseUrl(@RequestParam String url) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            // Parse URL to extract token
            String[] parts = url.split("\\?");
            if (parts.length < 2) {
                response.put("status", "error");
                response.put("message", "No query parameters found in URL");
                return ResponseEntity.ok(response);
            }
            
            String queryString = parts[1];
            String[] params = queryString.split("&");
            
            String token = null;
            for (String param : params) {
                if (param.startsWith("token=")) {
                    token = param.substring(6);
                    break;
                }
            }
            
            if (token == null) {
                response.put("status", "error");
                response.put("message", "No token parameter found in URL");
                return ResponseEntity.ok(response);
            }
            
            // Return token info
            response.put("status", "success");
            response.put("token", token);
            
            // Try to verify token
            try {
                String username = jwtService.extractUsername(token);
                response.put("username", username);
                response.put("isValid", username != null);
            } catch (Exception e) {
                response.put("isValid", false);
                response.put("validationError", e.getMessage());
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("URL parsing error: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "URL parsing error: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
} 