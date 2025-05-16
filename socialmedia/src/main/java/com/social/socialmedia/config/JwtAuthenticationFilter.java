package com.social.socialmedia.config;

import com.social.socialmedia.service.JwtService;
import com.social.socialmedia.service.UserInfoService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.lang.NonNull;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

@Component
@RequiredArgsConstructor
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserInfoService userInfoService;

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain
    ) throws ServletException, IOException {
        // Skip WebSocket endpoints to avoid authentication issues
        String path = request.getRequestURI();
        if (path.startsWith("/ws")) {
            // Skip authentication for WebSocket paths
            filterChain.doFilter(request, response);
            return;
        }
        
        String jwt = null;
        String userEmail = null;
        
        // Kiểm tra token từ header Authorization
        final String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            jwt = authHeader.substring(7);
        }
        
        // Nếu không có token trong header, kiểm tra trong X-Authorization
        if (jwt == null) {
            final String xAuthHeader = request.getHeader("X-Authorization");
            if (xAuthHeader != null && xAuthHeader.startsWith("Bearer ")) {
                jwt = xAuthHeader.substring(7);
            }
        }
        
        // Nếu vẫn không có token, kiểm tra trong URL parameter
        if (jwt == null) {
            jwt = request.getParameter("token");
        }
        
        // Try access_token parameter as well
        if (jwt == null) {
            jwt = request.getParameter("access_token");
        }
        
        // Nếu không tìm thấy token, tiếp tục chuỗi filter
        if (jwt == null) {
            filterChain.doFilter(request, response);
            return;
        }
        
        // Trích xuất email từ token
        userEmail = jwtService.extractUsername(jwt);

        if (userEmail != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = this.userInfoService.loadUserByUsername(userEmail);
            
            if (jwtService.isTokenValid(jwt, userDetails)) {
                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(
                    userDetails,
                    null,
                    userDetails.getAuthorities()
                );
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);
            }
        }
        filterChain.doFilter(request, response);
    }
} 