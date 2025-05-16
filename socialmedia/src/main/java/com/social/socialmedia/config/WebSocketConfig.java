package com.social.socialmedia.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

import com.social.socialmedia.service.JwtService;
import com.social.socialmedia.service.UserInfoService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final UserInfoService userInfoService;
    private final WebSocketHandshakeInterceptor handshakeInterceptor;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Prefix cho các endpoint mà client sẽ subscribe để nhận thông báo
        config.enableSimpleBroker("/topic", "/queue", "/user");
        
        // Prefix cho các endpoint mà client sẽ gửi message đến
        config.setApplicationDestinationPrefixes("/app");
        
        // Cấu hình để gửi tin nhắn cho một người dùng cụ thể
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Endpoint mà client sẽ kết nối đến
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(handshakeInterceptor)
                .withSockJS()
                .setWebSocketEnabled(true)
                .setHeartbeatTime(25000)
                .setDisconnectDelay(5000)
                .setClientLibraryUrl("https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js")
                .setSessionCookieNeeded(false); // Không yêu cầu cookie cho session
                
        // Thêm endpoint không dùng SockJS cho các client không hỗ trợ
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .addInterceptors(handshakeInterceptor);
        
        log.info("WebSocket endpoints registered");
    }
    
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // Tăng kích thước message cho phép (nếu cần gửi hình ảnh hoặc dữ liệu lớn)
        registration.setMessageSizeLimit(128 * 1024); // 128KB
        registration.setSendBufferSizeLimit(512 * 1024); // 512KB
        registration.setSendTimeLimit(20000); // 20 seconds
    }
    
    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    log.info("Handling WebSocket connection: {}", accessor);
                    
                    // Extract JWT from headers
                    String token = null;
                    
                    // First try Authorization header
                    var authorization = accessor.getFirstNativeHeader("Authorization");
                    if (authorization != null && authorization.startsWith("Bearer ")) {
                        token = authorization.substring(7);
                        log.debug("Found token in Authorization header");
                    }
                    
                    // Then try X-Authorization header
                    if (token == null) {
                        authorization = accessor.getFirstNativeHeader("X-Authorization");
                        if (authorization != null && authorization.startsWith("Bearer ")) {
                            token = authorization.substring(7);
                            log.debug("Found token in X-Authorization header");
                        }
                    }
                    
                    // Finally try URL parameters
                    if (token == null) {
                        var sessionAttributes = accessor.getSessionAttributes();
                        if (sessionAttributes != null) {
                            // Try both "token" and "access_token" attributes
                            if (sessionAttributes.containsKey("token")) {
                                token = (String) sessionAttributes.get("token");
                                log.debug("Found token in session attributes (token)");
                            } else if (sessionAttributes.containsKey("access_token")) {
                                token = (String) sessionAttributes.get("access_token");
                                log.debug("Found token in session attributes (access_token)");
                            }
                        }
                    }
                    
                    log.info("WebSocket connection attempt with token: {}", token != null ? token.substring(0, Math.min(10, token.length())) + "..." : "Not found");
                    
                    if (token != null) {
                        try {
                            // Validate token and set authentication
                            String username = jwtService.extractUsername(token);
                            log.info("WebSocket token validation - username: {}", username);
                            
                            if (username != null) {
                                UserDetails userDetails = userInfoService.loadUserByUsername(username);
                                
                                if (jwtService.isTokenValid(token, userDetails)) {
                                    log.info("WebSocket authentication successful for user: {}", username);
                                    UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                                    SecurityContextHolder.getContext().setAuthentication(auth);
                                    accessor.setUser(auth);
                                } else {
                                    log.warn("Invalid WebSocket token for user: {}", username);
                                }
                            }
                        } catch (Exception e) {
                            log.error("WebSocket authentication error", e);
                        }
                    } else {
                        // Cho phép kết nối mà không cần xác thực nếu endpoint được cấu hình để cho phép
                        log.warn("No authentication token found in WebSocket connection request - allowing unauthenticated connection");
                    }
                }
                
                return message;
            }
        });
    }
} 