package com.social.socialmedia.controller;

import java.util.Arrays;
import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.UserDetails;
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
    
    /**
     * Debug endpoint to specifically check access_token parameter
     */
    @GetMapping("/check-access-token")
    public ResponseEntity<?> checkAccessToken(@RequestParam String access_token) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("Checking access_token parameter: {}", access_token.substring(0, Math.min(10, access_token.length())) + "...");
            
            // Check if token is valid and extract username
            String username = jwtService.extractUsername(access_token);
            
            response.put("status", username != null ? "success" : "error");
            response.put("token_type", "access_token");
            response.put("username", username);
            response.put("token_length", access_token.length());
            
            if (username != null) {
                // Check if user exists
                UserInfo user = userInfoService.findByEmail(username);
                response.put("userExists", user != null);
                
                if (user != null) {
                    response.put("userId", user.getId());
                    
                    // Check token validity
                    UserDetails userDetails = userInfoService.loadUserByUsername(username);
                    boolean isValid = jwtService.isTokenValid(access_token, userDetails);
                    response.put("tokenValid", isValid);
                }
            }
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            log.error("Token verification error: {}", e.getMessage(), e);
            response.put("status", "error");
            response.put("message", "Token verification error: " + e.getMessage());
            return ResponseEntity.ok(response);
        }
    }
    
    /**
     * Debug endpoint to test SockJS handshake directly
     */
    @GetMapping("/sockjs-debug")
    public ResponseEntity<?> testSockJS(@RequestParam(required = false) String token) {
        Map<String, Object> response = new HashMap<>();
        
        try {
            log.info("Testing SockJS handshake with token: {}", token != null ? token.substring(0, Math.min(10, token.length())) + "..." : "none");
            
            // Analyze common WebSocket connection issues
            response.put("timestamp", System.currentTimeMillis());
            response.put("securityConfig", "WebSocket endpoints should be permitted in SecurityConfig");
            response.put("cors", "Ensure CORS allows WebSocket endpoints");
            
            // Generate a test URL for SockJS connection
            String testUrl = "/ws?token=" + (token != null ? token : "YOUR_TOKEN_HERE");
            response.put("testSockJsUrl", testUrl);
            
            // Include troubleshooting info
            response.put("troubleshooting", Arrays.asList(
                "Check browser console for detailed error messages",
                "Verify that SockJS endpoints (/ws/info) are properly permitted in security config",
                "Ensure token is valid and not expired",
                "Try WebSocket endpoint without SockJS first to isolate issues",
                "Ensure firewall or proxy is not blocking WebSocket connections"
            ));
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error in SockJS debug endpoint", e);
            response.put("error", e.getMessage());
            return ResponseEntity.internalServerError().body(response);
        }
    }
} 