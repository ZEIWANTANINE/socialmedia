package com.social.socialmedia.config;

import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.http.server.ServletServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.server.HandshakeInterceptor;
import org.springframework.web.util.UriComponentsBuilder;

@Component
public class WebSocketHandshakeInterceptor implements HandshakeInterceptor {
    
    private static final Logger logger = LoggerFactory.getLogger(WebSocketHandshakeInterceptor.class);

    @Override
    public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                  WebSocketHandler wsHandler, Map<String, Object> attributes) throws Exception {
        
        logger.info("Processing WebSocket handshake from: {}", request.getRemoteAddress());
        logger.info("Request URI: {}", request.getURI());
        
        if (request instanceof ServletServerHttpRequest) {
            ServletServerHttpRequest servletRequest = (ServletServerHttpRequest) request;
            String query = servletRequest.getServletRequest().getQueryString();
            
            logger.debug("Query string: {}", query);
            
            // Kiểm tra header trước
            String authHeader = servletRequest.getServletRequest().getHeader("Authorization");
            if (authHeader != null && authHeader.startsWith("Bearer ")) {
                String token = authHeader.substring(7);
                logger.info("Found token in Authorization header");
                attributes.put("token", token);
                attributes.put("access_token", token); // Add both for compatibility
                return true;
            }
            
            String xAuthHeader = servletRequest.getServletRequest().getHeader("X-Authorization");
            if (xAuthHeader != null && xAuthHeader.startsWith("Bearer ")) {
                String token = xAuthHeader.substring(7);
                logger.info("Found token in X-Authorization header");
                attributes.put("token", token);
                attributes.put("access_token", token); // Add both for compatibility
                return true;
            }
            
            // Kiểm tra query parameters
            if (query != null && !query.isEmpty()) {
                logger.info("Query string received: {}", query);
                
                Map<String, String> queryParams = UriComponentsBuilder.fromUriString("?" + query)
                                                  .build().getQueryParams().toSingleValueMap();
                
                // Log all query parameters for debugging
                logger.info("All query parameters: {}", queryParams);
                
                // Try both "token" and "access_token" parameters
                String token = queryParams.get("token");
                
                if (token == null || token.isEmpty()) {
                    // If "token" parameter is not found, try "access_token"
                    token = queryParams.get("access_token");
                    if (token != null && !token.isEmpty()) {
                        logger.info("Found token in URL parameters (access_token)");
                    }
                } else {
                    logger.info("Found token in URL parameters (token)");
                }
                
                if (token != null && !token.isEmpty()) {
                    // Store token in both attributes for compatibility
                    attributes.put("token", token);
                    attributes.put("access_token", token);
                    logger.info("Successfully stored token in session attributes");
                } else {
                    logger.warn("No token found in URL parameters");
                }
            } else {
                logger.debug("No query parameters found");
            }
        }
        
        // Always return true to allow the connection
        logger.info("WebSocket handshake completed, allowing connection");
        return true;
    }

    @Override
    public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                              WebSocketHandler wsHandler, Exception exception) {
        if (exception != null) {
            logger.error("Error during handshake", exception);
        } else {
            logger.debug("Handshake completed successfully");
        }
    }
} 