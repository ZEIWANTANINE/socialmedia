package com.social.socialmedia.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketTransportRegistration;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

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
                .setAllowedOrigins("*") // Cho phép tất cả các origins
                .withSockJS()
                .setSessionCookieNeeded(false); // Không yêu cầu cookie cho session
                
        // Thêm endpoint không dùng SockJS cho các client không hỗ trợ
        registry.addEndpoint("/ws")
                .setAllowedOrigins("*");
    }
    
    @Override
    public void configureWebSocketTransport(WebSocketTransportRegistration registration) {
        // Tăng kích thước message cho phép (nếu cần gửi hình ảnh hoặc dữ liệu lớn)
        registration.setMessageSizeLimit(128 * 1024); // 128KB
        registration.setSendBufferSizeLimit(512 * 1024); // 512KB
        registration.setSendTimeLimit(20000); // 20 seconds
    }
} 